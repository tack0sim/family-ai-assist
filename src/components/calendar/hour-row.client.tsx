"use client";

import type { ViewportBreakpoint } from "@/hooks/use-responsive-days";
import { cn } from "@/lib/utils";
import {
  calculateSegmentPosition,
  type EventSegment,
} from "@/lib/utils/event-segments";
import { EventCard } from "./event-card";

interface HourRowProps {
  breakpoint?: ViewportBreakpoint;
  dayWidthClass: string;
  hour: number;
  isLastSlot?: boolean;
  onTimeSlotClick: (dayIndex: number, hour: number, minute: number) => void;
  segments: EventSegment[];
}

export function HourRow({
  hour,
  isLastSlot = false,
  breakpoint = "desktop",
  dayWidthClass,
  segments,
  onTimeSlotClick,
}: HourRowProps) {
  const timeStr = new Date(2024, 0, 1, hour, 0).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Group segments by day, but only include those that START in this hour
  const segmentsByDay: Record<number, EventSegment[]> = {};
  for (let i = 0; i < 7; i++) {
    segmentsByDay[i] = [];
  }

  // Only render a segment if it starts in this hour (to avoid rendering it multiple times)
  for (const segment of segments) {
    // Calculate if segment starts in this hour
    const segmentStartMinutes = segment.startHour * 60 + segment.startMinute;
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;

    if (
      segmentStartMinutes >= hourStart &&
      segmentStartMinutes < hourEnd &&
      segmentsByDay[segment.dayIndex]
    ) {
      segmentsByDay[segment.dayIndex].push(segment);
    }
  }

  const handleTimeSlotClick = (dayIndex: number) => {
    onTimeSlotClick(dayIndex, hour, 0);
  };

  return (
    <div
      className={cn(
        "relative flex min-h-[60px]",
        isLastSlot ? "" : "border-border border-b"
      )}
    >
      {/* Time label - fixed left column */}
      <div className="sticky left-0 z-20 w-12 flex-shrink-0 bg-muted py-2 text-center text-muted-foreground text-xs lg:static">
        {timeStr}
      </div>

      {/* Days grid - horizontal scrolling area */}
      <div className="relative flex flex-1">
        {Array.from({ length: 7 }).map((_, dayIndex) => {
          const daySegments = segmentsByDay[dayIndex] || [];
          const hasEvents = daySegments.length > 0;

          return (
            <div
              className={cn(
                `relative snap-start border-border border-r ${dayWidthClass}`,
                "last:border-r-0"
              )}
              key={dayIndex}
            >
              {hasEvents ? (
                <div className="relative h-full px-1 py-2">
                  {daySegments.map((segment) => {
                    const position = calculateSegmentPosition(segment, hour);
                    if (!position) {
                      return null;
                    }

                    // Calculate total duration in minutes for this segment
                    const durationMinutes =
                      (segment.endHour - segment.startHour) * 60 +
                      (segment.endMinute - segment.startMinute);
                    // Each hour slot is 60px, so height = (durationMinutes / 60) * 60px
                    // But we need to account for the offset within the starting hour
                    const totalHeightPx = (durationMinutes / 60) * 60;

                    return (
                      <div
                        className="absolute right-1 left-1"
                        key={`${segment.event.event.id}-${segment.segmentNumber}`}
                        style={{
                          top: `${position.topPercent * 100}%`,
                          height: `${Math.max(totalHeightPx, 30)}px`,
                          zIndex: 10,
                        }}
                      >
                        <EventCard
                          breakpoint={breakpoint}
                          event={segment.event}
                          segment={segment}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <button
                  aria-label={`Add event at ${timeStr}`}
                  className="h-full w-full cursor-pointer px-1 py-2 text-left transition-colors hover:bg-muted"
                  onClick={() => handleTimeSlotClick(dayIndex)}
                  type="button"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
