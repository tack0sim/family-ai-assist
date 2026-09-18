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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  // If authenticated but no family context, redirect to onboarding
  const hasFamily = await checkUserFamilyContext(user.id);
  if (!hasFamily) {
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
        <CalendarView userId={user.id} />
      </Suspense>
    </CalendarProvider>
  );
}
