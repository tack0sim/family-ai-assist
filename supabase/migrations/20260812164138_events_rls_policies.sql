-- Enable RLS on events tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;

-- ====== EVENTS TABLE POLICIES ======

-- SELECT: Family members can see:
--   - Family visibility events in their family
--   - Personal events if they are creator or family admin
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
        -- User can see personal events if they are creator or admin
        events.visibility = 'personal'
        AND (
          events.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = events.family_id
              AND fm.user_id = auth.uid()
              AND fm.role = 'admin'
          )
        )
      )
    )
  );

-- INSERT: Active family members can create events in their family
CREATE POLICY events_insert_member ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = events.family_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
  );

-- UPDATE: Only creator or family admin can update events
CREATE POLICY events_update_creator_admin ON public.events
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = events.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
  ) WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = events.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
  );

-- DELETE: Only creator or family admin can delete events
CREATE POLICY events_delete_creator_admin ON public.events
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = events.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
  );

-- ====== EVENT_ASSIGNEES TABLE POLICIES ======

-- SELECT: User can see assignees for events they can see
CREATE POLICY event_assignees_select ON public.event_assignees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_assignees.event_id
        AND (
          -- User is active family member and event is family visibility
          (
            e.visibility = 'family'
            AND EXISTS (
              SELECT 1 FROM public.family_members fm
              WHERE fm.family_id = e.family_id
                AND fm.user_id = auth.uid()
                AND fm.status = 'active'
            )
          )
          OR (
            -- User is event creator or family admin
            e.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.family_members fm
              WHERE fm.family_id = e.family_id
                AND fm.user_id = auth.uid()
                AND fm.role = 'admin'
            )
          )
          OR (
            -- User is assigned to this event
            event_assignees.profile_id = auth.uid()
          )
        )
    )
  );

-- INSERT: User can assign themselves or family admins can assign others
CREATE POLICY event_assignees_insert ON public.event_assignees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_assignees.event_id
        AND (
          e.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = e.family_id
              AND fm.user_id = auth.uid()
              AND fm.role = 'admin'
          )
        )
    )
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = (SELECT family_id FROM public.events WHERE id = event_assignees.event_id)
        AND fm.user_id = event_assignees.profile_id
        AND fm.status = 'active'
    )
  );

-- DELETE: Event creator or family admin can remove assignees
CREATE POLICY event_assignees_delete ON public.event_assignees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_assignees.event_id
        AND (
          e.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = e.family_id
              AND fm.user_id = auth.uid()
              AND fm.role = 'admin'
          )
        )
    )
  );

-- ====== EVENT_TAGS_CONFIG TABLE POLICIES ======

-- SELECT: Family members can see tag config for their family
CREATE POLICY event_tags_config_select ON public.event_tags_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = event_tags_config.family_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
  );

-- INSERT: Active family members can create tags
CREATE POLICY event_tags_config_insert ON public.event_tags_config
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = event_tags_config.family_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
  );

-- UPDATE: Only creator or family admin can update tags
CREATE POLICY event_tags_config_update ON public.event_tags_config
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = event_tags_config.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
  ) WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = event_tags_config.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
  );

-- DELETE: Only creator or family admin can delete tags
CREATE POLICY event_tags_config_delete ON public.event_tags_config
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = event_tags_config.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
  );

-- ====== EVENT_TAGS TABLE POLICIES ======

-- SELECT: User can see tags for events they can see
CREATE POLICY event_tags_select ON public.event_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_tags.event_id
        AND (
          -- User is active family member and event is family visibility
          (
            e.visibility = 'family'
            AND EXISTS (
              SELECT 1 FROM public.family_members fm
              WHERE fm.family_id = e.family_id
                AND fm.user_id = auth.uid()
                AND fm.status = 'active'
            )
          )
          OR (
            -- User is event creator or family admin
            e.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.family_members fm
              WHERE fm.family_id = e.family_id
                AND fm.user_id = auth.uid()
                AND fm.role = 'admin'
            )
          )
        )
    )
  );

-- INSERT: Event creator or family admin can add tags
CREATE POLICY event_tags_insert ON public.event_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_tags.event_id
        AND (
          e.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = e.family_id
              AND fm.user_id = auth.uid()
              AND fm.role = 'admin'
          )
        )
    )
    AND EXISTS (
      SELECT 1 FROM public.event_tags_config tc
      WHERE tc.id = event_tags.tag_id
        AND tc.family_id = (SELECT family_id FROM public.events WHERE id = event_tags.event_id)
    )
  );

-- DELETE: Event creator or family admin can remove tags
CREATE POLICY event_tags_delete ON public.event_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_tags.event_id
        AND (
          e.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = e.family_id
              AND fm.user_id = auth.uid()
              AND fm.role = 'admin'
          )
        )
    )
  );
