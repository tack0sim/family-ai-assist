-- Test suite for events tables schema and RLS policies
-- Run with: supabase test db

BEGIN;

-- Create test results tracking
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

-- Setup: Create test data
INSERT INTO public.profiles (id, display_name)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Admin User'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Member User'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Outsider User');

INSERT INTO public.families (id, name, created_by)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Test Family', '11111111-1111-1111-1111-111111111111'::uuid);

INSERT INTO public.family_members (family_id, user_id, role, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'admin', 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'member', 'active');

-- Test 1: Verify events table exists with all required columns
DO $$
DECLARE
  v_table_exists boolean;
  v_has_recurrence boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'events'
  ) INTO v_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events'
    AND column_name IN ('rrule', 'recurrence_count', 'recurrence_expires_at')
  ) INTO v_has_recurrence;

  PERFORM record_test(
    'events_table_exists_with_recurrence_columns',
    v_table_exists AND v_has_recurrence,
    CASE WHEN NOT v_table_exists THEN 'events table does not exist'
         WHEN NOT v_has_recurrence THEN 'recurrence columns missing'
         ELSE 'OK'
    END
  );
END;
$$;

-- Test 2: Verify event_assignees table exists
DO $$
DECLARE
  v_table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_assignees'
  ) INTO v_table_exists;

  PERFORM record_test(
    'event_assignees_table_exists',
    v_table_exists,
    CASE WHEN NOT v_table_exists THEN 'event_assignees table does not exist' ELSE 'OK' END
  );
END;
$$;

-- Test 3: Verify event_tags_config table exists
DO $$
DECLARE
  v_table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_tags_config'
  ) INTO v_table_exists;

  PERFORM record_test(
    'event_tags_config_table_exists',
    v_table_exists,
    CASE WHEN NOT v_table_exists THEN 'event_tags_config table does not exist' ELSE 'OK' END
  );
END;
$$;

-- Test 4: Verify event_tags table exists
DO $$
DECLARE
  v_table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_tags'
  ) INTO v_table_exists;

  PERFORM record_test(
    'event_tags_table_exists',
    v_table_exists,
    CASE WHEN NOT v_table_exists THEN 'event_tags table does not exist' ELSE 'OK' END
  );
END;
$$;

-- Test 5: Verify indexes exist for performance
DO $$
DECLARE
  v_idx_count integer;
BEGIN
  SELECT COUNT(*) INTO v_idx_count
  FROM pg_indexes
  WHERE tablename IN ('events', 'event_assignees', 'event_tags_config', 'event_tags')
  AND schemaname = 'public';

  PERFORM record_test(
    'performance_indexes_created',
    v_idx_count >= 5,
    'Expected at least 5 indexes, found: ' || v_idx_count::text
  );
END;
$$;

-- Test 6: Family member can create a family visibility event
DO $$
DECLARE
  v_event_id uuid;
BEGIN
  -- Insert as member user
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222'::text)::text, true);
  
  INSERT INTO public.events (
    family_id, created_by, title, description, start_at, end_at, type, visibility
  ) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Test Event',
    'Test Description',
    now(),
    now() + interval '1 hour',
    'event',
    'family'
  )
  RETURNING id INTO v_event_id;

  PERFORM record_test(
    'member_can_create_family_visibility_event',
    v_event_id IS NOT NULL,
    'Failed to insert event'
  );
END;
$$;

-- Test 7: Family member can see family visibility events
DO $$
DECLARE
  v_event_id uuid;
  v_event_title text;
BEGIN
  -- Create event as admin
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111'::text)::text, true);
  
  INSERT INTO public.events (
    family_id, created_by, title, description, start_at, end_at, type, visibility
  ) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Family Event',
    'Visible to all',
    now(),
    now() + interval '1 hour',
    'event',
    'family'
  )
  RETURNING id INTO v_event_id;

  -- Query as member user
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222'::text)::text, true);

  SELECT title INTO v_event_title
  FROM public.events
  WHERE id = v_event_id
  LIMIT 1;

  PERFORM record_test(
    'member_can_see_family_visibility_events',
    v_event_title = 'Family Event',
    'Member could not see family event'
  );
END;
$$;

-- Test 8: Non-member cannot see events
DO $$
DECLARE
  v_event_id uuid;
  v_event_count integer;
BEGIN
  -- Create event as admin
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111'::text)::text, true);
  
  INSERT INTO public.events (
    family_id, created_by, title, description, start_at, end_at, type, visibility
  ) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Family Event',
    'Visible to all',
    now(),
    now() + interval '1 hour',
    'event',
    'family'
  )
  RETURNING id INTO v_event_id;

  -- Query as outsider user
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '33333333-3333-3333-3333-333333333333'::text)::text, true);

  SELECT COUNT(*) INTO v_event_count
  FROM public.events
  WHERE family_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

  PERFORM record_test(
    'non_member_cannot_see_family_events',
    v_event_count = 0,
    'Non-member should not see any events, but found: ' || v_event_count::text
  );
END;
$$;

-- Test 9: Personal events only visible to creator and admin
DO $$
DECLARE
  v_event_id uuid;
  v_event_by_member integer;
  v_event_by_admin integer;
  v_event_by_outsider integer;
BEGIN
  -- Create personal event as member
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222'::text)::text, true);
  
  INSERT INTO public.events (
    family_id, created_by, title, description, start_at, end_at, type, visibility
  ) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Personal Event',
    'Only for me',
    now(),
    now() + interval '1 hour',
    'event',
    'personal'
  )
  RETURNING id INTO v_event_id;

  -- Creator (member) can see it
  SELECT COUNT(*) INTO v_event_by_member
  FROM public.events
  WHERE id = v_event_id;

  -- Admin can see it
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111'::text)::text, true);
  SELECT COUNT(*) INTO v_event_by_admin
  FROM public.events
  WHERE id = v_event_id;

  -- Outsider cannot see it
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '33333333-3333-3333-3333-333333333333'::text)::text, true);
  SELECT COUNT(*) INTO v_event_by_outsider
  FROM public.events
  WHERE id = v_event_id;

  PERFORM record_test(
    'personal_events_visibility_correct',
    v_event_by_member = 1 AND v_event_by_admin = 1 AND v_event_by_outsider = 0,
    'Creator: ' || v_event_by_member || ', Admin: ' || v_event_by_admin || ', Outsider: ' || v_event_by_outsider
  );
END;
$$;

-- Test 10: Recurrence fields persist correctly
DO $$
DECLARE
  v_rrule text := 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
  v_stored_rrule text;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111'::text)::text, true);
  
  INSERT INTO public.events (
    family_id, created_by, title, description, start_at, end_at, type, visibility,
    rrule, recurrence_count, recurrence_expires_at
  ) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Recurring Event',
    'Weekly meeting',
    now(),
    now() + interval '1 hour',
    'event',
    'family',
    v_rrule,
    10,
    now() + interval '3 months'
  );

  SELECT rrule INTO v_stored_rrule
  FROM public.events
  WHERE title = 'Recurring Event'
  LIMIT 1;

  PERFORM record_test(
    'recurrence_fields_persist',
    v_stored_rrule = v_rrule,
    'Expected RRULE: ' || v_rrule || ', Got: ' || COALESCE(v_stored_rrule, 'NULL')
  );
END;
$$;

-- Output test results
DO $$
DECLARE
  v_passed integer;
  v_total integer;
  r test_results%rowtype;
BEGIN
  SELECT COUNT(*) INTO v_total FROM test_results;
  SELECT COUNT(*) INTO v_passed FROM test_results WHERE passed = true;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Events Schema & RLS Tests';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Passed: % / %', v_passed, v_total;
  RAISE NOTICE '';

  FOR r IN SELECT * FROM test_results ORDER BY test_name LOOP
    RAISE NOTICE '[%] %: %',
      CASE WHEN r.passed THEN '✓' ELSE '✗' END,
      r.test_name,
      COALESCE(r.message, '');
  END LOOP;

  RAISE NOTICE '========================================';
END;
$$;

ROLLBACK;
