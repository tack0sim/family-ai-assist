# ADR 0002: Sidebar-First Architecture for TTFB Optimization

**Date:** 2026-09-21  
**Status:** Proposed  
**Deciders:** @tack0sim  
**Affected Components:** proxy.ts, authenticated-layout.tsx, nav-user.client.tsx, src/app/(frontend)/page.tsx, CalendarView, page data fetching  

## Problem

Current TTFB is ~4 seconds with ~20 API requests per page load. The bottleneck is **sequential Database hits**:

1. Proxy calls `getUser()` (DB hit: ~150ms)
2. Layout calls `getCachedUser()` again (memoized, but blocks sidebar render)
3. Page calls `checkUserFamilyContext()` (DB hit: ~150ms)
4. Page calls `getEvents()` + `getFamilyMembers()` (2× DB hits in parallel: ~150ms total)

**Root cause:** Sidebar render is blocked on user identity data, preventing app shell from appearing until DB queries complete.

## Decision

Adopt a **three-layer rendering strategy** that separates authentication verification (fast, no DB) from user identity data (slower, DB-dependent):

### Layer 1: Authentication Boundary (proxy.ts)
- **When:** On every request, before page render
- **How:** Call `getClaims()` (token signature verification, ~1ms, no DB hit)
- **What it does:** Verifies session is valid; prevents unauthenticated access to protected routes
- **Routes protected (proxy):** `/settings`, `/onboarding`, `/invite/*` (enforced at proxy)
- **Routes unprotected (checked in page):** `/` (homepage handles both authenticated and unauthenticated)
- **Result:** Protected routes block at proxy boundary (~1ms); landing page and sidebar render in ~50-100ms without DB hit

### Layer 2: Authenticated Layout (Server Component)
- **When:** For authenticated users (confirmed by proxy or page-level `getClaims()`)
- **What it does:** Check auth state from proxy-verified cookies (no new call); render sidebar skeleton
- **Importantly:** Does NOT call `getCachedUser()` or other DB queries
- **Child: NavUser (Client Component)**
  - Runs independently in the browser
  - Uses browser Supabase client to fetch user details (name, email, avatar)
  - Suspends while fetching; shows skeleton navbar until complete
  - Loads in parallel with page data—does not block calendar render

### Layer 3: Page Data Fetching (2-Tier Parallelization with Prop Passing)

**Homepage (/)** - Dual path:
```typescript
// Check auth without DB hit (fast)
const supabase = await createClient()
const { data } = await supabase.auth.getClaims()

if (!data?.claims) {
  // Unauthenticated → render landing page (TTFB: ~50-100ms)
  return <LandingPage />
}

// Authenticated → fetch user and family data (TTFB: ~1.2s)
const user = await getCachedUser()
const familyId = await checkUserFamilyContext(user.id)
if (!familyId) redirect('/onboarding')

// Pass familyId as prop to avoid redundant fetch
return <CalendarView userId={user.id} familyId={familyId} />
```

**CalendarView** - Parallel family data fetch (no familyId re-fetch):

```typescript
export async function CalendarView({ 
  userId, 
  familyId  // Passed from parent, no re-fetch
}: { 
  userId: User["id"]
  familyId: string
}) {
  // Parallel: both depend on familyId (already resolved)
  const [familyMembers, events] = await Promise.all([
    getFamilyMembers(familyId),  // ~100ms
    getEvents(familyId, ...)     // ~150ms
  ])
  
  return (
    <CalendarContainer
      events={formatEventResponse(events.data)}
      familyId={familyId}
      familyMembers={familyMembers}
      onWeekChange={fetchEventsByWeek}
    />
  )
}
```

**If no family:** `checkUserFamilyContext()` redirects to `/onboarding` before CalendarView is even instantiated (post-shell paint, better UX)

## Architecture Diagram

```
Unauthenticated User
  ↓
Request to / (NOT protected in proxy)
  ↓
Page component checks getClaims() (1ms) → no claims
  ↓
Render <LandingPage /> (50-100ms TTFB)


Authenticated User
  ↓
Request to / (NOT protected in proxy)
  ↓
Page component checks getClaims() (1ms) → claims exist
  ↓
Render sidebar shell (50-100ms) + layout
  ↓                       ↓
[Sidebar visible]    NavUser (client-side fetch in parallel)
  ↓
getCachedUser() (1ms, memoized)
  ↓
checkUserFamilyContext(userId) (150ms) ← blocks here, returns familyId
  ↓
Pass familyId to CalendarView as prop (no re-fetch)
  ↓
CalendarView parallelizes:
  ├─ getFamilyMembers(familyId) (100ms)
  └─ getEvents(familyId, ...) (150ms)
  ↓
Both complete in ~150ms
  ↓
Render calendar (1200-1500ms total TTFB)


Protected Route (/settings, /onboarding, /invite/*)
  ↓
Proxy checks getClaims() (1ms)
  ↓
No claims? → Redirect to /auth/login (10ms TTFB)
  ↓
Claims exist? → Continue to page component (same as authenticated flow above)
```

## Rationale

### Why separate auth verification from user identity?

**`getClaims()` (token signature check):**
- No database round-trip required
- Runs in ~1ms
- Sufficient to authorize access to the route
- Safe for cached responses behind CDN

**`getCachedUser()` / user identity:**
- Requires database round-trip (~150ms)
- Contains user-specific data (name, email, avatar)
- Not needed until NavUser component renders

**Result:** Sidebar paints 150ms earlier because we don't wait for database.

### Why is `/` unprotected in proxy but other routes protected?

**Homepage (`/`)** must render for unauthenticated users (landing page). If protected in proxy, they'd be redirected before the page component runs.

**Solution:** Homepage checks `getClaims()` in the page component (fast, no DB) to decide:
- No claims → render LandingPage (50-100ms TTFB)
- Claims exist → render CalendarView (1.2-1.5s TTFB)

**Other routes** (`/settings`, `/onboarding`, `/invite/*`) are protected in proxy so unauthenticated users get a fast redirect instead of waiting for a page component to run.

### Why defer NavUser to client-side?

User identity (name, email, avatar) is **not critical for initial paint**. The sidebar structure, navigation, and calendar are what matter first.

**Client-side rendering advantages:**
- Loads in parallel with page data (no blocking)
- Uses browser Supabase client (credential already present)
- Independent suspension boundary (doesn't block calendar)
- Better user experience: skeleton navbar → smooth transition when data arrives

**Trade-off:** Brief skeleton state before NavUser displays. Acceptable because:
- Sidebar structure is immediately visible
- User knows they're authenticated (sidebar visible)
- NavUser data appears in 200-300ms (imperceptible delay)

### Why pass familyId as prop instead of re-fetching in CalendarView?

`checkUserFamilyContext()` already resolves `familyId` in the parent component. Passing it as a prop:
- Eliminates redundant `checkUserFamilyContext()` call
- Makes data dependency explicit (props flow)
- Reduces TTFB by ~50ms (one fewer DB query)
- Improves code clarity: CalendarView receives what it needs, doesn't fetch duplicately

**Alternative (rejected):** CalendarView re-fetches familyId via `getUserFamilyMembership()`. This adds 50-100ms with no benefit.

### Why 2-tier parallelization?

`familyId` is **required by** both `getFamilyMembers()` and `getEvents()`. Dependencies must be resolved sequentially:

1. User identity (from auth)
2. Family membership (from user)
3. Family data (from family)

However, steps 2 and 3 can overlap:
- Step 1 → Step 2 (sequential: ~150ms)
- Step 2 → Step 3 (parallel for both: ~150ms total)
- **Total:** ~300ms data fetch time

Without parallelization (all sequential): ~450ms.

### Why upgrade @supabase/ssr to v0.10.0+?

Supabase SSR v0.10.0+ automatically sets critical cache headers (`Vary: Cookie`, `Cache-Control: private`) when handling token refresh in the proxy. This prevents **user credential mismatch** on deployments behind CDNs (Vercel Edge Functions, CloudFlare, etc.):

- **v0.9.0 (current):** Proxy refreshes tokens but doesn't set cache headers; different users may see cached pages with wrong credentials
- **v0.10.0+ (required):** Proxy automatically includes cache headers; CDN respects them, no credential leakage

**Current status:** Upgraded to @supabase/ssr@0.12.7 (latest as of 2026-09-21).

## Implementation Changes

| Component | Change | Timing Impact |
|-----------|--------|---|
| `package.json` / `pnpm-lock.yaml` | Upgrade `@supabase/ssr` to ≥0.10.0 (currently 0.12.7) | Fixes CDN cache header injection |
| `src/proxy.ts` | Use matcher array for protected routes: `/settings`, `/onboarding`, `/invite/*`; ensure `updateSession()` calls `getClaims()` (already does) | Auth redirect: ~10ms |
| `src/app/(frontend)/page.tsx` | Add `getClaims()` check for unauthenticated path; render LandingPage if no claims; parallelize family data fetch for authenticated path; **pass familyId prop to CalendarView** | Unauthenticated: 50-100ms; Authenticated: 1.2-1.5s |
| `src/components/calendar/calendar-container.client.tsx` or parent wrapper | Accept `familyId` as prop (no re-fetch) | Eliminates ~50ms DB call |
| `src/components/layout/authenticated-layout.tsx` | Remove `getCachedUser()` call; render sidebar immediately based on proxy-verified session | Sidebar paint: ~50-100ms |
| `src/components/nav-user.client.tsx` | Add `'use client'` directive; use browser Supabase client to fetch user details; independent Suspense boundary | NavUser: 200-300ms (parallel) |
| `src/lib/supabase/check-family.ts` | Modify to return `{ familyId: string; exists: boolean }` instead of boolean | Enables prop passing |
| `src/app/(frontend)/settings/page.tsx` | Call `getCachedUser()` for user data; use cached result | Settings render: ~1-50ms |
| `src/app/(frontend)/onboarding/page.tsx` | Call `getCachedUser()` for redirect logic | Onboarding render: ~1-50ms |

## Expected Outcomes

**Landing page (unauthenticated):** ~50-100ms TTFB
- Proxy auth check: ~1ms (route not protected, passes through)
- Page layout paint: ~50ms
- `getClaims()` check: ~1ms (no DB hit)
- Render `<LandingPage />`: ~50ms

**Calendar page (authenticated):** ~1.2-1.5s TTFB
- Proxy auth check: ~1ms
- Sidebar shell paint: ~50-100ms
- NavUser loads in parallel: 200-300ms
- `getCachedUser()`: ~1ms (memoized)
- `checkUserFamilyContext()`: ~150ms (returns familyId)
- `Promise.all([getFamilyMembers, getEvents])`: ~150ms (parallel, no re-fetch)
- Calendar renders: ~1.2-1.5s total

**Before:** ~4 seconds TTFB; ~20 API requests  
**After:** ~50-100ms landing page; ~1.2-1.5s authenticated app; ~8-9 API requests (two fewer DB calls eliminated)

**Vercel Analytics:** Expect reduction from ~20 API requests → ~8-9 API requests (eliminated redundant `getUser()` calls and `checkUserFamilyContext()` re-fetch).

**CDN Safety:** @supabase/ssr v0.12.7 automatically injects cache headers; credentials are never leaked to wrong users across CDN nodes.

## Trade-offs & Risks

### Accepted Trade-off: Skeleton NavUser

**What:** User navbar shows loading skeleton for 200-300ms before showing name/avatar.

**Why acceptable:**
- Sidebar structure is immediately visible (not a skeleton)
- User sees they're authenticated
- Data appears in imperceptible time

**Alternative rejected:** Keep NavUser server-rendered → blocks entire sidebar, 150ms+ slower.

### Risk: Auth Token Refresh

**Concern:** If proxy token is stale, NavUser browser client might get 401.

**Mitigation:**
- Proxy calls `getClaims()` on every request (refreshes token if needed)
- Browser client inherits fresh cookies from proxy response
- NavUser fallback on error: show logout prompt

### Risk: CDN Caching Leakage (MITIGATED by v0.10.0+)

**Concern:** Different users see cached pages from CDN, showing wrong data.

**Mitigation:**
- @supabase/ssr v0.10.0+ (now deployed as 0.12.7) automatically sets `Vary: Cookie` and `Cache-Control: private` headers
- Proxy verifies token with `getClaims()` and ensures fresh cookies
- NavUser loads client-side (always fresh, not cached)
- Page routes are all dynamic (no ISR), so never cached

### Risk: Homepage Shows Wrong Content Briefly

**Concern:** If `getClaims()` call fails or returns stale state, homepage might briefly show landing page when user is authenticated.

**Mitigation:**
- `getClaims()` is called synchronously during Server Component render (no race condition)
- Proxy token refresh happens before page component runs
- Browser session state is kept in sync via proxy cookies

## Alternatives Considered

### Alternative 1: Protect `/` in proxy
```typescript
// proxy.ts protects all routes including /
matcher: ["/((?!auth).*)", "/invite/*"]
```
**Problem:** Unauthenticated users get redirected before LandingPage renders; slower TTFB for landing page (~10ms redirect vs. ~100ms page load). Also violates DRY—must maintain route list in both proxy and page components.

### Alternative 2: Fetch everything server-side, parallelize all
```typescript
const [user, familyId, members, events] = await Promise.all([
  getCachedUser(),
  checkUserFamilyContext(...),  // ERROR: needs userId
  getFamilyMembers(...),         // ERROR: needs familyId
  getEvents(...)                 // ERROR: needs familyId
])
```
**Problem:** Dependencies can't be parallelized—would fail at runtime or require circular logic.

### Alternative 3: Keep NavUser server-rendered
```typescript
// authenticated-layout.tsx
const user = await getCachedUser()
return <NavUser user={user} />
```
**Problem:** Sidebar blocked on 150ms DB hit; TTFB remains 4s. No improvement.

### Alternative 4: Re-fetch familyId in CalendarView
```typescript
// CalendarView
const familyId = await getUserFamilyMembership(userId)
```
**Problem:** Redundant DB call (~50-100ms); familyId already resolved by parent. Adds ~50ms to TTFB with no benefit.

### Alternative 5: Use middleware instead of proxy
**Problem:** Next.js middleware can't handle cookie refresh properly; proxy.ts is the documented pattern.

### Alternative 6: Use @supabase/ssr v0.9.0 (current)
**Problem:** No automatic cache headers; CDN may leak user credentials across sessions. Must manually add cache headers to proxy responses (error-prone).

## Decision Criteria Met

✅ **Hard to reverse:** Affects auth flow, component structure, data fetching pattern across entire app; moving data fetching to client, changing route protection, and aligning prop flow requires rearchitecting.  
✅ **Surprising without context:** TTFB optimization strategy isn't obvious; sidebar-first rendering with deferred user identity needs documentation to justify.  
✅ **Result of real trade-off:** Sidebar-first with skeleton NavUser and prop-passed data (fastest) vs. user-identity-first (slower, more traditional).

## Implementation Checklist

- [x] Upgrade `@supabase/ssr` to ≥0.10.0 (currently 0.12.7)
- [ ] Update `src/proxy.ts` matcher to protect `/settings`, `/onboarding`, `/invite/*` (not `/`)
- [ ] Update `src/app/(frontend)/page.tsx` to add `getClaims()` check for unauthenticated path
- [ ] Pass `familyId` prop from Home to CalendarView component
- [ ] Remove `getCachedUser()` from authenticated-layout.tsx
- [ ] Refactor nav-user.client.tsx to fetch data client-side
- [ ] Update `checkUserFamilyContext()` to return `{ familyId, exists }`
- [ ] Remove familyId re-fetch logic from CalendarView (now accepts as prop)
- [ ] Update settings & onboarding pages to use cached user
- [ ] Test: Measure TTFB with DevTools (target: 50-100ms landing page; 1.2-1.5s authenticated)
- [ ] Test: Verify auth redirects work (unauthenticated protected routes → login, no-family → onboarding)
- [ ] Test: Verify NavUser skeleton → data transition is smooth
- [ ] Test: Verify landing page renders for unauthenticated users
- [ ] Test: Verify CDN caching headers are set (Chrome DevTools Network tab → Response Headers → check Vary, Cache-Control)
- [ ] Deploy and monitor Vercel Analytics (API request reduction)
