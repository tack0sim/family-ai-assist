"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/hooks/use-calendar";

interface WeekNavigationProps {
  onWeekChange: (newWeekStart: Date) => Promise<void>;
}

export function WeekNavigation({ onWeekChange }: WeekNavigationProps) {
  const { state, goToPrevWeek, goToNextWeek, goToToday } = useCalendar();

  const handlePrev = async () => {
    const prevWeekStart = new Date(state.currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    goToPrevWeek();
    await onWeekChange(prevWeekStart);
  };

  const handleNext = async () => {
    const nextWeekStart = new Date(state.currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    goToNextWeek();
    await onWeekChange(nextWeekStart);
  };

  const handleToday = async () => {
    const today = new Date();
    const weekStart = new Date(today);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    goToToday();
    await onWeekChange(weekStart);
  };

  const weekRange = `${state.currentWeekStart.toLocaleDateString(
    "de-DE"
  )} - ${state.currentWeekEnd.toLocaleDateString("de-DE")}`;

  return (
    <div className="flex items-center justify-between gap-4 bg-white p-4">
      <div className="flex items-center gap-2">
        <Button
          className="gap-1"
          onClick={handlePrev}
          size="sm"
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Week
        </Button>
        <Button
          className="gap-1"
          onClick={handleNext}
          size="sm"
          variant="outline"
        >
          Next Week
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button onClick={handleToday} size="sm" variant="ghost">
          Today
        </Button>
      </div>
      <div className="font-semibold text-slate-700 text-sm">{weekRange}</div>
    </div>
  );
}
