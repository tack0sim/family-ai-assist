"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { EventTag } from "@/lib/schemas/settings";
import { EventTagsSection } from "./family/event-tags-section.client";

interface EventsTabProps {
  familyId: string;
  initialEventTags: EventTag[];
  userRole: "admin" | "member";
}

export function EventsTab({
  familyId,
  initialEventTags,
  userRole,
}: EventsTabProps) {
  // Only admins can manage event tags
  if (userRole !== "admin") {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-600">
            Only family admins can manage event tags
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <EventTagsSection familyId={familyId} initialTags={initialEventTags} />
  );
}
