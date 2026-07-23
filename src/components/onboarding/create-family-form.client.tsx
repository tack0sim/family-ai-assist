"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createFamily } from "@/actions";
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
import { createFamilySchema } from "@/lib/schemas/onboarding";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";
import { InviteFirstMembersModal } from "./invite-first-members-modal.client";

interface CreateFamilyFormProps extends React.ComponentProps<"div"> {}

export function CreateFamilyForm({
  className,
  ...props
}: CreateFamilyFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const familyName = formData.get("familyName") as string;

    // Validate with zod
    const validation = createFamilySchema.safeParse({ familyName });

    if (!validation.success) {
      const flattened = validation.error.flatten();
      const firstFieldError = Object.values(flattened.fieldErrors)[0]?.[0];
      setError(firstFieldError || "Invalid input. Please check your entries.");
      return;
    }

    setLoading(true);

    try {
      // Prepare FormData for server action with expected field name
      const serverFormData = new FormData();
      serverFormData.set("name", familyName);

      const createdFamilyId = await createFamily(serverFormData);
      setFamilyId(createdFamilyId);
    } catch (err) {
      if (isRedirectError(err)) {
        throw err;
      }
      setLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create family. Please try again.");
      }
    }
  };

  // Show invite modal after family creation
  if (familyId) {
    return (
      <InviteFirstMembersModal
        familyId={familyId}
        onSkip={() => {
          router.push("/");
        }}
        onSuccess={() => {
          router.push("/");
        }}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create a Family</CardTitle>
          <CardDescription>
            Start by creating a family and inviting members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="familyName">Family Name</FieldLabel>
                <Input
                  disabled={loading}
                  id="familyName"
                  name="familyName"
                  placeholder="e.g. Smith Family"
                  required
                  type="text"
                />
                <FieldDescription>
                  Choose a name for your family group
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
                      Creating family...
                    </>
                  ) : (
                    "Create Family"
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
