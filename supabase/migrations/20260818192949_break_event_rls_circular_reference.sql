-- Break RLS circular reference between events and event_assignees policies
-- Create a SECURITY DEFINER helper function to check event visibility
-- This eliminates the infinite recursion detected in policy evaluation

-- Create helper function to check if user can see an event
-- SECURITY DEFINER means this function executes at owner's permission level,
-- bypassing RLS on referenced tables (events, family_members, event_assignees)
CREATE OR REPLACE FUNCTION public.can_user_see_event(
  event_id uuid,
  user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
    AND (
      -- User can see family visibility events if they're an active family member
      (
        e.visibility = 'family'
        AND EXISTS (
          SELECT 1 FROM public.family_members fm
          WHERE fm.family_id = e.family_id
            AND fm.user_id = user_id
            AND fm.status = 'active'
        )
      )
      OR (
        -- User can see personal events if they are creator, admin, or assigned
        e.visibility = 'personal'
        AND (
          e.created_by = user_id
          OR EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = e.family_id
              AND fm.user_id = user_id
              AND fm.role = 'admin'
          )
          OR EXISTS (
            SELECT 1 FROM public.event_assignees ea
            WHERE ea.event_id = e.id
              AND ea.profile_id = user_id
          )
        )
      )
    )
  );
$$;

-- Drop the old problematic events_select_family policy
DROP POLICY IF EXISTS events_select_family ON public.events;

-- Recreate events_select_family policy using the helper function
-- Much simpler and no circular references
CREATE POLICY events_select_family ON public.events
  FOR SELECT USING (
    public.can_user_see_event(id, auth.uid())
  );

-- Drop and recreate event_assignees_select policy to use helper function
-- This breaks the circular reference
DROP POLICY IF EXISTS event_assignees_select ON public.event_assignees;

CREATE POLICY event_assignees_select ON public.event_assignees
  FOR SELECT USING (
    public.can_user_see_event(event_assignees.event_id, auth.uid())
  );

-- Drop and recreate event_assignees_insert policy
-- User must be able to see the event AND be creator/admin to add assignees
DROP POLICY IF EXISTS event_assignees_insert ON public.event_assignees;

CREATE POLICY event_assignees_insert ON public.event_assignees
  FOR INSERT WITH CHECK (
    public.can_user_see_event(event_assignees.event_id, auth.uid())
    AND (
      -- Must be creator or family admin to add assignees
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
    )
  );

-- Drop and recreate event_assignees_delete policy
-- User must be able to see the event AND be creator/admin to remove assignees
DROP POLICY IF EXISTS event_assignees_delete ON public.event_assignees;

CREATE POLICY event_assignees_delete ON public.event_assignees
  FOR DELETE USING (
    public.can_user_see_event(event_assignees.event_id, auth.uid())
    AND (
      -- Must be creator or family admin to remove assignees
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
    )
  );
