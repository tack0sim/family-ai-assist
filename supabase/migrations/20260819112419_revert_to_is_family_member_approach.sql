-- Revert to is_family_member() approach
-- The simple auth.uid() check also failed, so the issue is NOT the policy logic
-- Must be related to how RLS is configured on the events table itself

DROP POLICY IF EXISTS events_insert_member ON public.events;

CREATE POLICY events_insert_member ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND is_family_member(family_id)
  );
