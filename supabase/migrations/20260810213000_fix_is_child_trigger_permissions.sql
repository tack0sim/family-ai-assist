-- Fix trigger permissions issue by using SECURITY DEFINER
-- The sync_is_child_flag function must run with elevated privileges to update profiles
-- even though the UPDATE is triggered from auth.users during user creation/update

DROP TRIGGER IF EXISTS trigger_sync_is_child ON auth.users;
DROP FUNCTION IF EXISTS public.sync_is_child_flag();

-- Recreate with SECURITY DEFINER to run with owner's (postgres) privileges
-- This bypasses RLS restrictions so the trigger can update profiles during auth operations
CREATE OR REPLACE FUNCTION public.sync_is_child_flag()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET is_child = COALESCE((NEW.raw_user_meta_data->>'is_child')::boolean, false)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger with elevated permissions
CREATE TRIGGER trigger_sync_is_child
AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_is_child_flag();

-- Add explicit comment documenting the security definer usage
COMMENT ON FUNCTION public.sync_is_child_flag() IS 
  'Syncs is_child flag from auth.users.raw_user_meta_data to profiles.is_child.
   Runs with SECURITY DEFINER to bypass RLS on profiles table updates.
   This is safe because the function only updates the is_child column based on metadata.
   Triggered automatically on auth.users INSERT or raw_user_meta_data UPDATE.';
