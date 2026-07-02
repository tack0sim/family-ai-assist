"use client";

import { createClient } from "@/lib/supabase/client";
import { redirect, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

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
      onClick={handleSignOut}
      className={cn("w-full", className)}
      variant={variantOverride ?? "default"}
    >
      Sign Out
    </Button>
  );
}
