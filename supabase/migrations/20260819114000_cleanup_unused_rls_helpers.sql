-- Cleanup migration: Remove unused RLS helpers since we're using service role for events INSERTs
-- 
-- Analysis:
-- - The is_family_member_with_status() SECURITY DEFINER function was created to bypass RLS 
--   but we're now using the service role client directly for events table INSERTs
-- - The GRANT SELECT ON family_members TO authenticator is no longer needed
-- - The events_insert_member policy is still defined but not evaluated anymore,
--   we can simplify it or keep it as a safety measure for direct API calls

-- Drop the unused SECURITY DEFINER helper function
DROP FUNCTION IF EXISTS is_family_member_with_status(UUID, UUID, TEXT) CASCADE;

-- Revert the events_insert_member policy to use the existing is_family_member() SECURITY DEFINER
-- (This is kept for future RLS-based INSERT work, currently bypassed via service role)
DROP POLICY IF EXISTS events_insert_member ON public.events;

CREATE POLICY events_insert_member ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND is_family_member(family_id)
  );

-- Revoke the explicit grant that was added for RLS evaluation
-- (This was only needed when we were trying to use RLS policies for INSERTs)
REVOKE SELECT ON public.family_members FROM authenticator;

-- Keep SELECT/UPDATE/DELETE policies for normal operations
-- These remain unchanged as they're used for legitimate data access control
