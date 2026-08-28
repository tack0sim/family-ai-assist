# Migration Workflow Guide

This guide documents the complete migration workflow for **family-ai-assist**, covering how to create, test, verify, and deploy database migrations locally and to production.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Creating Migrations](#creating-migrations)
3. [Testing Migrations Locally](#testing-migrations-locally)
4. [Verifying Migration Flow](#verifying-migration-flow)
5. [Exporting Changes](#exporting-changes)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- PostgreSQL client tools (`psql`)
- Node.js and pnpm
- Supabase CLI (optional, for advanced features)

### Start Local Development

```bash
# Start Supabase services locally
./supabase/local-setup.sh start

# Apply all migrations
./supabase/local-setup.sh migrate

# Apply seed data
./supabase/local-setup.sh seed

# Verify everything works
./supabase/verify-migrations.sh

# Start the Next.js app (in another terminal)
pnpm dev
```

Visit http://localhost:3000 to use the app.

## Creating Migrations

### File Naming Convention

Migration files are named with a **timestamp** and a **descriptive name**:

```
YYYYMMDDHHMISS_descriptive_name.sql
```

Examples:
- `20260714192100_create_rls_helper_functions.sql` (good)
- `20260810212606_add_is_child_flag_to_profiles.sql` (good)
- `add_column.sql` (bad - no timestamp)
- `migration.sql` (bad - no timestamp or description)

### Creating a New Migration

#### Using Supabase CLI (Recommended)

```bash
# Create a new migration with Supabase CLI
supabase migration new add_feature_xyz

# This creates: migrations/20260828_add_feature_xyz.sql
```

#### Manual Creation

```bash
# Get current timestamp
DATE=$(date +%Y%m%d%H%M%S)

# Create migration file
touch supabase/migrations/${DATE}_your_feature_name.sql

# Edit the file and add SQL
```

### Migration Template

Start with this template for any migration:

```sql
-- Migration: <Brief description of changes>
-- Issue: #<issue-number> (if applicable)
-- Date: YYYY-MM-DD

-- Description:
-- This migration does the following:
-- 1. <What this migration does>
-- 2. <Any side effects or dependencies>

-- Example migration: Creating a new table with RLS policies
CREATE TABLE my_new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add Row-Level Security (RLS)
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "my_policy" ON my_new_table
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Best Practices for Writing Migrations

1. **Idempotency**: Make migrations safe to run multiple times
   ```sql
   -- ✓ Good: Use IF NOT EXISTS or IF EXISTS
   CREATE TABLE IF NOT EXISTS my_table (id UUID PRIMARY KEY);
   
   -- ✗ Avoid: Will fail if run twice
   CREATE TABLE my_table (id UUID PRIMARY KEY);
   ```

2. **Atomic Changes**: Keep migrations focused on one logical change
   ```sql
   -- ✓ Good: One migration per feature
   -- Migration 1: Add table
   CREATE TABLE events (id UUID PRIMARY KEY);
   
   -- Migration 2: Add RLS
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
   
   -- ✗ Avoid: Multiple unrelated changes in one file
   ```

3. **Include Comments**: Document what each migration does
   ```sql
   -- Migration: Add is_child flag to profiles table
   -- Issue: #14
   -- Reason: Support distinguishing child accounts from parent accounts
   
   ALTER TABLE profiles ADD COLUMN is_child BOOLEAN DEFAULT false;
   ```

4. **Test Reversibility**: Consider how to reverse changes if needed
   ```sql
   -- Add a new column
   ALTER TABLE profiles ADD COLUMN new_field TEXT;
   
   -- To reverse (if needed in future migration):
   -- ALTER TABLE profiles DROP COLUMN new_field;
   ```

5. **Handle Existing Data**: Plan data transformations carefully
   ```sql
   -- Add column with default for existing rows
   ALTER TABLE my_table ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
   
   -- Update existing rows if needed
   UPDATE my_table SET status = 'active' WHERE condition;
   ```

## Testing Migrations Locally

### Workflow for Testing

```bash
# 1. Start local Supabase (if not already running)
./supabase/local-setup.sh start

# 2. Apply all migrations
./supabase/local-setup.sh migrate

# 3. Apply seed data (optional)
./supabase/local-setup.sh seed

# 4. Test your application logic
pnpm dev

# 5. Run application tests
pnpm test

# 6. If you need to make changes to migrations:
# - Stop the database
./supabase/local-setup.sh stop

# - Edit your migration files
# - Reset to start fresh
./supabase/local-setup.sh reset

# - Verify everything still works
./supabase/verify-migrations.sh
```

### Connecting to Local Database

Connect directly to PostgreSQL for manual testing:

```bash
# Connect via psql
./supabase/local-setup.sh psql

# Or with explicit credentials
psql -h localhost -p 5432 -U postgres -d postgres

# Once connected, query tables
\dt                          -- List tables
\d profiles                  -- Describe table
SELECT * FROM profiles;      -- Query data
```

### Testing RLS Policies

Test Row-Level Security (RLS) policies locally:

```sql
-- Connect as the postgres user (superuser, ignores RLS)
-- Then impersonate different auth roles:

SET ROLE authenticated;
-- Now queries will respect RLS policies

SELECT * FROM profiles;  -- Subject to RLS rules

RESET ROLE;  -- Return to superuser
```

## Verifying Migration Flow

### Automated Verification Script

Run the comprehensive migration verification script:

```bash
./supabase/verify-migrations.sh
```

This script verifies:

1. **Migration files exist** - All SQL files are readable
2. **Migrations apply cleanly** - No errors when applying migrations
3. **Schema is persisted** - Tables and columns were created
4. **Seed data survives** - Auth users exist after seed
5. **Idempotency** - Migrations can be re-run safely
6. **Exportability** - Changes can be dumped for production

### Manual Verification

Verify specific aspects manually:

```bash
# List all tables
./supabase/local-setup.sh psql -c "\dt"

# Count migration files
find supabase/migrations -name "*.sql" | wc -l

# Verify RLS is enabled on a table
./supabase/local-setup.sh psql -c "\d+ profiles" | grep "Row Level Security"

# List all RLS policies on a table
./supabase/local-setup.sh psql -c "SELECT policyname FROM pg_policies WHERE tablename = 'profiles';"
```

## Exporting Changes

### For Staging/Production Review

Export the current schema to review changes before deploying:

```bash
# Export database schema
./supabase/local-setup.sh psql --schema-only > schema_dump.sql

# Review the schema
less schema_dump.sql

# Or compare with a previous version
diff schema_dump_old.sql schema_dump.sql
```

### Using Supabase CLI

```bash
# Push migrations to Supabase
supabase db push

# Verify remote database
supabase db remote set <connection-string>
```

### Git Workflow

1. Create a new branch for your migration:
   ```bash
   git checkout -b feature/migration-xyz
   ```

2. Add your migration file:
   ```bash
   git add supabase/migrations/20260828_your_migration.sql
   ```

3. Test locally (see Testing Migrations Locally section)

4. Commit with a clear message:
   ```bash
   git commit -m "feat: add xyz migration

   - Creates new table
   - Adds RLS policies
   - Issue: #47"
   ```

5. Push and create a Pull Request

## Best Practices

### General Principles

✅ **DO:**
- Keep migrations focused and atomic
- Use descriptive file names with timestamps
- Include comments explaining the migration
- Test thoroughly before committing
- Use IF NOT EXISTS/IF EXISTS for idempotency
- Include issue references in comments
- Document RLS policies clearly
- Test data migrations with real-world data volumes

❌ **DON'T:**
- Create migrations without timestamps
- Mix multiple unrelated changes
- Skip the verification script
- Assume migrations work without testing
- Hard-code data that should be seeded elsewhere
- Ignore RLS when creating tables with sensitive data
- Run migrations in production without staging test

### RLS Policy Best Practices

When creating RLS policies:

1. **Always enable RLS on sensitive tables**
   ```sql
   ALTER TABLE sensitive_table ENABLE ROW LEVEL SECURITY;
   ```

2. **Use helper functions for complex logic**
   ```sql
   CREATE FUNCTION is_family_member(family_id UUID) RETURNS BOOLEAN AS $$
     SELECT EXISTS (
       SELECT 1 FROM family_members 
       WHERE family_members.family_id = $1 
       AND family_members.user_id = auth.uid()
     );
   $$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;
   ```

3. **Grant explicit permissions**
   ```sql
   GRANT SELECT ON table_name TO authenticated;
   GRANT UPDATE ON table_name TO authenticated;
   ```

4. **Test policies after creation**
   ```bash
   ./supabase/verify-migrations.sh
   ```

### Seed Data Best Practices

1. **Keep seed data simple and focused**
   - 2-3 test users (admin, regular user, child)
   - Minimal realistic data for testing
   - No sensitive real-world data

2. **Ensure seed data survives migrations**
   - Use INSERT INTO with explicit column names
   - Set `session_replication_role = replica` to skip triggers during seed
   - Verify seed data after running migrations

3. **Document test credentials**
   ```sql
   -- Test User Credentials:
   -- - admin@example.com / password123
   -- - test@example.com / password123
   ```

## Troubleshooting

### "Migration Already Exists" Error

When running migrations multiple times:

```
ERROR: relation "profiles" already exists
```

**Solution:** This is normal and safe. The verify script treats re-runs as idempotent.

### "Role Does Not Exist" Error

```
ERROR: role "authenticated" does not exist
```

**Solution:** Roles must be created before they can be used in policies. Check that all prerequisite migrations have been applied:

```bash
./supabase/local-setup.sh migrate
```

### Service Won't Start

```
Error: Docker is not installed
```

**Solution:** Install Docker Desktop from https://www.docker.com/products/docker-desktop

### Seed Data Not Applied

```
Auth users: 0
```

**Solution:** Run the seed command explicitly:

```bash
./supabase/local-setup.sh seed
```

### RLS Policy Not Working

Test using psql directly:

```bash
./supabase/local-setup.sh psql -c "
SET ROLE authenticated;
SET app.current_user_id = 'some-uuid';
SELECT * FROM profiles;
RESET ROLE;
"
```

### Reset Everything

If you need a clean slate:

```bash
# ⚠️ WARNING: This deletes all data!
./supabase/local-setup.sh reset

# Then verify everything works
./supabase/verify-migrations.sh
```

## Quick Reference

### Common Commands

```bash
# Start services
./supabase/local-setup.sh start

# Apply migrations
./supabase/local-setup.sh migrate

# Apply seed data
./supabase/local-setup.sh seed

# Verify migration workflow
./supabase/verify-migrations.sh

# Connect to database
./supabase/local-setup.sh psql

# View logs
./supabase/local-setup.sh logs

# Stop services
./supabase/local-setup.sh stop

# Reset everything (⚠️ deletes all data)
./supabase/local-setup.sh reset
```

### Service Information

| Service | URL | Credentials |
|---------|-----|-------------|
| App | http://localhost:3000 | N/A |
| PostgREST API | http://localhost:3001 | N/A |
| PostgreSQL | localhost:5432 | postgres/postgres |
| Redis | localhost:6379 | N/A |

## Examples

### Example 1: Add a Simple Column

```sql
-- Migration: Add verification_status to profiles
-- Issue: #52

ALTER TABLE profiles 
ADD COLUMN verification_status VARCHAR(50) DEFAULT 'unverified',
ADD COLUMN verified_at TIMESTAMPTZ;

-- Update existing rows with default
UPDATE profiles SET verification_status = 'unverified' WHERE verification_status IS NULL;
```

### Example 2: Create a New Table with RLS

```sql
-- Migration: Create notifications table
-- Issue: #53

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('event', 'invitation', 'message'))
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Only users can see their own notifications
CREATE POLICY "users_select_own_notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Only users can update their own notifications
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
```

### Example 3: Add RLS to Existing Table

```sql
-- Migration: Add RLS to events table
-- Issue: #54

-- First, ensure the table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'events'
  ) THEN
    RAISE EXCEPTION 'Table events does not exist';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "users_select_family_events" ON events
  FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM family_members 
    WHERE user_id = auth.uid()
  ));

-- Grant permissions
GRANT SELECT ON events TO authenticated;
```

## Related Documents

- [DOCKER.md](./DOCKER.md) - Docker Compose setup details
- [CONTEXT.md](../CONTEXT.md) - Project architecture and decisions
- [Database Schema](./migrations/) - All migration files

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review existing [GitHub Issues](https://github.com/tack0sim/family-ai-assist/issues)
3. Run `./supabase/verify-migrations.sh` for diagnostics
4. Check Docker logs: `./supabase/local-setup.sh logs`
