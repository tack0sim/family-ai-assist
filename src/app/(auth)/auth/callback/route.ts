import { NextResponse } from "next/server";
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
      const baseUrl = getBaseURL(request.headers);
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // return the user to an error page with instructions
  const baseUrl = getBaseURL(request.headers);
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}
