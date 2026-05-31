"use client";

import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { Button } from "./ui/button";

export function SignOutButton() {
  const handleSignOut = async () => {
    await createClient().auth.signOut();
    redirect("/auth/login");
  };

  return <Button onClick={handleSignOut}>Sign Out</Button>;
}
