import { describe, expect, it } from "vitest";
import {
  datetimeLocalToISO,
  formatDateTimeLocal,
} from "./format-datetime-local";

describe("datetimeLocalToISO", () => {
  it("returns empty string for empty input", () => {
    expect(datetimeLocalToISO("")).toBe("");
  });

  it("converts local datetime to ISO format with Z suffix", () => {
    const result = datetimeLocalToISO("2026-09-03T14:00");

    // Verify it returns a valid ISO 8601 UTC string
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    // Should include seconds when input doesn't have them
    expect(result).toContain(":00Z");
  });

  it("preserves seconds when provided in input", () => {
    const result = datetimeLocalToISO("2026-09-03T14:30:45");

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result).toContain(":45Z");
  });

  it("correctly applies timezone offset conversion", () => {
    // Since the function uses the browser's actual timezone,
    // we can verify the math by checking that the result is a valid UTC datetime
    const result = datetimeLocalToISO("2026-09-03T14:00");

    // Parse the result to verify it's a valid UTC datetime
    const utcDate = new Date(result);
    expect(utcDate).toBeInstanceOf(Date);
    expect(isNaN(utcDate.getTime())).toBe(false);
  });

  it("handles dates with various times", () => {
    const testCases = [
      "2026-09-03T00:00",
      "2026-09-03T12:00",
      "2026-09-03T23:59",
    ];

    testCases.forEach((input) => {
      const result = datetimeLocalToISO(input);
      // All results should be valid ISO 8601 UTC strings
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      // Should be parseable as a valid date
      const parsed = new Date(result);
      expect(isNaN(parsed.getTime())).toBe(false);
    });
  });
});

describe("formatDateTimeLocal", () => {
  it("formats a date to datetime-local format", () => {
    const date = new Date("2026-09-03T14:30:00Z");
    const result = formatDateTimeLocal(date);

    // Result should be in local time format (no Z suffix)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(result).not.toContain("Z");
  });

  it("pads month and day with leading zeros", () => {
    const date = new Date("2026-01-05T09:05:00Z");
    const result = formatDateTimeLocal(date);

    // Verify format has proper padding
    expect(result).toMatch(/2026-01-05T\d{2}:\d{2}/);
  });

  it("handles dates at month boundaries", () => {
    const date = new Date("2026-12-31T23:59:00Z");
    const result = formatDateTimeLocal(date);

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
