import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = ["/", "/auth/login"];
const protectedPaths = ["/dashboard", "/profile", "/onboarding"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = publicPaths.includes(path);
  const isProtectedPath = protectedPaths.includes(path);

  if (isProtectedPath && !isPublicPath) {
    return await updateSession(request);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
