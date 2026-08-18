import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getEvents } from "@/actions";
import { CalendarContainer } from "@/components/calendar/calendar-container.client";
import { HeroSection } from "@/components/hero-section";
import { Spinner } from "@/components/ui/spinner";
import { CalendarProvider } from "@/lib/calendar-provider";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import { getUserFamilyMembership } from "@/lib/supabase/family";
import { createClient } from "@/lib/supabase/server";

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

// Transform flattened response back to EventWithDetails format
function formatEventResponse(data: any[]) {
  return data.map((item) => ({
    event: {
      id: item.id,
      family_id: item.familyId,
      created_by: item.createdBy,
      title: item.title,
      description: item.description,
      start_at: item.startAt,
      end_at: item.endAt,
      all_day: item.allDay,
      type: item.type,
      visibility: item.visibility,
      rrule: item.rrule,
      recurrence_count: item.recurrenceCount,
      recurrence_expires_at: item.recurrenceExpiresAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    },
    assignees: item.assignees,
    tags: item.tags,
  }));
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

  // Define onWeekChange as a server action that can be called from client
  const onWeekChange = async (newWeekStart: Date) => {
    "use server";
    const newWeekEnd = new Date(newWeekStart);
    newWeekEnd.setDate(newWeekEnd.getDate() + 6);
    newWeekEnd.setHours(23, 59, 59, 999);

    const weekResult = await getEvents(familyId, {
      startAt: newWeekStart.toISOString(),
      endAt: newWeekEnd.toISOString(),
    });

    return weekResult.data;
  };

  return (
    <CalendarContainer
      events={formatEventResponse(result.data)}
      familyId={familyId}
      onWeekChange={async (newWeekStart) => {
        const weekResult = await onWeekChange(newWeekStart);
        return formatEventResponse(weekResult);
      }}
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
