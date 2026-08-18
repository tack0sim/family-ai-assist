"use client";

import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCalendar } from "@/hooks/use-calendar";
import type { EventWithDetails } from "@/lib/types/events";
import { DayColumn } from "./day-column";
import { WeekNavigation } from "./week-navigation.client";

interface WeekGridProps {
  familyId: string;
  onWeekChange: (weekStart: Date) => Promise<EventWithDetails[]>;
}

export function WeekGrid({ familyId, onWeekChange }: WeekGridProps) {
  const { state, setLoading, setEvents } = useCalendar();
  const { currentWeekStart, events, loading, error } = state;

  const handleWeekChange = useCallback(
    async (newWeekStart: Date) => {
      setLoading(true);
      try {
        const newEvents = await onWeekChange(newWeekStart);
        setEvents(newEvents);
      } catch (err) {
        console.error("Failed to fetch events for week:", err);
      } finally {
        setLoading(false);
      }
    },
    [onWeekChange, setLoading, setEvents]
  );

  function getEventsForDay(date: Date): {
    allDay: EventWithDetails[];
    timed: EventWithDetails[];
  } {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEvents = events.filter((e) => {
      const eventStart = new Date(e.event.start_at);
      const eventEnd = new Date(e.event.end_at);
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });

    return {
      allDay: dayEvents.filter((e) => e.event.all_day),
      timed: dayEvents.filter((e) => !e.event.all_day),
    };
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-900 text-sm">
            Error while loading events...
          </h3>
          <p className="text-red-700 text-sm">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <WeekNavigation onWeekChange={handleWeekChange} />

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
          <Spinner />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {days.map((date) => {
          const { allDay, timed } = getEventsForDay(date);
          return (
            <div className="flex-1 overflow-hidden" key={date.toISOString()}>
              <DayColumn
                allDayEvents={allDay}
                date={date}
                isToday={isToday(date)}
                timedEvents={timed}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
