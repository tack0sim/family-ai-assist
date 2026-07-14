-- Refactor invitations RLS policies to use helper functions
-- Issue #2: Replace redundant EXISTS subquery with reusable is_family_admin helper

-- Drop existing policy
DROP POLICY IF EXISTS invitations_insert_admin ON public.invitations;

-- Recreate policy using helper function
CREATE POLICY invitations_insert_admin ON public.invitations
  FOR INSERT WITH CHECK (
    is_family_admin(family_id)  -- Only family admins can create invitations
  );

-- Add comment explaining the refactoring
COMMENT ON POLICY invitations_insert_admin ON public.invitations IS 'Allows INSERT only for family admins (using is_family_admin helper)';
