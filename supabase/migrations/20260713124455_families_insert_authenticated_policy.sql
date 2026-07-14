-- Enable RLS on the families table
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions to authenticated users
GRANT INSERT, SELECT ON public.families TO authenticated;

DROP POLICY IF EXISTS families_insert_authenticated ON public.families;

CREATE POLICY families_insert_authenticated ON public.families
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );