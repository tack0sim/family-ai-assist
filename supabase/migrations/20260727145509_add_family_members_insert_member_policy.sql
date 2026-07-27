-- Allow authenticated users to accept family invitations by inserting themselves as 'member'
-- This policy enables users to join families through the autoAcceptInvitation flow
-- The policy enforces that:
-- 1. User must be authenticated
-- 2. User can only add themselves (user_id = auth.uid())
-- 3. User can only insert with 'member' role (not 'admin')

DROP POLICY IF EXISTS family_members_insert_member ON public.family_members;

CREATE POLICY family_members_insert_member ON public.family_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND role = 'member'
  );
