-- Add is_child column to profiles table and sync from auth.users metadata
-- Implement synced denormalization: auth.users is the source of truth,
-- profiles.is_child is kept in sync via trigger

-- Add is_child column to profiles
ALTER TABLE public.profiles ADD COLUMN is_child boolean DEFAULT false;

-- Create function to sync is_child flag from auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_is_child_flag()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET is_child = COALESCE((NEW.raw_user_meta_data->>'is_child')::boolean, false)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync is_child whenever auth.users is modified
DROP TRIGGER IF EXISTS trigger_sync_is_child ON auth.users;
CREATE TRIGGER trigger_sync_is_child
AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_is_child_flag();

-- Sync existing child profiles based on their metadata
UPDATE public.profiles
SET is_child = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE raw_user_meta_data->>'is_child' = 'true'
);

-- Add index on is_child for efficient filtering in family queries
CREATE INDEX idx_profiles_is_child ON public.profiles(is_child) 
WHERE is_child = true;
