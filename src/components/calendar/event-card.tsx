"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ViewportBreakpoint } from "@/hooks/use-responsive-days";
import type { EventWithDetails } from "@/lib/types/events";
import { cn } from "@/lib/utils";
import type { EventSegment } from "@/lib/utils/event-segments";
import { EventCardDialog } from "./event-card-dialog";

interface EventCardProps {
  breakpoint?: ViewportBreakpoint;
  event: EventWithDetails;
  isAllDay?: boolean;
  segment?: EventSegment;
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
  segment,
}: EventCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const colors = eventTypeColors[event.event.type] || eventTypeColors.event;
  const variant = eventTypeBadgeVariants[event.event.type] || "default";

  // Use segment times if available, otherwise use event times
  let startTime: string;
  let endTime: string;

  if (segment) {
    const startDate = new Date(
      2024,
      0,
      1,
      segment.startHour,
      segment.startMinute
    );
    const endDate = new Date(2024, 0, 1, segment.endHour, segment.endMinute);

    startTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    endTime = endDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else {
    startTime = new Date(event.event.start_at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    endTime = new Date(event.event.end_at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // Responsive sizing
  const isMobile = breakpoint === "mobile";
  const maxAssignees = isMobile ? 3 : 2;

  // Show continuation indicator if multi-day event
  const isMultiDay = segment && segment.totalSegments > 1;
  const isFirstSegment = segment && segment.segmentNumber === 1;
  const isLastSegment =
    segment && segment.segmentNumber === segment.totalSegments;

  return (
    <>
      <div
        className={cn(
          "flex h-full w-full cursor-pointer flex-col items-start justify-start gap-1 overflow-hidden rounded-md border border-l-4",
          colors.bg,
          colors.border,
          isMobile ? "p-3" : "p-2"
        )}
        data-slot="event-card"
        onClick={() => setIsDialogOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsDialogOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div
          className="flex w-full flex-col items-start justify-between gap-1"
          data-slot="event-title-time"
        >
          <h3
            className={cn(
              "w-full truncate font-semibold",
              colors.text,
              isMobile ? "text-base" : "text-sm"
            )}
            data-slot="event-card-title"
          >
            {event.event.title}
          </h3>
          {!isAllDay && (
            <p
              className={cn("text-xs", colors.text, "opacity-75")}
              data-slot="event-card-time"
            >
              {startTime} - {endTime}
            </p>
          )}
        </div>

        {event.assignees && event.assignees.length > 0 && (
          <div
            className="flex flex-wrap gap-1"
            data-slot="event-card-assignees"
          >
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

        {event.event.description && (
          <p
            className={cn(
              "text-xs",
              colors.text,
              "opacity-75",
              isMobile ? "line-clamp-3" : "line-clamp-2"
            )}
            data-slot="event-card-description"
          >
            {event.event.description}
          </p>
        )}
        {event.event.type && (
          <Badge
            className="shrink-0 text-xs"
            data-slot="event-card-badge"
            variant={variant}
          >
            {event.event.type}
          </Badge>
        )}
      </div>
      {isDialogOpen && (
        <EventCardDialog
          event={event}
          onClose={() => setIsDialogOpen(false)}
          open={true}
        />
      )}
    </>
  );
}
