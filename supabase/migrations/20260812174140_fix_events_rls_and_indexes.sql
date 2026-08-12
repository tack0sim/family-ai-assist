-- Fix Issue 1: Allow assigned users to see events they're assigned to
-- Re-create the events_select policy with the missing condition
DROP POLICY IF EXISTS events_select_family ON public.events;

CREATE POLICY events_select_family ON public.events
  FOR SELECT USING (
    -- Check if user is an active family member
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = events.family_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
    AND (
      -- User can see family visibility events
      events.visibility = 'family'
      OR (
        -- User can see personal events if they are creator, admin, or assigned
        events.visibility = 'personal'
        AND (
          events.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = events.family_id
              AND fm.user_id = auth.uid()
              AND fm.role = 'admin'
          )
          OR EXISTS (
            SELECT 1 FROM public.event_assignees ea
            WHERE ea.event_id = events.id
              AND ea.profile_id = auth.uid()
          )
        )
      )
    )
  );

-- Fix Issue 2: Add performance indexes on created_by columns
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_event_tags_config_created_by ON public.event_tags_config(created_by);

-- Fix Issue 3: Update misleading comment
-- Note: The event_tags_config_insert policy was already correct (only creator and admin can create tags)
-- The comment in the original migration was just misleading, so we document the fix here
COMMENT ON POLICY event_tags_config_insert ON public.event_tags_config IS
  'Only creator and family admin can create tags. Other active family members can view tags but cannot create new ones.';
