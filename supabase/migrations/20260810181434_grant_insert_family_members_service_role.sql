-- Grant INSERT privilege on the family_members table to the service_role user
-- This allows the service_role to insert new family members into the table, which is necessary for creating child profiles.

GRANT INSERT ON public.family_members TO service_role;