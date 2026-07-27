-- Grant UPDATE privileges to service_role on invitations table
-- Required for server-side actions to update invitations status via createServiceRoleClient()

GRANT UPDATE ON public.invitations TO service_role;