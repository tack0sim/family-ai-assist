import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkUserFamilyContext,
  type FamilyContext,
} from "@/lib/supabase/check-family";
import * as serviceModule from "@/lib/supabase/service";

vi.mock("@/lib/supabase/service");

describe("checkUserFamilyContext", () => {
  const mockUserId = "user-123";
  const mockFamilyId = "family-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockServiceClient = (
    createdFamily: any = null,
    membership: any = null,
    createdError: any = null,
    memberError: any = null
  ) => ({
    from: vi.fn((table: string) => {
      if (table === "families") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: createdFamily,
                error: createdError,
              }),
            }),
          }),
        };
      }
      if (table === "family_members") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: membership,
                  error: memberError,
                }),
              }),
            }),
          }),
        };
      }
    }),
  });

  describe("returns FamilyContext object with new overload", () => {
    it("should return { familyId, exists: true } when user created a family", async () => {
      const mockClient = createMockServiceClient({ id: mockFamilyId });
      vi.mocked(serviceModule.createServiceRoleClient).mockReturnValue(
        mockClient as any
      );

      const result = await checkUserFamilyContext(mockUserId);

      expect(result).toEqual({
        familyId: mockFamilyId,
        exists: true,
      });
    });

    it("should return { familyId, exists: true } when user is active member of family", async () => {
      const membershipFamilyId = "family-789";
      const mockClient = createMockServiceClient(null, {
        family_id: membershipFamilyId,
      });
      vi.mocked(serviceModule.createServiceRoleClient).mockReturnValue(
        mockClient as any
      );

      const result = await checkUserFamilyContext(mockUserId);

      expect(result).toEqual({
        familyId: membershipFamilyId,
        exists: true,
      });
    });

    it("should return { familyId: '', exists: false } when user has no family context", async () => {
      const mockClient = createMockServiceClient(null, null);
      vi.mocked(serviceModule.createServiceRoleClient).mockReturnValue(
        mockClient as any
      );

      const result = await checkUserFamilyContext(mockUserId);

      expect(result).toEqual({
        familyId: "",
        exists: false,
      });
    });

    it("should return { familyId: '', exists: false } when userId is empty", async () => {
      const result = await checkUserFamilyContext("");

      expect(result).toEqual({
        familyId: "",
        exists: false,
      });
    });

    it("should prioritize created family over membership", async () => {
      const mockClient = createMockServiceClient(
        { id: mockFamilyId },
        { family_id: "family-789" }
      );
      vi.mocked(serviceModule.createServiceRoleClient).mockReturnValue(
        mockClient as any
      );

      const result = await checkUserFamilyContext(mockUserId);

      expect(result).toEqual({
        familyId: mockFamilyId,
        exists: true,
      });
    });

    it("should log errors but still return valid result", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockClient = createMockServiceClient(
        null,
        { family_id: mockFamilyId },
        new Error("Query error"),
        null
      );
      vi.mocked(serviceModule.createServiceRoleClient).mockReturnValue(
        mockClient as any
      );

      const result = await checkUserFamilyContext(mockUserId);

      expect(result).toEqual({
        familyId: mockFamilyId,
        exists: true,
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error checking created families:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("backward compatibility with boolean return", () => {
    it("should be explicitly typed as FamilyContext return type", async () => {
      const mockClient = createMockServiceClient({ id: mockFamilyId });
      vi.mocked(serviceModule.createServiceRoleClient).mockReturnValue(
        mockClient as any
      );

      const result: FamilyContext = await checkUserFamilyContext(mockUserId);

      expect(result).toBeDefined();
      expect(result.familyId).toBeDefined();
      expect(typeof result.exists).toBe("boolean");
    });
  });
});
