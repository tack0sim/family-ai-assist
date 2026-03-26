"use client";

import { cn } from "@/lib/utils";
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
import { SignInButton } from "./signin-button";
import Link from "next/link";
import { signIn } from "@/actions";
import { useState } from "react";
import { Spinner } from "./ui/spinner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      await signIn(formData);
    } catch (error) {
      setLoading(false);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSignIn}>
            <FieldGroup>
              <Field>
                <SignInButton />
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      {/* <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription> */}
    </div>
  );
}
