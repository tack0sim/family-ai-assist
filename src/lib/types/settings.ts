// Types for Family and Settings data
export interface FamilyMember {
  display_name?: string;
  email?: string;
  family_id: string;
  id: string;
  joined_at: string;
  role: "admin" | "member";
  status: "active" | "invited";
  user_id: string;
}

export interface FamilyInvitation {
  created_at: string;
  email: string;
  expires_at: string;
  family_id: string;
  id: string;
  status: "pending" | "accepted";
  token: string;
}

export interface FamilyData {
  familyId: string;
  invitations: FamilyInvitation[];
  members: FamilyMember[];
  userRole: "admin" | "member";
}

// Supabase row types from API responses
export interface FamilyMemberRow {
  family_id: string;
  id: string;
  joined_at: string;
  profiles: {
    display_name: string | null;
  } | null;
  role: "admin" | "member";
  status: "active" | "invited";
  user_id: string;
}

export interface FamilyInvitationRow {
  created_at: string;
  email: string;
  expires_at: string;
  family_id: string;
  id: string;
  status: "pending" | "accepted";
  token: string;
}
