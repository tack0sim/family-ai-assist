-- Grant DELETE privileges to service_role on invitations table
-- Required for server-side actions to delete invitations via createServiceRoleClient()
-- RLS policy (invitations_delete_admin) still enforces that only family admins can delete

GRANT DELETE ON public.invitations TO service_role;