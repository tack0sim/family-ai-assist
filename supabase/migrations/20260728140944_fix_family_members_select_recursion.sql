-- Fix infinite recursion in family_members RLS policy
-- Issue: family_members_select_member used self-join that triggered infinite recursion
-- Solution: Use is_family_member() helper function (SECURITY DEFINER) to bypass RLS

-- Drop the loose policy that allows any authenticated user to see all family_members
DROP POLICY IF EXISTS family_members_select ON public.family_members;

-- Drop the recursive policy
DROP POLICY IF EXISTS family_members_select_member ON public.family_members;

-- Create the new policy using the helper function
-- This allows users to see only family_members rows from families they belong to
CREATE POLICY family_members_select_member ON public.family_members
  FOR SELECT USING (
    is_family_member(family_id)
  );

COMMENT ON POLICY family_members_select_member ON public.family_members IS
  'Users can only select family_members rows from families they are active members of. Uses is_family_member() to avoid RLS recursion.';
