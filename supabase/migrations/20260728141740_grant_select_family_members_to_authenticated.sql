-- Grant authenticated role SELECT privileges on family_members tables
-- Grant service_role SELECT, UPDATE, DELETE privileges on family_members tables
-- Allows users to view family members data while ensuring they have the necessary permissions
-- Allows service_role to manage family members data for admin actions after RLS enforced checks

GRANT SELECT ON public.family_members TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.family_members TO service_role;
