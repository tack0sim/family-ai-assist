"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Check if a user has agreed to beta testing consent.
 *
 * @param userId - The user ID to check
 */
export async function hasBetaConsentAgreed(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("beta_consent_agreed")
    .eq("id", userId)
    .single();

  return profile?.beta_consent_agreed ?? false;
}
