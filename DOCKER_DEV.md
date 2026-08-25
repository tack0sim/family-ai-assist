# Local Development with Docker

This project uses Docker Compose to provide a complete local Supabase environment for development.

## Quick Start

```bash
# Start local Supabase
./supabase/local-setup.sh start

# Apply migrations
./supabase/local-setup.sh migrate

# Start the Next.js app (in another terminal)
pnpm dev
```

Visit http://localhost:3000

## Configuration

Create `.env.local` in the project root with environment variables from `supabase/.env.docker`:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key-from-.env.docker>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-.env.docker>
SUPABASE_SERVICE_ROLE_KEY=<service-key-from-.env.docker>
REDIS_URL=redis://localhost:6379
```

**Note**: The `supabase/.env.docker` file contains your local development secrets and is gitignored for security.

See [supabase/DOCKER.md](./supabase/DOCKER.md) for detailed documentation.

## Common Tasks

- **Check service health**: `./supabase/local-setup.sh status`
- **View logs**: `./supabase/local-setup.sh logs`
- **Connect to database**: `./supabase/local-setup.sh psql`
- **Reset database**: `./supabase/local-setup.sh reset` (⚠️ deletes all data)

## Troubleshooting

See [supabase/DOCKER.md#troubleshooting](./supabase/DOCKER.md#troubleshooting)

## Services

- **PostgreSQL**: localhost:5432
- **PostgREST API**: localhost:3001
- **Redis**: localhost:6379

All services are configured in `supabase/docker-compose.yml` and can be managed with `./supabase/local-setup.sh`.
