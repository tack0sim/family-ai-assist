-- Add INSERT and SELECT grants for authenticated users on invitations table
-- Issue: Missing GRANT privileges prevented authenticated users from creating invitations
-- even though the RLS policy (invitations_insert_admin) was correctly configured

-- Grant INSERT and SELECT on invitations to authenticated users
-- RLS policy (invitations_insert_admin) enforces that only family admins can actually insert
GRANT INSERT, SELECT ON public.invitations TO authenticated;
