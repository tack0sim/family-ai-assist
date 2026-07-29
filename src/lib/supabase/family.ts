"use server";

import { createClient } from "@/lib/supabase/server";

export interface AdminAccessResult {
  isAdmin: boolean;
  role?: string;
}

/**
 * Validates if a user is an active admin member of a specific family.
 * Queries the family_members table to check both role and status.
 *
 * Uses authenticated client (not service role) to respect RLS policies.
 *
 * @param userId - The UUID of the user to validate
 * @param familyId - The UUID of the family to check membership in
 * @returns Promise containing isAdmin boolean and the user's role in the family
 * @throws Error if user ID or family ID is empty or if database query fails
 */
export async function validateAdminAccess(
  userId: string,
  familyId: string
): Promise<AdminAccessResult> {
  // Validate inputs
  if (!(userId?.trim() && familyId?.trim())) {
    throw new Error("User ID and Family ID are required");
  }

  const supabase = await createClient();

  // Query family_members table for this user in this family
  // RLS policy will ensure user can only see members of families they belong to
  const { data, error } = await supabase
    .from("family_members")
    .select("role, status")
    .eq("user_id", userId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (error) {
    console.error("Error validating admin access:", error);
    throw error;
  }

  // If no membership record found
  if (!data) {
    return {
      isAdmin: false,
    };
  }

  // Check if user is active admin
  const isAdmin = data.status === "active" && data.role === "admin";

  return {
    isAdmin,
    role: data.role,
  };
}
