# Family Calendar & Assistant App — v1 PRD

**Document Version**: 1.0  
**Last Updated**: 2026-06-19  
**Status**: Ready for Development  
**Source**: Notion - Family AI Assistant App

---

## Executive Summary

The **Family Calendar & Assistant App** is a full-stack web application designed to help families stay connected and organized. It provides a shared calendar system where family members can coordinate schedules, an intelligent AI assistant that understands family context, and secure file sharing. The app targets modern families seeking a unified platform to manage shared activities, communicate asynchronously via AI, and maintain a central repository of family documents and photos.

**Target Launch**: v1 release with core calendar, authentication, and AI assistant features.

---

## Problem Statement & Opportunity

**Problem**:
- Families struggle to maintain a single source of truth for shared schedules and events
- Existing calendar solutions (Google Calendar, Outlook) are individual-centric and lack family context
- Coordinating family activities requires multiple tools and manual communication
- AI assistants today don't understand family dynamics, preferences, or upcoming events
- No unified platform combines scheduling, communication, and file sharing for families

**Opportunity**:
- Build a privacy-first platform that brings families closer through better coordination
- Leverage AI to proactively help families plan, organize, and manage shared responsibilities
- Create a safe space for family data (calendar, files, preferences) without third-party exposure

---

## User Personas & Use Cases

### Primary Users

1. **Family Admin** (age 35–55)
   - Typically a parent who initiates the family group
   - Manages family settings, invites members, handles onboarding
   - Uses the calendar to coordinate childcare, appointments, and family events
   - Asks the AI for help planning birthday parties, vacation trips, and weekly schedules

2. **Family Member** (age 12–50)
   - Parent, teenager, or adult child in the family group
   - Views and updates shared calendar events
   - Asks the AI for reminders, suggestions, and family-specific advice
   - Uploads documents, photos, and files related to family events

### Use Cases

- **Mom creates a family → invites Dad and two teenage kids** via email; they accept and join
- **Dad creates a "Soccer Tournament" event** on the calendar; Mom and kids see it in real-time
- **Teenager asks the AI**: "What's planned for my birthday week?" → AI pulls upcoming events and suggests ideas
- **Family admin uploads** scanned family recipes, photo albums, trip itineraries to shared storage
- **Mom asks AI to help plan** a surprise anniversary party → AI suggests dates based on family calendar gaps
- **Multiple family members update calendar simultaneously** → all see changes without refresh

---

## Product Goals & Success Metrics

### Q1–Q2 v1 Goals
1. **Achieve 100% functional parity** with the v1 architecture plan
2. **Ensure zero unauthorized data access** (all features protected by family RLS)
3. **Support real-time sync** across up to 10 family members without latency >1s
4. **Deliver delightful onboarding** — from signup to first event creation in <5 minutes
5. **Establish foundation for AI context** — calendar and family data properly indexed and queryable

### Success Metrics
- **Time to First Event**: <5 min (from signup to creating a calendar event)
- **Real-time Sync Latency**: <1000ms for all members (p95)
- **Calendar Load Time**: <1s (initial load + filtering)
- **Auth Completion Rate**: >90% (email + OAuth combined)
- **Onboarding Completion**: >85% (sign up → create/join family)
- **AI Response Latency**: <3s (p95) for typical requests
- **Rate Limit Compliance**: 20 requests/hour per user (no complaints about restrictiveness in beta)

---

## Feature Specification

### Feature 1: Authentication & Identity

**Requirement**: Users sign up, log in, and create profiles with privacy safeguards.

**User Stories**:
- As a new user, I can sign up with Google or email/password and create my profile
- As a user, I can log out and my session is invalidated immediately
- As a returning user, I can log in securely without re-entering credentials each session
- As a user, I can update my display name and avatar

**Acceptance Criteria**:
- [ ] Google OAuth login completes and stores user profile in DB (< 2 sec)
- [ ] Email/password signup with server-side validation (min 8 chars, complexity rules)
- [ ] Invalid login attempts show user-friendly error (max 3 attempts in 10 min = 10 min lockout)
- [ ] Session token refreshes transparently without logout
- [ ] Logout clears session immediately; back button does not return to protected routes
- [ ] Avatar uploads < 2 MB, stored in Supabase Storage, lazy-loaded on UI
- [ ] Passwords hashed via bcrypt (min 10 rounds)

---

### Feature 2: Family Model & Onboarding

**Requirement**: Users create or join families; admins manage membership via invitations.

**User Stories**:
- As a new user, after signing up, I see an onboarding screen to create or join a family
- As a family admin, I can create a family and be set as the initial admin
- As a family admin, I can invite family members by email; they receive a link valid for 7 days
- As an invited user, I can accept an invitation to join a family (requires login)
- As a family admin, I can see pending invitations and resend or revoke them
- As a family member, I can see all family members and their roles

**Acceptance Criteria**:
- [ ] Onboarding gate: new sessions without active family_members row redirect to `/onboarding`
- [ ] Creating a family auto-sets user as admin and creates active family_members row
- [ ] Invitations send email with 7-day expiry token; expired tokens show error on accept
- [ ] Accepting invitation creates pending family_members row, sent daily digest to admins for approval
- [ ] Admin can promote member to admin or remove member entirely
- [ ] Family name and admin settings editable only by admin
- [ ] Removed members lose access to all family data immediately (RLS enforced)

---

### Feature 3: Calendar & Events

**Requirement**: Family members view, create, and manage a shared calendar with real-time sync.

**User Stories**:
- As a family member, I see a calendar showing all events for my family
- As a user, I can create an event with title, time, type (event/appointment/reminder/deadline), assigned members, and tags
- As a user, I can edit or delete my own events; admins can edit any event
- As a user, I can filter events by type, assigned member, or tag
- As a user, I see events update in real-time when other family members create/edit/delete
- As a user, I can view events in multiple views: month, week, day, list

**Acceptance Criteria**:
- [ ] Calendar loads initial week of events in <1s (Redis cache hit or DB fallback)
- [ ] Creating/editing/deleting event invalidates Redis cache and triggers Realtime broadcast
- [ ] Event form validates dates (end_at > start_at), title required, max 255 chars
- [ ] All_day events render differently than timed events
- [ ] Visibility toggle (family/personal) visible to creator; personal events hidden from non-admin
- [ ] Color tags display as visual identifiers (event type → color mapping)
- [ ] Pagination/infinite scroll for month view with >50 events
- [ ] Recurring events (v1): store RRULE string only; no instance editing
- [ ] Recurrence expansion to instances deferred to v2

---

### Feature 4: AI Assistant

**Requirement**: Context-aware AI that understands family structure, calendars, and provides helpful suggestions.

**User Stories**:
- As a user, I can chat with an AI assistant in a dedicated `/chat` page
- As a user, I can ask the AI to help plan events, suggest schedules, answer family questions
- As a user, I see previous conversation history (last 20 messages) in the chat UI
- As a user, my chat requests are rate-limited to 20/hour to prevent abuse
- As a user, I see a 429 error with Retry-After header if I exceed rate limit
- As a user, I see suggested starter prompts: "Plan a birthday party", "Weekly schedule", "Event ideas"

**Acceptance Criteria**:
- [ ] Chat POST request includes Supabase session verification; unauthenticated requests rejected
- [ ] System prompt includes current user name, family name, family member count, and next 7 days of events
- [ ] AI responses stream to client via Server-Sent Events (no chunky waits)
- [ ] Chat history persists: last 20 messages loaded on `/chat` page load
- [ ] Each message pair (user + assistant) stored in chat_messages table
- [ ] Rate limiter uses Redis sliding window; returns 429 + Retry-After on excess
- [ ] Suggested prompts show on first visit; disappear after first real message
- [ ] Chat clearing deletes all messages for user in that family (optional feature v1)

---

### Feature 5: File Storage & Sharing

**Requirement**: Secure family file repository for documents, photos, and shared resources.

**User Stories**:
- As a user, I can upload files (images, PDFs, Office docs) up to 50 MB each
- As a user, I can see all uploaded files organized by uploader and date
- As a user, I can download files with a secure, time-limited link (1 min)
- As a user, I can optionally link a file to an event (e.g., party photos → birthday event)
- As a family member, I can see files uploaded by other members (no cross-family visibility)
- As an admin, I can delete any file; others can delete only their own

**Acceptance Criteria**:
- [ ] Upload directly to Supabase Storage; client validates MIME type and size before upload
- [ ] Server-side validation: MIME whitelist (image/*, application/pdf, Office types), max 50 MB
- [ ] Files stored at path `{family_id}/{file_id}/{original_filename}`
- [ ] Storage RLS enforced: read/write only for active family_members
- [ ] Download generates short-lived signed URL (60s TTL) to prevent link sharing
- [ ] File metadata (name, size, uploader, upload date, optional event_id) stored in files table
- [ ] Deleted files: remove from storage first; DB cleanup via cascade
- [ ] Orphaned files (user deleted) handled gracefully; no 404 on old download links
- [ ] Grid and list view toggle for file browser
- [ ] Filter by uploader, date range, linked event

---

### Feature 6: Family Settings & Profile Management

**Requirement**: Users manage profiles and admins manage family membership and settings.

**User Stories**:
- As a user, I can update my display name and profile picture
- As a user, I can see which OAuth providers I'm connected to
- As a family admin, I can view and manage all family members
- As a family admin, I can change another member's role (admin/member)
- As a family admin, I can remove a member from the family
- As a user, I see a sidebar with all app navigation (calendar, chat, files, settings)

**Acceptance Criteria**:
- [ ] Profile page allows display_name and avatar_url updates
- [ ] Profile picture uploads < 2 MB, stored in public Supabase Storage bucket
- [ ] Family settings page shows member list with role badges
- [ ] Admin can promote member (role = 'admin') or demote (role = 'member')
- [ ] Admin removal of member triggers RLS cascade; user loses access instantly
- [ ] Pending invitations shown to admin with resend/revoke buttons
- [ ] Sidebar responsive: desktop sidebar, mobile hamburger menu (Sheet)
- [ ] Active navigation item highlighted
- [ ] Mobile layout: sidebar collapses, touch-friendly menu icon

---

### Feature 7: Real-time Synchronization

**Requirement**: All family members see live updates when events, chat, or files change.

**User Stories**:
- As a user, when a family member creates an event, I see it on my calendar without refreshing
- As a user, when an event is edited, I see the change immediately
- As a user, when an event is deleted, it disappears from my calendar instantly
- As a user, when another member uploads a file, I see it in the files list immediately

**Acceptance Criteria**:
- [ ] Supabase Realtime subscribed on mount to `events:family_id=eq.{familyId}`
- [ ] INSERT event → append to local state (no re-fetch)
- [ ] UPDATE event → find by id and replace in local state
- [ ] DELETE event → remove matching id from local state
- [ ] Broadcast latency <1s (p95) across all browser clients
- [ ] Reconnection on network hiccup: auto-resubscribe and sync state
- [ ] Conflict resolution: server-side wins (RLS enforces single source of truth)

---

## User Experience (UX) Design Principles

1. **Speed & Responsiveness**: All interactions should feel instant (<500ms for local actions, <1s for server roundtrips)
2. **Clarity**: Intuitive navigation; form errors explained in plain language
3. **Privacy**: Users understand what data is shared within family; visual indicators for personal vs. family visibility
4. **Accessibility**: WCAG 2.1 AA compliance; semantic HTML; color not sole indicator of status
5. **Mobile-First**: Responsive design; touch-friendly buttons and forms
6. **Onboarding**: New users reach "first event" in <5 minutes; no complex setup

---

## Technical Architecture & Implementation Plan

### Tech Stack Rationale

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend & Backend | Next.js (App Router, Server Actions, RSC) | Unified TypeScript, serverless deployment, built-in auth support |
| Database & Auth | Supabase (PostgreSQL + Auth) | Open-source, built-in RLS for multi-tenancy, real-time support |
| Real-time | Supabase Realtime | Native WebSocket support, tight DB integration |
| File Storage | Supabase Storage | Same provider, RLS-enforced access control, signed URLs |
| Caching | Redis (ioredis) | In-memory caching for calendar queries, rate limiting |
| Validation | Zod | TypeScript-first, compile-time safety, shared server/client schemas |
| UI | shadcn/ui + Tailwind | Component-driven, customizable, accessibility-first |
| Calendar | FullCalendar | Feature-rich, accessible, multiple view modes |
| AI | Vercel AI SDK | Provider-agnostic (swap OpenAI, Claude, etc. without code changes) |

### Implementation Phases

#### Phase 1: Foundation & Auth (Week 1–2)
- Project setup (Next.js, TypeScript, shadcn/ui)
- Supabase project creation and configuration
- Google OAuth + Email/password authentication
- User profile creation and management
- Session middleware and route protection
- Database schema: `profiles`, `families`, `family_members`, `invitations`
- RLS policies for auth
- Onboarding flow (create or join family)

**Deliverables**: Users can sign up, log in, create/join families, and manage profiles.

#### Phase 2: Calendar (Week 3–4)
- Events schema and migrations
- Create/read/update/delete event Server Actions with Zod validation
- Calendar UI with FullCalendar (month, week, day, list views)
- Event filtering (type, assignee, tag)
- Real-time sync via Supabase Realtime subscriptions
- Redis caching for calendar reads (TTL: 5 min, keyed by family + week)
- Event visibility (family/personal)
- Recurring event storage (RRULE string, no instance editing)

**Deliverables**: Fully functional shared calendar with real-time sync and filtering.

#### Phase 3: AI Assistant (Week 5–6)
- Chat API route with Vercel AI SDK streaming
- Chat history schema and storage
- System prompt with family context and event data
- Rate limiter (20 req/hour per user)
- Chat UI with history and suggested prompts
- Streaming responses (useChat hook)

**Deliverables**: Context-aware AI assistant that understands family events and provides suggestions.

#### Phase 4: File Storage (Week 7–8)
- Supabase Storage bucket setup and RLS
- Files schema and migrations
- Upload flow (client → Storage, register metadata)
- File validation (MIME type, size)
- Download with signed URLs (60s TTL)
- File browser UI (grid/list, filter by uploader/date/event)
- Delete permissions (owner or admin)

**Deliverables**: Secure family file repository with easy sharing.

#### Phase 5: Polish & Deployment (Week 9–10)
- Layout & navigation (sidebar, mobile drawer)
- Family settings (member management, invitations)
- Profile settings
- Error and loading states (error.tsx, loading.tsx)
- Form validation and user feedback (react-hook-form, Sonner toasts)
- Accessibility audit and fixes
- Performance optimization (bundle size, image optimization)
- Staging and production deployment
- Monitoring (error tracking, performance)

**Deliverables**: Production-ready application deployed to Vercel + Supabase.

---

## Success Criteria & Acceptance

### v1 Launch Checklist

#### Implementation Specifications

**Database Schema — Family Model**
**Profiles Table**
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
```

**Families Table**
```sql
CREATE TABLE families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

**Family Members Table**
```sql
CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  status text CHECK (status IN ('pending', 'active')) DEFAULT 'pending',
  joined_at timestamptz,
  UNIQUE (family_id, user_id)
);
```

**Invitations Table**
```sql
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  email text NOT NULL,
  token uuid UNIQUE DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES profiles(id),
  expires_at timestamptz NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending'
);
```

**Events Table**
```sql
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('event', 'appointment', 'reminder', 'deadline')),
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean DEFAULT false,
  color text,
  recurrence_rule text,
  visibility text CHECK (visibility IN ('family', 'personal')) DEFAULT 'family',
  assigned_to uuid[],
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Chat Messages Table**
```sql
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user', 'assistant')) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Files Table**
```sql
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES profiles(id),
  name text NOT NULL,
  storage_path text NOT NULL,
  size bigint NOT NULL,
  mime_type text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
```

**RLS (Row-Level Security) Policies**

| Table | Policy |
|-------|--------|
| `profiles` | Users can SELECT and UPDATE their own row only |
| `families` | SELECT by active family members; UPDATE by admin only |
| `family_members` | SELECT by family members; INSERT/UPDATE via service role only |
| `invitations` | SELECT where email matches JWT; INSERT by admin; service role for updates |
| `events` | SELECT by active family members; INSERT/UPDATE/DELETE by creator or admin |
| `chat_messages` | SELECT by user and active family members; INSERT by user only |
| `files` | SELECT by active family members; INSERT by user; DELETE by owner or admin |

---

## Data & API Layer Specification

---

## Constraints & Assumptions

### Assumptions
- Users have stable internet connection; offline mode deferred to v2 (PWA)
- Family size <50 members (scalable; no hard technical limit)
- Average calendar size <200 events per family per month
- File storage per family <1 GB in v1 (soft limit, enforced via UX)
- AI requests are conversational (not production workloads like batch exports)

### Constraints
- **Rate Limiting**: Max 20 AI requests/hour per user (prevents abuse, accommodates normal usage)
- **File Size**: Max 50 MB per file (balances UX and storage costs)
- **Invitation Expiry**: 7 days (standard practice; users lose access if they don't act)
- **Real-time Subscriptions**: Limited to 10 concurrent connections per family (Supabase default; scalable)
- **Recurring Events**: v1 stores RRULE only; instance expansion deferred to v2
- **Chat History**: Last 20 messages loaded (prevents large initial payloads; scroll/pagination optional v2)

### Security & Privacy
- All user-created data is private to the family group (enforced by RLS)
- Personal events visible only to creator and admins
- Passwords hashed with bcrypt (min 10 rounds)
- OAuth tokens handled by Supabase Auth (no token storage in app)
- File downloads require time-limited signed URLs (60s TTL)
- No cross-family data leakage (RLS audit required pre-launch)

---

## Out of Scope — v1

The following features are deferred to v2+:
- **Push notifications** for upcoming events or reminders
- **Email reminders** for events (can use Resend or Supabase Edge Functions)
- **iCal import/export** (manual upload deferred; calendar feed deferred)
- **Recurring event instance editing** (v1 stores RRULE string only)
- **AI memory & personalization** (context only includes next 7 days)
- **Multiple family memberships** per user (1:1 family assignment in v1)
- **PWA / mobile app** (responsive web app only; native app deferred)
- **Audit log / event history** (no change tracking)
- **Role-based permissions** beyond admin/member (custom roles deferred)
- **Chat image/file uploads** (text-only chat in v1)
- **Integrations** with Google Calendar, Outlook, Slack (v2+)
- **Advanced analytics** (family activity reports, usage insights)

---

## Future Roadmap — v2+

### v2 Planned Features
- **Notifications System**: Email reminders for upcoming events; browser push notifications; SMS alerts
- **Recurring Event Expansion**: Materialize recurrence rules into instances; support "edit this event" vs "edit all" pattern
- **AI Memory & Personalization**: Persist family preferences and context as vector embeddings; semantic retrieval for better suggestions
- **iCal Sync**: Export family calendar as `.ics` feed; import external calendars (Google, Outlook)
- **PWA & Offline Support**: Install app to home screen; read calendar offline; sync on reconnect
- **Multiple Family Memberships**: Allow users to belong to multiple families; family switcher in UI
- **Advanced Chat Features**: Image/file uploads in chat; conversation search; conversation export
- **Team Collaboration**: Shared tasks/checklists; polling and voting; event RSVP system
- **Marketplace Integrations**: Link tickets (sports, concerts); restaurant reservations; travel itineraries

---

## Rollout & Launch Strategy

### Pre-Launch (Week -2 to Launch)
1. **Beta Testing** (1 week): Internal team + 10–20 friends/family
   - Validation: All features work end-to-end
   - Feedback: Onboarding UX, calendar UI, AI responses
2. **Security Audit** (1 week): RLS policy review, auth flow validation, data access tests
3. **Load Testing**: Calendar with 100+ events, file uploads, concurrent chat requests
4. **Monitoring Setup**: Error tracking (Sentry), performance monitoring (Vercel Analytics)

### Launch
- **Launch Targets**:
  - **Soft Launch**: Internal team + beta testers (day 1)
  - **Public Launch**: Announcement on Product Hunt, Twitter, relevant communities (week 2)
- **Post-Launch Support**: Daily check-ins; rapid bug fixes; user feedback loop

### 30-Day Post-Launch
- Monitor key metrics (session duration, feature adoption, error rates)
- Fix critical bugs within 24 hours
- Iterate on onboarding based on user feedback
- Plan v1.1 (minor polish) and v2 roadmap

---

## Metrics & KPIs

### Success Metrics (v1)
- **Activation Rate**: % of signups that create a calendar event within 7 days → Target: >70%
- **Retention Rate**: % of DAU in week 2 / DAU in week 1 → Target: >60%
- **Feature Adoption**: % of users using calendar, AI chat, files within 30 days → Target: >80%, >40%, >30%
- **Session Duration**: Average time per session → Target: >10 min
- **Error Rate**: % of requests resulting in 5xx errors → Target: <0.1%
- **Time to First Event**: Average time from signup to first event creation → Target: <5 min
- **Real-time Latency**: p95 latency for calendar updates → Target: <1s
- **API Response Time**: p95 for all endpoints → Target: <500ms

### Infrastructure Metrics
- **Database**: Query latency p95, connection pool usage, storage growth
- **Redis**: Cache hit rate for calendar queries, memory usage
- **Supabase Realtime**: Active subscriptions, message latency
- **File Storage**: Total bytes, upload/download throughput

---

## Dependencies & Stakeholders

### Internal Team
- **Frontend Engineer**: UI/UX implementation, client-side caching, Realtime integration
- **Backend Engineer**: API routes, auth flow, data validation, RLS policies
- **DevOps**: Infrastructure setup (Supabase, Vercel, Redis), monitoring, deployment
- **Product Manager**: Feature prioritization, roadmap, user feedback synthesis
- **QA**: Test plan, edge case validation, cross-browser testing

### External Dependencies
- **Supabase**: PostgreSQL hosting, Auth, Realtime, Storage
- **Vercel**: Next.js hosting, serverless functions, analytics
- **Redis Cloud** (or self-hosted): Caching, rate limiting
- **Resend or SendGrid**: Email invitations
- **Vercel AI SDK + LLM Provider**: OpenAI, Anthropic, or custom model

---

## Appendix: Reference & Glossary

### Key Terms
- **RLS**: Row-Level Security — PostgreSQL feature that filters data per user/role
- **Server Action**: Next.js 13+ feature for server-side mutations (form submission, cache invalidation)
- **RSC**: React Server Component — renders on server, sends HTML to client
- **RRULE**: iCalendar format for specifying recurrence (RFC 5545)
- **PostgREST**: Auto-generated REST API from PostgreSQL (Supabase feature)
- **RPC**: Remote Procedure Call — stored procedure in PostgreSQL, callable via Supabase
- **Realtime**: WebSocket-based live subscriptions (Supabase Realtime)

### File Structure (for reference during implementation)
```
app/
├── (auth)/
│   ├── auth/callback/route.ts       # OAuth callback + session exchange
│   └── login/page.tsx               # Login page
├── (app)/
│   ├── layout.tsx                   # Root layout with sidebar/header
│   ├── calendar/page.tsx            # Calendar UI
│   ├── chat/page.tsx                # AI chat UI
│   ├── files/page.tsx               # File browser
│   ├── family/page.tsx              # Family settings
│   └── profile/page.tsx             # Profile settings
├── api/
│   └── chat/route.ts                # AI streaming endpoint
└── onboarding/page.tsx              # Onboarding flow

lib/
├── supabase/
│   ├── server.ts                    # Server client factory
│   └── client.ts                    # Browser client factory
├── redis.ts                         # Redis singleton
├── rate-limit.ts                    # Rate limiter
└── validations/
    ├── event.ts, file.ts, invitation.ts

actions/
├── events.ts                        # Event mutations
├── family.ts                        # Family mutations
└── files.ts                         # File mutations

supabase/migrations/
├── 0001_profiles.sql
├── 0002_families.sql
├── 0003_events.sql
├── 0004_chat_messages.sql
├── 0005_files.sql
└── 0006_rpc_get_family_events.sql
```

---

## Approval & Sign-Off

**Document Owner**: Product Manager  
**Last Reviewed**: 2026-06-19  
**Status**: Ready for Development ✅

**Stakeholder Approval**:
- [ ] Product Manager: Confirms feature scope and prioritization
- [ ] Technical Lead: Confirms architecture and feasibility
- [ ] Design Lead: Confirms UX/UI alignment
- [ ] Security Lead: Confirms data security and privacy measures

---

**PRD Compiled From**: Notion - Family AI Assistant App (imported 2026-06-19)  
**Source URL**: https://app.notion.com/p/32d9995db27080fc8be8ea6a2ad33868
