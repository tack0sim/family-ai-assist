import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFamilySchema, joinFamilySchema } from "@/lib/schemas/onboarding";

describe("Onboarding Schemas", () => {
  describe("createFamilySchema", () => {
    it("should validate a valid family name", () => {
      const result = createFamilySchema.safeParse({
        familyName: "Smith Family",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.familyName).toBe("Smith Family");
      }
    });

    it("should fail if family name is empty", () => {
      const result = createFamilySchema.safeParse({ familyName: "" });
      expect(result.success).toBe(false);
    });

    it("should fail if family name is less than 2 characters", () => {
      const result = createFamilySchema.safeParse({ familyName: "A" });
      expect(result.success).toBe(false);
    });

    it("should fail if family name exceeds 50 characters", () => {
      const longName = "A".repeat(51);
      const result = createFamilySchema.safeParse({ familyName: longName });
      expect(result.success).toBe(false);
    });

    it("should trim whitespace from family name", () => {
      const result = createFamilySchema.safeParse({
        familyName: "  Smith Family  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.familyName).toBe("Smith Family");
      }
    });
  });

  describe("joinFamilySchema", () => {
    it("should validate a valid invitation code", () => {
      const result = joinFamilySchema.safeParse({
        invitationCode: "ABC123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invitationCode).toBe("ABC123");
      }
    });

    it("should fail if invitation code is empty", () => {
      const result = joinFamilySchema.safeParse({ invitationCode: "" });
      expect(result.success).toBe(false);
    });

    it("should fail if invitation code is less than 6 characters", () => {
      const result = joinFamilySchema.safeParse({ invitationCode: "ABC12" });
      expect(result.success).toBe(false);
    });

    it("should trim whitespace from invitation code", () => {
      const result = joinFamilySchema.safeParse({
        invitationCode: "  ABC123DEF  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invitationCode).toBe("ABC123DEF");
      }
    });
  });
});
