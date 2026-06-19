-- Optimize RLS policies by caching auth.uid() and auth.jwt() calls
-- Fixes Issue #6: RLS Performance - auth.uid() called per row instead of once

-- Drop existing policies
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS families_select_member ON public.families;
DROP POLICY IF EXISTS families_update_admin ON public.families;
DROP POLICY IF EXISTS family_members_select_member ON public.family_members;
DROP POLICY IF EXISTS invitations_select_by_email ON public.invitations;
DROP POLICY IF EXISTS invitations_insert_admin ON public.invitations;

-- Recreate policies with cached auth function calls

-- profiles: users can SELECT and UPDATE only their own row
CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- families: SELECT by active family members; UPDATE by admin only
CREATE POLICY families_select_member ON public.families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = families.id
        AND fm.user_id = (SELECT auth.uid())
        AND fm.status = 'active'
    )
  );

CREATE POLICY families_update_admin ON public.families
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = families.id
        AND fm.user_id = (SELECT auth.uid())
        AND fm.role = 'admin'
    )
  );

-- family_members: SELECT by family members
CREATE POLICY family_members_select_member ON public.family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm2
      WHERE fm2.family_id = public.family_members.family_id
        AND fm2.user_id = (SELECT auth.uid())
        AND fm2.status = 'active'
    )
  );

-- invitations: SELECT where email matches JWT email
CREATE POLICY invitations_select_by_email ON public.invitations
  FOR SELECT USING (email = ((SELECT auth.jwt()) ->> 'email'));

-- invitations: INSERT by admins (WITH CHECK)
CREATE POLICY invitations_insert_admin ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = (SELECT auth.uid())
        AND fm.family_id = family_id
        AND fm.role = 'admin'
    )
  );

-- Add comments explaining the optimization
COMMENT ON POLICY profiles_select_self ON public.profiles IS 
  'Cached auth.uid() call prevents per-row evaluation';

COMMENT ON POLICY invitations_select_by_email ON public.invitations IS 
  'Cached auth.jwt() call prevents per-row evaluation';
