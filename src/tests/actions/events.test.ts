import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js modules
vi.mock("next/cache");
vi.mock("next/navigation");

// Mock Supabase modules
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/supabase/family");
vi.mock("@/lib/supabase/check-family");

import { createEvent, deleteEvent, getEvent, updateEvent } from "@/actions";
import {
  getFamilyMembers,
  getUserFamilyMembership,
  validateAdminAccess,
} from "@/lib/supabase/family";
import { createClient } from "@/lib/supabase/server";

describe("Event CRUD Actions", () => {
  const testUserId = "user-123";
  const testFamilyId = "family-123";
  const testEventId = "event-123";

  let mockSupabaseClient: any;
  let mockSupabaseFrom: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "events") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: testEventId,
                  title: "Team Meeting",
                  family_id: testFamilyId,
                  created_by: testUserId,
                  start_at: "2026-08-20T10:00:00Z",
                  end_at: "2026-08-20T11:00:00Z",
                  type: "event",
                  all_day: false,
                  visibility: "family",
                  description: null,
                  rrule: null,
                  recurrence_count: null,
                  recurrence_expires_at: null,
                  created_at: "2026-08-14T10:00:00Z",
                  updated_at: "2026-08-14T10:00:00Z",
                },
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: testEventId,
                  title: "Team Meeting",
                  family_id: testFamilyId,
                  created_by: testUserId,
                  start_at: "2026-08-20T10:00:00Z",
                  end_at: "2026-08-20T11:00:00Z",
                  type: "event",
                  all_day: false,
                  visibility: "family",
                  description: null,
                  rrule: null,
                  recurrence_count: null,
                  recurrence_expires_at: null,
                  created_at: "2026-08-14T10:00:00Z",
                  updated_at: "2026-08-14T10:00:00Z",
                },
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: testEventId,
                    title: "Updated Meeting",
                    family_id: testFamilyId,
                    created_by: testUserId,
                    start_at: "2026-08-20T10:00:00Z",
                    end_at: "2026-08-20T11:00:00Z",
                    type: "event",
                    all_day: false,
                    visibility: "family",
                    description: null,
                    rrule: null,
                    recurrence_count: null,
                    recurrence_expires_at: null,
                    created_at: "2026-08-14T10:00:00Z",
                    updated_at: "2026-08-14T10:00:00Z",
                  },
                }),
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      // For event_assignees and event_tags tables
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    });

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: testUserId } },
        }),
      },
      from: mockSupabaseFrom,
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
  });

  describe("createEvent", () => {
    it("should create an event with valid data", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        role: "member",
        status: "active",
      });

      const eventData = {
        title: "Team Meeting",
        startAt: "2026-08-20T10:00:00Z",
        endAt: "2026-08-20T11:00:00Z",
        type: "event" as const,
        allDay: false,
      };

      const result = await createEvent(testFamilyId, eventData);

      expect(result).toBeDefined();
      expect(result.title).toBe("Team Meeting");
    });

    it("should reject if user is not an active family member", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        role: "member",
        status: "pending",
      });

      const eventData = {
        title: "Team Meeting",
        startAt: "2026-08-20T10:00:00Z",
        endAt: "2026-08-20T11:00:00Z",
        type: "event" as const,
      };

      await expect(createEvent(testFamilyId, eventData)).rejects.toThrow(
        "Not a member of this family"
      );
    });

    it("should validate that end time is after start time", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        role: "member",
        status: "active",
      });

      const eventData = {
        title: "Invalid Event",
        startAt: "2026-08-20T11:00:00Z",
        endAt: "2026-08-20T10:00:00Z",
        type: "event" as const,
      };

      await expect(createEvent(testFamilyId, eventData)).rejects.toThrow(
        "Validation error"
      );
    });
  });

  describe("updateEvent", () => {
    it("should update an event if user is the creator", async () => {
      const updateData = {
        title: "Updated Meeting",
      };

      const result = await updateEvent(testEventId, updateData);

      expect(result.title).toBe("Updated Meeting");
    });

    it("should reject update if user is not creator or admin", async () => {
      vi.mocked(validateAdminAccess).mockResolvedValue({
        isAdmin: false,
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "events") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: testEventId,
                    created_by: "other-user",
                    family_id: testFamilyId,
                  },
                }),
              }),
            }),
          };
        }
      });

      const updateData = {
        title: "Updated Meeting",
      };

      await expect(updateEvent(testEventId, updateData)).rejects.toThrow(
        "Not authorized"
      );
    });
  });

  describe("deleteEvent", () => {
    it("should delete an event if user is the creator", async () => {
      await deleteEvent(testEventId);
      // If no error is thrown, test passes
      expect(true).toBe(true);
    });
  });

  describe("getEvent", () => {
    it("should return a family visibility event for family member", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        role: "member",
        status: "active",
      });

      const result = await getEvent(testEventId);

      expect(result.title).toBe("Team Meeting");
      expect(result.visibility).toBe("family");
    });

    it("should reject if user is not a family member", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: "different-family",
        role: "member",
        status: "active",
      });

      await expect(getEvent(testEventId)).rejects.toThrow(
        "Not a member of this event's family"
      );
    });

    it("should return personal event if user is the creator", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        role: "member",
        status: "active",
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "events") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: testEventId,
                    title: "Personal Event",
                    family_id: testFamilyId,
                    created_by: testUserId,
                    start_at: "2026-08-20T10:00:00Z",
                    end_at: "2026-08-20T11:00:00Z",
                    type: "event",
                    all_day: false,
                    visibility: "personal",
                    description: null,
                    rrule: null,
                    recurrence_count: null,
                    recurrence_expires_at: null,
                    created_at: "2026-08-14T10:00:00Z",
                    updated_at: "2026-08-14T10:00:00Z",
                  },
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getEvent(testEventId);

      expect(result.title).toBe("Personal Event");
      expect(result.visibility).toBe("personal");
    });

    it("should return personal event if user is admin", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        role: "admin",
        status: "active",
      });

      vi.mocked(validateAdminAccess).mockResolvedValue({
        isAdmin: true,
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "events") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: testEventId,
                    title: "Personal Event",
                    family_id: testFamilyId,
                    created_by: "other-user",
                    start_at: "2026-08-20T10:00:00Z",
                    end_at: "2026-08-20T11:00:00Z",
                    type: "event",
                    all_day: false,
                    visibility: "personal",
                    description: null,
                    rrule: null,
                    recurrence_count: null,
                    recurrence_expires_at: null,
                    created_at: "2026-08-14T10:00:00Z",
                    updated_at: "2026-08-14T10:00:00Z",
                  },
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getEvent(testEventId);

      expect(result.title).toBe("Personal Event");
    });

    it("should return personal event if user is assigned", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        role: "member",
        status: "active",
      });

      vi.mocked(validateAdminAccess).mockResolvedValue({
        isAdmin: false,
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "events") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: testEventId,
                    title: "Personal Event",
                    family_id: testFamilyId,
                    created_by: "other-user",
                    start_at: "2026-08-20T10:00:00Z",
                    end_at: "2026-08-20T11:00:00Z",
                    type: "event",
                    all_day: false,
                    visibility: "personal",
                    description: null,
                    rrule: null,
                    recurrence_count: null,
                    recurrence_expires_at: null,
                    created_at: "2026-08-14T10:00:00Z",
                    updated_at: "2026-08-14T10:00:00Z",
                  },
                }),
              }),
            }),
          };
        }
        if (table === "event_assignees") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "assign-123",
                      event_id: testEventId,
                      profile_id: testUserId,
                    },
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getEvent(testEventId);

      expect(result.title).toBe("Personal Event");
    });

    it("should reject personal event if user is not creator, admin, or assigned", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        role: "member",
        status: "active",
      });

      vi.mocked(validateAdminAccess).mockResolvedValue({
        isAdmin: false,
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "events") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: testEventId,
                    title: "Personal Event",
                    family_id: testFamilyId,
                    created_by: "other-user",
                    start_at: "2026-08-20T10:00:00Z",
                    end_at: "2026-08-20T11:00:00Z",
                    type: "event",
                    all_day: false,
                    visibility: "personal",
                    description: null,
                    rrule: null,
                    recurrence_count: null,
                    recurrence_expires_at: null,
                    created_at: "2026-08-14T10:00:00Z",
                    updated_at: "2026-08-14T10:00:00Z",
                  },
                }),
              }),
            }),
          };
        }
        if (table === "event_assignees") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      await expect(getEvent(testEventId)).rejects.toThrow(
        "Not authorized to view this personal event"
      );
    });
  });
});
