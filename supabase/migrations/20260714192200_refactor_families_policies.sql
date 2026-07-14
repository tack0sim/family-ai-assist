-- Refactor families RLS policies to use helper functions
-- Issue #2: Replace redundant EXISTS subqueries with reusable helper functions

-- Drop existing policies
DROP POLICY IF EXISTS families_select_member ON public.families;
DROP POLICY IF EXISTS families_update_admin ON public.families;

-- Recreate policies using helper functions
CREATE POLICY families_select_member ON public.families
  FOR SELECT USING (
    created_by = auth.uid()  -- Creators can read their own families
    OR is_family_member(id)  -- Or active family members
  );

CREATE POLICY families_update_admin ON public.families
  FOR UPDATE USING (
    is_family_admin(id)  -- Only admins can update
  );

-- Add comment explaining the refactoring
COMMENT ON POLICY families_select_member ON public.families IS 'Allows SELECT for family creators and active members (using is_family_member helper)';
COMMENT ON POLICY families_update_admin ON public.families IS 'Allows UPDATE only for family admins (using is_family_admin helper)';
