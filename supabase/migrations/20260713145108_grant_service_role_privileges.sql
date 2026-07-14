-- Grant service role SELECT privileges on families and family_members tables
GRANT SELECT ON public.families TO service_role;
GRANT SELECT ON public.family_members TO service_role;
