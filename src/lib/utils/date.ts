export function getWeekBoundaries(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return { weekStart, weekEnd };
}
