-- Grant table-level permissions to authenticated users
-- Fixes: permission denied for table families (error 42501)
-- Without these grants, RLS policies cannot be evaluated, even if they would pass

GRANT INSERT, SELECT ON public.families TO authenticated;

-- Also grant to anon for future use cases if needed
-- GRANT SELECT ON public.families TO anon;
