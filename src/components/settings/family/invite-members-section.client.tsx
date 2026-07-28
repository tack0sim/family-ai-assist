"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { inviteMembers } from "@/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { inviteMembersSchema } from "@/lib/schemas/onboarding";

interface InviteMembersSectionProps {
  familyId: string;
  onInvitationsUpdate: () => Promise<void>;
}

export function InviteMembersSection({
  familyId,
  onInvitationsUpdate,
}: InviteMembersSectionProps) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const addEmailRow = () => {
    setEmails([...emails, ""]);
  };

  const removeEmailRow = (index: number) => {
    if (emails.length === 1) {
      return; // Don't remove if it's the last one
    }
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Filter out empty emails
    const filledEmails = emails.filter((email) => email.trim().length > 0);

    // Validate with zod
    const validation = inviteMembersSchema.safeParse({
      emails: filledEmails,
    });

    if (!validation.success) {
      const flattened = validation.error.flatten();
      const fieldErrors = Object.values(flattened.fieldErrors).flat();
      const firstError = fieldErrors[0];
      setError(firstError || "Validation failed. Please check your entries.");
      return;
    }

    setLoading(true);

    try {
      await inviteMembers(familyId, validation.data.emails);
      setEmails([""]); // Reset form
      setSuccessMessage(
        `Invited ${validation.data.emails.length} member${validation.data.emails.length > 1 ? "s" : ""}!`
      );

      // Update invitations list
      await onInvitationsUpdate();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send invitations. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const filledEmailsCount = emails.filter((e) => e.trim().length > 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Family Members</CardTitle>
        <CardDescription>
          Send invitations to add new members to your family
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email rows */}
            <div className="space-y-3">
              {emails.map((email, index) => (
                <div className="flex gap-2" key={index}>
                  <div className="flex-1">
                    <Field>
                      <FieldLabel htmlFor={`email-${index}`}>
                        {index === 0 ? "Email address" : ""}
                      </FieldLabel>
                      <Input
                        disabled={loading}
                        id={`email-${index}`}
                        name={`email-${index}`}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        placeholder="Enter email address"
                        type="email"
                        value={email}
                      />
                    </Field>
                  </div>
                  {emails.length > 1 && (
                    <button
                      aria-label="Remove email"
                      className="mt-7 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      disabled={loading}
                      onClick={() => removeEmailRow(index)}
                      type="button"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add another email button */}
            <button
              className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700 disabled:opacity-50"
              disabled={loading}
              onClick={addEmailRow}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add another email
            </button>

            {/* Error message */}
            {error && (
              <Field>
                <p className="text-red-600 text-sm">{error}</p>
              </Field>
            )}

            {/* Success message */}
            {successMessage && (
              <Field>
                <p className="text-green-600 text-sm">{successMessage}</p>
              </Field>
            )}

            {/* Submit button */}
            <Button
              className="w-full"
              disabled={loading || filledEmailsCount === 0}
              type="submit"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Sending...
                </>
              ) : (
                `Send Invitation${filledEmailsCount === 1 ? "" : "s"}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
