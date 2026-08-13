import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be at most 100 characters")
    .trim(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export const createChildProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be at most 100 characters")
    .trim(),
  dateOfBirth: z.string().date().optional(),
});

export type CreateChildProfileFormData = z.infer<
  typeof createChildProfileSchema
>;

export const eventTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be at most 50 characters")
    .trim(),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Color must be a valid hex format (e.g., #FF5733)"
    )
    .optional(),
});

export type EventTagFormData = z.infer<typeof eventTagSchema>;

export interface EventTag {
  color: string | null;
  created_at: string;
  created_by: string;
  family_id: string;
  id: string;
  name: string;
}
