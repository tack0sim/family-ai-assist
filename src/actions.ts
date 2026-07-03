"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getBaseURL } from "@/lib/utils/get-base-url";

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

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
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

  redirect("/auth/check-email");
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
    throw new Error(error?.message || "Signin failed");
  }

  redirect("/");
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

  // get the logged-in user id from server-side session client
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // use service role client to create family and membership (bypass RLS)
  const svc = createServiceRoleClient();

  const { data: family, error: famErr } = await svc
    .from("families")
    .insert({ name, created_by: userId })
    .select("id")
    .single();

  if (famErr || !family?.id) {
    throw new Error(famErr?.message || "Failed to create family");
  }

  // create family_members as admin
  const { error: memErr } = await svc.from("family_members").insert({
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

  const svc = createServiceRoleClient();

  // fetch invitation by token
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

  // create family_members entry for the user
  const { error: memErr } = await svc.from("family_members").insert({
    family_id: invite.family_id,
    user_id: userId,
    role: "member",
    status: "active",
    joined_at: new Date().toISOString(),
  });
  if (memErr) {
    throw new Error(memErr.message || "Failed to join family");
  }

  // mark invitation accepted
  const { error: updErr } = await svc
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invite.id);
  if (updErr) {
    throw new Error(updErr.message || "Failed to mark invitation accepted");
  }

  redirect("/");
}
