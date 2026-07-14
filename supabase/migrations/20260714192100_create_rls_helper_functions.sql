-- Create security-definer helper functions for RLS policies
-- Issue #2: Refactor RLS policies to use reusable helper functions

-- Helper function to check if the current user is an active member of a family
CREATE OR REPLACE FUNCTION is_family_member(p_family_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = p_family_id 
      AND user_id = (SELECT auth.uid())
      AND status = 'active'
  );
$$;

-- Helper function to check if the current user is an admin of a family
CREATE OR REPLACE FUNCTION is_family_admin(p_family_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = p_family_id 
      AND user_id = (SELECT auth.uid())
      AND role = 'admin'
      AND status = 'active'
  );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION is_family_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_family_admin(uuid) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION is_family_member(uuid) IS 'Returns true if the current authenticated user is an active member of the specified family';
COMMENT ON FUNCTION is_family_admin(uuid) IS 'Returns true if the current authenticated user is an admin of the specified family';
