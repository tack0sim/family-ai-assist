-- Test suite for families INSERT RLS policy
-- Issue #5: Verify authenticated users can insert families with proper restrictions
-- Run with: supabase test db

BEGIN;

-- Create test data
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

-- Setup: Create test users
CREATE TEMP TABLE test_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL
);

INSERT INTO test_users (email) VALUES
  ('user1@test.com'),
  ('user2@test.com');

-- RED: Test 1 - Authenticated user CAN insert family with themselves as created_by
DO $$
DECLARE
  v_user1_id uuid := (SELECT id FROM test_users WHERE email = 'user1@test.com');
  v_family_id uuid := gen_random_uuid();
  v_success boolean := false;
BEGIN
  -- Set user context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user1_id)::text, true);
  
  -- Attempt to insert family with correct created_by
  BEGIN
    INSERT INTO public.families (id, name, created_by)
    VALUES (v_family_id, 'Test Family 1', v_user1_id);
    v_success := true;
  EXCEPTION WHEN OTHERS THEN
    v_success := false;
  END;
  
  PERFORM record_test(
    'authenticated_user_can_insert_family_as_self',
    v_success,
    'Authenticated user should be able to insert family with themselves as created_by'
  );
  
  -- Cleanup
  IF v_success THEN
    DELETE FROM public.families WHERE id = v_family_id;
  END IF;
END;
$$;

-- RED: Test 2 - Authenticated user CANNOT insert family with someone else as created_by
DO $$
DECLARE
  v_user1_id uuid := (SELECT id FROM test_users WHERE email = 'user1@test.com');
  v_user2_id uuid := (SELECT id FROM test_users WHERE email = 'user2@test.com');
  v_family_id uuid := gen_random_uuid();
  v_failed_as_expected boolean := false;
BEGIN
  -- Set user1 context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user1_id)::text, true);
  
  -- Attempt to insert family with user2 as created_by (should fail)
  BEGIN
    INSERT INTO public.families (id, name, created_by)
    VALUES (v_family_id, 'Test Family 2', v_user2_id);
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'authenticated_user_cannot_insert_family_as_other',
    v_failed_as_expected,
    'Authenticated user should NOT be able to insert family with someone else as created_by'
  );
  
  -- Cleanup (should not be needed, but just in case)
  DELETE FROM public.families WHERE id = v_family_id;
END;
$$;

-- RED: Test 3 - Unauthenticated user CANNOT insert family
DO $$
DECLARE
  v_user1_id uuid := (SELECT id FROM test_users WHERE email = 'user1@test.com');
  v_family_id uuid := gen_random_uuid();
  v_failed_as_expected boolean := false;
BEGIN
  -- Clear user context (simulate unauthenticated)
  PERFORM set_config('request.jwt.claims', NULL, true);
  
  -- Attempt to insert family without authentication (should fail)
  BEGIN
    INSERT INTO public.families (id, name, created_by)
    VALUES (v_family_id, 'Test Family 3', v_user1_id);
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'unauthenticated_user_cannot_insert_family',
    v_failed_as_expected,
    'Unauthenticated user should NOT be able to insert family'
  );
  
  -- Cleanup (should not be needed, but just in case)
  DELETE FROM public.families WHERE id = v_family_id;
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
