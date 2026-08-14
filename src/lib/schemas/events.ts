import { z } from "zod";

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(1, "Event title is required")
      .max(255, "Event title must be at most 255 characters")
      .trim(),
    description: z.string().trim().optional(),
    startAt: z
      .string()
      .datetime({ message: "Start time must be a valid datetime" }),
    endAt: z
      .string()
      .datetime({ message: "End time must be a valid datetime" }),
    allDay: z.boolean().default(false),
    type: z.enum(["event", "appointment", "reminder", "deadline"]),
    visibility: z.enum(["family", "personal"]).default("family"),
    assignees: z.array(z.string().uuid()).optional().default([]),
    tags: z.array(z.string().uuid()).optional().default([]),
    rrule: z.string().optional(),
  })
  .refine(
    (data) => {
      const startAt = new Date(data.startAt);
      const endAt = new Date(data.endAt);
      return endAt > startAt;
    },
    {
      message: "End time must be after start time",
      path: ["endAt"],
    }
  )
  .refine(
    (data) => {
      if (!data.allDay) {
        return true;
      }

      // For all-day events, end time must be at 23:59:59
      // Use string-based validation to avoid timezone issues
      return data.endAt.endsWith("23:59:59");
    },
    {
      message: "For all-day events, end time must be at 23:59:59",
      path: ["endAt"],
    }
  );

export type CreateEventFormData = z.infer<typeof createEventSchema>;

// Create update schema without refinements first, then add them
const updateEventBaseSchema = z.object({
  title: z
    .string()
    .min(1, "Event title is required")
    .max(255, "Event title must be at most 255 characters")
    .trim()
    .optional(),
  description: z.string().trim().optional(),
  startAt: z
    .string()
    .datetime({ message: "Start time must be a valid datetime" })
    .optional(),
  endAt: z
    .string()
    .datetime({ message: "End time must be a valid datetime" })
    .optional(),
  allDay: z.boolean().optional(),
  type: z.enum(["event", "appointment", "reminder", "deadline"]).optional(),
  visibility: z.enum(["family", "personal"]).optional(),
  assignees: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string().uuid()).optional(),
  rrule: z.string().optional(),
});

export const updateEventSchema = updateEventBaseSchema
  .refine(
    (data) => {
      if (!(data.startAt && data.endAt)) {
        return true;
      }
      const startAt = new Date(data.startAt);
      const endAt = new Date(data.endAt);
      return endAt > startAt;
    },
    {
      message: "End time must be after start time",
      path: ["endAt"],
    }
  )
  .refine(
    (data) => {
      // Only validate all-day format if endAt is provided
      if (!data.endAt) {
        return true;
      }
      // Only validate if this is an all-day update or if all-day was already true
      if (data.allDay !== true) {
        return true;
      }

      return data.endAt.endsWith("23:59:59");
    },
    {
      message: "For all-day events, end time must be at 23:59:59",
      path: ["endAt"],
    }
  );

export type UpdateEventFormData = z.infer<typeof updateEventSchema>;

export interface EventData {
  allDay: boolean;
  assignees?: Array<{ id: string; profile_id: string }>;
  createdAt: string;
  createdBy: string;
  description?: string;
  endAt: string;
  familyId: string;
  id: string;
  recurrenceCount?: number;
  recurrenceExpiresAt?: string;
  rrule?: string;
  startAt: string;
  tags?: Array<{ id: string; tag_id: string }>;
  title: string;
  type: "event" | "appointment" | "reminder" | "deadline";
  updatedAt: string;
  visibility: "family" | "personal";
}
