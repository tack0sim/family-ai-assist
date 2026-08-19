import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js modules
vi.mock("next/cache");
vi.mock("next/navigation");

// Mock Supabase modules
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/supabase/family");
vi.mock("@/lib/supabase/check-family");
vi.mock("@/lib/redis");

import {
  addEventAssignee,
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  removeEventAssignee,
  updateEvent,
} from "@/actions";
import { getRedisClient } from "@/lib/redis";
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

  describe("getEvents", () => {
    const testMemberId1 = "550e8400-e29b-41d4-a716-446655440003";
    const testMemberId2 = "550e8400-e29b-41d4-a716-446655440004";
    const testTagId1 = "550e8400-e29b-41d4-a716-446655440005";

    const baseDate = new Date("2026-08-20T10:00:00Z");
    const startDate = new Date("2026-08-17T00:00:00Z");
    const endDate = new Date("2026-08-24T23:59:59Z");

    let mockRedisClient: any;

    beforeEach(() => {
      mockRedisClient = {
        get: vi.fn().mockResolvedValue(null),
        setEx: vi.fn().mockResolvedValue("OK"),
        del: vi.fn().mockResolvedValue(1),
        keys: vi.fn().mockResolvedValue([]),
        isOpen: true,
      };

      vi.mocked(getRedisClient).mockResolvedValue(mockRedisClient);

      // Set up mock for getEvents query
      mockSupabaseFrom = vi.fn((table: string) => {
        if (table === "events") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "event_assignees") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === "event_tags") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [],
                error: null,
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

    it("should fetch events by date range", async () => {
      const result = await getEvents(testFamilyId, {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      });

      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeGreaterThanOrEqual(0);
    });

    it("should validate required date parameters", async () => {
      await expect(
        getEvents(testFamilyId, {
          startAt: "invalid-date",
          endAt: endDate.toISOString(),
        })
      ).rejects.toThrow("Validation error");
    });

    it("should require active family membership", async () => {
      vi.mocked(getUserFamilyMembership).mockResolvedValueOnce({
        familyId: "different-family",
        role: "member",
        status: "active",
      });

      await expect(
        getEvents(testFamilyId, {
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
        })
      ).rejects.toThrow("Not a member of this family");
    });

    it("should apply default pagination (limit 50, offset 0)", async () => {
      const result = await getEvents(testFamilyId, {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      });

      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.offset).toBe(0);
    });

    it("should accept custom limit and offset", async () => {
      const result = await getEvents(testFamilyId, {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        limit: 10,
        offset: 5,
      });

      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(5);
    });

    it("should support type filtering", async () => {
      const result = await getEvents(testFamilyId, {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        type: "event",
      });

      expect(result).toBeDefined();
    });

    it("should support member filtering (AND logic)", async () => {
      const result = await getEvents(testFamilyId, {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        members: [testMemberId1, testMemberId2],
      });

      expect(result).toBeDefined();
    });

    it("should support tag filtering (AND logic)", async () => {
      const result = await getEvents(testFamilyId, {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        tags: [testTagId1],
      });

      expect(result).toBeDefined();
    });

    it("should return paginated results with metadata", async () => {
      const result = await getEvents(testFamilyId, {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        limit: 10,
        offset: 5,
      });

      expect(result.pagination).toEqual({
        offset: 5,
        limit: 10,
        total: expect.any(Number),
        hasMore: expect.any(Boolean),
      });
    });

    it("should handle Redis cache gracefully when unavailable", async () => {
      vi.mocked(getRedisClient).mockRejectedValueOnce(
        new Error("Redis unavailable")
      );

      // Should not throw, should continue without cache
      const result = await getEvents(testFamilyId, {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      });

      expect(result).toBeDefined();
    });
  });

  describe("Event Assignees Management", () => {
    const testAssigneeId = "assignee-123";

    it("should add an assignee to an event", async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: testUserId } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "events") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: testEventId,
                      family_id: testFamilyId,
                      created_by: testUserId,
                      start_at: "2026-08-20T10:00:00Z",
                      end_at: "2026-08-20T11:00:00Z",
                    },
                  }),
                }),
              }),
            };
          }
          if (table === "event_assignees") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any);
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        status: "active",
        role: "member",
      } as any);
      vi.mocked(validateAdminAccess).mockResolvedValue({
        isAdmin: false,
      } as any);
      vi.mocked(getFamilyMembers).mockResolvedValue([
        {
          user_id: testAssigneeId,
          status: "active",
        } as any,
      ]);

      await addEventAssignee(testEventId, testAssigneeId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("event_assignees");
    });

    it("should remove an assignee from an event", async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: testUserId } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "events") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: testEventId,
                      family_id: testFamilyId,
                      created_by: testUserId,
                      start_at: "2026-08-20T10:00:00Z",
                      end_at: "2026-08-20T11:00:00Z",
                    },
                  }),
                }),
              }),
            };
          }
          if (table === "event_assignees") {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any);
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        status: "active",
        role: "member",
      } as any);
      vi.mocked(validateAdminAccess).mockResolvedValue({
        isAdmin: false,
      } as any);

      await removeEventAssignee(testEventId, testAssigneeId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("event_assignees");
    });

    it("should reject adding assignee if user is not event creator/admin", async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: testUserId } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "events") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: testEventId,
                      family_id: testFamilyId,
                      created_by: "other-user",
                      start_at: "2026-08-20T10:00:00Z",
                      end_at: "2026-08-20T11:00:00Z",
                    },
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any);
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        status: "active",
        role: "member",
      } as any);
      vi.mocked(validateAdminAccess).mockResolvedValue({
        isAdmin: false,
      } as any);

      await expect(
        addEventAssignee(testEventId, testAssigneeId)
      ).rejects.toThrow("Not authorized to modify this event");
    });

    it("should reject adding non-family-member as assignee", async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: testUserId } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "events") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: testEventId,
                      family_id: testFamilyId,
                      created_by: testUserId,
                      start_at: "2026-08-20T10:00:00Z",
                      end_at: "2026-08-20T11:00:00Z",
                    },
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any);
      vi.mocked(getUserFamilyMembership).mockResolvedValue({
        familyId: testFamilyId,
        status: "active",
        role: "member",
      } as any);
      vi.mocked(validateAdminAccess).mockResolvedValue({
        isAdmin: false,
      } as any);
      vi.mocked(getFamilyMembers).mockResolvedValue([] as any);

      await expect(
        addEventAssignee(testEventId, testAssigneeId)
      ).rejects.toThrow("User is not an active family member");
    });
  });
});
