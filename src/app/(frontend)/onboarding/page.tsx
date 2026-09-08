import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { CreateFamilyForm } from "@/components/onboarding/create-family-form.client";
import { InvitationHandler } from "@/components/onboarding/invitation-handler.client";
import { checkUserFamilyContext } from "@/lib/supabase/check-family";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Onboarding | Family Assist",
  description:
    "Onboarding page of the Family Assist platform. Family Assist is an AI-powered SaaS platform to help manage family tasks and activities. The platform simplifies family organization and communication. It features include shared calendars, task management, and an AI assistant for task management.",
  openGraph: {
    type: "website",
    title: "Onboarding - Family Assist",
    description:
      "Family Assist is an AI-powered SaaS platform to help manage family tasks and activities. The platform simplifies family organization and communication. It features include shared calendars, task management, and an AI assistant for task management.",
    siteName: "Family Assist",
  },
};

export default async function OnboardingPage() {
  // Check if user is authenticated
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const isAuthenticated = !!data?.claims;

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    redirect("/auth/login?next=/onboarding");
  }

  // Check if user has accepted beta testing consent
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("beta_consent_agreed")
      .eq("id", user.id)
      .single();

    if (!profile?.beta_consent_agreed) {
      redirect("/auth/consent");
    }
  }

  // Redirect to home if user already has family context
  const hasFamily = await checkUserFamilyContext();
  if (hasFamily) {
    redirect("/");
  }

  return (
    <Section>
      <Container variant="narrow">
        <div className="mb-12">
          <h1 className="mb-2 font-bold text-3xl tracking-tight">
            Welcome to Family Assist
          </h1>
          <p className="text-gray-600">
            Get started by creating a family and inviting your family members
          </p>
        </div>

        {/* Invitation auto-accept handler */}
        <InvitationHandler />

        <div className="grid gap-8">
          {/* Create Family Section */}
          <CreateFamilyForm />

          {/* Join Family Section */}
          {/* Currently disabled as the join family via invitation code feature is not planned */}
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-gray-200 border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <JoinFamilyForm /> */}
        </div>
      </Container>
    </Section>
  );
}
