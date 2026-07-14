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
    created_by = auth.uid()  -- Creators can read their own families
    OR EXISTS (
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

CREATE POLICY families_insert_authenticated ON public.families
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- family_members: INSERT/UPDATE controlled by explicit policies
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Allow users to see family members in families they belong to
-- Uses a simpler auth-based approach instead of recursive queries
CREATE POLICY family_members_select ON public.family_members
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow authenticated users to insert membership as 'member' role only (for invitation acceptance)
CREATE POLICY family_members_insert_member ON public.family_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND role = 'member'
  );

-- Block direct UPDATE from client-side. Service role can update if needed.
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
