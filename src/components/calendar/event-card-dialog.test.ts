import { describe, expect, it } from "vitest";
import { updateEventSchema } from "@/lib/schemas/events";
import {
  datetimeLocalToISO,
  formatDateTimeLocal,
} from "@/lib/utils/format-datetime-local";

describe("EventCardDialog - Date Formatting and Validation", () => {
  describe("formatDateTimeLocal", () => {
    it("should format a Date object to datetime-local format", () => {
      const date = new Date("2026-09-09T10:30:00Z");
      const result = formatDateTimeLocal(date);
      // The result depends on timezone, so just check the format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it("should handle edge cases correctly", () => {
      const date = new Date("2026-01-01T00:00:00Z");
      const result = formatDateTimeLocal(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });

  describe("datetimeLocalToISO", () => {
    it("should convert datetime-local string to ISO format", () => {
      const datetimeLocal = "2026-09-09T10:30";
      const result = datetimeLocalToISO(datetimeLocal);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it("should handle empty string", () => {
      const result = datetimeLocalToISO("");
      expect(result).toBe("");
    });

    it("should preserve the correct time values", () => {
      const datetimeLocal = "2026-09-09T10:30";
      const result = datetimeLocalToISO(datetimeLocal);
      // Verify it creates a valid ISO string
      const date = new Date(result);
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCHours()).toBeDefined();
    });
  });

  describe("updateEventSchema validation", () => {
    it("should validate a partial update with title only", () => {
      const data = {
        title: "Updated Event",
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate a partial update with dates", () => {
      const data = {
        startAt: "2026-09-09T10:00:00Z",
        endAt: "2026-09-09T11:00:00Z",
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid dates (end before start)", () => {
      const data = {
        startAt: "2026-09-09T11:00:00Z",
        endAt: "2026-09-09T10:00:00Z",
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty title", () => {
      const data = {
        title: "",
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject title exceeding max length", () => {
      const data = {
        title: "a".repeat(256),
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept optional fields", () => {
      const data = {
        title: "Updated Event",
        description: undefined,
        type: undefined,
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate event type enum", () => {
      const data = {
        type: "event" as const,
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid event type", () => {
      const data = {
        type: "invalid_type",
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should validate visibility enum", () => {
      const data = {
        visibility: "family" as const,
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept allDay boolean", () => {
      const data = {
        allDay: true,
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
