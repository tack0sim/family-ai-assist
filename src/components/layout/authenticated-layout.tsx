import { AppSidebar } from "@/components/app-sidebar.client";
import { SidebarInset } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper for the (frontend) route group.
 * Renders sidebar + inset for authenticated users with family context.
 *
 * Uses proxy-verified auth state (getClaims) for immediate sidebar render (~50-100ms),
 * without DB round-trips. NavUser child component suspends independently to fetch full user data.
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

  // If authenticated, render sidebar + inset immediately
  // NavUser suspends independently to fetch full user data
  // Individual pages handle family context checks and redirects
  return (
    <>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </>
  );
}
