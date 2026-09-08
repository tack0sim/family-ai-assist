"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { submitBetaConsent } from "@/actions";
import { LetterOfIntentModal } from "@/components/consent/letter-of-intent-modal.client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export function ConsentContent() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("invitation_token");
  const [consentChecked, setConsentChecked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmitConsent = () => {
    if (!consentChecked) {
      setError("You must accept the Letter of Intent to continue");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await submitBetaConsent(invitationToken ?? undefined);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Letter of Intent</CardTitle>
          <CardDescription>
            Review and accept the beta testing terms to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field className="flex w-fit self-center">
              <Button
                onClick={() => setModalOpen(true)}
                type="button"
                variant="outline"
              >
                View Full Letter of Intent
              </Button>
            </Field>

            <Field>
              <div className="flex items-start gap-3">
                <input
                  checked={consentChecked}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  id="consent-accept"
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  type="checkbox"
                />
                <label
                  className="cursor-pointer font-medium text-sm leading-relaxed"
                  htmlFor="consent-accept"
                >
                  I accept the Letter of Intent for beta testing
                </label>
              </div>
            </Field>

            {error && <p className="mt-2 text-red-600 text-xs">{error}</p>}

            <Field className="flex w-fit self-center">
              <Button
                disabled={isPending || !consentChecked}
                onClick={handleSubmitConsent}
              >
                {isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <LetterOfIntentModal onOpenChange={setModalOpen} open={modalOpen} />
    </div>
  );
}
