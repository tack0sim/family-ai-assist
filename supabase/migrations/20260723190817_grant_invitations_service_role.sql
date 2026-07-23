-- Grant INSERT and SELECT privileges to service_role on invitations table
-- Required for server-side actions to create invitations via createServiceRoleClient()
-- RLS policy (invitations_insert_admin) still enforces that only family admins can insert

GRANT INSERT, SELECT ON public.invitations TO service_role;
