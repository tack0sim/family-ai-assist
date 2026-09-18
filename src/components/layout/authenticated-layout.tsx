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
 * Does NOT enforce auth/family checks here—those are handled by individual page components
 * (onboarding, settings) to avoid redirect loops with pages that don't require family context.
 */
export async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const supabase = await createClient();

  // Get user if authenticated
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  // If not authenticated, return simple layout without sidebar
  if (!user) {
    return <div className="flex grow flex-col">{children}</div>;
  }

  // If authenticated, render sidebar + inset
  // Individual pages handle family context checks and redirects
  return (
    <>
      <AppSidebar user={user} />
      <SidebarInset>{children}</SidebarInset>
    </>
  );
}
