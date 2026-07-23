import { describe, expect, it } from "vitest";
import { inviteMembersSchema } from "@/lib/schemas/onboarding";

/**
 * Integration tests for the invite modal workflow
 * These tests focus on schema validation and data flow
 */
describe("InviteFirstMembersModal - Schema Validation", () => {
  it("should validate single email", () => {
    const result = inviteMembersSchema.safeParse({
      emails: ["test@example.com"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emails).toEqual(["test@example.com"]);
    }
  });

  it("should validate multiple emails", () => {
    const result = inviteMembersSchema.safeParse({
      emails: ["test1@example.com", "test2@example.com"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emails).toHaveLength(2);
    }
  });

  it("should trim and lowercase email addresses", () => {
    const result = inviteMembersSchema.safeParse({
      emails: ["  TEST@EXAMPLE.COM  ", "Another@Example.COM"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emails).toEqual([
        "test@example.com",
        "another@example.com",
      ]);
    }
  });

  it("should reject invalid email format", () => {
    const result = inviteMembersSchema.safeParse({
      emails: ["invalid-email"],
    });

    expect(result.success).toBe(false);
  });

  it("should reject duplicate emails", () => {
    const result = inviteMembersSchema.safeParse({
      emails: ["test@example.com", "test@example.com"],
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty email array", () => {
    const result = inviteMembersSchema.safeParse({
      emails: [],
    });

    expect(result.success).toBe(false);
  });

  it("should reject array with only empty strings", () => {
    const result = inviteMembersSchema.safeParse({
      emails: ["", "  "],
    });

    expect(result.success).toBe(false);
  });

  it("should filter out empty emails before validation", () => {
    // This simulates what the client component does
    const emails = ["test@example.com", "", "test2@example.com", "  "];
    const filledEmails = emails.filter((email) => email.trim().length > 0);

    const result = inviteMembersSchema.safeParse({
      emails: filledEmails,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emails).toHaveLength(2);
    }
  });
});
