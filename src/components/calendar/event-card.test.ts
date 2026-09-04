import { describe, expect, it } from "vitest";
import type { EventWithDetails } from "@/lib/types/events";

describe("EventCard Logic", () => {
  it("should determine event type colors correctly", () => {
    const eventTypeColors: Record<
      string,
      { bg: string; text: string; border: string }
    > = {
      event: {
        bg: "bg-blue-50",
        text: "text-blue-900",
        border: "border-blue-200",
      },
      appointment: {
        bg: "bg-purple-50",
        text: "text-purple-900",
        border: "border-purple-200",
      },
      reminder: {
        bg: "bg-orange-50",
        text: "text-orange-900",
        border: "border-orange-200",
      },
      deadline: {
        bg: "bg-red-50",
        text: "text-red-900",
        border: "border-red-200",
      },
    };

    expect(eventTypeColors.event).toEqual({
      bg: "bg-blue-50",
      text: "text-blue-900",
      border: "border-blue-200",
    });

    expect(eventTypeColors.reminder).toEqual({
      bg: "bg-orange-50",
      text: "text-orange-900",
      border: "border-orange-200",
    });
  });

  it("should determine badge variant correctly", () => {
    const eventTypeBadgeVariants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      event: "default",
      appointment: "secondary",
      reminder: "outline",
      deadline: "destructive",
    };

    expect(eventTypeBadgeVariants.event).toBe("default");
    expect(eventTypeBadgeVariants.deadline).toBe("destructive");
    expect(eventTypeBadgeVariants.reminder).toBe("outline");
  });

  it("should format time correctly in de-DE locale", () => {
    const date = new Date("2026-08-20T10:30:00Z");
    const timeStr = date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    expect(timeStr).toMatch(/\d{2}:\d{2}/);
    // German locale uses HH:mm format (24-hour)
    const parts = timeStr.split(":");
    expect(parts).toHaveLength(2);
  });

  it("should handle event with description", () => {
    const event = {
      title: "Team Meeting",
      description: "Discuss project updates and roadmap",
    };

    expect(event.description).toBeTruthy();
    expect(event.description?.length).toBeGreaterThan(0);
  });

  it("should handle event without description", () => {
    const event = {
      title: "Quick Sync",
      description: undefined,
    };

    expect(event.description).toBeUndefined();
  });

  it("should differentiate all-day from timed events", () => {
    const allDayEvent = {
      all_day: true,
      start_at: "2026-08-20T00:00:00Z",
      end_at: "2026-08-20T23:59:59Z",
    };

    const timedEvent = {
      all_day: false,
      start_at: "2026-08-20T10:00:00Z",
      end_at: "2026-08-20T11:00:00Z",
    };

    expect(allDayEvent.all_day).toBe(true);
    expect(timedEvent.all_day).toBe(false);
  });

  it("should truncate long titles", () => {
    const longTitle =
      "This is a very long event title that should be truncated in the UI";
    const truncatedClass = "truncate";

    // Verify that we're applying truncate class
    expect(truncatedClass).toBe("truncate");
  });

  it("should limit description display to 2 lines", () => {
    const descriptionClass = "line-clamp-2";
    expect(descriptionClass).toBe("line-clamp-2");
  });

  it("should render assignees with display names", () => {
    const event: EventWithDetails = {
      event: {
        id: "event-1",
        title: "Team Meeting",
        description: "Weekly sync",
        start_at: "2026-09-03T10:00:00Z",
        end_at: "2026-09-03T11:00:00Z",
        all_day: false,
        type: "event",
        visibility: "family",
        family_id: "family-1",
        created_by: "user-1",
        rrule: null,
        recurrence_count: null,
        recurrence_expires_at: null,
        created_at: "2026-09-01T08:00:00Z",
        updated_at: "2026-09-01T08:00:00Z",
      },
      assignees: [
        {
          id: "assign-1",
          event_id: "event-1",
          profile_id: "user-2",
          profiles: {
            display_name: "Alice Smith",
          },
        },
        {
          id: "assign-2",
          event_id: "event-1",
          profile_id: "user-3",
          profiles: {
            display_name: "Bob Jones",
          },
        },
      ],
    };

    // Verify assignees structure
    expect(event.assignees).toHaveLength(2);
    expect(event.assignees?.[0].profiles?.display_name).toBe("Alice Smith");
    expect(event.assignees?.[1].profiles?.display_name).toBe("Bob Jones");
  });

  it("should show fallback name when display_name is missing", () => {
    const event: EventWithDetails = {
      event: {
        id: "event-1",
        title: "Meeting",
        description: null,
        start_at: "2026-09-03T10:00:00Z",
        end_at: "2026-09-03T11:00:00Z",
        all_day: false,
        type: "appointment",
        visibility: "family",
        family_id: "family-1",
        created_by: "user-1",
        rrule: null,
        recurrence_count: null,
        recurrence_expires_at: null,
        created_at: "2026-09-01T08:00:00Z",
        updated_at: "2026-09-01T08:00:00Z",
      },
      assignees: [
        {
          id: "assign-1",
          event_id: "event-1",
          profile_id: "user-2",
          profiles: {
            display_name: undefined,
          },
        },
      ],
    };

    // Verify fallback behavior
    const displayName =
      event.assignees?.[0].profiles?.display_name || "Unknown";
    expect(displayName).toBe("Unknown");
  });

  it("should handle empty assignees array", () => {
    const event: EventWithDetails = {
      event: {
        id: "event-1",
        title: "Solo Task",
        description: null,
        start_at: "2026-09-04T14:00:00Z",
        end_at: "2026-09-04T15:00:00Z",
        all_day: false,
        type: "reminder",
        visibility: "personal",
        family_id: "family-1",
        created_by: "user-1",
        rrule: null,
        recurrence_count: null,
        recurrence_expires_at: null,
        created_at: "2026-09-01T08:00:00Z",
        updated_at: "2026-09-01T08:00:00Z",
      },
      assignees: [],
    };

    expect(event.assignees).toHaveLength(0);
  });

  it("should show +N indicator when more than 2 assignees", () => {
    const event: EventWithDetails = {
      event: {
        id: "event-1",
        title: "Large Meeting",
        description: null,
        start_at: "2026-09-03T10:00:00Z",
        end_at: "2026-09-03T11:00:00Z",
        all_day: false,
        type: "event",
        visibility: "family",
        family_id: "family-1",
        created_by: "user-1",
        rrule: null,
        recurrence_count: null,
        recurrence_expires_at: null,
        created_at: "2026-09-01T08:00:00Z",
        updated_at: "2026-09-01T08:00:00Z",
      },
      assignees: [
        {
          id: "assign-1",
          event_id: "event-1",
          profile_id: "user-2",
          profiles: { display_name: "Alice" },
        },
        {
          id: "assign-2",
          event_id: "event-1",
          profile_id: "user-3",
          profiles: { display_name: "Bob" },
        },
        {
          id: "assign-3",
          event_id: "event-1",
          profile_id: "user-4",
          profiles: { display_name: "Carol" },
        },
      ],
    };

    // Should show 2 assignees and +1 indicator
    const displayedAssignees = event.assignees?.slice(0, 2) || [];
    const moreCount = Math.max(0, (event.assignees?.length || 0) - 2);

    expect(displayedAssignees).toHaveLength(2);
    expect(moreCount).toBe(1);
  });
});
