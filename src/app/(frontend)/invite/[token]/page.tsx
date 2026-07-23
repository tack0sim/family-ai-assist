import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvitePageClient } from "./client";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

/**
 * /invite/[token] page for authenticated users
 *
 * Flow:
 * 1. Check if user is authenticated
 * 2. Redirect unauthenticated users to login with token preserved
 * 3. Render client component for authenticated users to handle auto-accept
 */
export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // Check if user is authenticated
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const isAuthenticated = !!data?.claims;

  // Redirect unauthenticated users to login with token preserved
  if (!isAuthenticated) {
    redirect(`/auth/login?invitation_token=${token}`);
  }

  return <InvitePageClient token={token} />;
}
