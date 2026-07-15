-- Migration: Improve auth→profile trigger reliability
-- Issue #14: Fix trigger to handle all auth methods with proper error handling
-- Created: 2026-07-15

-- Drop and recreate the trigger function with improved reliability
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger 
SECURITY DEFINER -- Run with elevated privileges to ensure profile creation
LANGUAGE plpgsql
AS $$
DECLARE
  v_display_name text;
  v_error_message text;
BEGIN
  -- Extract display_name from metadata (NULL if not present - OK for OAuth users)
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1) -- Fallback: use email prefix as display name
  );

  -- Always create profile for new auth user
  -- Use INSERT with conflict handling to ensure idempotency
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    v_display_name,
    NEW.raw_user_meta_data->>'avatar_url', -- Also extract avatar if available from OAuth
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    created_at = COALESCE(profiles.created_at, now());

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details for debugging
    GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, v_error_message;
    
    -- Re-raise to prevent auth.users row creation if profile creation fails
    -- This maintains the invariant: auth.users row exists => profile row exists
    RAISE EXCEPTION 'Profile creation failed for user %: %', NEW.id, v_error_message;
END;
$$;

-- Comment for documentation
COMMENT ON FUNCTION public.handle_auth_user_created() IS 
  'Trigger function that maintains auth.users ↔ profiles invariant. 
   Creates profile for every new auth user with fallback display_name extraction.
   Raises exception if profile creation fails to prevent orphaned auth.users rows.
   Issue #14: Handles OAuth users without display_name metadata.';

-- Recreate trigger (ensures it's properly attached)
DROP TRIGGER IF EXISTS trigger_handle_auth_user_created ON auth.users;
CREATE TRIGGER trigger_handle_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Add index on families.created_by for faster JOINs (Supabase best practice)
-- Check if index exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'families' 
    AND indexname = 'families_created_by_idx'
  ) THEN
    CREATE INDEX families_created_by_idx ON public.families (created_by);
    RAISE NOTICE 'Created index families_created_by_idx';
  ELSE
    RAISE NOTICE 'Index families_created_by_idx already exists';
  END IF;
END $$;

COMMENT ON INDEX public.families_created_by_idx IS 
  'Index on foreign key for faster JOINs and CASCADE operations. 
   Supabase best practice: Always index foreign key columns.';
