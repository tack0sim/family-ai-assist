-- Drop the overly restrictive self-only profile selection policy
DROP POLICY profiles_select_self ON public.profiles;

-- Create new policy that allows viewing your own profile or profiles of family members
-- Family members in the same family_id can see each other's display names
CREATE POLICY profiles_select_family ON public.profiles
  FOR SELECT USING (
    -- Can view own profile
    id = auth.uid()
    OR
    -- Can view profiles of active family members in same family
    id IN (
      SELECT fm.user_id 
      FROM family_members fm
      WHERE fm.status = 'active'
      AND fm.family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );
