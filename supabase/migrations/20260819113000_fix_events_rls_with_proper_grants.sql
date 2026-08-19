-- Fix the RLS issue by:
-- 1. Ensuring authenticator role can see family_members data needed for policy evaluation
-- 2. Simplifying the events INSERT policy to avoid recursive RLS checks

-- First, grant the authenticator role SELECT on family_members
-- This is necessary for RLS policies to evaluate subqueries against family_members
GRANT SELECT ON public.family_members TO authenticator;

-- Create a helper function with SECURITY DEFINER that bypasses RLS for membership checks
CREATE OR REPLACE FUNCTION is_family_member_with_status(
  p_user_id UUID,
  p_family_id UUID,
  p_status TEXT DEFAULT 'active'
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = p_user_id
      AND family_id = p_family_id
      AND status = p_status
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_family_member_with_status(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_family_member_with_status(UUID, UUID, TEXT) TO authenticator;

-- Now update the events_insert_member policy to use this function
DROP POLICY IF EXISTS events_insert_member ON public.events;

CREATE POLICY events_insert_member ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND is_family_member_with_status(auth.uid(), family_id, 'active')
  );
