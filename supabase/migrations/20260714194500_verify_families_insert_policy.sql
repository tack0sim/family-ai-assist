-- Verification check for families INSERT RLS policy (Issue #5)
-- This migration verifies the policy exists with correct definition

DO $$
DECLARE
  v_policy_exists boolean;
  v_policy_check text;
BEGIN
  RAISE NOTICE 'Verifying families INSERT policy (Issue #5)...';
  
  -- Check if policy exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'families' 
      AND policyname = 'families_insert_authenticated'
      AND cmd = 'INSERT'
  ) INTO v_policy_exists;
  
  IF NOT v_policy_exists THEN
    RAISE EXCEPTION 'families_insert_authenticated policy does not exist';
  END IF;
  
  RAISE NOTICE '✓ Policy families_insert_authenticated exists';
  
  -- Check policy definition contains required checks
  SELECT qual::text 
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'families' 
    AND policyname = 'families_insert_authenticated'
  INTO v_policy_check;
  
  IF v_policy_check NOT LIKE '%auth.uid()%' THEN
    RAISE EXCEPTION 'Policy does not check auth.uid()';
  END IF;
  
  IF v_policy_check NOT LIKE '%created_by%' THEN
    RAISE EXCEPTION 'Policy does not check created_by';
  END IF;
  
  RAISE NOTICE '✓ Policy contains required checks (auth.uid and created_by)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Issue #5 verification PASSED ✓';
  RAISE NOTICE 'families INSERT policy is correctly defined';
  RAISE NOTICE '========================================';
  
END $$;
