"use client";

import { useEffect } from "react";
import { useCalendar } from "@/hooks/use-calendar";
import type { EventWithDetails } from "@/lib/types/events";
import type { FamilyMember } from "@/lib/types/settings";
import { WeekGrid } from "./week-grid.client";

interface CalendarContainerProps {
  events: EventWithDetails[];
  familyId: string;
  familyMembers: FamilyMember[];
  onWeekChange: (weekStart: Date) => Promise<EventWithDetails[]>;
}

export function CalendarContainer({
  events: initialEvents,
  familyId,
  familyMembers,
  onWeekChange,
}: CalendarContainerProps) {
  const { setEvents } = useCalendar();

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents, setEvents]);

  return (
    <WeekGrid
      familyId={familyId}
      familyMembers={familyMembers}
      onWeekChange={onWeekChange}
    />
  );
}
