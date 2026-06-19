-- Enable RLS and policies for profiles, families, family_members, invitations

-- profiles: users can SELECT and UPDATE only their own row
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- families: SELECT by active family members; UPDATE by admin only
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY families_select_member ON public.families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = families.id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
  );

CREATE POLICY families_update_admin ON public.families
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = families.id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
  );

-- family_members: SELECT by family members; INSERT/UPDATE restricted to service role (block non-service clients)
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY family_members_select_member ON public.family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm2
      WHERE fm2.family_id = public.family_members.family_id
        AND fm2.user_id = auth.uid()
        AND fm2.status = 'active'
    )
  );

-- Block direct INSERT/UPDATE from client-side by default. Service role bypasses RLS.
CREATE POLICY family_members_block_insert ON public.family_members
  FOR INSERT WITH CHECK (false);

CREATE POLICY family_members_block_update ON public.family_members
  FOR UPDATE USING (false);

-- invitations: SELECT where email matches JWT email; INSERT by admins (WITH CHECK) ; updates restricted to service role
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_select_by_email ON public.invitations
  FOR SELECT USING (email = (auth.jwt() ->> 'email'));

-- Allow insertion when creator is an admin of the family (WITH CHECK ensures inserted row is allowed)
CREATE POLICY invitations_insert_admin ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.family_id = family_id
        AND fm.role = 'admin'
    )
  );

-- Block updates from client-side; service role can update
CREATE POLICY invitations_block_update ON public.invitations
  FOR UPDATE USING (false);

-- Notes:
-- Service role keys bypass RLS and can perform INSERT/UPDATE where policies block clients.
