"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  FamilyInvitation,
  FamilyMember,
  FamilyMemberRow,
} from "@/lib/types/settings";

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

/**
 * Fetch all family members for a given family ID.
 * Uses request-level caching to avoid repeated queries within the same request.
 *
 * @param familyId - The UUID of the family
 * @returns Promise<FamilyMember[]> Array of family members with their profile information
 * @throws Error if database query fails
 */
export const getFamilyMembers = cache(
  async (familyId: string): Promise<FamilyMember[]> => {
    if (!familyId?.trim()) {
      throw new Error("Family ID is required");
    }

    const supabase = await createClient();

    // Fetch all family members with their profile info
    const { data: membersData, error: membersError } = await supabase
      .from("family_members")
      .select(
        `
        id,
        user_id,
        family_id,
        role,
        status,
        joined_at,
        profiles(display_name)
      `
      )
      .eq("family_id", familyId)
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching members:", membersError);
      throw new Error("Failed to fetch family members");
    }

    // Map the raw Supabase data to our FamilyMember type
    const members: FamilyMember[] = (
      (membersData || []) as unknown as FamilyMemberRow[]
    ).map((member) => ({
      id: member.id,
      user_id: member.user_id,
      family_id: member.family_id,
      role: member.role,
      status: member.status,
      joined_at: member.joined_at,
      display_name: member.profiles?.display_name || undefined,
      email: undefined, // Email retrieval would require separate logic or schema change
    }));

    return members;
  }
);

/**
 * Fetch pending invitations for a given family ID.
 * Uses request-level caching to avoid repeated queries within the same request.
 *
 * @param familyId - The UUID of the family
 * @returns Promise<FamilyInvitation[]> Array of pending family invitations
 * @throws Error if database query fails
 */
export const getPendingInvitations = cache(
  async (familyId: string): Promise<FamilyInvitation[]> => {
    if (!familyId?.trim()) {
      throw new Error("Family ID is required");
    }

    const supabase = await createClient();

    const { data: invData, error: invError } = await supabase
      .from("invitations")
      .select("*")
      .eq("family_id", familyId)
      .order("expires_at");

    if (invError) {
      console.error("Error fetching invitations:", invError);
      throw new Error("Failed to fetch pending invitations");
    }

    return (invData || []) as FamilyInvitation[];
  }
);
