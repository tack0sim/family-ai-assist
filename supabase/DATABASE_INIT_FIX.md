# Database Initialization Fix

## Problem
The `reset` command in `local-setup.sh` was failing because the `supabase_auth` and `supabase_rest` services couldn't connect to PostgreSQL after the database volume was wiped.

### Root Cause
When the Supabase PostgreSQL Docker image initializes a fresh database, it creates all necessary roles (`supabase_auth_admin`, `authenticator`, etc.) through its built-in init scripts. However, **these roles have no password assigned**.

When services tried to connect via TCP from other containers, PostgreSQL required password authentication (SCRAM-SHA-256), causing connections to fail:
```
FATAL: password authentication failed for user "supabase_auth_admin"
DETAIL: User "supabase_auth_admin" has no password assigned.
```

## Solution
The fix leverages the Supabase PostgreSQL image's built-in initialization hook at `/etc/postgresql.schema.sql`. This file is executed by the `migrate.sh` script after all standard database initialization, making it the perfect place to set user passwords.

### Changes Made

1. **Created `sql/99-post-init-users.sql`**
   - Simple SQL script that sets passwords for `supabase_auth_admin` and `authenticator`
   - Uses the `POSTGRES_PASSWORD` env var from `.env.docker` (default: `postgres`)
   - Runs automatically during database initialization via the `/etc/postgresql.schema.sql` hook

2. **Updated `docker-compose.yml`**
   - Added volume mount: `./sql/99-post-init-users.sql:/etc/postgresql.schema.sql:ro`
   - This ensures the init script runs during the first database setup
   - Read-only mount (`ro`) for safety

3. **Simplified `local-setup.sh` reset function**
   - Removed complex initialization logic and polling
   - Reverted to simple `docker compose down -v` → `up -d` → `migrate` flow
   - Now works reliably because passwords are set during database initialization

## How It Works

1. `reset()` tears down all containers and volumes
2. `docker compose up -d` starts the postgres container
3. Postgres runs the migration init scripts (from `/docker-entrypoint-initdb.d/`)
4. Postgres runs `/etc/postgresql.schema.sql` (our mounted script)
5. Auth and REST services can now connect because the roles have passwords
6. Migrations run successfully via `migrate()`

## Testing

To verify the fix works:

```bash
cd supabase
echo "yes" | bash local-setup.sh reset
```

All services should reach healthy status:
```
supabase_db      Up 41 seconds (healthy)
supabase_auth    Up 30 seconds (healthy)
supabase_rest    Up 30 seconds
supabase_envoy   Up 24 seconds (healthy)
supabase_redis   Up 41 seconds (healthy)
```

## Why This Approach Is Elegant

✅ **Declarative** - No shell scripting, just a volume mount in docker-compose  
✅ **Reproducible** - Works identically across all dev machines  
✅ **No temp files** - No sed/awk/envsubst required  
✅ **Leverages official patterns** - Uses the Supabase image's built-in hooks  
✅ **Dev-only** - No impact on production Supabase instances  
✅ **Idempotent** - Safe to run multiple times (uses existing password)  

## Important Notes

- **Dev only**: This fix is only for local development. Production Supabase instances are managed by Supabase and don't need this.
- **Fixed password**: The dev environment uses `POSTGRES_PASSWORD=postgres` by default. For shared dev teams, keep this consistent in `.env.docker`.
- **No production impact**: This file is never deployed to production.
