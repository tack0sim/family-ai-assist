# Responsive Week Grid: Viewport-Based Column Strategy

The week grid renders all 7 days always, with viewport-based display widths and snap-scrolling for horizontal navigation. Mobile shows 2 days in viewport (50vw each), tablet shows 5 days in viewport (20vw each, Mon-Fri initially but can scroll to Sat/Sun), and desktop shows all 7 days (flex-1 distribution). Horizontally scrolling reveals the remaining days. Week boundaries are enforced by week navigation buttons—scrolling does not cross Monday/Sunday edges.

## Rationale

**Why render all 7 days always (not filtered)?** Filtering days from the DOM on tablet (hiding Sat/Sun) creates a UX gap—users can't scroll to them. Rendering all 7 days and controlling viewport width via column width (`50vw` on mobile, `20vw` on tablet, `flex-1` on desktop) gives users intuitive free-flow scrolling within the week.

**Why viewport-based column widths (50vw/20vw/flex-1)?**
- Mobile: `50vw` per day ensures exactly 2 days fit in viewport (50vw + 50vw = 100vw)
- Tablet: `20vw` per day ensures exactly 5 days fit in viewport (5 × 20vw = 100vw), with Sat/Sun accessible via scroll
- Desktop: `flex-1` distributes 7 days evenly across viewport, each ~14.3vw

Progressive disclosure maximizes readability at each device size. Mobile needs large, readable EventCards in a constrained viewport; tablets gain more breathing room with 5 days visible initially; desktops show the full week at once. This reduces cognitive load and improves tap-target sizing on mobile while keeping desktop users from needing horizontal scroll most of the time.

**Why snap-scrolling?** Snap-scrolling would align day columns to viewport edges when scroll stops, preventing awkward half-visible columns. However, snap-scrolling conflicts with absolutely positioned EventCards in the current implementation and is deferred for v2. Free-flow scrolling provides intuitive navigation for now.

## Status: v1 (Snap-scrolling deferred to v2)

**Why defer week boundary enforcement to buttons, not scroll?** Allowing seamless scroll across Mon/Sun edges creates confusion about which week you're viewing. Hard boundaries (via week navigation buttons) make it explicit: scrolling stops at Sunday, click "next week" to navigate to the next Monday.

**Why all days are scrollable on tablet (not just Mon-Fri)?** Users expect to access Sat/Sun if they exist in the current week. Starting with Mon-Fri visible (20vw × 5 = 100vw) but allowing scroll to reveal Sat/Sun provides a natural progressive disclosure: most common weekday usage without requiring navigation.

## Consequences

- **EventCard styling adapts per viewport** (larger padding/text on mobile for readability; more compact on desktop)
- **Week navigation always resets scroll to day 1** of the new week (predictable but not context-preserving)
- **Day column width is fixed per breakpoint**:
  - Mobile: 50vw (shows 2 days, scroll for more)
  - Tablet: 20vw (shows 5 days, scroll for Sat/Sun)
  - Desktop: flex-1 (shows all 7 days)
- **Breakpoints**:
  - Mobile: < 640px (sm)
  - Tablet: 640px-1024px (sm-lg)
  - Desktop: ≥ 1024px (lg)
- **Snap-scrolling uses inline styles** (`scrollSnapType` and `scrollSnapAlign`) rather than Tailwind classes for precise control
- **All 7 days are always rendered in the DOM**; visibility is controlled by container overflow and day column widths, not conditional rendering
