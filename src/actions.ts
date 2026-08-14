"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendInvitationEmails } from "@/lib/email/send-invitation";
import { createEventSchema, updateEventSchema } from "@/lib/schemas/events";
import {
  createChildProfileSchema,
  eventTagSchema,
} from "@/lib/schemas/settings";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import {
  getFamilyMembers,
  getPendingInvitations,
  getUserFamilyMembership,
  validateAdminAccess,
} from "@/lib/supabase/family";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { FamilyData, FamilyInvitation } from "@/lib/types/settings";
import { getBaseURL } from "@/lib/utils/get-base-url";
import { validatePasswordComplexity } from "@/lib/utils/validate-password";
import { getUserDisplayName } from "./lib/supabase/user";

export async function socialSignIn(invitationToken?: string) {
  const header = await headers();
  const baseUrl = getBaseURL(header);

  const supabase = await createClient();

  let redirectTo = `${baseUrl}/auth/callback`;
  if (invitationToken) {
    redirectTo += `?invitation_token=${encodeURIComponent(invitationToken)}`;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
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

export async function signUp(formData: FormData, invitationToken?: string) {
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

  let destination = "/onboarding";
  if (invitationToken) {
    destination += `?invitation_token=${encodeURIComponent(invitationToken)}`;
  }

  redirect(destination);
}

export async function signIn(formData: FormData, invitationToken?: string) {
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
  let destination = hasFamily ? "/" : "/onboarding";

  if (!hasFamily && invitationToken) {
    destination += `?invitation_token=${encodeURIComponent(invitationToken)}`;
  }

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

  // Return family ID for the client to handle modal display and redirect
  return family.id;
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

/**
 * Auto-accept an invitation during onboarding.
 * Only accepts if user has ZERO families (no created families and no active memberships).
 * Returns success or throws error with user-friendly message.
 */
export async function autoAcceptInvitation(token: string) {
  if (!token) {
    throw new Error("This invitation link is no longer valid");
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Check if user already has any families
  const hasFamily = await checkUserFamilyContext();
  if (hasFamily) {
    throw new Error(
      "You can only auto-accept invitations when joining your first family. Please use the join form for additional families."
    );
  }

  // Use service role to fetch invitation (user can only see their own by email)
  const svc = createServiceRoleClient();
  const { data: invite, error: invErr } = await svc
    .from("invitations")
    .select("id, family_id, email, expires_at, status")
    .eq("token", token)
    .maybeSingle();

  if (invErr) {
    throw new Error("This invitation link is no longer valid");
  }
  if (!invite) {
    throw new Error("This invitation link is no longer valid");
  }
  if (invite.status === "accepted") {
    throw new Error("You've already joined this family");
  }
  if (invite.status === "expired") {
    throw new Error(
      "This invitation has expired. Ask the family admin to send a new one"
    );
  }
  if (invite.status !== "pending") {
    throw new Error("This invitation link is no longer valid");
  }
  if (new Date(invite.expires_at) < new Date()) {
    throw new Error(
      "This invitation has expired. Ask the family admin to send a new one"
    );
  }

  // Verify email matches authenticated user
  const userEmail = userData.user?.email;
  if (invite.email !== userEmail) {
    throw new Error("This invitation is not for your email address");
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
    throw new Error("Failed to join family. Please try again.");
  }

  // Mark invitation accepted (use service role for this update as RLS blocks it)
  const { error: updErr } = await svc
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invite.id);
  if (updErr) {
    throw new Error("Failed to complete the invitation. Please try again.");
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
    invitedByName: getUserDisplayName(userData.user),
    expiresAt: new Date(invitations[0]!.expires_at),
    baseUrl,
  });

  revalidatePath("/settings");
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

  revalidatePath("/settings");
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

  revalidatePath("/settings");
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

  revalidatePath("/settings");
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
    invitedByName: getUserDisplayName(userData.user),
    expiresAt: new Date(newExpiry),
    baseUrl,
  });
}

export async function updateUserProfile(displayName: string) {
  if (!displayName || displayName.trim().length === 0) {
    throw new Error("Display name is required");
  }

  if (displayName.trim().length < 2) {
    throw new Error("Display name must be at least 2 characters");
  }

  if (displayName.trim().length > 100) {
    throw new Error("Display name must be less than 100 characters");
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName.trim(),
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to update profile");
  }
}

export async function getFamilyData(): Promise<FamilyData> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Get current user's family membership
  const { familyId, role: userRole } = await getUserFamilyMembership(userId);

  // Fetch family members using extracted utility
  const members = await getFamilyMembers(familyId);

  // Fetch invitations if user is admin
  let invitations: FamilyInvitation[] = [];
  if (userRole === "admin") {
    invitations = await getPendingInvitations(familyId);
  }

  return {
    familyId,
    userRole,
    members,
    invitations,
  };
}

/**
 * Create a child profile (email-less account) for a minor in the family.
 * Only family admins can create child profiles.
 *
 * @param familyId - The UUID of the family to add the child to
 * @param displayName - The child's name (required, 2-100 characters)
 * @param dateOfBirth - Optional date of birth for age tracking
 * @returns Object with { id (auth user id), profile_id (same as id), display_name, created_at }
 * @throws Error if user is not admin, invalid input, or auth service fails
 */
export async function createChildProfile(
  familyId: string,
  displayName: string,
  dateOfBirth?: string
): Promise<{
  id: string;
  profile_id: string;
  display_name: string;
  created_at: string;
}> {
  // Validate user inputs (familyId is already known by the server)
  const validationResult = createChildProfileSchema.safeParse({
    displayName,
    dateOfBirth,
  });

  if (!validationResult.success) {
    throw new Error(
      validationResult.error.issues[0]?.message || "Invalid input"
    );
  }

  // Get current user and verify authentication
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Verify user is admin of this family
  const { isAdmin } = await validateAdminAccess(userId, familyId);
  if (!isAdmin) {
    throw new Error("Only admins can create child profiles");
  }

  // Use service role client for privileged operations
  const svc = createServiceRoleClient();

  // Generate synthetic email for child account (required by Supabase)
  // Uses .local TLD to indicate internal/non-routable address
  const childEmail = `child-${crypto.randomUUID()}@family-assist.local`;

  // Create email-less auth user with child metadata
  const { data: authData, error: authError } = await svc.auth.admin.createUser({
    email: childEmail,
    email_confirm: true,
    user_metadata: {
      display_name: displayName.trim(),
      is_child: true,
      parent_id: userId,
      ...(dateOfBirth && { date_of_birth: dateOfBirth }),
    },
  });

  if (authError || !authData.user) {
    console.error("Auth creation error:", authError);
    throw new Error(authError?.message || "Failed to create child account");
  }

  const childUserId = authData.user.id;
  const createdAt = authData.user.created_at;

  // Ensure profile is created via trigger, with fallback
  const { error: ensureProfileErr } = await svc.rpc("ensure_profile_exists", {
    p_user_id: childUserId,
  });

  if (ensureProfileErr) {
    console.error("Profile creation error:", ensureProfileErr);
    throw new Error("Failed to create child profile. Please try again.");
  }

  // Add child as member to family with role='member'
  const { error: memberErr } = await svc.from("family_members").insert({
    family_id: familyId,
    user_id: childUserId,
    role: "member",
    status: "active",
    joined_at: new Date().toISOString(),
  });

  if (memberErr) {
    console.error("Family member creation error:", memberErr);
    throw new Error(memberErr.message || "Failed to add child to family");
  }
  revalidatePath("/settings");

  return {
    id: childUserId,
    profile_id: childUserId,
    display_name: displayName.trim(),
    created_at: createdAt,
  };
}

// ====== EVENT TAG MANAGEMENT ======

export async function createEventTag(
  familyId: string,
  name: string,
  color?: string
) {
  const supabase = await createClient();

  // Get current user
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Validate admin access
  const { isAdmin } = await validateAdminAccess(userId, familyId);
  if (!isAdmin) {
    throw new Error("Only family admins can create tags");
  }

  // Validate input
  const validationResult = eventTagSchema.safeParse({ name, color });
  if (!validationResult.success) {
    throw new Error(
      validationResult.error.issues[0]?.message || "Validation failed"
    );
  }
  const validated = validationResult.data;

  // Create tag
  const { data, error } = await supabase
    .from("event_tags_config")
    .insert({
      family_id: familyId,
      name: validated.name,
      color: validated.color || null,
      created_by: userId,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error creating event tag:", error);
    if (error.code === "23505") {
      throw new Error("A tag with this name already exists in your family");
    }
    throw new Error(error.message || "Failed to create event tag");
  }

  revalidatePath("/settings");
  return data;
}

export async function updateEventTag(
  familyId: string,
  tagId: string,
  name: string,
  color?: string
) {
  const supabase = await createClient();

  // Get current user
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Validate admin access
  const { isAdmin } = await validateAdminAccess(userId, familyId);
  if (!isAdmin) {
    throw new Error("Only family admins can update tags");
  }

  // Validate input
  const validationResult = eventTagSchema.safeParse({ name, color });
  if (!validationResult.success) {
    throw new Error(
      validationResult.error.issues[0]?.message || "Validation failed"
    );
  }
  const validated = validationResult.data;

  // Verify tag belongs to the family
  const { data: existingTag, error: fetchError } = await supabase
    .from("event_tags_config")
    .select("id, family_id")
    .eq("id", tagId)
    .maybeSingle();

  if (fetchError) {
    throw new Error("Failed to verify tag ownership");
  }

  if (!existingTag || existingTag.family_id !== familyId) {
    throw new Error("Tag not found or does not belong to this family");
  }

  // Update tag
  const { data, error } = await supabase
    .from("event_tags_config")
    .update({
      name: validated.name,
      color: validated.color || null,
    })
    .eq("id", tagId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating event tag:", error);
    if (error.code === "23505") {
      throw new Error("A tag with this name already exists in your family");
    }
    throw new Error(error.message || "Failed to update event tag");
  }

  revalidatePath("/settings");
  return data;
}

export async function deleteEventTag(familyId: string, tagId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Validate admin access
  const { isAdmin } = await validateAdminAccess(userId, familyId);
  if (!isAdmin) {
    throw new Error("Only family admins can delete tags");
  }

  // Verify tag belongs to the family
  const { data: existingTag, error: fetchError } = await supabase
    .from("event_tags_config")
    .select("id, family_id")
    .eq("id", tagId)
    .maybeSingle();

  if (fetchError) {
    throw new Error("Failed to verify tag ownership");
  }

  if (!existingTag || existingTag.family_id !== familyId) {
    throw new Error("Tag not found or does not belong to this family");
  }

  // Delete tag (cascade delete handled by DB)
  const { error } = await supabase
    .from("event_tags_config")
    .delete()
    .eq("id", tagId);

  if (error) {
    console.error("Error deleting event tag:", error);
    throw new Error(error.message || "Failed to delete event tag");
  }

  revalidatePath("/settings");
}

export async function getEventTags(familyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_tags_config")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching event tags:", error);
    throw new Error(error.message || "Failed to fetch event tags");
  }

  return data;
}

// Event CRUD actions

export async function createEvent(familyId: string, data: unknown) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Validate user is an active family member
  const membership = await getUserFamilyMembership(userId);
  if (membership.familyId !== familyId || membership.status !== "active") {
    throw new Error("Not a member of this family or membership is inactive");
  }

  // Validate input data with safeParse
  const {
    success,
    data: validated,
    error: validationError,
  } = createEventSchema.safeParse(data);

  if (!success) {
    throw new Error(`Validation error: ${validationError.message}`);
  }

  // Validate assignees are active family members
  if (validated.assignees && validated.assignees.length > 0) {
    const familyMembers = await getFamilyMembers(familyId);
    const activeMemberIds = familyMembers
      .filter((m) => m.status === "active")
      .map((m) => m.user_id);

    for (const assigneeId of validated.assignees) {
      if (!activeMemberIds.includes(assigneeId)) {
        throw new Error(`User ${assigneeId} is not an active family member`);
      }
    }
  }

  // Create event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      family_id: familyId,
      created_by: userId,
      title: validated.title,
      description: validated.description,
      start_at: validated.startAt,
      end_at: validated.endAt,
      all_day: validated.allDay,
      type: validated.type,
      visibility: validated.visibility,
      rrule: validated.rrule,
    })
    .select()
    .single();

  if (eventError || !event) {
    throw new Error(eventError?.message || "Failed to create event");
  }

  // Add assignees if any
  if (validated.assignees && validated.assignees.length > 0) {
    const assigneeRecords = validated.assignees.map((profileId) => ({
      event_id: event.id,
      profile_id: profileId,
    }));

    const { error: assigneeError } = await supabase
      .from("event_assignees")
      .insert(assigneeRecords);

    if (assigneeError) {
      await supabase.from("events").delete().eq("id", event.id);
      throw new Error(assigneeError.message || "Failed to add event assignees");
    }
  }

  // Add tags if any
  if (validated.tags && validated.tags.length > 0) {
    const tagRecords = validated.tags.map((tagId) => ({
      event_id: event.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from("event_tags")
      .insert(tagRecords);

    if (tagError) {
      await supabase.from("events").delete().eq("id", event.id);
      throw new Error(tagError.message || "Failed to add event tags");
    }
  }

  revalidatePath("/");

  return mapEventToResponse(event, validated.assignees, validated.tags);
}

export async function updateEvent(eventId: string, data: unknown) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Get event to verify ownership and family
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, family_id, created_by")
    .eq("id", eventId)
    .single();

  if (fetchError || !event) {
    throw new Error("Event not found");
  }

  // Check authorization: creator or admin
  const adminCheck = await validateAdminAccess(userId, event.family_id);
  if (event.created_by !== userId && !adminCheck.isAdmin) {
    throw new Error("Not authorized to update this event");
  }

  // Validate input data with safeParse
  const {
    success,
    data: validated,
    error: validationError,
  } = updateEventSchema.safeParse(data);

  if (!success) {
    throw new Error(`Validation error: ${validationError.message}`);
  }

  // Validate assignees if provided
  if (validated.assignees && validated.assignees.length > 0) {
    const familyMembers = await getFamilyMembers(event.family_id);
    const activeMemberIds = familyMembers
      .filter((m) => m.status === "active")
      .map((m) => m.user_id);

    for (const assigneeId of validated.assignees) {
      if (!activeMemberIds.includes(assigneeId)) {
        throw new Error(`User ${assigneeId} is not an active family member`);
      }
    }
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (validated.title !== undefined) {
    updateData.title = validated.title;
  }
  if (validated.description !== undefined) {
    updateData.description = validated.description;
  }
  if (validated.startAt !== undefined) {
    updateData.start_at = validated.startAt;
  }
  if (validated.endAt !== undefined) {
    updateData.end_at = validated.endAt;
  }
  if (validated.allDay !== undefined) {
    updateData.all_day = validated.allDay;
  }
  if (validated.type !== undefined) {
    updateData.type = validated.type;
  }
  if (validated.visibility !== undefined) {
    updateData.visibility = validated.visibility;
  }
  if (validated.rrule !== undefined) {
    updateData.rrule = validated.rrule;
  }
  updateData.updated_at = new Date().toISOString();

  const { data: updatedEvent, error: updateError } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", eventId)
    .select()
    .single();

  if (updateError || !updatedEvent) {
    throw new Error(updateError?.message || "Failed to update event");
  }

  // Update assignees if provided
  if (validated.assignees) {
    await supabase.from("event_assignees").delete().eq("event_id", eventId);

    if (validated.assignees.length > 0) {
      const assigneeRecords = validated.assignees.map((profileId) => ({
        event_id: eventId,
        profile_id: profileId,
      }));

      const { error: assigneeError } = await supabase
        .from("event_assignees")
        .insert(assigneeRecords);

      if (assigneeError) {
        throw new Error(
          assigneeError.message || "Failed to update event assignees"
        );
      }
    }
  }

  // Update tags if provided
  if (validated.tags) {
    await supabase.from("event_tags").delete().eq("event_id", eventId);

    if (validated.tags.length > 0) {
      const tagRecords = validated.tags.map((tagId) => ({
        event_id: eventId,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("event_tags")
        .insert(tagRecords);

      if (tagError) {
        throw new Error(tagError.message || "Failed to update event tags");
      }
    }
  }

  revalidatePath("/");

  return mapEventToResponse(updatedEvent, validated.assignees, validated.tags);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, family_id, created_by")
    .eq("id", eventId)
    .single();

  if (fetchError || !event) {
    throw new Error("Event not found");
  }

  const adminCheck = await validateAdminAccess(userId, event.family_id);
  if (event.created_by !== userId && !adminCheck.isAdmin) {
    throw new Error("Not authorized to delete this event");
  }

  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (deleteError) {
    throw new Error(deleteError.message || "Failed to delete event");
  }

  revalidatePath("/");
}

/**
 * Helper to check if user can view an event
 */
async function canViewEvent(
  userId: string,
  event: Record<string, unknown>,
  supabase: any
) {
  // For family visibility events, just check membership (already validated)
  if (event.visibility === "family") {
    return true;
  }

  // For personal events, check if user is creator, admin, or assigned
  const adminCheck = await validateAdminAccess(
    userId,
    event.family_id as string
  );
  if (event.created_by === userId || adminCheck.isAdmin) {
    return true;
  }

  // Check if user is assigned to this event
  const { data: assignment } = await supabase
    .from("event_assignees")
    .select("id")
    .eq("event_id", event.id)
    .eq("profile_id", userId)
    .maybeSingle();

  return !!assignment;
}

export async function getEvent(eventId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Get event
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    throw new Error("Event not found");
  }

  // Verify user is a family member
  const membership = await getUserFamilyMembership(userId);
  if (
    membership.familyId !== event.family_id ||
    membership.status !== "active"
  ) {
    throw new Error("Not a member of this event's family");
  }

  // Check visibility permissions for personal events
  const canView = await canViewEvent(userId, event, supabase);
  if (!canView) {
    throw new Error("Not authorized to view this personal event");
  }

  // Fetch assignees
  const { data: assignees } = await supabase
    .from("event_assignees")
    .select("*")
    .eq("event_id", eventId);

  // Fetch tags
  const { data: tags } = await supabase
    .from("event_tags")
    .select("*")
    .eq("event_id", eventId);

  return mapEventToResponse(event, assignees, tags);
}

/**
 * Helper function to map database event to response format
 */
function mapEventToResponse(
  event: Record<string, unknown>,
  assignees?: unknown[] | null,
  tags?: unknown[] | null
) {
  return {
    id: event.id,
    familyId: event.family_id,
    createdBy: event.created_by,
    title: event.title,
    description: event.description,
    startAt: event.start_at,
    endAt: event.end_at,
    allDay: event.all_day,
    type: event.type,
    visibility: event.visibility,
    rrule: event.rrule,
    recurrenceCount: event.recurrence_count,
    recurrenceExpiresAt: event.recurrence_expires_at,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
    assignees: assignees || undefined,
    tags: tags || undefined,
  };
}
