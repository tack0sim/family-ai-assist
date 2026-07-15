-- Test suite for auth.users → profiles trigger
-- Issue #14: Verify auth→profile relationship is maintained for all auth methods
-- Run with: supabase test db

BEGIN;

-- Create test results table
CREATE TEMP TABLE test_results (
  test_name text PRIMARY KEY,
  passed boolean,
  message text
);

-- Helper function to record test results
CREATE OR REPLACE FUNCTION record_test(
  p_test_name text,
  p_condition boolean,
  p_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO test_results (test_name, passed, message)
  VALUES (p_test_name, p_condition, p_message);
END;
$$ LANGUAGE plpgsql;

-- RED TEST: OAuth user (no display_name in metadata) creates profile
-- This simulates Google OAuth flow where user metadata may be minimal
DO $$
DECLARE
  v_oauth_user_id uuid := gen_random_uuid();
  v_profile_exists boolean := false;
BEGIN
  -- Simulate OAuth user creation (no display_name in raw_user_meta_data)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_oauth_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'oauth_user@test.com',
    crypt('fake_password', gen_salt('bf')),
    now(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"sub":"123456","email":"oauth_user@test.com"}'::jsonb, -- No display_name!
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Check if profile was created by trigger
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_oauth_user_id
  ) INTO v_profile_exists;
  
  PERFORM record_test(
    'oauth_user_creates_profile',
    v_profile_exists,
    'OAuth user creation should trigger profile creation even without display_name'
  );
  
  -- Cleanup
  DELETE FROM auth.users WHERE id = v_oauth_user_id;
END;
$$;

-- RED TEST: Email user (with display_name in metadata) creates profile
DO $$
DECLARE
  v_email_user_id uuid := gen_random_uuid();
  v_profile_exists boolean := false;
  v_display_name_matches boolean := false;
  v_stored_display_name text;
BEGIN
  -- Simulate email signup with display_name
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_email_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'email_user@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{}'::jsonb,
    '{"display_name":"John Doe"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Check if profile was created
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_email_user_id
  ) INTO v_profile_exists;
  
  -- Check if display_name was correctly extracted
  SELECT display_name INTO v_stored_display_name
  FROM public.profiles 
  WHERE id = v_email_user_id;
  
  v_display_name_matches := (v_stored_display_name = 'John Doe');
  
  PERFORM record_test(
    'email_user_creates_profile',
    v_profile_exists AND v_display_name_matches,
    'Email user creation should trigger profile with correct display_name'
  );
  
  -- Cleanup
  DELETE FROM auth.users WHERE id = v_email_user_id;
END;
$$;

-- RED TEST: ensure_profile_exists function works for missing profiles
DO $$
DECLARE
  v_test_user_id uuid := gen_random_uuid();
  v_profile_created boolean := false;
BEGIN
  -- First, create an auth.users entry manually WITHOUT letting trigger run
  -- We'll test the defensive function directly
  
  -- Insert directly into auth.users (simulating trigger failure scenario)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_test_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'defensive_test@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{}'::jsonb,
    '{"display_name":"Defensive Test"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Delete the profile that was created by trigger (simulate missing profile scenario)
  DELETE FROM public.profiles WHERE id = v_test_user_id;
  
  -- Call defensive function
  PERFORM public.ensure_profile_exists(v_test_user_id);
  
  -- Check if profile was created
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_test_user_id
  ) INTO v_profile_created;
  
  PERFORM record_test(
    'ensure_profile_exists_creates_missing_profile',
    v_profile_created,
    'ensure_profile_exists function should create missing profile'
  );
  
  -- Cleanup
  DELETE FROM auth.users WHERE id = v_test_user_id;
END;
$$;

-- RED TEST: Foreign key index exists on families.created_by
DO $$
DECLARE
  v_index_exists boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'families' 
    AND indexname = 'families_created_by_idx'
  ) INTO v_index_exists;
  
  PERFORM record_test(
    'families_created_by_has_index',
    v_index_exists,
    'Foreign key families.created_by should have an index for performance'
  );
END;
$$;

-- Display test results
SELECT 
  test_name,
  CASE WHEN passed THEN '✓ PASS' ELSE '✗ FAIL' END as status,
  message
FROM test_results
ORDER BY test_name;

-- Final summary
SELECT 
  COUNT(*) as total_tests,
  SUM(CASE WHEN passed THEN 1 ELSE 0 END) as passed,
  SUM(CASE WHEN NOT passed THEN 1 ELSE 0 END) as failed
FROM test_results;

ROLLBACK;
