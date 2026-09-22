import type { User } from "@supabase/supabase-js";
import { AppSidebar } from "@/components/app-sidebar.client";
import { SidebarInset } from "@/components/ui/sidebar";
import { getCachedUser } from "@/lib/supabase/cached";
import { createClient } from "@/lib/supabase/server";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper for the (frontend) route group.
 * Renders sidebar + inset for authenticated users with family context.
 *
 * Uses proxy-verified auth state (getClaims) for immediate sidebar render (~50-100ms).
 * Starts getCachedUser() without awaiting to begin server-side auth fetch in parallel.
 * NavUser receives the promise and uses it via React's use() hook for Suspense.
 *
 * Note: The promise is passed as-is (no catch wrapper) to ensure both AppSidebar
 * and page.tsx receive the same cached promise instance. If auth fails, the promise
 * rejects, which is caught by the nearest error boundary.
 *
 * Does NOT enforce auth/family checks here—those are handled by individual page components
 * (onboarding, settings) to avoid redirect loops with pages that don't require family context.
 */
export async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const supabase = await createClient();

  // Fast auth check using proxy-verified cookies (no DB hit)
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims;

  // If not authenticated, return simple layout without sidebar
  if (!isAuthenticated) {
    return <div className="flex grow flex-col">{children}</div>;
  }

  // Start server-side auth fetch WITHOUT awaiting
  // This begins the fetch immediately, promise is "in flight"
  // React's cache() ensures this same promise is reused by page.tsx
  // NavUser receives the promise and uses it for Suspense
  //
  // DO NOT wrap with .catch() here—we pass the raw cached promise to ensure
  // both AuthenticatedLayout and page.tsx use the same promise instance.
  // If auth fails, the rejection propagates to error boundaries.
  const userPromise: Promise<User> = getCachedUser();

  return (
    <>
      <AppSidebar userPromise={userPromise} />
      <SidebarInset>{children}</SidebarInset>
    </>
  );
}
