"use client";

import { useContext } from "react";
import { CalendarContext } from "@/lib/calendar-provider";

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within CalendarProvider");
  }
  return context;
}
