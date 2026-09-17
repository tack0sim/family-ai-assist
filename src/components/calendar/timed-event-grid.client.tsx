"use client";

import type { RefObject } from "react";
import { useCallback } from "react";
import type { ViewportBreakpoint } from "@/hooks/use-responsive-days";
import type { EventWithDetails } from "@/lib/types/events";
import { segmentEvent } from "@/lib/utils/event-segments";
import { HourRow } from "./hour-row.client";

interface TimedEventGridProps {
  breakpoint?: ViewportBreakpoint;
  dayWidthClass: string;
  events: EventWithDetails[];
  onTimeSlotClick: (date: Date, hour: number, minute: number) => void;
  scrollRef?: RefObject<HTMLDivElement | null>;
  weekStart: Date;
}

export function TimedEventGrid({
  breakpoint = "desktop",
  dayWidthClass,
  events,
  weekStart,
  scrollRef,
  onTimeSlotClick,
}: TimedEventGridProps) {
  // Segment all events for the week
  const allSegments = events.flatMap((event) => segmentEvent(event, weekStart));

  // Get segments for each hour
  const hoursSegments = Array.from({ length: 24 }).map((_, hour) => {
    return allSegments.filter((segment) => {
      // Check if segment overlaps with this hour
      const hourStart = hour * 60;
      const hourEnd = (hour + 1) * 60;

      const segmentStartMinutes = segment.startHour * 60 + segment.startMinute;
      const segmentEndMinutes = segment.endHour * 60 + segment.endMinute;

      return segmentStartMinutes < hourEnd && segmentEndMinutes > hourStart;
    });
  });

  const handleTimeSlotClick = useCallback(
    (dayIndex: number, hour: number, minute: number) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + dayIndex);
      onTimeSlotClick(date, hour, minute);
    },
    [weekStart, onTimeSlotClick]
  );

  return (
    <div
      className="no-scrollbar flex overflow-x-auto"
      data-timed-grid-scroll
      ref={scrollRef}
    >
      <div className="flex w-max flex-col lg:w-full">
        {hoursSegments.map((segments, hour) => {
          const isLastSlot = hour === 23;
          return (
            <HourRow
              breakpoint={breakpoint}
              dayWidthClass={dayWidthClass}
              hour={hour}
              isLastSlot={isLastSlot}
              key={`hour-${hour}`}
              onTimeSlotClick={handleTimeSlotClick}
              segments={segments}
            />
          );
        })}
      </div>
    </div>
  );
}
