-- Issue #3: Add FORCE ROW LEVEL SECURITY to all tables
-- This ensures even table owners and superusers respect RLS policies
-- Reference: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

-- Force RLS on profiles table
-- Users can only access their own profile
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Force RLS on families table
-- Only family members and creators can access families
ALTER TABLE public.families FORCE ROW LEVEL SECURITY;

-- Force RLS on family_members table
-- Only authenticated users can access their family memberships
ALTER TABLE public.family_members FORCE ROW LEVEL SECURITY;

-- Force RLS on invitations table
-- Only recipients (by email) can access invitations
ALTER TABLE public.invitations FORCE ROW LEVEL SECURITY;
