"use client";

import { Badge } from "@/components/ui/badge";
import type { EventWithDetails } from "@/lib/types/events";

interface EventCardProps {
  event: EventWithDetails;
  isAllDay?: boolean;
}

const eventTypeColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  event: {
    bg: "bg-blue-50",
    text: "text-blue-900",
    border: "border-blue-200",
  },
  appointment: {
    bg: "bg-purple-50",
    text: "text-purple-900",
    border: "border-purple-200",
  },
  reminder: {
    bg: "bg-orange-50",
    text: "text-orange-900",
    border: "border-orange-200",
  },
  deadline: {
    bg: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
  },
};

const eventTypeBadgeVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  event: "default",
  appointment: "secondary",
  reminder: "outline",
  deadline: "destructive",
};

export function EventCard({ event, isAllDay = false }: EventCardProps) {
  const colors = eventTypeColors[event.event.type] || eventTypeColors.event;
  const variant = eventTypeBadgeVariants[event.event.type] || "default";

  const startTime = new Date(event.event.start_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const endTime = new Date(event.event.end_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div
      className={`rounded-md border p-2 ${colors.bg} ${colors.border} border-l-4`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className={`truncate font-semibold text-sm ${colors.text}`}>
          {event.event.title}
        </h3>
        <Badge className="flex-shrink-0 text-xs" variant={variant}>
          {event.event.type}
        </Badge>
      </div>

      {!isAllDay && (
        <p className={`text-xs ${colors.text} opacity-75`}>
          {startTime} - {endTime}
        </p>
      )}

      {event.event.description && (
        <p className={`mt-1 line-clamp-2 text-xs ${colors.text} opacity-75`}>
          {event.event.description}
        </p>
      )}

      {event.assignees && event.assignees.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {event.assignees.slice(0, 2).map((assignee) => (
            <Badge
              className="text-xs"
              key={assignee.profile_id}
              variant="outline"
            >
              👤
            </Badge>
          ))}
          {event.assignees.length > 2 && (
            <Badge className="text-xs" variant="outline">
              +{event.assignees.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
