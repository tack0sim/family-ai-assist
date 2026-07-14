-- Test suite for RLS helper functions (is_family_member, is_family_admin)
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

-- Setup: Create test users and families
CREATE TEMP TABLE test_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL
);

INSERT INTO test_users (email) VALUES
  ('admin@test.com'),
  ('member@test.com'),
  ('outsider@test.com');

-- Create test families
INSERT INTO public.families (id, name, created_by)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Test Family', (SELECT id FROM test_users WHERE email = 'admin@test.com'));

-- Create family memberships
INSERT INTO public.family_members (family_id, user_id, role, status)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, (SELECT id FROM test_users WHERE email = 'admin@test.com'), 'admin', 'active'),
  ('11111111-1111-1111-1111-111111111111'::uuid, (SELECT id FROM test_users WHERE email = 'member@test.com'), 'member', 'active');

-- RED: Test is_family_member function (should fail - function doesn't exist yet)
DO $$
DECLARE
  v_admin_id uuid := (SELECT id FROM test_users WHERE email = 'admin@test.com');
  v_member_id uuid := (SELECT id FROM test_users WHERE email = 'member@test.com');
  v_outsider_id uuid := (SELECT id FROM test_users WHERE email = 'outsider@test.com');
  v_family_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_result boolean;
BEGIN
  -- Test 1: Admin is family member
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id)::text, true);
    SELECT is_family_member(v_family_id) INTO v_result;
    PERFORM record_test('is_family_member_returns_true_for_admin', v_result = true, 'Admin should be recognized as family member');
  EXCEPTION WHEN OTHERS THEN
    PERFORM record_test('is_family_member_returns_true_for_admin', false, 'Function does not exist: ' || SQLERRM);
  END;

  -- Test 2: Member is family member
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member_id)::text, true);
    SELECT is_family_member(v_family_id) INTO v_result;
    PERFORM record_test('is_family_member_returns_true_for_member', v_result = true, 'Member should be recognized as family member');
  EXCEPTION WHEN OTHERS THEN
    PERFORM record_test('is_family_member_returns_true_for_member', false, 'Function does not exist: ' || SQLERRM);
  END;

  -- Test 3: Outsider is NOT family member
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_outsider_id)::text, true);
    SELECT is_family_member(v_family_id) INTO v_result;
    PERFORM record_test('is_family_member_returns_false_for_outsider', v_result = false, 'Outsider should NOT be recognized as family member');
  EXCEPTION WHEN OTHERS THEN
    PERFORM record_test('is_family_member_returns_false_for_outsider', false, 'Function does not exist: ' || SQLERRM);
  END;
END;
$$;

-- RED: Test is_family_admin function (should fail - function doesn't exist yet)
DO $$
DECLARE
  v_admin_id uuid := (SELECT id FROM test_users WHERE email = 'admin@test.com');
  v_member_id uuid := (SELECT id FROM test_users WHERE email = 'member@test.com');
  v_outsider_id uuid := (SELECT id FROM test_users WHERE email = 'outsider@test.com');
  v_family_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_result boolean;
BEGIN
  -- Test 4: Admin is family admin
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id)::text, true);
    SELECT is_family_admin(v_family_id) INTO v_result;
    PERFORM record_test('is_family_admin_returns_true_for_admin', v_result = true, 'Admin should be recognized as family admin');
  EXCEPTION WHEN OTHERS THEN
    PERFORM record_test('is_family_admin_returns_true_for_admin', false, 'Function does not exist: ' || SQLERRM);
  END;

  -- Test 5: Member is NOT family admin
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_member_id)::text, true);
    SELECT is_family_admin(v_family_id) INTO v_result;
    PERFORM record_test('is_family_admin_returns_false_for_member', v_result = false, 'Regular member should NOT be recognized as admin');
  EXCEPTION WHEN OTHERS THEN
    PERFORM record_test('is_family_admin_returns_false_for_member', false, 'Function does not exist: ' || SQLERRM);
  END;

  -- Test 6: Outsider is NOT family admin
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_outsider_id)::text, true);
    SELECT is_family_admin(v_family_id) INTO v_result;
    PERFORM record_test('is_family_admin_returns_false_for_outsider', v_result = false, 'Outsider should NOT be recognized as admin');
  EXCEPTION WHEN OTHERS THEN
    PERFORM record_test('is_family_admin_returns_false_for_outsider', false, 'Function does not exist: ' || SQLERRM);
  END;
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
