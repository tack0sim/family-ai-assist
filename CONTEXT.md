# Family Calendar & Assistant

A privacy-first platform for families to coordinate schedules, communicate via AI assistant, and share files in a secure shared space.

## Language

### Identity & Membership

**Profile**:
The user's identity record containing display name and avatar, tied 1:1 to their auth account.
_Avoid_: User, account, person

**Family**:
A named group that shares calendar events, files, and AI context. Created by one profile and joined by others.
_Avoid_: Group, household, team, space

**Family Member**:
A profile's membership in a specific family, with a role (admin or member) and status (pending or active).
_Avoid_: Membership, participant, user

**Invitation**:
A time-limited token sent to an email address, allowing the recipient to request membership in a family.
_Avoid_: Invite, join request, access token

**Admin**:
A family member with role='admin' who can manage membership, edit any event, and delete any file.
_Avoid_: Owner, moderator, manager

**Member**:
A family member with role='member' who can view shared content, create events, and manage their own uploads.
_Avoid_: Regular user, participant

### Calendar & Events

**Event**:
A scheduled occurrence on the family calendar with title, time range, type, and optional assignments.
_Avoid_: Appointment, calendar item, activity

**Event Type**:
One of: event, appointment, reminder, or deadline. Affects visual presentation and filtering.
_Avoid_: Category, kind

**Assignment**:
The linking of an event to specific family members who are involved or responsible.
_Avoid_: Attendee, participant, assignee

**Tag**:
A label attached to events for filtering and categorization (e.g., "medical", "school", "vacation").
_Avoid_: Label, category

**Visibility**:
Whether an event is visible to the entire family or only to its creator and admins. Values: family or personal.
_Avoid_: Privacy, access level, scope

**Recurrence**:
An RRULE string defining how an event repeats over time. v1 stores the rule but does not expand to instances.
_Avoid_: Repeat, series, pattern

**Week Grid**:
The responsive calendar layout rendering all 7 days horizontally in a scrollable container. Day column width varies by viewport breakpoint: 50vw on mobile (2 days visible), 20vw on tablet (5 days visible), and flex-1 on desktop (7 days visible). Snap-scrolling aligns columns when scroll stops.
_Avoid_: Calendar view, week view, calendar grid

**Day Column**:
A vertical column representing a single day, containing all-day events at the top and 24 hourly time slots below.
_Avoid_: Day view, day card

**Scroll Window**:
The visible portion of the week grid at any moment. Constrained by viewport width and day column width per breakpoint (50vw mobile, 20vw tablet, flex-1 desktop).
_Avoid_: Viewport, visible area

**Week Boundary**:
The implicit hard limit at Monday (start) and Sunday (end) of the current week. Enforced by week navigation buttons—users cannot scroll beyond these boundaries; must navigate to adjacent weeks via UI.
_Avoid_: Edge, limit, constraint

**Snap Scrolling**:
Horizontal scroll behavior that would align day columns to viewport edges when scrolling stops. Currently deferred to v2 due to conflicts with absolutely positioned EventCards. Free-flow scrolling provides intuitive navigation for v1.
_Avoid_: Snap points, scroll locking

### AI & Communication

**Chat Message**:
A single user or assistant message in the AI conversation, stored with family context.
_Avoid_: Message, prompt, response

**Chat History**:
The last 20 messages between a user and the AI assistant within a family context.
_Avoid_: Conversation, thread

**System Prompt**:
The context injected into AI requests, including family name, member count, and upcoming events.
_Avoid_: Context, AI prompt, instructions

**Rate Limit**:
A sliding window constraint of 20 AI requests per hour per user, enforced via Redis.
_Avoid_: Throttle, quota, limit

### Files & Storage

**File**:
An uploaded document, image, or resource stored in family storage and optionally linked to an event.
_Avoid_: Document, attachment, resource

**File Metadata**:
The database record tracking file name, size, uploader, upload date, and optional event link.
_Avoid_: File info, file record

**Signed URL**:
A time-limited (60-second) download link generated on-demand to prevent unauthorized sharing.
_Avoid_: Download link, access URL, presigned URL

### Access & Security

**RLS** (Row-Level Security):
Supabase's enforcement of access rules at the database level, ensuring family data isolation.
_Avoid_: Access control, permissions, policy

**Active Membership**:
A family_members row with status='active', granting full access to that family's data.
_Avoid_: Active user, membership, access

**Session**:
A Supabase auth session tied to a profile, automatically refreshed until logout.
_Avoid_: Login session, auth token, user session

