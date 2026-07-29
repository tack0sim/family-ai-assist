-- Fix: Allow family admins to view pending invitations for their family
-- Issue: Admins could not fetch invitations sent to others because the RLS policy
-- only allowed users to see invitations where email = their email.
-- This blocked the "Pending Invitations" section in /settings.
--
-- Solution: 
-- 1. Drop the email-based policy (not used - invite acceptance uses service role)
-- 2. Add policy allowing admins to SELECT invitations for their family

-- Drop the email-based policy since it's not used (invite flow uses service role)
DROP POLICY IF EXISTS invitations_select_by_email ON public.invitations;

-- Add policy allowing admins to SELECT invitations for their family
CREATE POLICY invitations_select_admin ON public.invitations
  FOR SELECT USING (
    is_family_admin(family_id)
  );
