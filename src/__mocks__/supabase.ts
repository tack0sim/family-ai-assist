import { vi } from "vitest";

/**
 * Mock Supabase client factory
 * Creates chainable mock objects that simulate Supabase API
 */

export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: (table: string) => createMockTable(table),
  };
}

function createMockTable(tableName: string) {
  let mockError: Error | null = null;
  let mockData: unknown = null;

  return {
    insert: (data: unknown) => ({
      select: (fields: string) => ({
        single: () => ({
          data: mockData || { id: "mock-id", ...data },
          error: mockError,
        }),
      }),
      then: (callback: (result: unknown) => void) => {
        callback({
          data: mockData || (Array.isArray(data) ? data : [data]),
          error: mockError,
        });
      },
    }),
    select: (fields: string) => ({
      eq: (column: string, value: unknown) => ({
        maybeSingle: () => ({
          data: mockData || null,
          error: mockError,
        }),
        single: () => ({
          data: mockData || null,
          error: mockError,
        }),
      }),
    }),
    update: (data: unknown) => ({
      eq: (column: string, value: unknown) => ({
        data: null,
        error: mockError,
      }),
    }),
    // Helper methods for test setup
    _setMockData: (data: unknown) => {
      mockData = data;
    },
    _setMockError: (error: Error | null) => {
      mockError = error;
    },
  };
}
