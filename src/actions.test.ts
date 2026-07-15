import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js modules first
vi.mock("next/headers");
vi.mock("next/navigation");

// Mock Supabase modules
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/supabase/service");

// Mock utilities
vi.mock("@/lib/utils/get-base-url");
vi.mock("@/lib/supabase/check-family");

// Mock Resend (email service)
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        data: { id: "email-message-id" },
        error: null,
      }),
    },
  })),
}));

// Mock react-email render
vi.mock("react-email", () => ({
  render: vi.fn((component: any) => "<html>Mock Email HTML</html>"),
  Button: ({ children, href }: any) =>
    `<button href="${href}">${children}</button>`,
  Container: ({ children }: any) => `<div>${children}</div>`,
  Head: () => "<head></head>",
  Hr: () => "<hr />",
  Html: ({ children }: any) => `<html>${children}</html>`,
  Preview: ({ children }: any) => `<div>${children}</div>`,
  Section: ({ children }: any) => `<section>${children}</section>`,
  Text: ({ children }: any) => `<p>${children}</p>`,
}));

import {
  acceptInvitation,
  createFamily,
  inviteMembers,
  removeMember,
  resendInvitation,
  revokeInvitation,
  signIn,
  signUp,
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

    const familyId = "family-123";
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
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      }),
    };

    const mockServiceClient = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: null,
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

    const mockServiceClient = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: null,
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
    const { headers } = await import("next/headers");
    const { getBaseURL } = await import("@/lib/utils/get-base-url");

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
              user_metadata: {
                display_name: "Admin User",
              },
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
        if (table === "families") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: familyId, name: "Test Family" },
                  error: null,
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
    vi.mocked(headers).mockResolvedValue({} as any);
    vi.mocked(getBaseURL).mockReturnValue("https://test.example.com");

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

describe("Family Management - revokeInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should revoke invitation when caller is admin", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");

    const familyId = "family-123";
    const userId = "admin-user";
    const invitationId = "invite-id-123";

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

    const invitationsTable = {
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
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
    };

    const mockServiceClient = {
      from: (table: string) => {
        if (table === "family_members") {
          return familyMembersTable;
        }
        if (table === "invitations") {
          return invitationsTable;
        }
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);

    // Act
    await revokeInvitation(familyId, invitationId);

    // Assert
    expect(invitationsTable.delete).toHaveBeenCalled();
  });

  it("should throw error if family ID is missing", async () => {
    // Act & Assert
    await expect(revokeInvitation("", "invite-id")).rejects.toThrow(
      "Family ID is required"
    );
  });

  it("should throw error if invitation ID is missing", async () => {
    // Act & Assert
    await expect(revokeInvitation("family-123", "")).rejects.toThrow(
      "Invitation ID is required"
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
    await expect(revokeInvitation("family-123", "invite-id")).rejects.toThrow(
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
    await expect(revokeInvitation("family-123", "invite-id")).rejects.toThrow(
      "User is not admin of this family"
    );
  });
});

describe("Family Management - resendInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resend invitation with new token and expiry when caller is admin", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { headers } = await import("next/headers");
    const { getBaseURL } = await import("@/lib/utils/get-base-url");

    const familyId = "family-123";
    const userId = "admin-user";
    const invitationId = "invite-id-123";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email: "admin@example.com",
              user_metadata: {
                display_name: "Admin User",
              },
            },
          },
        }),
      },
    };

    const invitationsTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: invitationId,
                family_id: familyId,
                email: "invited@example.com",
                token: "old-token",
                expires_at: new Date(Date.now() + 86_400_000).toISOString(),
              },
              error: null,
            }),
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
    };

    const familiesTable = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: familyId, name: "Test Family" },
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
        if (table === "invitations") {
          return invitationsTable;
        }
        if (table === "families") {
          return familiesTable;
        }
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);
    vi.mocked(headers).mockResolvedValue({} as any);
    vi.mocked(getBaseURL).mockReturnValue("https://test.example.com");

    // Act
    await resendInvitation(familyId, invitationId);

    // Assert
    const updateCalls = (invitationsTable.update as any).mock.calls;
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0][0]).toHaveProperty("token");
    expect(updateCalls[0][0]).toHaveProperty("expires_at");
  });

  it("should throw error if family ID is missing", async () => {
    // Act & Assert
    await expect(resendInvitation("", "invite-id")).rejects.toThrow(
      "Family ID is required"
    );
  });

  it("should throw error if invitation ID is missing", async () => {
    // Act & Assert
    await expect(resendInvitation("family-123", "")).rejects.toThrow(
      "Invitation ID is required"
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
    await expect(resendInvitation("family-123", "invite-id")).rejects.toThrow(
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
    await expect(resendInvitation("family-123", "invite-id")).rejects.toThrow(
      "User is not admin of this family"
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
              id: "admin-user",
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
        if (table === "invitations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
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
    await expect(resendInvitation("family-123", "invalid-id")).rejects.toThrow(
      "Invitation not found"
    );
  });
});

describe("Auth - Family Context Checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn - redirect based on family context", () => {
    it("should redirect to /onboarding if user has no family context", async () => {
      // Arrange
      const { createClient } = await import("@/lib/supabase/server");
      const { redirect } = await import("next/navigation");
      const { checkUserFamilyContext } = await import(
        "@/lib/supabase/check-family"
      );

      const mockSupabaseClient = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "user@example.com" },
              session: { access_token: "token-123" },
            },
            error: null,
          }),
        },
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
      vi.mocked(checkUserFamilyContext).mockResolvedValue(false);
      vi.mocked(redirect).mockImplementation(() => {
        throw new Error("REDIRECT_/onboarding");
      });

      // Act
      const formData = new FormData();
      formData.append("email", "user@example.com");
      formData.append("password", "password123");

      try {
        await signIn(formData);
      } catch (error) {
        // Expected redirect
      }

      // Assert
      expect(redirect).toHaveBeenCalledWith("/onboarding");
    });

    it("should redirect to / if user has family context", async () => {
      // Arrange
      const { createClient } = await import("@/lib/supabase/server");
      const { redirect } = await import("next/navigation");
      const { checkUserFamilyContext } = await import(
        "@/lib/supabase/check-family"
      );

      const mockSupabaseClient = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "user@example.com" },
              session: { access_token: "token-123" },
            },
            error: null,
          }),
        },
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
      vi.mocked(checkUserFamilyContext).mockResolvedValue(true);
      vi.mocked(redirect).mockImplementation(() => {
        throw new Error("REDIRECT_/");
      });

      // Act
      const formData = new FormData();
      formData.append("email", "user@example.com");
      formData.append("password", "password123");

      try {
        await signIn(formData);
      } catch (error) {
        // Expected redirect
      }

      // Assert
      expect(redirect).toHaveBeenCalledWith("/");
    });
  });

  describe("signUp - should not check family during signup", () => {
    it("should redirect to /auth/check-email after successful signup", async () => {
      // Arrange
      const { createClient } = await import("@/lib/supabase/server");
      const { redirect } = await import("next/navigation");

      const mockSupabaseClient = {
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-456",
                email: "newuser@example.com",
              },
            },
            error: null,
          }),
        },
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
      vi.mocked(redirect).mockImplementation(() => {
        throw new Error("REDIRECT_/auth/check-email");
      });

      // Act
      const formData = new FormData();
      formData.append("email", "newuser@example.com");
      formData.append("password", "password123");
      formData.append("confirm-password", "password123");

      try {
        await signUp(formData);
      } catch (error) {
        // Expected redirect
      }

      // Assert
      expect(redirect).toHaveBeenCalledWith("/auth/check-email");
    });
  });
});
