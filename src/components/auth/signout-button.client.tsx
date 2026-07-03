"use client";

import { redirect, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface SignOutButtonProps {
  className?: string;
  variantOverride?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function SignOutButton({
  className,
  variantOverride,
}: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.refresh();
    redirect("/");
  };

  return (
    <Button
      className={cn("w-full", className)}
      onClick={handleSignOut}
      variant={variantOverride ?? "default"}
    >
      Sign Out
    </Button>
  );
}
