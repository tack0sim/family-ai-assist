"use server";

import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Return type when getting family context information.
 */
export interface FamilyContext {
  exists: boolean;
  familyId: string;
}

/**
 * Check if a user has any family context:
 * - A family they created (families.created_by)
 * - An active membership in a family (family_members with status='active')
 *
 * Uses service role client to bypass RLS and avoid policy recursion.
 * Returns an object with the family ID and existence status.
 *
 * @param userId - The user ID to check (passed from caller to avoid redundant getUser() calls)
 */
export async function checkUserFamilyContext(
  userId: string
): Promise<FamilyContext> {
  if (!userId) {
    return { familyId: "", exists: false };
  }

  // Use service role to bypass RLS and avoid policy recursion
  const svc = createServiceRoleClient();

  // Check if user created a family
  const { data: createdFamily, error: createdError } = await svc
    .from("families")
    .select("id")
    .eq("created_by", userId)
    .maybeSingle();

  if (createdError) {
    console.error("Error checking created families:", createdError);
  }

  if (createdFamily) {
    return { familyId: createdFamily.id, exists: true };
  }

  // Check if user is an active member of any family
  const { data: membership, error: memberError } = await svc
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (memberError) {
    console.error("Error checking family memberships:", memberError);
  }

  if (membership) {
    return { familyId: membership.family_id, exists: true };
  }

  return { familyId: "", exists: false };
}
