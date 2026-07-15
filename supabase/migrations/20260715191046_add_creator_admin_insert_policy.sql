-- Allow creators to add themselves as admin to families they just created
-- This enables the onboarding flow where createFamily adds the creator as the first admin member

CREATE POLICY family_members_insert_creator_as_admin ON public.family_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND role = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_members.family_id
      AND f.created_by = auth.uid()
    )
  );
