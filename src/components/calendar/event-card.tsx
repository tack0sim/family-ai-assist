"use client";

import { Badge } from "@/components/ui/badge";
import type { ViewportBreakpoint } from "@/hooks/use-responsive-days";
import type { EventWithDetails } from "@/lib/types/events";
import { cn } from "@/lib/utils";

interface EventCardProps {
  breakpoint?: ViewportBreakpoint;
  event: EventWithDetails;
  isAllDay?: boolean;
}

const eventTypeColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  event: {
    bg: "bg-blue-50/90 dark:bg-blue-950/90",
    text: "text-blue-900 dark:text-blue-200",
    border: "border-blue-200 dark:border-blue-800",
  },
  appointment: {
    bg: "bg-purple-50/90 dark:bg-purple-950/90",
    text: "text-purple-900 dark:text-purple-200",
    border: "border-purple-200 dark:border-purple-800",
  },
  reminder: {
    bg: "bg-orange-50/90 dark:bg-orange-950/90",
    text: "text-orange-900 dark:text-orange-200",
    border: "border-orange-200 dark:border-orange-800",
  },
  deadline: {
    bg: "bg-red-50/90 dark:bg-red-950/90",
    text: "text-red-900 dark:text-red-200",
    border: "border-red-200 dark:border-red-800",
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

export function EventCard({
  event,
  isAllDay = false,
  breakpoint = "desktop",
}: EventCardProps) {
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

  // Responsive sizing
  const isMobile = breakpoint === "mobile";
  const maxAssignees = isMobile ? 3 : 2;

  return (
    <div
      className={cn(
        "h-full truncate rounded-md border border-l-4",
        colors.bg,
        colors.border,
        isMobile ? "p-3" : "p-2"
      )}
    >
      <div className="mb-1 flex flex-col items-start justify-between gap-2 truncate">
        <Badge className="shrink-0 text-xs" variant={variant}>
          {event.event.type}
        </Badge>
        <h3
          className={cn(
            "font-semibold",
            colors.text,
            isMobile ? "text-base" : "text-sm"
          )}
        >
          {event.event.title}
        </h3>
      </div>

      {!isAllDay && (
        <p className={cn("text-xs", colors.text, "opacity-75")}>
          {startTime} - {endTime}
        </p>
      )}

      {event.event.description && (
        <p
          className={cn(
            "mt-1 text-xs",
            colors.text,
            "opacity-75",
            isMobile ? "line-clamp-3" : "line-clamp-2"
          )}
        >
          {event.event.description}
        </p>
      )}

      {event.assignees && event.assignees.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {event.assignees.slice(0, maxAssignees).map((assignee) => {
            const displayName = assignee.profiles?.display_name || "Unknown";
            const firstName = displayName.split(" ")[0];
            return (
              <Badge
                className="text-xs"
                key={assignee.profile_id}
                variant="outline"
              >
                {firstName}
              </Badge>
            );
          })}
          {event.assignees.length > maxAssignees && (
            <Badge className="text-xs" variant="outline">
              +{event.assignees.length - maxAssignees}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
