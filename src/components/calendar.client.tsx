"use client";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./calendar.css";
import { useState } from "react";

export function CalendarUI() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  return (
    <div className="flex justify-center">
      <Calendar
        value={selectedDate}
        onChange={(date) => {
          if (date instanceof Date) {
            setSelectedDate(date);
          }
        }}
        className="rounded-lg border border-border p-4"
      />
    </div>
  );
}
