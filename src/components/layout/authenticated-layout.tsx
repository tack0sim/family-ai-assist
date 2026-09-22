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
  // React's cache() ensures this same promise is reused by page.tsx
  const userPromise: Promise<User | null> = getCachedUser().catch(() => null);

  return (
    <>
      <AppSidebar userPromise={userPromise} />
      <SidebarInset>{children}</SidebarInset>
    </>
  );
}
