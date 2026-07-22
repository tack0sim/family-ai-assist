"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendInvitationEmails } from "@/lib/email/send-invitation";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getBaseURL } from "@/lib/utils/get-base-url";
import { validatePasswordComplexity } from "@/lib/utils/validate-password";

export async function socialSignIn() {
  const header = await headers();
  const baseUrl = getBaseURL(header);

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback`,
      scopes: "openid email profile",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect("/auth/auth-code-error");
  }

  redirect(data.url);
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm-password") as string;

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const validation = validatePasswordComplexity(password);
  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: formData.get("name") as string,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Signup failed");
  }

  const svc = createServiceRoleClient();
  const { error: ensureProfileErr } = await svc.rpc("ensure_profile_exists", {
    p_user_id: data.user.id,
  });

  if (ensureProfileErr) {
    throw new Error("Failed to verify user profile. Please try again.");
  }

  redirect("/onboarding");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    // Handle specific error types
    if (error?.code === "invalid_credentials") {
      throw new Error("Invalid email or password");
    }

    if (error?.code === "rate_limit_error") {
      throw new Error(error.message);
    }

    throw new Error(error?.message || "Signin failed");
  }

  // Call ensure_profile_exists RPC after successful signin
  const svc = createServiceRoleClient();
  const { error: ensureProfileErr } = await svc.rpc("ensure_profile_exists", {
    p_user_id: data.user.id,
  });

  if (ensureProfileErr) {
    throw new Error("Failed to verify user profile. Please try again.");
  }

  // Check if user has family context
  const hasFamily = await checkUserFamilyContext();
  const destination = hasFamily ? "/" : "/onboarding";

  redirect(destination);
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
  }

  redirect("/");
}

export async function createFamily(formData: FormData) {
  const name = (formData.get("name") as string) || null;
  if (!name) {
    throw new Error("Missing family name");
  }

  // Get the logged-in user from server-side session
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Issue #14: Defensive check - ensure profile exists before creating family
  // This handles cases where the auth→profile trigger may have failed
  const svc = createServiceRoleClient();
  const { error: ensureProfileErr } = await svc.rpc("ensure_profile_exists", {
    p_user_id: userId,
  });

  if (ensureProfileErr) {
    throw new Error("Failed to verify user profile. Please try again.");
  }

  // Create family using authenticated client (RLS policy allows this)
  const { data: family, error: famErr } = await supabase
    .from("families")
    .insert({ name, created_by: userId })
    .select("id")
    .single();

  if (famErr || !family?.id) {
    throw new Error(famErr?.message || "Failed to create family");
  }

  // Add creator as admin member (RLS policy ensures user can only add themselves as admin to families they created)
  const { error: memErr } = await supabase.from("family_members").insert({
    family_id: family.id,
    user_id: userId,
    role: "admin",
    status: "active",
    joined_at: new Date().toISOString(),
  });

  if (memErr) {
    throw new Error(memErr.message || "Failed to create family membership");
  }

  // redirect to root (UI deferred)
  redirect("/");
}

export async function acceptInvitation(token: string) {
  if (!token) {
    throw new Error("Missing invitation token");
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Use service role to fetch invitation (user can only see their own by email)
  const svc = createServiceRoleClient();
  const { data: invite, error: invErr } = await svc
    .from("invitations")
    .select("id, family_id, email, expires_at, status")
    .eq("token", token)
    .maybeSingle();

  if (invErr) {
    throw new Error(invErr.message || "Failed to fetch invitation");
  }
  if (!invite) {
    throw new Error("Invitation not found");
  }
  if (invite.status !== "pending") {
    throw new Error("Invitation not pending");
  }
  if (new Date(invite.expires_at) < new Date()) {
    throw new Error("Invitation expired");
  }

  // Verify email matches authenticated user
  const userEmail = userData.user?.email;
  if (invite.email !== userEmail) {
    throw new Error("Invitation email does not match authenticated user");
  }

  // Create family_members entry using authenticated user (RLS policy enforces role='member')
  const { error: memErr } = await supabase.from("family_members").insert({
    family_id: invite.family_id,
    user_id: userId,
    role: "member",
    status: "active",
    joined_at: new Date().toISOString(),
  });
  if (memErr) {
    throw new Error(memErr.message || "Failed to join family");
  }

  // Mark invitation accepted (use service role for this update as RLS blocks it)
  const { error: updErr } = await svc
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invite.id);
  if (updErr) {
    throw new Error(updErr.message || "Failed to accept invitation");
  }

  redirect("/");
}

export async function inviteMembers(familyId: string, emails: string[]) {
  if (!familyId) {
    throw new Error("Missing family ID");
  }

  if (!emails || emails.length === 0) {
    throw new Error("No emails provided");
  }

  // get the logged-in user id from server-side session client
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // use service role client to verify user is admin
  const svc = createServiceRoleClient();

  const { data: membership, error: memberErr } = await svc
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .single();

  if (memberErr || !membership || membership.role !== "admin") {
    throw new Error("User is not admin of this family");
  }

  // Fetch family info for email context
  const { data: family } = await svc
    .from("families")
    .select("name")
    .eq("id", familyId)
    .single();

  const familyName = family?.name || "Your Family";

  // Create invitation records
  const invitations = emails.map((email) => ({
    family_id: familyId,
    email,
    token: crypto.randomUUID(),
    invited_by: userId,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    status: "pending" as const,
  }));

  const { error: invErr } = await svc.from("invitations").insert(invitations);

  if (invErr) {
    throw new Error(invErr.message || "Failed to create invitations");
  }

  // Send invitation emails
  const headersList = await headers();
  const baseUrl = getBaseURL(headersList);

  await sendInvitationEmails({
    emails: invitations.map((inv) => ({ email: inv.email, token: inv.token })),
    familyName,
    invitedByName: userData.user?.user_metadata?.display_name,
    expiresAt: new Date(invitations[0]!.expires_at),
    baseUrl,
  });
}

/**
 * Update a family member's role
 * Only admins can change member roles
 */
export async function updateMemberRole(
  familyId: string,
  memberId: string,
  newRole: "admin" | "member" | "viewer"
) {
  // Validate inputs
  if (!familyId) {
    throw new Error("Family ID is required");
  }

  if (!memberId) {
    throw new Error("Member ID is required");
  }

  if (!(newRole && ["admin", "member", "viewer"].includes(newRole))) {
    throw new Error("Invalid role");
  }

  // Get current user
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Verify caller is admin
  const svc = createServiceRoleClient();
  const { data: membership, error: memberErr } = await svc
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .single();

  if (memberErr || !membership || membership.role !== "admin") {
    throw new Error("User is not admin of this family");
  }

  // Prevent admin from changing own role to non-admin
  if (memberId === userId && newRole !== "admin") {
    throw new Error("Admin cannot remove their own admin status");
  }

  // Update member role
  const { error: updateErr } = await svc
    .from("family_members")
    .update({ role: newRole })
    .eq("family_id", familyId)
    .eq("user_id", memberId);

  if (updateErr) {
    throw new Error(updateErr.message || "Failed to update member role");
  }
}

/**
 * Remove a family member
 * Only admins can remove members, and cannot remove themselves
 */
export async function removeMember(familyId: string, memberId: string) {
  // Validate inputs
  if (!familyId) {
    throw new Error("Family ID is required");
  }

  if (!memberId) {
    throw new Error("Member ID is required");
  }

  // Get current user
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Verify caller is admin
  const svc = createServiceRoleClient();
  const { data: membership, error: memberErr } = await svc
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .single();

  if (memberErr || !membership || membership.role !== "admin") {
    throw new Error("User is not admin of this family");
  }

  // Prevent admin from removing themselves
  if (memberId === userId) {
    throw new Error("Admin cannot remove themselves");
  }

  // Delete member record
  const { error: deleteErr } = await svc
    .from("family_members")
    .delete()
    .eq("family_id", familyId)
    .eq("user_id", memberId);

  if (deleteErr) {
    throw new Error(deleteErr.message || "Failed to remove member");
  }
}

/**
 * Revoke an invitation
 * Only admins can revoke invitations
 */
export async function revokeInvitation(familyId: string, invitationId: string) {
  // Validate inputs
  if (!familyId) {
    throw new Error("Family ID is required");
  }

  if (!invitationId) {
    throw new Error("Invitation ID is required");
  }

  // Get current user
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Verify caller is admin
  const svc = createServiceRoleClient();
  const { data: membership, error: memberErr } = await svc
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .single();

  if (memberErr || !membership || membership.role !== "admin") {
    throw new Error("User is not admin of this family");
  }

  // Delete invitation record
  const { error: deleteErr } = await svc
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("family_id", familyId);

  if (deleteErr) {
    throw new Error(deleteErr.message || "Failed to revoke invitation");
  }
}

/**
 * Resend an invitation email
 * Only admins can resend invitations
 */
export async function resendInvitation(familyId: string, invitationId: string) {
  // Validate inputs
  if (!familyId) {
    throw new Error("Family ID is required");
  }

  if (!invitationId) {
    throw new Error("Invitation ID is required");
  }

  // Get current user
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Verify caller is admin
  const svc = createServiceRoleClient();
  const { data: membership, error: memberErr } = await svc
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .single();

  if (memberErr || !membership || membership.role !== "admin") {
    throw new Error("User is not admin of this family");
  }

  // Get the invitation
  const { data: invitation, error: getErr } = await svc
    .from("invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("family_id", familyId)
    .single();

  if (getErr || !invitation) {
    throw new Error("Invitation not found");
  }

  // Fetch family info for email context
  const { data: family } = await svc
    .from("families")
    .select("name")
    .eq("id", familyId)
    .single();

  const familyName = family?.name || "Your Family";

  // Update invitation with new token and expiry
  const newToken = crypto.randomUUID();
  const newExpiry = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: updateErr } = await svc
    .from("invitations")
    .update({
      token: newToken,
      expires_at: newExpiry,
    })
    .eq("id", invitationId);

  if (updateErr) {
    throw new Error(updateErr.message || "Failed to resend invitation");
  }

  // Send invitation email with new token
  const headersList = await headers();
  const baseUrl = getBaseURL(headersList);

  await sendInvitationEmails({
    emails: [{ email: invitation.email, token: newToken }],
    familyName,
    invitedByName: userData.user?.user_metadata?.display_name,
    expiresAt: new Date(newExpiry),
    baseUrl,
  });
}
