-- Manual test suite for families INSERT RLS policy (Issue #5)
-- This test requires a real authenticated user and should be run manually
-- NOT suitable for automated migration testing due to auth.users FK constraint
--
-- To run manually:
--   1. Get a real user ID from your auth.users table
--   2. Replace the user IDs below with real ones
--   3. Run: supabase db execute --file supabase/tests/families_insert_policy_manual.test.sql

BEGIN;

-- Test setup: Replace these with real user IDs from your database
DO $$
DECLARE
  v_real_user_id uuid; -- Replace with a real user from auth.users
  v_other_user_id uuid; -- Replace with another real user from auth.users
  v_family_id uuid := gen_random_uuid();
  v_test_passed integer := 0;
  v_test_failed integer := 0;
BEGIN
  -- Get two real users from auth.users
  SELECT id INTO v_real_user_id FROM auth.users LIMIT 1;
  SELECT id INTO v_other_user_id FROM auth.users WHERE id != v_real_user_id LIMIT 1;
  
  IF v_real_user_id IS NULL OR v_other_user_id IS NULL THEN
    RAISE EXCEPTION 'Need at least 2 users in auth.users to run this test';
  END IF;
  
  RAISE NOTICE 'Using test user IDs: % and %', v_real_user_id, v_other_user_id;
  RAISE NOTICE '';
  
  -- Test 1: Authenticated user CAN insert family with themselves as created_by
  BEGIN
    RAISE NOTICE 'Test 1: Authenticated user can insert family as self...';
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_real_user_id)::text, true);
    
    INSERT INTO public.families (id, name, created_by)
    VALUES (v_family_id, 'Test Family - Self Created', v_real_user_id);
    
    DELETE FROM public.families WHERE id = v_family_id;
    
    v_test_passed := v_test_passed + 1;
    RAISE NOTICE '  ✓ PASS';
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
  END;
  
  -- Test 2: Authenticated user CANNOT insert family with someone else as created_by
  BEGIN
    RAISE NOTICE 'Test 2: Authenticated user cannot insert family as other...';
    v_family_id := gen_random_uuid();
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_real_user_id)::text, true);
    
    INSERT INTO public.families (id, name, created_by)
    VALUES (v_family_id, 'Test Family - Wrong Creator', v_other_user_id);
    
    -- Should not reach here
    DELETE FROM public.families WHERE id = v_family_id;
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ✗ FAIL: Policy did not block insert with wrong created_by';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    v_test_passed := v_test_passed + 1;
    RAISE NOTICE '  ✓ PASS (correctly blocked)';
  WHEN OTHERS THEN
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ✗ FAIL: Unexpected error: %', SQLERRM;
  END;
  
  -- Test 3: Unauthenticated user CANNOT insert family
  BEGIN
    RAISE NOTICE 'Test 3: Unauthenticated user cannot insert family...';
    v_family_id := gen_random_uuid();
    PERFORM set_config('request.jwt.claims', NULL, true);
    
    INSERT INTO public.families (id, name, created_by)
    VALUES (v_family_id, 'Test Family - No Auth', v_real_user_id);
    
    -- Should not reach here
    DELETE FROM public.families WHERE id = v_family_id;
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ✗ FAIL: Policy did not block unauthenticated insert';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    v_test_passed := v_test_passed + 1;
    RAISE NOTICE '  ✓ PASS (correctly blocked)';
  WHEN OTHERS THEN
    v_test_failed := v_test_failed + 1;
    RAISE NOTICE '  ✗ FAIL: Unexpected error: %', SQLERRM;
  END;
  
  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Summary:';
  RAISE NOTICE '  Passed: %', v_test_passed;
  RAISE NOTICE '  Failed: %', v_test_failed;
  
  IF v_test_failed > 0 THEN
    RAISE NOTICE '  Status: FAILED ✗';
    RAISE NOTICE '========================================';
    RAISE EXCEPTION 'Some tests failed';
  ELSE
    RAISE NOTICE '  Status: ALL PASSED ✓';
    RAISE NOTICE '========================================';
  END IF;
END $$;

ROLLBACK;
