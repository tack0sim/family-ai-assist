"use client";

import { useEffect, useState } from "react";
import { updateUserProfile } from "@/actions";
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
import { Spinner } from "@/components/ui/spinner";
import { updateProfileSchema } from "@/lib/schemas/settings";
import { createClient } from "@/lib/supabase/client";
import { getUserDisplayName } from "@/lib/supabase/user";

export function ProfileTab() {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanged, setHasChanged] = useState(false);

  // Fetch current user's display name on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const currentDisplayName = getUserDisplayName(user) || "";
      setDisplayName(currentDisplayName);
      setInitialLoading(false);
    };

    fetchUserData();
  }, []);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayName(newValue);
    setHasChanged(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate with zod
    const validation = updateProfileSchema.safeParse({
      displayName: displayName.trim(),
    });

    if (!validation.success) {
      const flattened = validation.error.flatten();
      const firstFieldError = Object.values(flattened.fieldErrors)[0]?.[0];
      setError(firstFieldError || "Invalid input. Please check your entries.");
      return;
    }

    setLoading(true);

    try {
      await updateUserProfile(validation.data.displayName);
      setSuccessMessage("Profile updated successfully!");
      setHasChanged(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
                <Input
                  disabled={loading}
                  id="displayName"
                  name="displayName"
                  onChange={handleDisplayNameChange}
                  placeholder="Enter your display name"
                  required
                  type="text"
                  value={displayName}
                />
                <FieldDescription>
                  How your name appears to family members
                </FieldDescription>
              </Field>

              {error && (
                <Field>
                  <p className="text-red-600 text-sm">{error}</p>
                </Field>
              )}

              {successMessage && (
                <Field>
                  <p className="text-green-600 text-sm">{successMessage}</p>
                </Field>
              )}

              <Field>
                <Button
                  className="w-full"
                  disabled={loading || !hasChanged}
                  type="submit"
                >
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
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
