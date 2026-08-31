# End-to-End Workflow Validation Guide

## Overview

This guide documents the complete end-to-end workflow for developing, testing, and deploying features in the family-ai-assist project. The workflow ensures smooth development experiences and seamless production deployments.

## Prerequisites

Before starting any feature development, ensure you have:

- Node.js 18+ (verify with `node --version`)
- pnpm (install with `npm install -g pnpm`)
- Docker Desktop running
- Git configured with your name and email
- Supabase CLI (install with `npm install -g supabase`)

**Verify prerequisites:**

```bash
node --version        # Should be 18+
pnpm --version       # Should be 11+
docker ps            # Should show no errors
git config --list    # Should show your user info
supabase --version   # Should be installed
```

## 1. Start with Clean Local Setup

### Initialize the Project

```bash
# Clone and navigate to project
git clone https://github.com/tack0sim/family-ai-assist
cd family-ai-assist

# Install dependencies
pnpm install

# Create environment file
cp env.example .env.local

# Copy Docker environment variables (if not already present)
cp supabase/.env.docker.example supabase/.env.docker
```

### Start Local Supabase Stack

```bash
# Start Docker services
./supabase/local-setup.sh start

# Apply all migrations
./supabase/local-setup.sh migrate

# Load seed data
./supabase/local-setup.sh seed

# Verify everything is running
./supabase/local-setup.sh status
```

You should see:
- PostgreSQL running on localhost:5432
- Envoy API Gateway on localhost:8000 (routes to all Supabase services)
- Redis on localhost:6379

### Verify Setup

```bash
# Check database connections
./supabase/verify-migrations.sh

# Start the Next.js app (in another terminal)
pnpm dev

# Visit http://localhost:3000
```

## 2. Create and Manage Feature Branches

### Naming Convention

Branch names should follow this pattern:

```
<type>/<description>
```

Where `<type>` is one of:
- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Testing improvements

Examples:
- `feat/add-family-members-messaging`
- `fix/calendar-event-timezone-issue`
- `refactor/optimize-rls-policies`
- `docs/migration-workflow-guide`

### Create Feature Branch

```bash
# Ensure you're on develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feat/your-feature-name

# Push to track on remote
git push -u origin feat/your-feature-name
```

## 3. Write and Test Migrations Locally

### Creating a New Migration (Recommended)

Using Supabase CLI is the recommended approach:

```bash
# Create a new migration with Supabase CLI
supabase migration new add_feature_xyz

# This generates: supabase/migrations/YYYYMMDDHHMMSS_add_feature_xyz.sql
```

### Migration Template

```sql
-- Migration: Add feature_xyz to users table
-- Description: Adds new column and RLS policy for feature_xyz

-- Create table or modify existing schema
CREATE TABLE IF NOT EXISTS feature_xyz (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feature_xyz ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can see their own records"
  ON feature_xyz
  FOR SELECT
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_xyz TO authenticated;
GRANT SELECT ON feature_xyz TO anon;
```

### Test Migration Locally

```bash
# Apply new migration to local Supabase
./supabase/local-setup.sh migrate

# Check for errors
./supabase/verify-migrations.sh

# Connect to database and verify
./supabase/local-setup.sh psql

-- In PostgreSQL:
SELECT * FROM feature_xyz;
```

### Common Issues

**Issue: Migration fails to apply**
- Check SQL syntax with `psql`
- Verify RLS is enabled before creating policies
- Ensure foreign keys reference existing tables

**Issue: Data is not visible**
- Verify RLS policies are correctly configured
- Check that GRANT statements are present
- Test policies with different user roles

## 4. Create Test Users via App UI

### Generate Test User Accounts

```bash
# With local Supabase running, visit http://localhost:3000

# Steps:
1. Click "Sign Up"
2. Enter test email: test@example.com
3. Enter password: Test123!@
4. Verify email (check Supabase logs)
5. Create family or join existing family
6. Invite additional members
```

### Access Local Database

```bash
# Connect to local PostgreSQL database
./supabase/local-setup.sh psql

-- View users
SELECT id, email FROM auth.users;

-- View your custom tables
SELECT * FROM your_table;
```

## 5. End-to-End Testing

### Run Full Test Suite

```bash
# Run all tests once
pnpm test:run

# Expected output: All tests should pass
```

### Test Specific Features

```bash
# Run tests for specific file
pnpm test:run src/features/your-feature.test.ts

# Run with UI
pnpm test:ui

# Watch mode for development
pnpm test
```

### Manual Testing Checklist

- [ ] Can create new records via app
- [ ] Can view records (respecting RLS)
- [ ] Can update records
- [ ] Can delete records
- [ ] Permissions work correctly for different users
- [ ] Migration can be reapplied without errors

## 6. Export Migration for Production Review

### Push Migration to Supabase Cloud

After testing locally and confirming everything works:

```bash
# Link to your Supabase project (if not already linked)
supabase link

# Push migrations to Supabase cloud
supabase db push

# This will:
# 1. Detect changes from local migrations
# 2. Generate SQL for production
# 3. Ask for confirmation
# 4. Apply migrations to cloud database
```

### Review Migration Before Deployment

```bash
# Check what will be pushed
supabase db push --dry-run

# Verify migration content
cat supabase/migrations/YYYYMMDDHHMMSS_your_feature_name.sql
```

## 7. Merge to Develop and Main

### Create Pull Request

```bash
# Create PR from feature branch to develop
gh pr create --base develop --title "feat: add feature_xyz" \
  --body "
- Adds feature_xyz table
- Implements RLS policies
- All tests passing
- Verified locally with seed data
"
```

### Review Checklist

- [ ] All tests pass
- [ ] Migration follows naming convention
- [ ] RLS policies are properly configured
- [ ] GRANT statements present
- [ ] Documentation updated
- [ ] No breaking changes

### Merge to Develop

```bash
# Merge via GitHub (recommended)
gh pr merge <pr-number> --squash

# Or merge locally
git checkout develop
git pull origin develop
git merge --no-ff feat/your-feature-name
git push origin develop
```

### Merge to Main (Production)

```bash
# Create release PR: develop -> main
gh pr create --base main --title "chore: release v0.x.x"

# Review and merge
gh pr merge <release-pr-number>

# Deploy (CI/CD handles this automatically)
```

## 8. Edge Cases and Known Issues

### Migration Edge Cases

**Downtime Migrations**
- Adding NOT NULL columns without default values requires backfill
- Use two-phase rollout: add column with default, then add constraint
- Test with actual data volume

**RLS Policy Conflicts**
- Avoid overlapping policies that may cause unexpected denials
- Use `USING` for SELECT and `WITH CHECK` for INSERT/UPDATE
- Test policies with multiple roles

**Foreign Key Constraints**
- Always add CASCADE delete for user-owned records
- Verify referential integrity before production
- Test data cleanup after deletions

### Development Issues

**Docker Port Conflicts**
```bash
# Check if ports are already in use
lsof -i :5432
lsof -i :8000
lsof -i :6379

# Kill conflicting process
kill <PID>

# Or use different ports in docker-compose.yml
```

**Stale Schema Cache**
```bash
# If changes don't appear in app
./supabase/local-setup.sh reset    # ⚠️ Deletes all data
./supabase/local-setup.sh migrate
./supabase/local-setup.sh seed
```

**RLS Test Failures**
```bash
# Verify user is authenticated
# Check service_role_key has necessary permissions
./supabase/local-setup.sh psql -c "SELECT * FROM auth.users LIMIT 5;"
```

## 9. Documentation Updates

### Update Relevant Docs

- [ ] Update `README.md` if new setup steps required
- [ ] Update `DOCKER_DEV.md` for new environment variables
- [ ] Update `MIGRATION_WORKFLOW.md` for new patterns
- [ ] Add inline comments for complex RLS policies

### Document Architecture Decisions

```bash
# Create ADR (Architecture Decision Record)
echo "# Decision: Why we implemented feature_xyz this way" > docs/adr/NNNN-feature-xyz.md
```

## 10. Workflow Checklist

Use this checklist to ensure all steps are complete:

- [ ] Started with clean local setup
- [ ] Created feature branch with correct naming
- [ ] Created and tested migration locally using `supabase migration new`
- [ ] Created test users via app UI
- [ ] Ran end-to-end tests successfully
- [ ] Verified RLS policies work correctly
- [ ] Pushed migration to cloud with `supabase db push`
- [ ] Committed with conventional message
- [ ] Created pull request with description
- [ ] All review checks passed
- [ ] Merged to develop
- [ ] Verified on develop environment
- [ ] Merged to main for production
- [ ] Updated documentation
- [ ] No edge cases introduced

## 11. Quick Reference Commands

### Local Development
```bash
./supabase/local-setup.sh start      # Start services
./supabase/local-setup.sh migrate    # Apply migrations
./supabase/local-setup.sh seed       # Load test data
./supabase/local-setup.sh status     # Check health
./supabase/local-setup.sh stop       # Stop services
./supabase/local-setup.sh reset      # ⚠️ Delete all data

./supabase/verify-migrations.sh      # Verify database
pnpm dev                             # Start Next.js app
pnpm test:run                        # Run tests
```

### Supabase CLI Commands
```bash
supabase migration new feature_name  # Create new migration
supabase db push                     # Push to cloud
supabase db push --dry-run          # Preview changes
supabase link                        # Link to project
```

### Git Workflow
```bash
git checkout -b feat/name            # Create branch
git push -u origin feat/name         # Push to remote
gh pr create --base develop          # Create PR
gh pr merge <number>                 # Merge PR
```

### Troubleshooting
```bash
./supabase/local-setup.sh logs       # View service logs
./supabase/local-setup.sh psql       # Connect to database
docker ps                            # Check running containers
docker logs supabase-db              # View database logs
```

## 12. Support and Questions

For issues or questions:

1. Check this guide first
2. Review [DOCKER_DEV.md](./DOCKER_DEV.md) for Docker-specific issues
3. Check [MIGRATION_WORKFLOW.md](./supabase/MIGRATION_WORKFLOW.md) for migration patterns
4. Open an issue on GitHub with detailed steps to reproduce

---

**Last Updated:** August 31, 2026
**Version:** 1.0
