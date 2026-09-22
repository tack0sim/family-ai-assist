"use client";

import type { User } from "@supabase/supabase-js";
import { GalleryVerticalEndIcon } from "lucide-react";
import type * as React from "react";
import { Suspense } from "react";
import { NavMain } from "@/components/nav-main.client";
import { NavUser } from "@/components/nav-user.client";
import { TeamSwitcher } from "@/components/team-switcher.client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

// This is sample data.
const data = {
  teams: [
    {
      name: "Family Assist",
      logo: <GalleryVerticalEndIcon />,
      plan: "Enterprise",
    },
  ],
};

function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 px-2 py-1.5">
          {/* Avatar skeleton */}
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />

          {/* Name and email skeleton */}
          <div className="grid flex-1 gap-2 text-left">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>

          {/* Chevron icon skeleton */}
          <Skeleton className="ml-auto h-4 w-4 rounded" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({
  userPromise,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userPromise: Promise<User>;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<NavUserSkeleton />}>
          <NavUser userPromise={userPromise} />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
