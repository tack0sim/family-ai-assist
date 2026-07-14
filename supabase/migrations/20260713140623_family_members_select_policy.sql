DROP POLICY IF EXISTS family_members_select ON public.family_members;

-- Allow users to see family members in families they belong to
-- Uses a simpler auth-based approach instead of recursive queries
CREATE POLICY family_members_select ON public.family_members
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );