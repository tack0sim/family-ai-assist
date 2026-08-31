# Local Supabase Development Environment

This guide explains how to set up and manage a local Supabase instance for development using Docker Compose.

## Architecture

Your local stack includes:

```
Next.js App (localhost:3000)
    ↓
Envoy Gateway (localhost:8000) ← Main API endpoint
    ├─ /auth/v1/*    → GoTrue (authentication)
    └─ /rest/v1/*    → PostgREST (database API)
    ↓
PostgreSQL (localhost:5432)
```

**Key point:** All requests go through Envoy on port 8000, which routes them to the appropriate internal service.

## Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- PostgreSQL client tools (for `psql`)
- Node.js and pnpm (for the Next.js app)

## Quick Start

### 1. Generate local environment

The `supabase/.env.docker` file contains development secrets. It's already created and gitignored.

### 2. Start the services

```bash
./supabase/local-setup.sh start
```

This will:
- Pull necessary Docker images
- Start all services (PostgreSQL, PostgREST API, Redis, etc.)
- Wait for all services to be healthy

### 3. Apply migrations

```bash
./supabase/local-setup.sh migrate
```

This runs all SQL migration files in order, setting up your database schema.

### 4. Configure your Next.js app

Create `.env.local` in the project root with your local credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
REDIS_URL=redis://localhost:6379
```

The keys are defined in `supabase/.env.docker` (which is gitignored for security).

### 5. Run the app

```bash
pnpm dev
```

Visit http://localhost:3000 to use your app.

## Services

The Docker Compose configuration includes:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Database engine |
| GoTrue (auth) | 9999 (internal) | Authentication service |
| PostgREST | 3000 (internal) | RESTful API |
| Envoy (api-gw) | 8000 | API Gateway (routes to all services) |
| Redis | 6379 | Caching and rate limiting |

**Note:** Port 8000 (Envoy) is your main entry point. It routes:
- `/auth/v1/*` → GoTrue (authentication)
- `/rest/v1/*` → PostgREST (database API)
- Future: `/storage/v1/*`, `/realtime/v1/*`, etc.

## Management Commands

### Start services

```bash
./supabase/local-setup.sh start
```

### Stop services

```bash
./supabase/local-setup.sh stop
```

### Restart services

```bash
./supabase/local-setup.sh restart
```

### Check service health

```bash
./supabase/local-setup.sh status
```

### Apply migrations

```bash
./supabase/local-setup.sh migrate
```

### Reset database

⚠️ **WARNING**: This deletes all data!

```bash
./supabase/local-setup.sh reset
```

### View logs

```bash
# All services
./supabase/local-setup.sh logs

# Specific service
./supabase/local-setup.sh logs postgres
./supabase/local-setup.sh logs supabase_rest
```

### Connect to PostgreSQL

```bash
./supabase/local-setup.sh psql
```

### Show configuration info

```bash
./supabase/local-setup.sh info
```

## Migrations

Migrations are SQL files in the `supabase/migrations/` directory. They're applied in alphabetical order (by timestamp prefix).

### Creating a new migration

Use the Supabase CLI:

```bash
supabase migration new <migration_name>
```

This creates a timestamped SQL file in `supabase/migrations/`.

### Applying migrations

```bash
./supabase/local-setup.sh migrate
```

Migrations are idempotent - running them multiple times is safe.

## Troubleshooting

### Services not starting

Check Docker is running:
```bash
docker ps
```

View service logs:
```bash
./supabase/local-setup.sh logs
```

### Database connection errors

Verify PostgreSQL is healthy:
```bash
./supabase/local-setup.sh psql -c "SELECT 1"
```

### Port already in use

If a port is already in use, either:
1. Stop the conflicting service
2. Change the port in `docker-compose.yml`

### Clearing volumes

To completely reset all data:
```bash
./supabase/local-setup.sh reset
```

## Environment Variables

Configuration is managed in `supabase/.env.docker` (gitignored for security):

- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `JWT_SECRET` - Secret for JWT signing
- `API_EXTERNAL_URL` - Auth service external URL
- `SITE_URL` - Your Next.js app URL (for OAuth redirects)
- `ENABLE_EMAIL_AUTOCONFIRM` - Skip email verification in dev
- `GOOGLE_ENABLED` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth config

For production, these should be strong, random values managed by your deployment system.

## Authentication Setup

### Email/Password Authentication

Email signup is enabled by default with auto-confirmation (no email verification required):

```bash
# In supabase/.env.docker
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true  # ← Users are immediately active
```

To test:
1. Start services
2. Go to your app at http://localhost:3000
3. Sign up with any email/password
4. You're immediately signed in (no email verification needed)

### Google OAuth (Optional)

To enable Google sign-in:

1. **Get credentials** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:8000/auth/v1/callback`

2. **Configure** in `supabase/.env.docker`:
   ```bash
   GOOGLE_ENABLED=true
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-secret-here
   ```

3. **Restart services:**
   ```bash
   ./supabase/local-setup.sh restart
   ```

### Verifying Auth Works

```bash
# Check auth service health
curl http://localhost:8000/auth/v1/health
# Should return: {"version":"...","name":"GoTrue"}

# Check if email signup is enabled
curl http://localhost:8000/auth/v1/settings
# Look for: "external_email_enabled": true
```

## Troubleshooting

### "Server lacks JWT secret" Error

**Symptom:** Email signin fails with "Server lacks JWT secret"

**Cause:** GoTrue (auth service) isn't running or can't access the database

**Solution:**
```bash
# 1. Check if auth container is running
docker ps | grep supabase_auth

# 2. If not running, check why
docker logs supabase_auth

# 3. Common issues:
#    - Missing JWT_SECRET in .env.docker
#    - Database not ready (wait a few seconds)
#    - Wrong POSTGRES_PASSWORD in auth connection string

# 4. Restart if needed
./supabase/local-setup.sh restart
```

### Auth Requests Return 404

**Cause:** Envoy gateway not routing correctly

**Solution:**
```bash
# Check gateway logs
docker logs supabase_envoy

# Restart gateway
docker restart supabase_envoy

# Verify routing works
curl http://localhost:8000/auth/v1/health
```

### Google OAuth Redirect Fails

**Cause:** Redirect URI mismatch

**Solution:**
1. Check Google Console authorized redirect URIs include: `http://localhost:8000/auth/v1/callback`
2. Verify `API_EXTERNAL_URL=http://localhost:8000/auth/v1` in `.env.docker`
3. Restart: `./supabase/local-setup.sh restart`

### Port 8000 Already in Use

**Solution:**
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or change the port in docker-compose.yml:
# api-gw:
#   ports:
#     - "8001:8000"  # Use 8001 externally
# Then update .env.local: NEXT_PUBLIC_SUPABASE_URL=http://localhost:8001
```

## Development Workflow

1. **Start environment**:
   ```bash
   ./supabase/local-setup.sh start
   ./supabase/local-setup.sh migrate
   pnpm dev
   ```

2. **Make schema changes**:
   ```bash
   supabase migration new feature_name
   # Edit the migration file
   ./supabase/local-setup.sh migrate
   ```

3. **Reset if needed**:
   ```bash
   ./supabase/local-setup.sh reset
   ./supabase/local-setup.sh migrate
   ```

4. **Stop when done**:
   ```bash
   ./supabase/local-setup.sh stop
   ```

## Security Notes

- **`.env.docker` is gitignored** - It contains local development secrets
- **Never commit secrets** to version control
- **Local JWT tokens are for development only** - Use proper secrets for production
- **Docker volumes persist data** - Reset with `./supabase/local-setup.sh reset` if needed
