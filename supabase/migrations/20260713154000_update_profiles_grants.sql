-- Update grants on profiles table for authenticated role
-- Include SELECT for upsert operations and other queries

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
