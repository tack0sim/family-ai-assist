-- Add indexes for columns used in RLS policy WHERE clauses
-- Fixes Issue #1: Missing database indexes for RLS policy columns

-- Indexes for family_members table
-- Used by families_select_member, families_update_admin, family_members_select_member, invitations_insert_admin
CREATE INDEX idx_family_members_family_user_status 
  ON public.family_members(family_id, user_id, status) 
  WHERE status = 'active';

CREATE INDEX idx_family_members_family_user_role 
  ON public.family_members(family_id, user_id, role);

-- Indexes for invitations table
-- Used by invitations_select_by_email, invitations_insert_admin
CREATE INDEX idx_invitations_email 
  ON public.invitations(email) 
  WHERE status = 'pending';

CREATE INDEX idx_invitations_family_id
  ON public.invitations(family_id);

-- Add comments for context
COMMENT ON INDEX idx_family_members_family_user_status IS 
  'Partial index for active family member lookups in RLS policies';

COMMENT ON INDEX idx_family_members_family_user_role IS 
  'Index for role-based RLS checks (admin policies)';

COMMENT ON INDEX idx_invitations_email IS 
  'Partial index for pending invitation email lookups';

COMMENT ON INDEX idx_invitations_family_id IS 
  'Index for family-based invitation queries';
