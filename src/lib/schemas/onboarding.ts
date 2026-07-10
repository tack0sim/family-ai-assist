import { z } from "zod";

export const createFamilySchema = z.object({
  familyName: z
    .string()
    .min(1, "Family name is required")
    .min(2, "Family name must be at least 2 characters")
    .max(50, "Family name must be at most 50 characters")
    .trim(),
});

export const joinFamilySchema = z.object({
  invitationCode: z
    .string()
    .min(1, "Invitation code is required")
    .min(6, "Invitation code must be at least 6 characters")
    .trim(),
});

export type CreateFamilyFormData = z.infer<typeof createFamilySchema>;
export type JoinFamilyFormData = z.infer<typeof joinFamilySchema>;
