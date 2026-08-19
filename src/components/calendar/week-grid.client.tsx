"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCalendar } from "@/hooks/use-calendar";
import type { CreateEventFormData } from "@/lib/schemas/events";
import type { EventWithDetails } from "@/lib/types/events";
import type { FamilyMember } from "@/lib/types/settings";
import { formatDateTimeLocal } from "@/lib/utils/format-datetime-local";
import { Container } from "../layout/container";
import { Section } from "../layout/section";
import { DayColumn } from "./day-column";
import { EventForm } from "./event-form.client";
import { WeekNavigation } from "./week-navigation.client";

interface WeekGridProps {
  familyId: string;
  familyMembers: FamilyMember[];
  onWeekChange: (weekStart: Date) => Promise<EventWithDetails[]>;
}

export function WeekGrid({
  familyId,
  familyMembers,
  onWeekChange,
}: WeekGridProps) {
  const { state, setLoading, setEvents } = useCalendar();
  const { currentWeekStart, events, loading, error } = state;

  const [formOpen, setFormOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState<
    Partial<CreateEventFormData> | undefined
  >();

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

  const handleTimeSlotClick = (date: Date, hour: number, minute: number) => {
    const startAt = new Date(date);
    startAt.setHours(hour, minute, 0, 0);

    const endAt = new Date(startAt);
    endAt.setHours(hour + 1, minute, 0, 0);

    setInitialFormData({
      startAt: formatDateTimeLocal(startAt),
      endAt: formatDateTimeLocal(endAt),
    });
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setInitialFormData(undefined);
  };

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
    <Section>
      <Container>
        <div className="flex flex-col">
          <WeekNavigation onWeekChange={handleWeekChange} />

          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
              <Spinner />
            </div>
          )}

          <div className="no-scrollbar flex h-[75vh] max-h-[75vh] flex-1 overflow-y-auto rounded-sm border-border border-y border-l">
            {days.map((date) => {
              const { allDay, timed } = getEventsForDay(date);
              return (
                <div className="flex-1" key={date.toISOString()}>
                  <DayColumn
                    allDayEvents={allDay}
                    date={date}
                    isToday={isToday(date)}
                    onTimeSlotClick={handleTimeSlotClick}
                    timedEvents={timed}
                  />
                </div>
              );
            })}
          </div>

          <EventForm
            familyId={familyId}
            familyMembers={familyMembers.map((m) => ({
              id: m.id,
              user_id: m.user_id,
              display_name: m.display_name || "Unknown",
            }))}
            initialData={initialFormData}
            onOpenChange={setFormOpen}
            onSuccess={handleFormSuccess}
            open={formOpen}
          />
        </div>
      </Container>
    </Section>
  );
}
