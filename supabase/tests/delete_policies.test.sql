-- Test suite for DELETE RLS policies
-- Issue #4: Add missing DELETE policies for all tables
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

-- Setup: Create test users and data
CREATE TEMP TABLE test_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL
);

INSERT INTO test_users (email) VALUES
  ('user1@test.com'),
  ('user2@test.com'),
  ('user3@test.com');

-- Get test user IDs
DO $$
DECLARE
  v_user1_id uuid := (SELECT id FROM test_users WHERE email = 'user1@test.com');
  v_user2_id uuid := (SELECT id FROM test_users WHERE email = 'user2@test.com');
  v_user3_id uuid := (SELECT id FROM test_users WHERE email = 'user3@test.com');
  v_family_id uuid := gen_random_uuid();
  v_invitation_id uuid := gen_random_uuid();
BEGIN
  -- Insert test profiles (using service role to bypass RLS)
  SET LOCAL role TO service_role;
  
  INSERT INTO public.profiles (id, email) VALUES
    (v_user1_id, 'user1@test.com'),
    (v_user2_id, 'user2@test.com'),
    (v_user3_id, 'user3@test.com');
  
  -- Create test family (user1 as creator)
  INSERT INTO public.families (id, name, created_by)
  VALUES (v_family_id, 'Test Family', v_user1_id);
  
  -- Add family members (user1 as admin, user2 as member)
  INSERT INTO public.family_members (family_id, user_id, role, status)
  VALUES 
    (v_family_id, v_user1_id, 'admin', 'active'),
    (v_family_id, v_user2_id, 'member', 'active');
  
  -- Create test invitation
  INSERT INTO public.invitations (id, family_id, email, invited_by, status)
  VALUES (v_invitation_id, v_family_id, 'invited@test.com', v_user1_id, 'pending');
  
  RESET role;
END;
$$;

-- =============================================================================
-- PROFILES DELETE POLICY TESTS
-- =============================================================================

-- Test 1: User CAN delete their own profile
DO $$
DECLARE
  v_user1_id uuid := (SELECT id FROM test_users WHERE email = 'user1@test.com');
  v_test_profile_id uuid := gen_random_uuid();
  v_success boolean := false;
BEGIN
  -- Setup: Create a test profile for user1 to delete
  SET LOCAL role TO service_role;
  INSERT INTO public.profiles (id, email)
  VALUES (v_test_profile_id, 'delete_test_1@test.com');
  RESET role;
  
  -- Set user1 context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_test_profile_id)::text, true);
  
  -- Attempt to delete own profile
  BEGIN
    DELETE FROM public.profiles WHERE id = v_test_profile_id;
    v_success := true;
  EXCEPTION WHEN OTHERS THEN
    v_success := false;
  END;
  
  PERFORM record_test(
    'profiles_delete_own',
    v_success,
    'User should be able to delete their own profile'
  );
  
  -- Cleanup
  SET LOCAL role TO service_role;
  DELETE FROM public.profiles WHERE id = v_test_profile_id;
  RESET role;
END;
$$;

-- Test 2: User CANNOT delete another user's profile
DO $$
DECLARE
  v_user1_id uuid := (SELECT id FROM test_users WHERE email = 'user1@test.com');
  v_user2_id uuid := (SELECT id FROM test_users WHERE email = 'user2@test.com');
  v_failed_as_expected boolean := false;
BEGIN
  -- Set user1 context
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user1_id)::text, true);
  
  -- Attempt to delete user2's profile (should fail)
  BEGIN
    DELETE FROM public.profiles WHERE id = v_user2_id;
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'profiles_delete_other',
    v_failed_as_expected,
    'User should NOT be able to delete another user''s profile'
  );
END;
$$;

-- Test 3: Unauthenticated user CANNOT delete any profile
DO $$
DECLARE
  v_user1_id uuid := (SELECT id FROM test_users WHERE email = 'user1@test.com');
  v_failed_as_expected boolean := false;
BEGIN
  -- Clear user context (simulate unauthenticated)
  PERFORM set_config('request.jwt.claims', NULL, true);
  
  -- Attempt to delete profile without authentication (should fail)
  BEGIN
    DELETE FROM public.profiles WHERE id = v_user1_id;
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'profiles_delete_unauthenticated',
    v_failed_as_expected,
    'Unauthenticated user should NOT be able to delete any profile'
  );
END;
$$;

-- =============================================================================
-- FAMILIES DELETE POLICY TESTS
-- =============================================================================

-- Test 4: Family admin CAN delete their family
DO $$
DECLARE
  v_user1_id uuid := (SELECT id FROM test_users WHERE email = 'user1@test.com');
  v_test_family_id uuid := gen_random_uuid();
  v_success boolean := false;
BEGIN
  -- Setup: Create a test family with user1 as admin
  SET LOCAL role TO service_role;
  INSERT INTO public.families (id, name, created_by)
  VALUES (v_test_family_id, 'Family to Delete', v_user1_id);
  
  INSERT INTO public.family_members (family_id, user_id, role, status)
  VALUES (v_test_family_id, v_user1_id, 'admin', 'active');
  RESET role;
  
  -- Set user1 context (admin)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user1_id)::text, true);
  
  -- Attempt to delete family as admin
  BEGIN
    DELETE FROM public.families WHERE id = v_test_family_id;
    v_success := true;
  EXCEPTION WHEN OTHERS THEN
    v_success := false;
  END;
  
  PERFORM record_test(
    'families_delete_admin',
    v_success,
    'Family admin should be able to delete their family'
  );
  
  -- Cleanup
  SET LOCAL role TO service_role;
  DELETE FROM public.family_members WHERE family_id = v_test_family_id;
  DELETE FROM public.families WHERE id = v_test_family_id;
  RESET role;
END;
$$;

-- Test 5: Non-admin member CANNOT delete family
DO $$
DECLARE
  v_user2_id uuid := (SELECT id FROM test_users WHERE email = 'user2@test.com');
  v_family_id uuid := (SELECT f.id FROM public.families f LIMIT 1);
  v_failed_as_expected boolean := false;
BEGIN
  -- Set user2 context (non-admin member)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user2_id)::text, true);
  
  -- Attempt to delete family as non-admin (should fail)
  BEGIN
    DELETE FROM public.families WHERE id = v_family_id;
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'families_delete_non_admin',
    v_failed_as_expected,
    'Non-admin member should NOT be able to delete family'
  );
END;
$$;

-- Test 6: Non-member CANNOT delete family
DO $$
DECLARE
  v_user3_id uuid := (SELECT id FROM test_users WHERE email = 'user3@test.com');
  v_family_id uuid := (SELECT f.id FROM public.families f LIMIT 1);
  v_failed_as_expected boolean := false;
BEGIN
  -- Set user3 context (non-member)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user3_id)::text, true);
  
  -- Attempt to delete family as non-member (should fail)
  BEGIN
    DELETE FROM public.families WHERE id = v_family_id;
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'families_delete_non_member',
    v_failed_as_expected,
    'Non-member should NOT be able to delete family'
  );
END;
$$;

-- Test 7: Unauthenticated user CANNOT delete family
DO $$
DECLARE
  v_family_id uuid := (SELECT f.id FROM public.families f LIMIT 1);
  v_failed_as_expected boolean := false;
BEGIN
  -- Clear user context (simulate unauthenticated)
  PERFORM set_config('request.jwt.claims', NULL, true);
  
  -- Attempt to delete family without authentication (should fail)
  BEGIN
    DELETE FROM public.families WHERE id = v_family_id;
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'families_delete_unauthenticated',
    v_failed_as_expected,
    'Unauthenticated user should NOT be able to delete family'
  );
END;
$$;

-- =============================================================================
-- INVITATIONS DELETE POLICY TESTS
-- =============================================================================

-- Test 8: Family admin CAN delete invitations
DO $$
DECLARE
  v_user1_id uuid := (SELECT id FROM test_users WHERE email = 'user1@test.com');
  v_family_id uuid := (SELECT f.id FROM public.families f LIMIT 1);
  v_test_invitation_id uuid := gen_random_uuid();
  v_success boolean := false;
BEGIN
  -- Setup: Create a test invitation
  SET LOCAL role TO service_role;
  INSERT INTO public.invitations (id, family_id, email, invited_by, status)
  VALUES (v_test_invitation_id, v_family_id, 'delete_test@test.com', v_user1_id, 'pending');
  RESET role;
  
  -- Set user1 context (admin)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user1_id)::text, true);
  
  -- Attempt to delete invitation as admin
  BEGIN
    DELETE FROM public.invitations WHERE id = v_test_invitation_id;
    v_success := true;
  EXCEPTION WHEN OTHERS THEN
    v_success := false;
  END;
  
  PERFORM record_test(
    'invitations_delete_admin',
    v_success,
    'Family admin should be able to delete invitations'
  );
  
  -- Cleanup
  SET LOCAL role TO service_role;
  DELETE FROM public.invitations WHERE id = v_test_invitation_id;
  RESET role;
END;
$$;

-- Test 9: Non-admin member CANNOT delete invitations
DO $$
DECLARE
  v_user2_id uuid := (SELECT id FROM test_users WHERE email = 'user2@test.com');
  v_invitation_id uuid := (SELECT i.id FROM public.invitations i LIMIT 1);
  v_failed_as_expected boolean := false;
BEGIN
  -- Set user2 context (non-admin member)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user2_id)::text, true);
  
  -- Attempt to delete invitation as non-admin (should fail)
  BEGIN
    DELETE FROM public.invitations WHERE id = v_invitation_id;
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'invitations_delete_non_admin',
    v_failed_as_expected,
    'Non-admin member should NOT be able to delete invitations'
  );
END;
$$;

-- Test 10: Non-member CANNOT delete invitations
DO $$
DECLARE
  v_user3_id uuid := (SELECT id FROM test_users WHERE email = 'user3@test.com');
  v_invitation_id uuid := (SELECT i.id FROM public.invitations i LIMIT 1);
  v_failed_as_expected boolean := false;
BEGIN
  -- Set user3 context (non-member)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user3_id)::text, true);
  
  -- Attempt to delete invitation as non-member (should fail)
  BEGIN
    DELETE FROM public.invitations WHERE id = v_invitation_id;
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'invitations_delete_non_member',
    v_failed_as_expected,
    'Non-member should NOT be able to delete invitations'
  );
END;
$$;

-- Test 11: Unauthenticated user CANNOT delete invitations
DO $$
DECLARE
  v_invitation_id uuid := (SELECT i.id FROM public.invitations i LIMIT 1);
  v_failed_as_expected boolean := false;
BEGIN
  -- Clear user context (simulate unauthenticated)
  PERFORM set_config('request.jwt.claims', NULL, true);
  
  -- Attempt to delete invitation without authentication (should fail)
  BEGIN
    DELETE FROM public.invitations WHERE id = v_invitation_id;
    v_failed_as_expected := false; -- Should not reach here
  EXCEPTION WHEN OTHERS THEN
    v_failed_as_expected := true; -- Expected to fail
  END;
  
  PERFORM record_test(
    'invitations_delete_unauthenticated',
    v_failed_as_expected,
    'Unauthenticated user should NOT be able to delete invitations'
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
