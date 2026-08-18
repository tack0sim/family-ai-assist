import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { fetchEventsByWeek, getEvents } from "@/actions";
import { CalendarContainer } from "@/components/calendar/calendar-container.client";
import { HeroSection } from "@/components/hero-section";
import { Spinner } from "@/components/ui/spinner";
import { CalendarProvider } from "@/lib/calendar-provider";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import { getUserFamilyMembership } from "@/lib/supabase/family";
import { createClient } from "@/lib/supabase/server";
import { formatEventResponse } from "@/lib/utils/format-events";

function getWeekBoundaries(date: Date) {
  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(weekStart.getDate() + daysToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

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

  return (
    <CalendarContainer
      events={formatEventResponse(result.data)}
      familyId={familyId}
      onWeekChange={fetchEventsByWeek}
    />
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const userId = user?.id;

  if (!isAuthenticated) {
    return <HeroSection />;
  }

  const hasFamily = await checkUserFamilyContext();
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
        {userId && <CalendarView userId={userId} />}
      </Suspense>
    </CalendarProvider>
  );
}
