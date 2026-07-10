"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useState } from "react";
import { acceptInvitation } from "@/actions";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { joinFamilySchema } from "@/lib/schemas/onboarding";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

interface JoinFamilyFormProps extends React.ComponentProps<"div"> {}

export function JoinFamilyForm({ className, ...props }: JoinFamilyFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const invitationCode = formData.get("invitationCode") as string;

    // Validate with zod
    const validation = joinFamilySchema.safeParse({ invitationCode });

    if (!validation.success) {
      const flattened = validation.error.flatten();
      const firstFieldError = Object.values(flattened.fieldErrors)[0]?.[0];
      setError(firstFieldError || "Invalid input. Please check your entries.");
      return;
    }

    setLoading(true);

    try {
      await acceptInvitation(invitationCode);
    } catch (err) {
      if (isRedirectError(err)) {
        throw err;
      }
      setLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to join family. Please check your code and try again."
        );
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Join a Family</CardTitle>
          <CardDescription>
            Already have an invitation? Enter your code to join
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invitationCode">
                  Invitation Code
                </FieldLabel>
                <Input
                  disabled={loading}
                  id="invitationCode"
                  name="invitationCode"
                  placeholder="Enter your invitation code"
                  required
                  type="text"
                />
                <FieldDescription>
                  Paste the code from your invitation email
                </FieldDescription>
              </Field>

              {error && (
                <Field>
                  <p className="text-red-600 text-sm">{error}</p>
                </Field>
              )}

              <Field>
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      Joining...
                    </>
                  ) : (
                    "Join Family"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
