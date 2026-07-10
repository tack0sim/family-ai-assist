import { redirect } from "next/navigation";
import { CreateFamilyForm } from "@/components/onboarding/create-family-form.client";
import { JoinFamilyForm } from "@/components/onboarding/join-family-form.client";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-12">
          <h1 className="mb-2 font-bold text-3xl tracking-tight">
            Welcome to Family AI Assist
          </h1>
          <p className="text-gray-600">
            Get started by creating a family or joining an existing one
          </p>
        </div>

        <div className="grid gap-8">
          {/* Create Family Section */}
          <CreateFamilyForm />

          {/* Join Family Section */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-gray-200 border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <JoinFamilyForm />
        </div>
      </div>
    </div>
  );
}
