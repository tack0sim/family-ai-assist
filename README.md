# Family AI Assistant

A privacy-first platform for families to coordinate schedules, communicate via an AI assistant, and share files in a secure shared space.

Built with **Next.js**, **Supabase** (auth + Postgres + storage), **Redis** (rate-limiting), **OpenAI**, and **Resend** (email).

---

## Getting Started

### Prerequisites

- Node.js (see `.nvmrc`)
- pnpm
- Docker Desktop (for the local Supabase stack)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp env.example .env.local
```

Fill in `.env.local` — see [Environment Variables](#environment-variables) below for details.

### 3. Start the local Supabase stack

```bash
./supabase/local-setup.sh start
./supabase/local-setup.sh migrate
```

See [DOCKER_DEV.md](./DOCKER_DEV.md) for full Docker setup documentation.

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

All variables are documented in [`env.example`](./env.example). Copy it and fill in the values for your target environment.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | ✅ | Full public URL of the app (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase REST API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Anon key — safe to expose to the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key — **server-only, never expose to the browser** |
| `SUPABASE_DB_PASSWORD` | ✅ | Database password (used by migrations) |
| `SUPABASE_CALLBACK_URL` | ✅ | OAuth redirect URL (e.g. `http://localhost:3000/auth/callback`) |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `REDIS_URL` | ✅ | Redis connection string (rate-limiting for AI chat) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for the AI assistant |
| `RESEND_API_KEY` | ✅ | Resend API key for transactional email |
| `RESEND_FROM_EMAIL` | ✅ | "From" address used in outgoing emails |

### Local vs. Production

| Setting | Local | Production |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://localhost:3001` (Docker PostgREST) | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | `https://yourdomain.com` |
| `SUPABASE_CALLBACK_URL` | `http://localhost:3000/auth/callback` | `https://yourdomain.com/auth/callback` |
| `REDIS_URL` | `redis://localhost:6379` | Managed Redis (e.g. Upstash) |

### Environment files

| File | Committed | Purpose |
|---|---|---|
| `env.example` | ✅ Yes | Template showing all required variables (no secrets) |
| `.env.local` | ❌ No | Local development overrides |
| `.env.production` | ❌ No | Production values (managed in deployment platform, e.g. Vercel) |

> **Never commit `.env.local` or `.env.production`.** They are gitignored. Use your deployment platform's secret manager (e.g. Vercel Environment Variables) for production secrets.

---

## Project Structure

```
src/
  app/          # Next.js App Router pages and route handlers
  components/   # Shared UI components
  lib/          # Utilities, Supabase client, auth helpers
supabase/
  migrations/   # SQL migration files (applied in order)
  docker-compose.yml
  local-setup.sh
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run tests (Vitest) |
| `pnpm lint` | Run Biome linter |
| `./supabase/local-setup.sh start` | Start local Supabase Docker stack |
| `./supabase/local-setup.sh migrate` | Apply database migrations |
| `./supabase/local-setup.sh reset` | ⚠️ Reset local database (deletes all data) |
