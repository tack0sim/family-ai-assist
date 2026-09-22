"use client";

import type { User } from "@supabase/supabase-js";
import { ChevronsUpDownIcon } from "lucide-react";
import { use } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getUserAvatarUrl, getUserDisplayName } from "@/lib/supabase/user";
import { SignOutButton } from "./auth/signout-button.client";

interface NavUserProps {
  userPromise: Promise<User | null>;
}

/**
 * NavUser fetches user identity (name, email, avatar) using server-initiated promise.
 * Suspends while the promise is in flight, Suspense boundary shows skeleton.
 *
 * The userPromise comes from AuthenticatedLayout calling getCachedUser() without awaiting.
 * This ensures server-side auth check happens in parallel with page data fetch.
 * React's cache() memoization ensures the promise is shared with page.tsx (no duplicate fetch).
 *
 * Performance: ~50-100ms (server-side auth), parallel with calendar data.
 */
export function NavUser({ userPromise }: NavUserProps) {
  const { isMobile } = useSidebar();

  // use() unwraps the promise from server
  // Suspends if pending, returns user when resolved, throws on error
  const user = use(userPromise);

  // Return null if not authenticated (Suspense skeleton will show)
  if (!user) {
    return null;
  }

  const userName = getUserDisplayName(user);
  const userInitials = userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const userEmail = user?.email;
  const userImage = getUserAvatarUrl(user);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <Avatar className="h-8 w-8 rounded-full">
                {userImage ? (
                  <AvatarImage alt={userName} src={userImage} />
                ) : null}
                <AvatarFallback className="rounded-full">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs">{userEmail}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  {userImage ? (
                    <AvatarImage alt={userName} src={userImage} />
                  ) : null}
                  <AvatarFallback className="rounded-full">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs">{userEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuGroup>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator /> */}
            <DropdownMenuItem>
              <SignOutButton
                className="flex w-full justify-start gap-1 p-0"
                variantOverride="ghost"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
