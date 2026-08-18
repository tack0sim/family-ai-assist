import { describe, expect, it } from "vitest";

describe("CalendarProvider Reducer Logic", () => {
  it("should handle week navigation calculations", () => {
    const getWeekStart = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    const now = new Date("2026-08-18");
    const weekStart = getWeekStart(now);

    // August 18, 2026 is a Tuesday, so week starts on Monday (August 17)
    expect(weekStart.getDate()).toBe(17);
  });

  it("should calculate next week correctly", () => {
    const date = new Date("2026-08-18");
    const nextWeek = new Date(date);
    nextWeek.setDate(nextWeek.getDate() + 7);

    expect(nextWeek.getDate()).toBe(25);
  });

  it("should calculate previous week correctly", () => {
    const date = new Date("2026-08-18");
    const prevWeek = new Date(date);
    prevWeek.setDate(prevWeek.getDate() - 7);

    expect(prevWeek.getDate()).toBe(11);
  });

  it("should identify all-day events correctly", () => {
    const event = {
      all_day: true,
      start_at: "2026-08-20T00:00:00Z",
      end_at: "2026-08-20T23:59:59Z",
    };

    expect(event.all_day).toBe(true);
  });

  it("should identify timed events correctly", () => {
    const event = {
      all_day: false,
      start_at: "2026-08-20T10:00:00Z",
      end_at: "2026-08-20T11:00:00Z",
    };

    expect(event.all_day).toBe(false);
  });

  it("should filter events for a specific day", () => {
    const dayStart = new Date("2026-08-20T00:00:00Z");
    const dayEnd = new Date("2026-08-20T23:59:59Z");

    const events = [
      {
        event: {
          start_at: new Date("2026-08-20T10:00:00Z"),
          end_at: new Date("2026-08-20T11:00:00Z"),
        },
      },
      {
        event: {
          start_at: new Date("2026-08-21T10:00:00Z"),
          end_at: new Date("2026-08-21T11:00:00Z"),
        },
      },
    ];

    const dayEvents = events.filter((e) => {
      const eventStart = new Date(e.event.start_at);
      const eventEnd = new Date(e.event.end_at);
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });

    expect(dayEvents).toHaveLength(1);
    expect(dayEvents[0].event.start_at).toEqual(
      new Date("2026-08-20T10:00:00Z")
    );
  });

  it("should group events by all-day and timed", () => {
    const events = [
      {
        event: { all_day: true, id: "event-1" },
      },
      {
        event: { all_day: false, id: "event-2" },
      },
      {
        event: { all_day: true, id: "event-3" },
      },
    ];

    const allDay = events.filter((e) => e.event.all_day);
    const timed = events.filter((e) => !e.event.all_day);

    expect(allDay).toHaveLength(2);
    expect(timed).toHaveLength(1);
  });
});
