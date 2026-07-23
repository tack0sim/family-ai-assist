"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { inviteMembers } from "@/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { inviteMembersSchema } from "@/lib/schemas/onboarding";
import { Spinner } from "../ui/spinner";

interface InviteFirstMembersModalProps {
  familyId: string;
  onSkip: () => void;
  onSuccess: () => void;
}

export function InviteFirstMembersModal({
  familyId,
  onSuccess,
  onSkip,
}: InviteFirstMembersModalProps) {
  const [emails, setEmails] = useState<string[]>([""]); // Start with one empty input
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

    // Filter out empty emails
    const filledEmails = emails.filter((email) => email.trim().length > 0);

    // Validate with zod
    const validation = inviteMembersSchema.safeParse({
      emails: filledEmails,
    });

    if (!validation.success) {
      const flattened = validation.error.flatten();
      // Get the first error message
      const fieldErrors = Object.values(flattened.fieldErrors).flat();
      const firstError = fieldErrors[0];
      setError(firstError || "Validation failed. Please check your entries.");
      return;
    }

    setLoading(true);

    try {
      await inviteMembers(familyId, validation.data.emails);
      setShowSuccess(true);
      // Give user time to see the success message before redirecting
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send invitations. Please try again.");
      }
    }
  };

  return (
    <Dialog
      open={true}
      // Note: onOpenChange is not needed since we control visibility via props
    >
      <DialogContent className="max-w-lg">
        {showSuccess ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-green-600">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 text-lg">
              Invitations sent!
            </h3>
            <p className="text-gray-600">
              Your family members have been invited to join.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite Family Members</DialogTitle>
              <DialogDescription>
                Add email addresses to invite people to your family
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleSubmit}>
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

              {/* Buttons */}
              <DialogFooter className="pt-4">
                <Button
                  disabled={loading}
                  onClick={onSkip}
                  type="button"
                  variant="outline"
                >
                  Skip for now
                </Button>
                <Button disabled={loading} type="submit">
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send invitations"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
