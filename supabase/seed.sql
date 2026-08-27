-- Seed data for family-ai-assist local development
-- Contains minimal test data for development and migration testing
--
-- Includes:
-- - 3 test user profiles (including admin and child account)
-- - 1 family group with members
-- - 6 sample events for testing calendar features
-- - Event assignments and custom tags

SET session_replication_role = replica;

--
-- Test user profiles
--

INSERT INTO "public"."profiles" ("id", "display_name", "avatar_url", "created_at", "is_child") VALUES
	('c9f54310-3fe9-473c-856b-7f6254816d01', 'Test User', NULL, '2026-07-27 16:29:36.511249+00', false),
	('8a0d376b-75a8-4d08-8526-84a32c373eae', 'Child Member', NULL, '2026-08-10 18:19:21.906885+00', true),
	('b4150a47-a677-4967-9f88-7f64efa7dc82', 'Admin User', NULL, '2026-07-15 15:28:20.258156+00', false);

--
-- Sample family group
--

INSERT INTO "public"."families" ("id", "name", "created_by", "created_at") VALUES
	('a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'Test Family', 'b4150a47-a677-4967-9f88-7f64efa7dc82', '2026-07-28 11:26:16.604079+00');

--
-- Sample events for testing calendar features
--

INSERT INTO "public"."events" ("id", "family_id", "created_by", "title", "description", "start_at", "end_at", "all_day", "type", "visibility", "rrule", "recurrence_count", "recurrence_expires_at", "created_at", "updated_at") VALUES
	('cc9962c5-3a40-49e5-948f-70fa730c4aec', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'b4150a47-a677-4967-9f88-7f64efa7dc82', 'Family Dinner', 'Weekly family dinner night', '2026-08-22 18:00:00+00', '2026-08-22 20:00:00+00', false, 'event', 'family', NULL, NULL, NULL, '2026-08-19 17:48:02.670358+00', '2026-08-19 17:48:02.670358+00'),
	('27a7d316-36ea-4899-9cd3-49f098939ad9', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'b4150a47-a677-4967-9f88-7f64efa7dc82', 'Movie Night', '', '2026-08-18 19:00:00+00', '2026-08-18 21:00:00+00', false, 'event', 'family', NULL, NULL, NULL, '2026-08-19 17:57:33.907613+00', '2026-08-19 17:57:33.907613+00'),
	('f720c079-fe93-4eca-88f9-714182babd97', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'b4150a47-a677-4967-9f88-7f64efa7dc82', 'School Pickup', '', '2026-08-20 15:30:00+00', '2026-08-20 16:00:00+00', false, 'event', 'family', NULL, NULL, NULL, '2026-08-19 18:03:03.017062+00', '2026-08-19 18:03:03.017062+00'),
	('6b2a8e88-616e-4408-8c6a-e4cb6efd497d', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'b4150a47-a677-4967-9f88-7f64efa7dc82', 'Doctor Appointment', 'Annual checkup', '2026-08-21 10:00:00+00', '2026-08-21 11:00:00+00', false, 'event', 'family', NULL, NULL, NULL, '2026-08-19 18:04:43.338858+00', '2026-08-19 18:04:43.338858+00'),
	('5be3dd9a-1384-4a98-a1e7-a0a205e94758', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'b4150a47-a677-4967-9f88-7f64efa7dc82', 'Weekend Trip', 'Family outing', '2026-08-18 08:00:00+00', '2026-08-18 18:00:00+00', false, 'event', 'family', NULL, NULL, NULL, '2026-08-19 18:05:54.190812+00', '2026-08-19 18:05:54.190812+00'),
	('68ae4c91-2652-43a4-be31-2bfd27e17c19', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'b4150a47-a677-4967-9f88-7f64efa7dc82', 'Parent Meeting', '', '2026-08-20 19:00:00+00', '2026-08-20 20:00:00+00', false, 'event', 'family', NULL, NULL, NULL, '2026-08-19 18:06:48.282792+00', '2026-08-19 18:06:48.282792+00');

--
-- Event assignments
--

INSERT INTO "public"."event_assignees" ("id", "event_id", "profile_id", "created_at") VALUES
	('b16d7aa9-5234-47f5-8c63-665af5c16cfa', '27a7d316-36ea-4899-9cd3-49f098939ad9', 'b4150a47-a677-4967-9f88-7f64efa7dc82', '2026-08-19 17:57:34.067442+00'),
	('05f335d0-e6e3-4e79-bdef-8c3cf06d8889', 'f720c079-fe93-4eca-88f9-714182babd97', 'b4150a47-a677-4967-9f88-7f64efa7dc82', '2026-08-19 18:03:03.103503+00'),
	('0d0ea707-3ac2-4746-a579-eff620efeff4', '6b2a8e88-616e-4408-8c6a-e4cb6efd497d', 'b4150a47-a677-4967-9f88-7f64efa7dc82', '2026-08-19 18:04:43.431519+00'),
	('b772d44a-c788-48a4-a783-3d227a514546', '6b2a8e88-616e-4408-8c6a-e4cb6efd497d', '8a0d376b-75a8-4d08-8526-84a32c373eae', '2026-08-19 18:04:43.431519+00'),
	('2789eaa1-071b-43f2-aee7-368e2e8cd7b6', '68ae4c91-2652-43a4-be31-2bfd27e17c19', 'b4150a47-a677-4967-9f88-7f64efa7dc82', '2026-08-19 18:06:48.353608+00');

--
-- Event tag configurations
--

INSERT INTO "public"."event_tags_config" ("id", "family_id", "name", "color", "created_by", "created_at") VALUES
	('7ef1b64f-be83-47ed-a455-6c74f4141645', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'Birthday', '#6366f1', 'b4150a47-a677-4967-9f88-7f64efa7dc82', '2026-08-13 14:44:05.891744+00');

--
-- Family members and roles
--

INSERT INTO "public"."family_members" ("id", "family_id", "user_id", "role", "status", "joined_at") VALUES
	('74e329bf-112e-44fa-9ee4-ce1ddeb40e90', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'b4150a47-a677-4967-9f88-7f64efa7dc82', 'admin', 'active', '2026-07-28 11:26:16.615+00'),
	('2caca77d-479a-445d-af65-2bb3180684ff', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', '8a0d376b-75a8-4d08-8526-84a32c373eae', 'member', 'active', '2026-08-10 18:19:21.931+00'),
	('d4829b96-44c8-4fcd-92b2-e837a7b0f92b', 'a29cca69-8ec6-4d96-8b61-36eb4fb2a462', 'c9f54310-3fe9-473c-856b-7f6254816d01', 'member', 'active', '2026-08-13 15:54:28.902+00');

SET session_replication_role = DEFAULT;
