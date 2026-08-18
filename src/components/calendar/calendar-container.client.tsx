"use client";

import { useEffect } from "react";
import { useCalendar } from "@/hooks/use-calendar";
import type { EventWithDetails } from "@/lib/types/events";
import { WeekGrid } from "./week-grid.client";

interface CalendarContainerProps {
  events: EventWithDetails[];
  familyId: string;
  onWeekChange: (weekStart: Date) => Promise<EventWithDetails[]>;
}

export function CalendarContainer({
  events,
  familyId,
  onWeekChange,
}: CalendarContainerProps) {
  const { setEvents } = useCalendar();

  useEffect(() => {
    setEvents(events);
  }, [events, setEvents]);

  return <WeekGrid familyId={familyId} onWeekChange={onWeekChange} />;
}
