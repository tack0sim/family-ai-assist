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
  familyId: z.string().uuid("Family ID must be a valid UUID"),
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
