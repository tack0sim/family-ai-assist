-- Grant permissions on events tables to authenticated and service_role
GRANT ALL ON public.events TO authenticated, service_role;
GRANT ALL ON public.event_assignees TO authenticated, service_role;
GRANT ALL ON public.event_tags_config TO authenticated, service_role;
GRANT ALL ON public.event_tags TO authenticated, service_role;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
