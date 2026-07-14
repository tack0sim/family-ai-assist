-- Add DELETE policies for all tables
-- Issue #4: Add missing DELETE policies for all tables

-- Profiles: Allow users to delete their own profile
CREATE POLICY profiles_delete_self ON public.profiles
  FOR DELETE USING (id = (SELECT auth.uid()));

-- Families: Allow admin to delete family
CREATE POLICY families_delete_admin ON public.families
  FOR DELETE USING (is_family_admin(families.id));

-- Invitations: Allow admin to delete invitations
CREATE POLICY invitations_delete_admin ON public.invitations
  FOR DELETE USING (is_family_admin(invitations.family_id));

COMMENT ON POLICY profiles_delete_self ON public.profiles IS 
  'Users can delete their own profile';

COMMENT ON POLICY families_delete_admin ON public.families IS 
  'Family admins can delete their family';

COMMENT ON POLICY invitations_delete_admin ON public.invitations IS 
  'Family admins can delete invitations for their family';
