"use client";

import type { ViewportBreakpoint } from "@/hooks/use-responsive-days";
import type { EventWithDetails } from "@/lib/types/events";
import { AllDaySection } from "./all-day-section";
import { TimeSlot } from "./time-slot";

interface DayColumnProps {
  allDayEvents: EventWithDetails[];
  breakpoint?: ViewportBreakpoint;
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
  breakpoint = "desktop",
}: DayColumnProps) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayDate = date.getDate();
  const monthName = date.toLocaleDateString("en-US", { month: "short" });

  const bgColor = isToday
    ? "bg-primary/10 dark:bg-primary/20"
    : "bg-background";

  return (
    <div className={`flex flex-col border-border border-r ${bgColor}`}>
      <div className="sticky top-0 z-20 border-border border-b bg-muted p-2 text-center">
        <div
          className={`font-semibold text-sm ${isToday ? "text-primary" : ""}`}
        >
          {dayName}
        </div>
        <div className={`font-bold text-lg ${isToday ? "text-primary" : ""}`}>
          {dayDate}
        </div>
        <div className="text-muted-foreground text-xs">{monthName}</div>
      </div>

      {allDayEvents.length > 0 && (
        <AllDaySection
          allDayEvents={allDayEvents}
          breakpoint={breakpoint}
          dayWidth="w-full"
        />
      )}

      <div className="min-h-0 flex-1">
        {HOURS.map((hour) => {
          const isLastSlot = hour === 23;
          return (
            <div key={`${hour}-0`}>
              <TimeSlot
                breakpoint={breakpoint}
                date={date}
                events={timedEvents}
                hour={hour}
                minute={0}
                onTimeSlotClick={onTimeSlotClick}
              />
              <TimeSlot
                breakpoint={breakpoint}
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
