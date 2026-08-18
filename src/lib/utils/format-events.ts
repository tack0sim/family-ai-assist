import type { EventWithDetails } from "@/lib/types/events";

export function formatEventResponse(data: any[]): EventWithDetails[] {
  return data.map((item) => ({
    event: {
      id: item.id,
      family_id: item.familyId,
      created_by: item.createdBy,
      title: item.title,
      description: item.description,
      start_at: item.startAt,
      end_at: item.endAt,
      all_day: item.allDay,
      type: item.type,
      visibility: item.visibility,
      rrule: item.rrule,
      recurrence_count: item.recurrenceCount,
      recurrence_expires_at: item.recurrenceExpiresAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    },
    assignees: item.assignees,
    tags: item.tags,
  }));
}
