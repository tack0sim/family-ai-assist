"use client";

import type { EventWithDetails } from "@/lib/types/events";
import { EventCard } from "./event-card";

interface TimeSlotProps {
  date: Date;
  events: EventWithDetails[];
  hour: number;
  minute: number;
  onTimeSlotClick: (date: Date, hour: number, minute: number) => void;
}

function calculateEventPosition(
  event: EventWithDetails,
  slotHour: number,
  slotMinute: number
) {
  const startDate = new Date(event.event.start_at);
  const startHour = startDate.getHours();
  const startMinute = startDate.getMinutes();

  const endDate = new Date(event.event.end_at);
  const endHour = endDate.getHours();
  const endMinute = endDate.getMinutes();

  const slotStartMinutes = slotHour * 60 + slotMinute;
  const eventStartMinutes = startHour * 60 + startMinute;
  const eventEndMinutes = endHour * 60 + endMinute;

  if (
    eventEndMinutes <= slotStartMinutes ||
    eventStartMinutes >= slotStartMinutes + 30
  ) {
    return null;
  }

  const topPercent = Math.max(0, (eventStartMinutes - slotStartMinutes) / 30);
  const heightPercent =
    Math.min(1, (eventEndMinutes - slotStartMinutes) / 30) - topPercent;

  return { topPercent, heightPercent };
}

export function TimeSlot({
  date,
  hour,
  minute,
  events,
  onTimeSlotClick,
}: TimeSlotProps) {
  const timeStr = new Date(2024, 0, 1, hour, minute).toLocaleTimeString(
    "de-DE",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );

  const slotEvents = events.filter((e) =>
    calculateEventPosition(e, hour, minute)
  );

  const handleClick = () => {
    onTimeSlotClick(date, hour, minute);
  };

  const isEmpty = slotEvents.length === 0;

  return (
    <div className="relative flex border-border border-b">
      <div className="w-12 flex-shrink-0 bg-slate-50 py-2 text-center text-slate-500 text-xs">
        {minute === 0 && timeStr}
      </div>
      {isEmpty ? (
        <button
          aria-label={`Add event at ${timeStr}`}
          className="relative flex-1 cursor-pointer px-1 py-2 text-left transition-colors hover:bg-slate-100"
          onClick={handleClick}
          type="button"
        />
      ) : (
        <div className="relative flex-1 px-1 py-2">
          {slotEvents.map((event) => {
            const position = calculateEventPosition(event, hour, minute);
            if (!position) {
              return null;
            }

            return (
              <div
                className="absolute right-1 left-1"
                key={event.event.id}
                style={{
                  top: `${position.topPercent * 100}%`,
                  height: `${Math.max(position.heightPercent * 100, 30)}%`,
                  zIndex: 10,
                }}
              >
                <EventCard event={event} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
