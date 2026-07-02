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
        className="rounded-lg border border-border p-4"
        onChange={(selectedDate) => {
          setSelectedDate(selectedDate as Date);
        }}
        value={selectedDate}
      />
    </div>
  );
}
