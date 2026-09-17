"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCalendar } from "@/hooks/use-calendar";
import { useResponsiveDays } from "@/hooks/use-responsive-days";
import type { CreateEventFormData } from "@/lib/schemas/events";
import type { EventWithDetails } from "@/lib/types/events";
import type { FamilyMember } from "@/lib/types/settings";
import { formatDateTimeLocal } from "@/lib/utils/format-datetime-local";
import { Container } from "../layout/container";
import { Section } from "../layout/section";
import { AllDayBar } from "./all-day-bar.client";
import { DayColumnHeader } from "./day-column";
import { EventForm } from "./event-form.client";
import { TimedEventGrid } from "./timed-event-grid.client";
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
  const { breakpoint, dayWidthClass } = useResponsiveDays();

  const [formOpen, setFormOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState<
    Partial<CreateEventFormData> | undefined
  >();

  const headersScrollRef = useRef<HTMLDivElement>(null);
  const timedGridScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);

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

  // Set up bidirectional scroll synchronization
  useEffect(() => {
    const headersEl = headersScrollRef.current;
    const timedGridEl = timedGridScrollRef.current;

    if (!(headersEl && timedGridEl)) {
      return;
    }

    const syncScroll = (sourceEl: HTMLDivElement, targetEl: HTMLDivElement) => {
      return () => {
        if (isScrollingSyncRef.current) {
          return;
        }
        isScrollingSyncRef.current = true;

        targetEl.scrollLeft = sourceEl.scrollLeft;

        // Also sync the inner sync-scroll elements
        const allScrollables = headersEl.querySelectorAll("[data-sync-scroll]");
        allScrollables.forEach((el) => {
          (el as HTMLDivElement).scrollLeft = sourceEl.scrollLeft;
        });

        setTimeout(() => {
          isScrollingSyncRef.current = false;
        }, 0);
      };
    };

    const handleHeadersScroll = syncScroll(headersEl, timedGridEl);
    const handleTimedGridScroll = syncScroll(timedGridEl, headersEl);

    headersEl.addEventListener("scroll", handleHeadersScroll, {
      passive: true,
    });
    timedGridEl.addEventListener("scroll", handleTimedGridScroll, {
      passive: true,
    });

    return () => {
      headersEl.removeEventListener("scroll", handleHeadersScroll);
      timedGridEl.removeEventListener("scroll", handleTimedGridScroll);
    };
  }, []);

  function isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  // Separate all-day and timed events by day
  function getEventsByDay(): {
    allDay: Map<number, EventWithDetails[]>;
    timed: EventWithDetails[];
  } {
    const allDayByDay = new Map<number, EventWithDetails[]>();
    const timedEvents: EventWithDetails[] = [];

    for (let i = 0; i < 7; i++) {
      allDayByDay.set(i, []);
    }

    for (const event of events) {
      const eventStart = new Date(event.event.start_at);
      const eventEnd = new Date(event.event.end_at);

      if (event.event.all_day) {
        // Find which days this all-day event spans
        const current = new Date(eventStart);
        current.setHours(0, 0, 0, 0);

        while (current < eventEnd) {
          const dayIndex = Math.floor(
            (current.getTime() - currentWeekStart.getTime()) /
              (24 * 60 * 60 * 1000)
          );

          if (dayIndex >= 0 && dayIndex < 7) {
            const dayEvents = allDayByDay.get(dayIndex) || [];
            dayEvents.push(event);
            allDayByDay.set(dayIndex, dayEvents);
          }

          current.setDate(current.getDate() + 1);
        }
      } else {
        timedEvents.push(event);
      }
    }

    return { allDay: allDayByDay, timed: timedEvents };
  }

  // Generate all 7 days of the week
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const { allDay: allDayEvents, timed: timedEvents } = getEventsByDay();

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
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/20">
              <Spinner />
            </div>
          )}

          <div className="flex h-[70vh] max-h-[80vh] flex-col overflow-hidden">
            {/* Shared horizontal scroll container for headers, all-day bar */}
            <div
              className="no-scrollbar flex flex-col overflow-x-auto overflow-y-hidden"
              ref={headersScrollRef}
            >
              {/* Day headers with snap points */}
              <div
                className="flex touch-pan-x snap-x snap-mandatory border-border border-b bg-background"
                data-sync-scroll
              >
                {/* Time column placeholder */}
                <div className="w-12 flex-shrink-0" />

                {/* Day headers */}
                <div className="relative flex flex-1">
                  {days.map((date, i) => (
                    <DayColumnHeader
                      date={date}
                      dayWidthClass={dayWidthClass}
                      isToday={isToday(date)}
                      key={date.toISOString()}
                    />
                  ))}
                </div>
              </div>

              {/* All-day events bar (scrolls horizontally with grid) */}
              <AllDayBar
                breakpoint={breakpoint}
                dayWidthClass={dayWidthClass}
                events={allDayEvents}
              />
            </div>

            {/* Timed events grid (vertical scroll for hours, horizontal snap scroll for days) */}
            <div className="flex-1 overflow-y-auto">
              <TimedEventGrid
                breakpoint={breakpoint}
                dayWidthClass={dayWidthClass}
                events={timedEvents}
                onTimeSlotClick={handleTimeSlotClick}
                scrollRef={timedGridScrollRef}
                weekStart={currentWeekStart}
              />
            </div>
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
