"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { signUp } from "@/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";
import { SignInButton } from "./signin-button.client";

interface SignupFormProps extends React.ComponentProps<"div"> {
  invitationToken?: string;
}

export function SignupForm({
  className,
  invitationToken,
  ...props
}: SignupFormProps) {
  const searchParams = useSearchParams();
  const loginHref = invitationToken
    ? `/auth/login?${searchParams.toString()}`
    : "/auth/login";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSignUp = (formData: FormData) => {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    startTransition(async () => {
      try {
        await signUp(formData, invitationToken);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Signin with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSignUp}>
            <FieldGroup>
              <Field>
                <SignInButton invitationToken={invitationToken} />
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with email
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  required
                  type="text"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  placeholder="m@example.com"
                  required
                  type="email"
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      required
                      type="password"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      required
                      type="password"
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button disabled={isPending} type="submit">
                  {isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
                <FieldDescription className="text-center">
                  Already have an account? <Link href={loginHref}>Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
