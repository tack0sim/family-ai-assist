-- Fix events_insert_member policy with explicit auth checks
-- Issue: RLS policy failing even after migration with is_family_member() helper
-- Solution: Use direct subquery with explicit column references for NEW row

DROP POLICY IF EXISTS events_insert_member ON public.events;

CREATE POLICY events_insert_member ON public.events
  FOR INSERT WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- created_by must match authenticated user
    AND created_by = auth.uid()
    -- User must be an active member of this family
    AND EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_id = events.family_id
        AND user_id = auth.uid()
        AND status = 'active'
        LIMIT 1
    )
  );
