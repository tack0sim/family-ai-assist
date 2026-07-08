import { AppSidebar } from "@/components/app-sidebar.client";
import { SidebarInset } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const isAuthenticated = !!data?.claims;

  if (!isAuthenticated) {
    return <div className="flex grow flex-col">{children}</div>;
  }

  // Fetch user data only if authenticated
  const { data: userData } = await supabase.auth.getUser();

  return (
    <body className="flex grow flex-col">
      {userData.user && <AppSidebar user={userData.user} />}
      <SidebarInset>{children}</SidebarInset>
    </body>
  );
}
