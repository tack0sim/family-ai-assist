-- Fix events table INSERT RLS policies to use is_family_member() helper function
-- Issue: Direct SELECT subqueries in WITH CHECK clauses can fail with permission/recursion issues
-- Solution: Use SECURITY DEFINER helper function which bypasses RLS and is proven to work

-- Drop existing policies for events
DROP POLICY IF EXISTS events_insert_member ON public.events;

-- Drop existing policies for event_assignees (which also checks family membership)
DROP POLICY IF EXISTS event_assignees_insert ON public.event_assignees;

-- Drop existing policies for event_tags (which also checks family membership)
DROP POLICY IF EXISTS event_tags_insert ON public.event_tags;

-- Drop existing policies for event_tags_config
DROP POLICY IF EXISTS event_tags_config_insert ON public.event_tags_config;

-- Recreate events INSERT policy using is_family_member() helper
-- This allows active family members to create events in their family
CREATE POLICY events_insert_member ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND is_family_member(family_id)
  );

-- Recreate event_assignees INSERT policy using is_family_member() helper
-- User can assign others only if they created the event or are family admin
CREATE POLICY event_assignees_insert ON public.event_assignees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_assignees.event_id
        AND (
          e.created_by = auth.uid()
          OR is_family_admin(e.family_id)
        )
    )
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = (SELECT family_id FROM public.events WHERE id = event_assignees.event_id)
        AND fm.user_id = event_assignees.profile_id
        AND fm.status = 'active'
    )
  );

-- Recreate event_tags INSERT policy using is_family_member() helper
-- Event creator or family admin can add tags
CREATE POLICY event_tags_insert ON public.event_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_tags.event_id
        AND (
          e.created_by = auth.uid()
          OR is_family_admin(e.family_id)
        )
    )
    AND EXISTS (
      SELECT 1 FROM public.event_tags_config tc
      WHERE tc.id = event_tags.tag_id
        AND tc.family_id = (SELECT family_id FROM public.events WHERE id = event_tags.event_id)
    )
  );

-- Recreate event_tags_config INSERT policy using is_family_member() helper
-- Active family members can create tags
CREATE POLICY event_tags_config_insert ON public.event_tags_config
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND is_family_member(family_id)
  );

COMMENT ON POLICY events_insert_member ON public.events IS
  'Active family members can insert events. Uses is_family_member() helper to avoid RLS recursion issues.';

COMMENT ON POLICY event_assignees_insert ON public.event_assignees IS
  'Event creators and family admins can assign members to events. Uses helper functions for efficiency.';

COMMENT ON POLICY event_tags_insert ON public.event_tags IS
  'Event creators and family admins can add tags to events. Uses helper functions for efficiency.';

COMMENT ON POLICY event_tags_config_insert ON public.event_tags_config IS
  'Active family members can create tag configurations. Uses is_family_member() helper.';