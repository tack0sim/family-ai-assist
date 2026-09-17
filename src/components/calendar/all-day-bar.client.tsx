"use client";

import type { ViewportBreakpoint } from "@/hooks/use-responsive-days";
import type { EventWithDetails } from "@/lib/types/events";
import { EventCard } from "./event-card";

interface AllDayBarProps {
  breakpoint?: ViewportBreakpoint;
  dayWidthClass: string;
  events: Map<number, EventWithDetails[]>; // Map of dayIndex to events
}

export function AllDayBar({
  breakpoint = "desktop",
  dayWidthClass,
  events,
}: AllDayBarProps) {
  const hasAnyEvents = Array.from(events.values()).some(
    (dayEvents) => dayEvents.length > 0
  );

  if (!hasAnyEvents) {
    return null;
  }

  return (
    <div className="no-scrollbar flex touch-pan-x snap-x snap-mandatory overflow-x-auto border-border border-b bg-muted">
      {/* Time column placeholder */}
      <div className="w-12 flex-shrink-0" />

      {/* Days columns */}
      <div className="relative flex flex-1">
        {Array.from({ length: 7 }).map((_, dayIndex) => {
          const dayEvents = events.get(dayIndex) || [];

          return (
            <div
              className={`relative border-border border-r px-1 py-2 ${dayWidthClass}`}
              key={dayIndex}
            >
              {dayEvents.length > 0 && (
                <div className="mb-1 font-semibold text-muted-foreground text-xs">
                  All-day
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {dayEvents.map((eventWithDetails) => (
                  <div
                    className="min-w-fit flex-1"
                    key={eventWithDetails.event.id}
                  >
                    <EventCard
                      breakpoint={breakpoint}
                      event={eventWithDetails}
                      isAllDay
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
