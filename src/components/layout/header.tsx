import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";

export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims;

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {isAuthenticated ? (
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            orientation="vertical"
          />
          {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Build Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
          <span className="font-normal text-foreground text-xs">
            Welcome to Family Assist
          </span>
        </div>
      ) : (
        <div className="flex w-full items-center px-4">
          <Link className="ml-auto" href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
