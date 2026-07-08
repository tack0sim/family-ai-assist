import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js modules first
vi.mock("next/headers");
vi.mock("next/navigation");

// Mock Supabase modules
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/supabase/service");

// Mock utilities
vi.mock("@/lib/utils/get-base-url");

// Mock Resend (email service)
vi.mock("resend");

import {
  acceptInvitation,
  createFamily,
  inviteMembers,
  removeMember,
  updateMemberRole,
} from "./actions";

describe("Family Management - createFamily", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a family and set current user as admin with active status", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { redirect } = await import("next/navigation");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-123",
              email: "user@example.com",
            },
          },
        }),
      },
    };

    const familyId = "family-123";
    const mockServiceClient = {
      from: vi.fn((table: string) => {
        if (table === "families") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: familyId },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "family_members") {
          return {
            insert: vi.fn().mockReturnValue({
              data: null,
              error: null,
            }),
          };
        }
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("REDIRECT_/");
    });

    // Act
    const formData = new FormData();
    formData.append("name", "Smith Family");

    try {
      await createFamily(formData);
    } catch (error: any) {
      // Expected redirect
    }

    // Assert
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("should throw error if family name is missing", async () => {
    // Act & Assert
    const formData = new FormData();
    await expect(createFamily(formData)).rejects.toThrow("Missing family name");
  });

  it("should throw error if user is not authenticated", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    // Act & Assert
    const formData = new FormData();
    formData.append("name", "Test Family");

    await expect(createFamily(formData)).rejects.toThrow("Not authenticated");
  });

  it("should throw error if family creation fails", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-123",
              email: "user@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act & Assert
    const formData = new FormData();
    formData.append("name", "Test Family");

    await expect(createFamily(formData)).rejects.toThrow("Database error");
  });
});

describe("Family Management - acceptInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accept invitation and add user to family with active status", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { redirect } = await import("next/navigation");

    const token = "invite-token-123";
    const familyId = "family-456";
    const userId = "user-456";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email: "invited@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: vi.fn((table: string) => {
        if (table === "invitations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "invite-id-123",
                    family_id: familyId,
                    email: "invited@example.com",
                    expires_at: new Date(Date.now() + 86_400_000).toISOString(), // 1 day from now
                    status: "pending",
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
        if (table === "family_members") {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("REDIRECT_/");
    });

    // Act
    try {
      await acceptInvitation(token);
    } catch (error: any) {
      // Expected redirect
    }

    // Assert
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("should throw error if invitation token is missing", async () => {
    // Act & Assert
    await expect(acceptInvitation("")).rejects.toThrow(
      "Missing invitation token"
    );
  });

  it("should throw error if user is not authenticated", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    // Act & Assert
    await expect(acceptInvitation("token-123")).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("should throw error if invitation not found", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-456",
              email: "user@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act & Assert
    await expect(acceptInvitation("invalid-token")).rejects.toThrow(
      "Invitation not found"
    );
  });

  it("should throw error if invitation has expired", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-456",
              email: "user@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "invite-id",
                family_id: "family-id",
                email: "user@example.com",
                expires_at: new Date(Date.now() - 86_400_000).toISOString(), // 1 day ago
                status: "pending",
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act & Assert
    await expect(acceptInvitation("expired-token")).rejects.toThrow(
      "Invitation expired"
    );
  });

  it("should throw error if invitation is not pending", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-456",
              email: "user@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "invite-id",
                family_id: "family-id",
                email: "user@example.com",
                expires_at: new Date(Date.now() + 86_400_000).toISOString(),
                status: "accepted",
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act & Assert
    await expect(acceptInvitation("accepted-token")).rejects.toThrow(
      "Invitation not pending"
    );
  });
});

describe("Family Management - inviteMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create invitation records and send emails for each recipient", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const familyId = "family-123";
    const userId = "user-123";
    const emails = ["alice@example.com", "bob@example.com"];

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email: "admin@example.com",
            },
          },
        }),
      },
    };

    let insertCalls = 0;
    const mockServiceClient = {
      from: vi.fn((table: string) => {
        if (table === "family_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { role: "admin" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "invitations") {
          return {
            insert: vi.fn((data) => {
              // Track that insert was called with invitations
              if (Array.isArray(data)) {
                insertCalls = data.length;
              } else {
                insertCalls = 1;
              }
              return Promise.resolve({
                data: null,
                error: null,
              });
            }),
          };
        }
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act
    await inviteMembers(familyId, emails);

    // Assert
    expect(mockServiceClient.from).toHaveBeenCalledWith("invitations");
    expect(insertCalls).toBe(2); // Should insert 2 invitation records
  });

  it("should throw error if family ID is missing", async () => {
    // Act & Assert
    await expect(inviteMembers("", ["test@example.com"])).rejects.toThrow(
      "Missing family ID"
    );
  });

  it("should throw error if emails array is empty", async () => {
    // Act & Assert
    await expect(inviteMembers("family-123", [])).rejects.toThrow(
      "No emails provided"
    );
  });

  it("should throw error if user is not authenticated", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    // Act & Assert
    await expect(
      inviteMembers("family-123", ["test@example.com"])
    ).rejects.toThrow("Not authenticated");
  });

  it("should throw error if user is not admin of family", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-456",
              email: "user@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: vi.fn((table: string) => {
        if (table === "family_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { role: "member" }, // Not admin
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act & Assert
    await expect(
      inviteMembers("family-123", ["test@example.com"])
    ).rejects.toThrow("User is not admin of this family");
  });
});

describe("Family Management - updateMemberRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update member role when caller is admin", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const familyId = "family-123";
    const userId = "admin-user";
    const memberId = "member-user";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email: "admin@example.com",
            },
          },
        }),
      },
    };

    const familyMembersTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: "admin" },
              error: null,
            }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    };

    const mockServiceClient = {
      from: (table: string) => {
        if (table === "family_members") {
          return familyMembersTable;
        }
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act
    await updateMemberRole(familyId, memberId, "viewer");

    // Assert
    expect(familyMembersTable.update).toHaveBeenCalledWith({
      role: "viewer",
    });
  });

  it("should throw error if family ID is missing", async () => {
    // Act & Assert
    await expect(updateMemberRole("", "member-id", "member")).rejects.toThrow(
      "Family ID is required"
    );
  });

  it("should throw error if member ID is missing", async () => {
    // Act & Assert
    await expect(updateMemberRole("family-123", "", "member")).rejects.toThrow(
      "Member ID is required"
    );
  });

  it("should throw error if role is invalid", async () => {
    // Act & Assert
    await expect(
      updateMemberRole("family-123", "member-id", "superadmin" as any)
    ).rejects.toThrow("Invalid role");
  });

  it("should throw error if user is not authenticated", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    // Act & Assert
    await expect(
      updateMemberRole("family-123", "member-id", "member")
    ).rejects.toThrow("Not authenticated");
  });

  it("should throw error if user is not admin of family", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "member-user",
              email: "member@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: vi.fn((table: string) => {
        if (table === "family_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { role: "member" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act & Assert
    await expect(
      updateMemberRole("family-123", "member-id", "admin")
    ).rejects.toThrow("User is not admin of this family");
  });

  it("should throw error if admin tries to remove own admin status", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const userId = "admin-user";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email: "admin@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: vi.fn((table: string) => {
        if (table === "family_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { role: "admin" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act & Assert
    await expect(
      updateMemberRole("family-123", userId, "member")
    ).rejects.toThrow("Admin cannot remove their own admin status");
  });
});

describe("Family Management - removeMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should remove member when caller is admin", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const familyId = "family-123";
    const userId = "admin-user";
    const memberId = "member-user";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email: "admin@example.com",
            },
          },
        }),
      },
    };

    const familyMembersTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: "admin" },
              error: null,
            }),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    };

    const mockServiceClient = {
      from: (table: string) => {
        if (table === "family_members") {
          return familyMembersTable;
        }
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act
    await removeMember(familyId, memberId);

    // Assert
    expect(familyMembersTable.delete).toHaveBeenCalled();
  });

  it("should throw error if family ID is missing", async () => {
    // Act & Assert
    await expect(removeMember("", "member-id")).rejects.toThrow(
      "Family ID is required"
    );
  });

  it("should throw error if member ID is missing", async () => {
    // Act & Assert
    await expect(removeMember("family-123", "")).rejects.toThrow(
      "Member ID is required"
    );
  });

  it("should throw error if user is not authenticated", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);

    // Act & Assert
    await expect(removeMember("family-123", "member-id")).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("should throw error if user is not admin of family", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "member-user",
              email: "member@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: (table: string) => {
        if (table === "family_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { role: "member" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act & Assert
    await expect(removeMember("family-123", "member-id")).rejects.toThrow(
      "User is not admin of this family"
    );
  });

  it("should throw error if admin tries to remove themselves", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const userId = "admin-user";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email: "admin@example.com",
            },
          },
        }),
      },
    };

    const mockServiceClient = {
      from: (table: string) => {
        if (table === "family_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { role: "admin" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act & Assert
    await expect(removeMember("family-123", userId)).rejects.toThrow(
      "Admin cannot remove themselves"
    );
  });
});
