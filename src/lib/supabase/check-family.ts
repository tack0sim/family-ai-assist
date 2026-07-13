"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Check if a user has any family context:
 * - A family they created (families.created_by)
 * - An active membership in a family (family_members with status='active')
 *
 * Returns true if the user has any of these conditions.
 */
export async function checkUserFamilyContext(): Promise<boolean> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return false;
  }

  // Check if user created a family
  const { data: createdFamily, error: createdError } = await supabase
    .from("families")
    .select("id")
    .eq("created_by", userId)
    .maybeSingle();

  if (createdError) {
    console.error("Error checking created families:", createdError);
  }

  if (createdFamily) {
    return true;
  }

  // Check if user is an active member of any family
  const { data: membership, error: memberError } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (memberError) {
    console.error("Error checking family memberships:", memberError);
  }

  return !!membership;
}
