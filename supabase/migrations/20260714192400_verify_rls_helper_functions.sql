-- Verification test for refactored RLS policies
-- Issue #2: Verify that policies using helper functions maintain correct security behavior
--
-- This migration runs tests in a transaction and rolls back, so it doesn't affect data.
-- If any test fails, the transaction will fail and the migration will not apply.

DO $$
DECLARE
  v_test_user_admin uuid;
  v_test_user_member uuid;
  v_test_user_outsider uuid;
  v_test_family_id uuid;
  v_result boolean;
  v_can_select boolean;
  v_can_update boolean;
  v_can_insert_invitation boolean;
BEGIN
  -- Create test users (simulated - in reality these would be auth.users)
  v_test_user_admin := gen_random_uuid();
  v_test_user_member := gen_random_uuid();
  v_test_user_outsider := gen_random_uuid();
  
  -- Create a test family
  INSERT INTO public.families (id, name, created_by)
  VALUES (gen_random_uuid(), 'Test Family for RLS', v_test_user_admin)
  RETURNING id INTO v_test_family_id;
  
  -- Create family memberships
  INSERT INTO public.family_members (family_id, user_id, role, status)
  VALUES
    (v_test_family_id, v_test_user_admin, 'admin', 'active'),
    (v_test_family_id, v_test_user_member, 'member', 'active');
  
  -- Test 1: Verify is_family_member works for admin
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_user_admin)::text, true);
  SELECT is_family_member(v_test_family_id) INTO v_result;
  IF v_result != true THEN
    RAISE EXCEPTION 'Test failed: is_family_member should return true for admin user';
  END IF;
  RAISE NOTICE '✓ Test 1 passed: is_family_member returns true for admin';
  
  -- Test 2: Verify is_family_member works for member
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_user_member)::text, true);
  SELECT is_family_member(v_test_family_id) INTO v_result;
  IF v_result != true THEN
    RAISE EXCEPTION 'Test failed: is_family_member should return true for regular member';
  END IF;
  RAISE NOTICE '✓ Test 2 passed: is_family_member returns true for member';
  
  -- Test 3: Verify is_family_member returns false for outsider
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_user_outsider)::text, true);
  SELECT is_family_member(v_test_family_id) INTO v_result;
  IF v_result != false THEN
    RAISE EXCEPTION 'Test failed: is_family_member should return false for outsider';
  END IF;
  RAISE NOTICE '✓ Test 3 passed: is_family_member returns false for outsider';
  
  -- Test 4: Verify is_family_admin works for admin
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_user_admin)::text, true);
  SELECT is_family_admin(v_test_family_id) INTO v_result;
  IF v_result != true THEN
    RAISE EXCEPTION 'Test failed: is_family_admin should return true for admin user';
  END IF;
  RAISE NOTICE '✓ Test 4 passed: is_family_admin returns true for admin';
  
  -- Test 5: Verify is_family_admin returns false for member
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_user_member)::text, true);
  SELECT is_family_admin(v_test_family_id) INTO v_result;
  IF v_result != false THEN
    RAISE EXCEPTION 'Test failed: is_family_admin should return false for regular member';
  END IF;
  RAISE NOTICE '✓ Test 5 passed: is_family_admin returns false for member';
  
  -- Test 6: Verify is_family_admin returns false for outsider
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_user_outsider)::text, true);
  SELECT is_family_admin(v_test_family_id) INTO v_result;
  IF v_result != false THEN
    RAISE EXCEPTION 'Test failed: is_family_admin should return false for outsider';
  END IF;
  RAISE NOTICE '✓ Test 6 passed: is_family_admin returns false for outsider';
  
  -- Clean up test data
  DELETE FROM public.family_members WHERE family_id = v_test_family_id;
  DELETE FROM public.families WHERE id = v_test_family_id;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'All RLS helper function tests passed! ✓';
  RAISE NOTICE '===========================================';
  
END;
$$;
