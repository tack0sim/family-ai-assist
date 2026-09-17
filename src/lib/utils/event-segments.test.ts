import { describe, expect, it } from "vitest";
import type { EventWithDetails } from "@/lib/types/events";
import {
  calculateSegmentPosition,
  getSegmentsForHourAndDay,
  segmentEvent,
} from "@/lib/utils/event-segments";

// Helper to create ISO string from local time components
function localTimeToISO(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0
): string {
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  return date.toISOString();
}

const mockEvent = (
  startAt: string,
  endAt: string,
  title = "Test Event"
): EventWithDetails => ({
  event: {
    id: "event-1",
    title,
    description: null,
    start_at: startAt,
    end_at: endAt,
    all_day: false,
    type: "event",
    visibility: "family",
    family_id: "family-1",
    created_by: "user-1",
    rrule: null,
    recurrence_count: null,
    recurrence_expires_at: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  assignees: [],
});

describe("Event Segmentation", () => {
  const weekStart = new Date(2024, 0, 8); // Monday in local time

  describe("segmentEvent", () => {
    it("should create one segment for single-day events", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 10, 0),
        localTimeToISO(2024, 1, 8, 11, 0)
      );
      const segments = segmentEvent(event, weekStart);

      expect(segments).toHaveLength(1);
      expect(segments[0]).toMatchObject({
        dayIndex: 0,
        segmentNumber: 1,
        totalSegments: 1,
        startHour: 10,
        startMinute: 0,
        endHour: 11,
        endMinute: 0,
      });
    });

    it("should create multiple segments for multi-day events", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 14, 0), // Monday 14:00
        localTimeToISO(2024, 1, 10, 10, 0) // Wednesday 10:00
      );
      const segments = segmentEvent(event, weekStart);

      expect(segments).toHaveLength(3);

      // Day 1 (Monday): 14:00 - 23:59
      expect(segments[0]).toMatchObject({
        dayIndex: 0,
        segmentNumber: 1,
        totalSegments: 3,
        startHour: 14,
        startMinute: 0,
        endHour: 23,
        endMinute: 59,
        isDayStart: false,
        isDayEnd: true,
      });

      // Day 2 (Tuesday): 00:00 - 23:59
      expect(segments[1]).toMatchObject({
        dayIndex: 1,
        segmentNumber: 2,
        totalSegments: 3,
        startHour: 0,
        startMinute: 0,
        endHour: 23,
        endMinute: 59,
        isDayStart: true,
        isDayEnd: true,
      });

      // Day 3 (Wednesday): 00:00 - 10:00
      expect(segments[2]).toMatchObject({
        dayIndex: 2,
        segmentNumber: 3,
        totalSegments: 3,
        startHour: 0,
        startMinute: 0,
        endHour: 10,
        endMinute: 0,
        isDayStart: true,
        isDayEnd: false,
      });
    });

    it("should only include segments within the current week", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 7, 10, 0), // Sunday (outside week)
        localTimeToISO(2024, 1, 14, 10, 0)
      );
      const segments = segmentEvent(event, weekStart);

      // Should only include segments for Mon-Sun of that week
      expect(segments.every((s) => s.dayIndex >= 0 && s.dayIndex <= 6)).toBe(
        true
      );
    });

    it("should handle events starting at midnight", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 0, 0),
        localTimeToISO(2024, 1, 8, 12, 0)
      );
      const segments = segmentEvent(event, weekStart);

      expect(segments[0]).toMatchObject({
        startHour: 0,
        startMinute: 0,
        isDayStart: true,
      });
    });

    it("should handle events ending at midnight", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 10, 0),
        localTimeToISO(2024, 1, 9, 0, 0)
      );
      const segments = segmentEvent(event, weekStart);

      expect(segments[0]).toMatchObject({
        endHour: 23,
        endMinute: 59,
        isDayEnd: true,
      });
    });
  });

  describe("getSegmentsForHourAndDay", () => {
    it("should return segments that overlap with a specific hour and day", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 10, 0),
        localTimeToISO(2024, 1, 8, 12, 0)
      );
      const segments = segmentEvent(event, weekStart);

      // Hour 10 (10:00-11:00) should contain the segment
      const result = getSegmentsForHourAndDay(segments, 0, 10);
      expect(result).toHaveLength(1);

      // Hour 9 (9:00-10:00) should not contain the segment
      const noResult = getSegmentsForHourAndDay(segments, 0, 9);
      expect(noResult).toHaveLength(0);

      // Hour 11 (11:00-12:00) should contain the segment (ends at 12:00)
      const result11 = getSegmentsForHourAndDay(segments, 0, 11);
      expect(result11).toHaveLength(1);
    });

    it("should not return segments from different days", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 10, 0),
        localTimeToISO(2024, 1, 8, 12, 0)
      );
      const segments = segmentEvent(event, weekStart);

      const result = getSegmentsForHourAndDay(segments, 1, 10); // Tuesday
      expect(result).toHaveLength(0);
    });

    it("should handle multi-day segments correctly", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 22, 0),
        localTimeToISO(2024, 1, 9, 2, 0)
      );
      const segments = segmentEvent(event, weekStart);

      // Monday hour 22 should have segment
      const mon22 = getSegmentsForHourAndDay(segments, 0, 22);
      expect(mon22).toHaveLength(1);

      // Tuesday hour 0-1 should have segment
      const tue0 = getSegmentsForHourAndDay(segments, 1, 0);
      expect(tue0).toHaveLength(1);

      const tue1 = getSegmentsForHourAndDay(segments, 1, 1);
      expect(tue1).toHaveLength(1);

      // Tuesday hour 2 should not have segment (ends at 02:00)
      const tue2 = getSegmentsForHourAndDay(segments, 1, 2);
      expect(tue2).toHaveLength(0);
    });
  });

  describe("calculateSegmentPosition", () => {
    it("should calculate position for segment starting mid-hour", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 10, 30),
        localTimeToISO(2024, 1, 8, 11, 30)
      );
      const segments = segmentEvent(event, weekStart);
      const segment = segments[0];

      const position = calculateSegmentPosition(segment, 10);

      expect(position).toBeDefined();
      expect(position?.topPercent).toBeCloseTo(0.5, 1); // 30 minutes into the hour
      expect(position?.heightPercent).toBeCloseTo(0.5, 1); // Last 30 minutes of hour
    });

    it("should return null if segment doesn't overlap with hour", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 10, 0),
        localTimeToISO(2024, 1, 8, 11, 0)
      );
      const segments = segmentEvent(event, weekStart);
      const segment = segments[0];

      const position = calculateSegmentPosition(segment, 9);
      expect(position).toBeNull();
    });

    it("should handle segments spanning multiple hours", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 10, 0),
        localTimeToISO(2024, 1, 8, 14, 0)
      );
      const segments = segmentEvent(event, weekStart);
      const segment = segments[0];

      // Hour 10: should start at 0, span full hour
      const pos10 = calculateSegmentPosition(segment, 10);
      expect(pos10?.topPercent).toBeCloseTo(0, 1);
      expect(pos10?.heightPercent).toBeCloseTo(1, 1);

      // Hour 12 (middle): should span full hour
      const pos12 = calculateSegmentPosition(segment, 12);
      expect(pos12?.topPercent).toBeCloseTo(0, 1);
      expect(pos12?.heightPercent).toBeCloseTo(1, 1);

      // Hour 13 (last): should end at 0, span full hour
      const pos13 = calculateSegmentPosition(segment, 13);
      expect(pos13?.topPercent).toBeCloseTo(0, 1);
      expect(pos13?.heightPercent).toBeCloseTo(1, 1);
    });

    it("should handle segments partially in an hour", () => {
      const event = mockEvent(
        localTimeToISO(2024, 1, 8, 10, 20),
        localTimeToISO(2024, 1, 8, 10, 40)
      );
      const segments = segmentEvent(event, weekStart);
      const segment = segments[0];

      const position = calculateSegmentPosition(segment, 10);
      expect(position?.topPercent).toBeCloseTo(0.333, 2); // 20 minutes = 1/3
      expect(position?.heightPercent).toBeCloseTo(0.333, 2); // 20 minutes = 1/3
    });
  });
});
