-- Grant permissions on profiles table to authenticated role
-- Allows users to ensure their own profile exists during operations

GRANT INSERT, UPDATE ON public.profiles TO authenticated;
