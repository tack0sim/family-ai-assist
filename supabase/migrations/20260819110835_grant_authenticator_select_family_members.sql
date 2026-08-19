-- Grant authenticator role direct SELECT on family_members
-- Issue: Circular RLS dependency when is_family_member() SECURITY DEFINER function tries to SELECT from family_members
-- Solution: Give authenticator role explicit SELECT privilege so it can evaluate RLS policies without circular issues

-- The authenticator role is the Supabase service role that actually executes queries
-- By giving it explicit SELECT, it can read family_members rows needed for RLS policy evaluation
GRANT SELECT ON public.family_members TO authenticator;

-- Also ensure it can execute the helper functions
GRANT EXECUTE ON FUNCTION is_family_member(uuid) TO authenticator;
GRANT EXECUTE ON FUNCTION is_family_admin(uuid) TO authenticator;
