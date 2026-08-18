import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getEventTags, getFamilyData } from "@/actions";
import { SettingsContent } from "@/components/settings/settings-content.client";
import { Spinner } from "@/components/ui/spinner";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import { createClient } from "@/lib/supabase/server";
import { getUserDisplayName } from "@/lib/supabase/user";

async function SettingsContentWrapper() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const familyData = await getFamilyData();
  const eventTags = await getEventTags(familyData.familyId);
  const displayName = getUserDisplayName(userData.user) || "";

  return (
    <SettingsContent
      familyData={familyData}
      initialDisplayName={displayName}
      initialEventTags={eventTags}
    />
  );
}

export default async function SettingsPage() {
  // Check if user is authenticated
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims;

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    redirect("/auth/login?next=/settings");
  }

  // Redirect to onboarding if user doesn't have family context
  const hasFamily = await checkUserFamilyContext();
  if (!hasFamily) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-gray-600">Manage your profile and family</p>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center">
            <Spinner />
          </div>
        }
      >
        <SettingsContentWrapper />
      </Suspense>
    </div>
  );
}
