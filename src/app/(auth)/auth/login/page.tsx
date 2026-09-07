import { HouseIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form.client";

export const metadata: Metadata = {
  title: "Login | Family Assist",
  description:
    "Login page of the Family Assist platform. Family Assist is an AI-powered SaaS platform to help manage family tasks and activities. The platform simplifies family organization and communication. It features include shared calendars, task management, and an AI assistant for task management.",
  openGraph: {
    type: "website",
    title: "Login - Family Assist",
    description:
      "Family Assist is an AI-powered SaaS platform to help manage family tasks and activities. The platform simplifies family organization and communication. It features include shared calendars, task management, and an AI assistant for task management.",
    siteName: "Family Assist",
  },
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ invitation_token?: string }>;
}

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;
  const invitationToken = searchParams.invitation_token;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-xs flex-col gap-6">
        <Link
          className="flex items-center gap-2 self-center font-medium text-xl"
          href="/"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HouseIcon className="size-4" />
          </div>
          Family Assist
        </Link>
        <LoginForm invitationToken={invitationToken} />
      </div>
    </div>
  );
}
