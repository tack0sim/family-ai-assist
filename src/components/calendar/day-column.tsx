"use client";

import type { EventWithDetails } from "@/lib/types/events";
import { AllDaySection } from "./all-day-section";
import { TimeSlot } from "./time-slot";

interface DayColumnProps {
  allDayEvents: EventWithDetails[];
  date: Date;
  isToday: boolean;
  timedEvents: EventWithDetails[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayColumn({
  date,
  allDayEvents,
  timedEvents,
  isToday,
}: DayColumnProps) {
  const dayName = date.toLocaleDateString("de-DE", { weekday: "short" });
  const dayDate = date.getDate();
  const monthName = date.toLocaleDateString("de-DE", { month: "short" });

  const bgColor = isToday ? "bg-blue-50" : "bg-white";

  return (
    <div className={`flex flex-col border-border border-r ${bgColor}`}>
      <div className="sticky top-0 z-20 border-border border-b bg-slate-100 p-2 text-center">
        <div
          className={`font-semibold text-sm ${isToday ? "text-blue-600" : ""}`}
        >
          {dayName}
        </div>
        <div className={`font-bold text-lg ${isToday ? "text-blue-600" : ""}`}>
          {dayDate}
        </div>
        <div className="text-slate-600 text-xs">{monthName}</div>
      </div>

      {allDayEvents.length > 0 && (
        <AllDaySection allDayEvents={allDayEvents} dayWidth="w-full" />
      )}

      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={`${hour}-0`}>
            <TimeSlot events={timedEvents} hour={hour} minute={0} />
            <TimeSlot events={timedEvents} hour={hour} minute={30} />
          </div>
        ))}
      </div>
    </div>
  );
}
