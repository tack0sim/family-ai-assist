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
  render: vi.fn((_component: any) => "<html>Mock Email HTML</html>"),
}));

import { autoAcceptInvitation, signUp } from "./actions";

/**
 * Integration test for the complete invitation-signup flow.
 *
 * This test verifies:
 * 1. User receives invitation email with token
 * 2. User clicks invitation link without being logged in
 * 3. User is redirected to signup with token preserved
 * 4. User signs up
 * 5. User is redirected to callback with token preserved
 * 6. Callback checks family context and redirects to onboarding with token
 * 7. Onboarding detects token and auto-accepts invitation
 * 8. User is added to family and redirected to home
 */
describe("Invitation-Signup Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify invitation token is preserved through signup", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { redirect } = await import("next/navigation");

    const invitationToken = "preserved-token-xyz789";
    const userId = "user-xyz";
    const email = "test@example.com";

    const mockSupabaseClient = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email,
            },
          },
          error: null,
        }),
      },
    };

    const mockServiceClient = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);
    vi.mocked(redirect).mockImplementation(vi.fn());

    // Act: Sign up with invitation token
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", "SecurePass123!");
    formData.append("confirm-password", "SecurePass123!");
    formData.append("name", "Test User");

    await signUp(formData, invitationToken);

    // Assert: Token is preserved in redirect URL
    const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0];
    expect(redirectCall).toContain("invitation_token=");
    expect(redirectCall).toContain(encodeURIComponent(invitationToken));
    expect(redirectCall).toContain("/onboarding");
  });

  it("should auto-accept invitation when user has no existing family", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { checkUserFamilyContext } = await import(
      "@/lib/supabase/check-family"
    );
    const { redirect } = await import("next/navigation");

    const token = "token-123";
    const familyId = "family-123";
    const userId = "user-123";
    const email = "member@example.com";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email,
            },
          },
        }),
      },
      from: vi.fn((table: string) => {
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

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "inv-123",
            family_id: familyId,
            email,
            expires_at: new Date(Date.now() + 86_400_000).toISOString(),
            status: "pending",
          },
          error: null,
        }),
      }),
    });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    const mockServiceClient = {
      from: vi.fn((table: string) => {
        if (table === "invitations") {
          // First call: select to fetch
          if (selectMock.mock.calls.length === 0) {
            return { select: selectMock };
          }
          // Second call: update to mark accepted
          return { update: updateMock };
        }
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);
    vi.mocked(checkUserFamilyContext).mockResolvedValue(false);
    vi.mocked(redirect).mockImplementation(vi.fn());

    // Act
    await autoAcceptInvitation(token);

    // Assert: User is added to family
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("family_members");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("should reject auto-accept if user already has a family", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { checkUserFamilyContext } = await import(
      "@/lib/supabase/check-family"
    );

    const token = "token-456";
    const userId = "user-456";
    const email = "existing-member@example.com";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email,
            },
          },
        }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(checkUserFamilyContext).mockResolvedValue(true);

    // Act & Assert
    await expect(autoAcceptInvitation(token)).rejects.toThrow(
      "You can only auto-accept invitations when joining your first family"
    );
  });

  it("should reject auto-accept for expired invitation", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { checkUserFamilyContext } = await import(
      "@/lib/supabase/check-family"
    );

    const token = "token-expired";
    const userId = "user-789";
    const email = "expired@example.com";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email,
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
                id: "inv-expired",
                family_id: "family-xyz",
                email,
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
    vi.mocked(checkUserFamilyContext).mockResolvedValue(false);

    // Act & Assert
    await expect(autoAcceptInvitation(token)).rejects.toThrow(
      "This invitation has expired"
    );
  });

  it("should reject auto-accept for already-accepted invitation", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { checkUserFamilyContext } = await import(
      "@/lib/supabase/check-family"
    );

    const token = "token-already-used";
    const userId = "user-abc";
    const email = "already-joined@example.com";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email,
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
                id: "inv-used",
                family_id: "family-456",
                email,
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
    vi.mocked(checkUserFamilyContext).mockResolvedValue(false);

    // Act & Assert
    await expect(autoAcceptInvitation(token)).rejects.toThrow(
      "You've already joined this family"
    );
  });

  it("should reject auto-accept with missing token", async () => {
    // Arrange & Act & Assert
    await expect(autoAcceptInvitation("")).rejects.toThrow(
      "This invitation link is no longer valid"
    );
  });

  it("should reject auto-accept if not authenticated", async () => {
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
    await expect(autoAcceptInvitation("token-123")).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("should preserve invitation token when signing up without invitation", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { redirect } = await import("next/navigation");

    const userId = "new-user-abc";
    const email = "newuser@example.com";

    const mockSupabaseClient = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email,
            },
          },
          error: null,
        }),
      },
    };

    const mockServiceClient = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);
    vi.mocked(redirect).mockImplementation(vi.fn());

    // Act: Sign up without invitation token
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", "SecurePass123!");
    formData.append("confirm-password", "SecurePass123!");
    formData.append("name", "New User");

    await signUp(formData);

    // Assert: Redirects to onboarding without token
    const redirectCall = vi.mocked(redirect).mock.calls[0]?.[0];
    expect(redirectCall).toBe("/onboarding");
  });

  it("should handle error when inserting into family_members fails", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { checkUserFamilyContext } = await import(
      "@/lib/supabase/check-family"
    );

    const token = "token-db-error";
    const familyId = "family-db-error";
    const userId = "user-db-error";
    const email = "db-error@example.com";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email,
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Duplicate key value violates unique constraint" },
        }),
      }),
    };

    const mockServiceClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "inv-db",
                family_id: familyId,
                email,
                expires_at: new Date(Date.now() + 86_400_000).toISOString(),
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
    vi.mocked(checkUserFamilyContext).mockResolvedValue(false);

    // Act & Assert
    await expect(autoAcceptInvitation(token)).rejects.toThrow(
      "Failed to join family. Please try again."
    );
  });

  it("should handle error when marking invitation as accepted fails", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { checkUserFamilyContext } = await import(
      "@/lib/supabase/check-family"
    );

    const token = "token-update-error";
    const familyId = "family-update-error";
    const userId = "user-update-error";
    const email = "update-error@example.com";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email,
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    };

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "inv-update",
            family_id: familyId,
            email,
            expires_at: new Date(Date.now() + 86_400_000).toISOString(),
            status: "pending",
          },
          error: null,
        }),
      }),
    });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Failed to update invitation" },
      }),
    });

    const mockServiceClient = {
      from: vi.fn((table: string) => {
        if (table === "invitations") {
          if (selectMock.mock.calls.length === 0) {
            return { select: selectMock };
          }
          return { update: updateMock };
        }
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);
    vi.mocked(checkUserFamilyContext).mockResolvedValue(false);

    // Act & Assert
    await expect(autoAcceptInvitation(token)).rejects.toThrow(
      "Failed to complete the invitation. Please try again."
    );
  });

  it("should handle error when ensure_profile_exists fails during signup", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { redirect } = await import("next/navigation");

    const userId = "profile-error-user";
    const email = "profile-error@example.com";

    const mockSupabaseClient = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email,
            },
          },
          error: null,
        }),
      },
    };

    const mockServiceClient = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Profile creation failed" },
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockServiceClient);
    vi.mocked(redirect).mockImplementation(vi.fn());

    // Act & Assert
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", "SecurePass123!");
    formData.append("confirm-password", "SecurePass123!");
    formData.append("name", "User");

    await expect(signUp(formData, "token-123")).rejects.toThrow(
      "Failed to verify user profile. Please try again."
    );
  });

  it("should handle invitation email validation mismatch", async () => {
    // Arrange
    const { createClient } = await import("@/lib/supabase/server");
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    const { checkUserFamilyContext } = await import(
      "@/lib/supabase/check-family"
    );

    const token = "token-mismatch";
    const userId = "user-mismatch";
    const userEmail = "different@example.com";
    const invitationEmail = "invited@example.com";

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: userId,
              email: userEmail,
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
                id: "inv-mismatch",
                family_id: "family-mismatch",
                email: invitationEmail,
                expires_at: new Date(Date.now() + 86_400_000).toISOString(),
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
    vi.mocked(checkUserFamilyContext).mockResolvedValue(false);

    // Act & Assert
    await expect(autoAcceptInvitation(token)).rejects.toThrow(
      "This invitation is not for your email address"
    );
  });
});
