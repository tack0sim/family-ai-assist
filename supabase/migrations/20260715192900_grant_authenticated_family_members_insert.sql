-- Grant authenticated users INSERT permission on family_members table
-- This allows the RLS policies to evaluate (RLS only applies if user has base table permission)
GRANT INSERT ON public.family_members TO authenticated;
