"use client";

import type { EventWithDetails } from "@/lib/types/events";
import { AllDaySection } from "./all-day-section";
import { TimeSlot } from "./time-slot";

interface DayColumnProps {
  allDayEvents: EventWithDetails[];
  date: Date;
  isToday: boolean;
  onTimeSlotClick: (date: Date, hour: number, minute: number) => void;
  timedEvents: EventWithDetails[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayColumn({
  date,
  allDayEvents,
  timedEvents,
  isToday,
  onTimeSlotClick,
}: DayColumnProps) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayDate = date.getDate();
  const monthName = date.toLocaleDateString("en-US", { month: "short" });

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

      <div className="min-h-0 flex-1">
        {HOURS.map((hour) => {
          const isLastSlot = hour === 23;
          return (
            <div key={`${hour}-0`}>
              <TimeSlot
                date={date}
                events={timedEvents}
                hour={hour}
                minute={0}
                onTimeSlotClick={onTimeSlotClick}
              />
              <TimeSlot
                date={date}
                events={timedEvents}
                hour={hour}
                isLast={isLastSlot}
                minute={30}
                onTimeSlotClick={onTimeSlotClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
