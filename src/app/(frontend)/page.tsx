import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/signout-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = (await (await createClient()).auth.getSession()).data.session;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {session ? (
          <SignOutButton />
        ) : (
          <Link href="/auth/login">
            <Button>Sign in</Button>
          </Link>
        )}
      </main>
    </div>
  );
}
