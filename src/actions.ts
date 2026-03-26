"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function socialSignIn() {
  const header = await headers();
  const origin = header.get("origin") ?? header.get("host") ?? "";

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
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
