import type { EventWithDetails } from "@/lib/types/events";

/**
 * Represents a segment of an event that spans a specific day
 */
export interface EventSegment {
  dayIndex: number; // 0-6, relative to week start
  endHour: number;
  endMinute: number;
  event: EventWithDetails;
  isDayEnd: boolean; // true if segment ends at 23:59 or 24:00
  isDayStart: boolean; // true if segment starts at 00:00
  segmentNumber: number; // 1-indexed
  startHour: number;
  startMinute: number;
  totalSegments: number;
}

/**
 * Split an event into segments based on which days it spans.
 * For multi-day events, creates one segment per day.
 *
 * @param event - The event to segment
 * @param weekStartDate - The start of the week for reference
 * @returns Array of event segments
 */
export function segmentEvent(
  event: EventWithDetails,
  weekStartDate: Date
): EventSegment[] {
  const eventStart = new Date(event.event.start_at);
  const eventEnd = new Date(event.event.end_at);

  // Get the date range this event spans, using LOCAL time
  const startDate = new Date(eventStart);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(eventEnd);
  endDate.setHours(0, 0, 0, 0);

  // Calculate number of days this event spans
  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );
  const totalDays = daysDiff + 1;

  const segments: EventSegment[] = [];

  for (let i = 0; i < totalDays; i++) {
    const segmentDate = new Date(startDate);
    segmentDate.setDate(segmentDate.getDate() + i);

    // Find which day of the week this is (0-6)
    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);

    const dayIndex = Math.floor(
      (segmentDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Only include if within the current week (0-6)
    if (dayIndex < 0 || dayIndex > 6) {
      continue;
    }

    // Determine start time for this segment (using local hours)
    let segmentStartHour = 0;
    let segmentStartMinute = 0;

    if (i === 0) {
      // First day: use event start time (local hours)
      segmentStartHour = eventStart.getHours();
      segmentStartMinute = eventStart.getMinutes();
    }

    // Determine end time for this segment (using local hours)
    let segmentEndHour = 23;
    let segmentEndMinute = 59;

    if (i === totalDays - 1) {
      // Last day: use event end time (local hours)
      segmentEndHour = eventEnd.getHours();
      segmentEndMinute = eventEnd.getMinutes();
    }

    segments.push({
      event,
      dayIndex,
      segmentNumber: segments.length + 1,
      totalSegments: totalDays,
      startHour: segmentStartHour,
      startMinute: segmentStartMinute,
      endHour: segmentEndHour,
      endMinute: segmentEndMinute,
      isDayStart: segmentStartHour === 0 && segmentStartMinute === 0,
      isDayEnd: segmentEndHour === 23 && segmentEndMinute === 59,
    });
  }

  return segments;
}

/**
 * Get all event segments for a specific hour and day
 * @param segments - Array of all event segments
 * @param dayIndex - Day index (0-6)
 * @param hour - Hour of day (0-23)
 * @returns Segments that overlap or start in the given hour
 */
export function getSegmentsForHourAndDay(
  segments: EventSegment[],
  dayIndex: number,
  hour: number
): EventSegment[] {
  return segments.filter((segment) => {
    if (segment.dayIndex !== dayIndex) {
      return false;
    }

    // Check if segment overlaps with this hour (0:00-0:59)
    const hourEnd = hour + 1;

    // Convert segment times to minutes for easier comparison
    const segmentStartTotalMinutes =
      segment.startHour * 60 + segment.startMinute;
    const segmentEndTotalMinutes = segment.endHour * 60 + segment.endMinute;
    const hourStartMinutes = hour * 60;
    const hourEndMinutes = hourEnd * 60;

    // Check if segment overlaps with this hour
    return (
      segmentStartTotalMinutes < hourEndMinutes &&
      segmentEndTotalMinutes > hourStartMinutes
    );
  });
}

/**
 * Calculate the visual position and height of a segment within an hour slot
 * @param segment - The event segment
 * @param hour - The hour being rendered
 * @returns Position info or null if segment doesn't fall in this hour
 */
export function calculateSegmentPosition(segment: EventSegment, hour: number) {
  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;

  const segmentStartMinutes = segment.startHour * 60 + segment.startMinute;
  const segmentEndMinutes = segment.endHour * 60 + segment.endMinute;

  // Check if segment overlaps with this hour
  if (segmentEndMinutes <= hourStart || segmentStartMinutes >= hourEnd) {
    return null;
  }

  // Calculate position within the hour (0-1)
  const topPercent = Math.max(0, (segmentStartMinutes - hourStart) / 60);
  const heightPercent =
    Math.min(1, (segmentEndMinutes - hourStart) / 60) - topPercent;

  return { topPercent, heightPercent };
}
