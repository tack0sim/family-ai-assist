-- Migration: Add defensive profile upsert function for server actions
-- Issue #14: Provides server-side safety net if trigger fails
-- Created: 2026-07-15

-- Function to ensure a profile exists for a given auth user
-- Can be called from server actions as a defensive check
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  v_user_email text;
  v_display_name text;
  v_avatar_url text;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RETURN; -- Profile exists, nothing to do
  END IF;

  -- Profile missing - fetch user data from auth.users
  SELECT 
    email,
    COALESCE(
      raw_user_meta_data->>'display_name',
      raw_user_meta_data->>'full_name',
      raw_user_meta_data->>'name',
      split_part(email, '@', 1)
    ),
    raw_user_meta_data->>'avatar_url'
  INTO v_user_email, v_display_name, v_avatar_url
  FROM auth.users
  WHERE id = p_user_id;

  -- If user doesn't exist in auth.users, raise error
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User % not found in auth.users', p_user_id;
  END IF;

  -- Create the missing profile
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at)
  VALUES (p_user_id, v_display_name, v_avatar_url, now())
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Created missing profile for user %', p_user_id;
END;
$$;

COMMENT ON FUNCTION public.ensure_profile_exists(uuid) IS
  'Defensive function to ensure profile exists for an auth user.
   Creates profile if missing (defensive fallback for trigger failures).
   Issue #14: Provides defense-in-depth for auth→profile invariant.';

-- Grant execute permission to authenticated users (via service role in practice)
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(uuid) TO service_role;
