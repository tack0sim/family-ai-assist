import { NextResponse } from "next/server";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import { createClient } from "@/lib/supabase/server";
import { getBaseURL } from "@/lib/utils/get-base-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Get authenticated user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Create profile for the newly authenticated user (if it doesn't exist)
      // The trigger should have created it, but this ensures it exists
      if (userId) {
        const { error: profileErr } = await supabase.from("profiles").upsert(
          {
            id: userId,
            display_name: userData.user?.user_metadata?.name || null,
            avatar_url: userData.user?.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        if (profileErr) {
          console.error("Failed to create profile:", profileErr);
          // Don't fail the entire flow, just log the error
        }
      }

      // Check if user has family context
      const hasFamily = await checkUserFamilyContext();
      const destination = hasFamily ? next : "/onboarding";

      const baseUrl = getBaseURL(request.headers);
      return NextResponse.redirect(`${baseUrl}${destination}`);
    }
  }

  // return the user to an error page with instructions
  const baseUrl = getBaseURL(request.headers);
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}
