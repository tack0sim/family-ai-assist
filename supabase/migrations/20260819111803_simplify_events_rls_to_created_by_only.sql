-- Simplify events RLS policy - remove family_members dependency
-- Issue: RLS policy WITH CHECK clause cannot reliably use SECURITY DEFINER functions with nested RLS
-- Solution: Simplify to just check created_by=auth.uid(), rely on application validation for family membership

-- Remove problematic authenticator grants
REVOKE SELECT ON public.family_members FROM authenticator;
REVOKE EXECUTE ON FUNCTION is_family_member(uuid) FROM authenticator;
REVOKE EXECUTE ON FUNCTION is_family_admin(uuid) FROM authenticator;

-- Drop and recreate events_insert_member policy
DROP POLICY IF EXISTS events_insert_member ON public.events;

CREATE POLICY events_insert_member ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

COMMENT ON POLICY events_insert_member ON public.events IS
  'Only authenticated users can create events. Family membership is validated at application layer.
   RLS policy ensures created_by always matches the authenticated user.';
