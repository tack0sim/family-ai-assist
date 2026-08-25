# Local Supabase Development Environment

This guide explains how to set up and manage a local Supabase instance for development using Docker Compose.

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
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001
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
| PostgREST | 3001 | RESTful API |
| Redis | 6379 | Caching and rate limiting |

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

For production, these should be strong, random values managed by your deployment system.

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
