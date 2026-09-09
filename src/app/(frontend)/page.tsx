import type { User } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { fetchEventsByWeek, getEvents } from "@/actions";
import { CalendarContainer } from "@/components/calendar/calendar-container.client";
import { LandingPage } from "@/components/landing-page";
import { Spinner } from "@/components/ui/spinner";
import { CalendarProvider } from "@/lib/calendar-provider";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import {
  getFamilyMembers,
  getUserFamilyMembership,
} from "@/lib/supabase/family";
import { createClient } from "@/lib/supabase/server";
import { getWeekBoundaries } from "@/lib/utils/date";
import { formatEventResponse } from "@/lib/utils/format-events";

export const metadata: Metadata = {
  title: "Family Assist",
  description:
    "Dashboard of the Family Assist platform. Family Assist is an AI-powered SaaS platform to help manage family tasks and activities. The platform simplifies family organization and communication. It features include shared calendars, task management, and an AI assistant for task management.",
  openGraph: {
    type: "website",
    title: "Dashboard - Family Assist",
    description:
      "Family Assist is an AI-powered SaaS platform to help manage family tasks and activities. The platform simplifies family organization and communication. It features include shared calendars, task management, and an AI assistant for task management.",
    siteName: "Family Assist",
  },
  robots: { index: false, follow: false },
};

async function CalendarView({ userId }: { userId: User["id"] }) {
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const { familyId } = await getUserFamilyMembership(userId);
  const { weekStart, weekEnd } = getWeekBoundaries(new Date());

  const result = await getEvents(familyId, {
    startAt: weekStart.toISOString(),
    endAt: weekEnd.toISOString(),
  });

  const familyMembers = await getFamilyMembers(familyId);

  return (
    <CalendarContainer
      events={formatEventResponse(result.data)}
      familyId={familyId}
      familyMembers={familyMembers}
      onWeekChange={fetchEventsByWeek}
    />
  );
}

export default async function Home() {
  const supabase = await createClient();
  const { data: isAuthenticated } = await supabase.auth.getClaims();

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Check if the user has a family context
  const hasFamily = await checkUserFamilyContext();
  if (!hasFamily) {
    redirect("/onboarding");
  }

  // Fetch the authenticated user data to get the user ID
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  return (
    <CalendarProvider>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Spinner />
          </div>
        }
      >
        {userId && <CalendarView userId={userId} />}
      </Suspense>
    </CalendarProvider>
  );
}
