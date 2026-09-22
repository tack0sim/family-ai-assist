import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

// Mock the updateSession function
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(async (request) => {
    // Return a simple response that indicates updateSession was called
    return new Response("updateSession called", { status: 200 });
  }),
}));

import { updateSession } from "@/lib/supabase/middleware";

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("protected routes (matched by matcher)", () => {
    it("should call updateSession for /settings", async () => {
      const mockRequest = {
        nextUrl: { pathname: "/settings" },
      } as unknown as NextRequest;

      await proxy(mockRequest);

      expect(updateSession).toHaveBeenCalledWith(mockRequest);
    });

    it("should call updateSession for /settings/profile", async () => {
      const mockRequest = {
        nextUrl: { pathname: "/settings/profile" },
      } as unknown as NextRequest;

      await proxy(mockRequest);

      expect(updateSession).toHaveBeenCalledWith(mockRequest);
    });

    it("should call updateSession for /settings/ with trailing slash", async () => {
      const mockRequest = {
        nextUrl: { pathname: "/settings/" },
      } as unknown as NextRequest;

      await proxy(mockRequest);

      expect(updateSession).toHaveBeenCalledWith(mockRequest);
    });

    it("should call updateSession for /onboarding", async () => {
      const mockRequest = {
        nextUrl: { pathname: "/onboarding" },
      } as unknown as NextRequest;

      await proxy(mockRequest);

      expect(updateSession).toHaveBeenCalledWith(mockRequest);
    });

    it("should call updateSession for /onboarding/step1", async () => {
      const mockRequest = {
        nextUrl: { pathname: "/onboarding/step1" },
      } as unknown as NextRequest;

      await proxy(mockRequest);

      expect(updateSession).toHaveBeenCalledWith(mockRequest);
    });

    it("should call updateSession for /onboarding/ with trailing slash", async () => {
      const mockRequest = {
        nextUrl: { pathname: "/onboarding/" },
      } as unknown as NextRequest;

      await proxy(mockRequest);

      expect(updateSession).toHaveBeenCalledWith(mockRequest);
    });
  });
});
