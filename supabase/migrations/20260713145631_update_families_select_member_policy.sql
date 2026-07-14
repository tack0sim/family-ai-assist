DROP POLICY IF EXISTS families_select_member ON public.families;

CREATE POLICY families_select_member ON public.families
  FOR SELECT USING (
    created_by = auth.uid()
  );