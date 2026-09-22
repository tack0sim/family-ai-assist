import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { fetchEventsByWeek, getEvents } from "@/actions";
import { CalendarContainer } from "@/components/calendar/calendar-container.client";
import { LandingPage } from "@/components/landing-page";
import { Spinner } from "@/components/ui/spinner";
import { CalendarProvider } from "@/lib/calendar-provider";
import { getCachedUser } from "@/lib/supabase/cached";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import { getFamilyMembers } from "@/lib/supabase/family";
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

async function CalendarView({ familyId }: { familyId: string }) {
  if (!familyId) {
    throw new Error("No family context");
  }

  const { weekStart, weekEnd } = getWeekBoundaries(new Date());

  // Parallelize event and member fetches
  const [eventsResult, membersResult] = await Promise.all([
    getEvents(familyId, {
      startAt: weekStart.toISOString(),
      endAt: weekEnd.toISOString(),
    }),
    getFamilyMembers(familyId),
  ]);

  return (
    <CalendarContainer
      events={formatEventResponse(eventsResult.data)}
      familyId={familyId}
      familyMembers={membersResult}
      onWeekChange={fetchEventsByWeek}
    />
  );
}

export default async function Home() {
  const supabase = await createClient();

  // Fast unauth detection - no DB hit for landing page users
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims;

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // If claims exist, get the cached user (populated by middleware)
  const user = await getCachedUser();

  // Check family context and get familyId
  const familyContext = await checkUserFamilyContext(user.id);

  if (!familyContext.exists) {
    redirect("/onboarding");
  }

  return (
    <CalendarProvider>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <CalendarView familyId={familyContext.familyId} />
      </Suspense>
    </CalendarProvider>
  );
}
