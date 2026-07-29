import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateAdminAccess } from "./family";
import * as serverModule from "./server";

// Mock the server module
vi.mock("./server");

describe("validateAdminAccess", () => {
  const mockUserId = "user-123";
  const mockFamilyId = "family-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockClient = (data: any, error: any = null) => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data,
              error,
            }),
          }),
        }),
      }),
    }),
  });

  it("should return isAdmin=true when user is active admin", async () => {
    const mockClient = createMockClient({
      role: "admin",
      status: "active",
    });

    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await validateAdminAccess(mockUserId, mockFamilyId);

    expect(result).toEqual({
      isAdmin: true,
      role: "admin",
    });
  });

  it("should return isAdmin=false when user is active member but not admin", async () => {
    const mockClient = createMockClient({
      role: "member",
      status: "active",
    });

    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await validateAdminAccess(mockUserId, mockFamilyId);

    expect(result).toEqual({
      isAdmin: false,
      role: "member",
    });
  });

  it("should return isAdmin=false when user is not a member of the family", async () => {
    const mockClient = createMockClient(null);

    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await validateAdminAccess(mockUserId, mockFamilyId);

    expect(result).toEqual({
      isAdmin: false,
    });
  });

  it("should return isAdmin=false when user has pending membership", async () => {
    const mockClient = createMockClient({
      role: "admin",
      status: "pending",
    });

    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await validateAdminAccess(mockUserId, mockFamilyId);

    expect(result).toEqual({
      isAdmin: false,
      role: "admin",
    });
  });

  it("should throw error when database query fails", async () => {
    const mockError = new Error("Database connection failed");
    const mockClient = createMockClient(null, mockError);

    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    await expect(validateAdminAccess(mockUserId, mockFamilyId)).rejects.toThrow(
      "Database connection failed"
    );
  });

  it("should throw error when user ID is empty", async () => {
    const mockClient = createMockClient({});

    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    await expect(validateAdminAccess("", mockFamilyId)).rejects.toThrow(
      "User ID and Family ID are required"
    );
  });

  it("should throw error when family ID is empty", async () => {
    const mockClient = createMockClient({});

    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    await expect(validateAdminAccess(mockUserId, "")).rejects.toThrow(
      "User ID and Family ID are required"
    );
  });
});
