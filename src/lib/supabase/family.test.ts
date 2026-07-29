import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFamilyMembers,
  getPendingInvitations,
  getUserFamilyMembership,
  validateAdminAccess,
} from "./family";
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

describe("getFamilyMembers", () => {
  const mockFamilyId = "family-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMembersResponse = (membersData: any, error: any = null) => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: membersData,
            error,
          }),
        }),
      }),
    }),
  });

  it("should fetch and return family members", async () => {
    const mockMembers = [
      {
        id: "member-1",
        user_id: "user-1",
        family_id: mockFamilyId,
        role: "admin",
        status: "active",
        joined_at: "2024-01-01T00:00:00Z",
        profiles: { display_name: "Admin User" },
      },
      {
        id: "member-2",
        user_id: "user-2",
        family_id: mockFamilyId,
        role: "member",
        status: "active",
        joined_at: "2024-01-02T00:00:00Z",
        profiles: { display_name: "Regular Member" },
      },
    ];

    const mockClient = createMembersResponse(mockMembers);
    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await getFamilyMembers(mockFamilyId);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "member-1",
      user_id: "user-1",
      family_id: mockFamilyId,
      role: "admin",
      status: "active",
      joined_at: "2024-01-01T00:00:00Z",
      display_name: "Admin User",
      email: undefined,
    });
  });

  it("should handle members without profile display_name", async () => {
    const mockMembers = [
      {
        id: "member-1",
        user_id: "user-1",
        family_id: mockFamilyId,
        role: "member",
        status: "active",
        joined_at: "2024-01-01T00:00:00Z",
        profiles: null,
      },
    ];

    const mockClient = createMembersResponse(mockMembers);
    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await getFamilyMembers(mockFamilyId);

    expect(result).toHaveLength(1);
    expect(result[0].display_name).toBeUndefined();
  });

  it("should return empty array when no members found", async () => {
    const mockClient = createMembersResponse([]);
    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await getFamilyMembers(mockFamilyId);

    expect(result).toEqual([]);
  });

  it("should throw error when database query fails", async () => {
    const mockError = new Error("Database connection failed");
    const mockClient = createMembersResponse(null, mockError);
    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    await expect(getFamilyMembers(mockFamilyId)).rejects.toThrow(
      "Failed to fetch family members"
    );
  });

  it("should throw error when family ID is empty", async () => {
    await expect(getFamilyMembers("")).rejects.toThrow("Family ID is required");
  });
});

describe("getPendingInvitations", () => {
  const mockFamilyId = "family-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createInvitationsResponse = (invData: any, error: any = null) => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: invData,
            error,
          }),
        }),
      }),
    }),
  });

  it("should fetch and return pending invitations", async () => {
    const mockInvitations = [
      {
        id: "inv-1",
        family_id: mockFamilyId,
        email: "newmember@example.com",
        token: "token-123",
        status: "pending",
        expires_at: "2024-12-31T23:59:59Z",
      },
      {
        id: "inv-2",
        family_id: mockFamilyId,
        email: "anothermember@example.com",
        token: "token-456",
        status: "pending",
        expires_at: "2024-12-30T23:59:59Z",
      },
    ];

    const mockClient = createInvitationsResponse(mockInvitations);
    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await getPendingInvitations(mockFamilyId);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockInvitations[0]);
  });

  it("should return empty array when no invitations found", async () => {
    const mockClient = createInvitationsResponse([]);
    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await getPendingInvitations(mockFamilyId);

    expect(result).toEqual([]);
  });

  it("should throw error when database query fails", async () => {
    const mockError = new Error("Database connection failed");
    const mockClient = createInvitationsResponse(null, mockError);
    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    await expect(getPendingInvitations(mockFamilyId)).rejects.toThrow(
      "Failed to fetch pending invitations"
    );
  });

  it("should throw error when family ID is empty", async () => {
    await expect(getPendingInvitations("")).rejects.toThrow(
      "Family ID is required"
    );
  });
});

describe("getUserFamilyMembership", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createUserMembershipResponse = (data: any, error: any = null) => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data,
            error,
          }),
        }),
      }),
    }),
  });

  it("should return user family membership with familyId, role and status", async () => {
    const mockClient = createUserMembershipResponse({
      family_id: "family-456",
      role: "admin",
      status: "active",
    });

    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await getUserFamilyMembership(mockUserId);

    expect(result).toEqual({
      familyId: "family-456",
      role: "admin",
      status: "active",
    });
  });

  it("should return member role when user is a regular member", async () => {
    const mockClient = createUserMembershipResponse({
      family_id: "family-789",
      role: "member",
      status: "active",
    });

    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    const result = await getUserFamilyMembership(mockUserId);

    expect(result).toEqual({
      familyId: "family-789",
      role: "member",
      status: "active",
    });
  });

  it("should throw error when user not in any family", async () => {
    const mockClient = createUserMembershipResponse(null);
    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    await expect(getUserFamilyMembership(mockUserId)).rejects.toThrow(
      "User not in any family"
    );
  });

  it("should throw error when database query fails", async () => {
    const mockError = new Error("Database connection failed");
    const mockClient = createUserMembershipResponse(null, mockError);
    vi.mocked(serverModule.createClient).mockResolvedValue(mockClient as any);

    await expect(getUserFamilyMembership(mockUserId)).rejects.toThrow();
  });

  it("should throw error when user ID is empty", async () => {
    await expect(getUserFamilyMembership("")).rejects.toThrow(
      "User ID is required"
    );
  });
});
