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
  SidebarRail,
} from "@/components/ui/sidebar";
import { Spinner } from "./ui/spinner";

// This is sample data.
const data = {
  teams: [
    {
      name: "Family Assist",
      logo: <GalleryVerticalEndIcon />,
      plan: "Enterprise",
    },
    // {
    //   name: "Acme Corp.",
    //   logo: <AudioLinesIcon />,
    //   plan: "Startup",
    // },
    // {
    //   name: "Evil Corp.",
    //   logo: <TerminalIcon />,
    //   plan: "Free",
    // },
  ],
};

function NavUserSkeleton() {
  return (
    <div className="flex h-10 items-center justify-center px-4">
      <Spinner />
    </div>
  );
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: User }) {
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
          <NavUser user={user} />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
