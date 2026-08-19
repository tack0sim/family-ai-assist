-- Revert to is_family_member() approach with verified GRANTS
-- Issue: Need to ensure authenticated role can execute is_family_member()
-- and has proper SELECT access to family_members

-- Drop the problematic direct subquery policy and go back to helper function
DROP POLICY IF EXISTS events_insert_member ON public.events;

-- Recreate using is_family_member() SECURITY DEFINER helper
CREATE POLICY events_insert_member ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND is_family_member(family_id)
  );

-- Ensure authenticated role has full necessary permissions
-- Grant SELECT on family_members to authenticated role
GRANT SELECT ON public.family_members TO authenticated;

-- Grant EXECUTE on is_family_member function
GRANT EXECUTE ON FUNCTION is_family_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_family_admin(uuid) TO authenticated;

-- Grant USAGE on public schema
GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON POLICY events_insert_member ON public.events IS
  'Active family members can insert events. Uses is_family_member() SECURITY DEFINER helper to check family membership safely.';
