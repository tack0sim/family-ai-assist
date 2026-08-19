"use client";

import type { EventWithDetails } from "@/lib/types/events";
import { EventCard } from "./event-card";

interface AllDaySectionProps {
  allDayEvents: EventWithDetails[];
  dayWidth: string;
}

export function AllDaySection({ allDayEvents, dayWidth }: AllDaySectionProps) {
  if (allDayEvents.length === 0) {
    return null;
  }

  return (
    <div className="border-border border-b bg-slate-50 p-2">
      <div className="mb-1 font-semibold text-slate-600 text-xs">All-day</div>
      <div className={"flex flex-wrap gap-2"}>
        {allDayEvents.map((eventWithDetails) => (
          <div className="min-w-fit flex-1" key={eventWithDetails.event.id}>
            <EventCard event={eventWithDetails} isAllDay />
          </div>
        ))}
      </div>
    </div>
  );
}
