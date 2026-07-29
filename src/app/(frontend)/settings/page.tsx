import { redirect } from "next/navigation";
import { getFamilyData } from "@/actions";
import { SettingsContent } from "@/components/settings/settings-content.client";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import { createClient } from "@/lib/supabase/server";

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

  const familyData = await getFamilyData();

  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-gray-600">Manage your profile and family</p>
      </div>

      <SettingsContent familyData={familyData} />
    </div>
  );
}
