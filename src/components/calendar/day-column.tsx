"use client";

interface DayColumnHeaderProps {
  date: Date;
  dayWidthClass: string;
  isToday: boolean;
}

export function DayColumnHeader({
  date,
  isToday,
  dayWidthClass,
}: DayColumnHeaderProps) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayDate = date.getDate();
  const monthName = date.toLocaleDateString("en-US", { month: "short" });

  const bgColor = isToday
    ? "bg-primary/10 dark:bg-primary/20"
    : "bg-background";

  return (
    <div
      className={`flex flex-col items-center border-border border-r border-b last:border-r-0 ${bgColor} px-2 py-3 text-center ${dayWidthClass}`}
    >
      <div className={`font-semibold text-sm ${isToday ? "text-primary" : ""}`}>
        {dayName}
      </div>
      <div className={`font-bold text-lg ${isToday ? "text-primary" : ""}`}>
        {dayDate}
      </div>
      <div className="text-muted-foreground text-xs">{monthName}</div>
    </div>
  );
}
