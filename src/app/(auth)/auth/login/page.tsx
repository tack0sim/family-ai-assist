import { HouseIcon } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form.client";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-xs flex-col gap-6">
        <Link
          className="flex items-center gap-2 self-center font-medium"
          href="/"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HouseIcon className="size-4" />
          </div>
          Family AI Assist
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
