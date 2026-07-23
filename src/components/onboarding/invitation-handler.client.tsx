"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { autoAcceptInvitation } from "@/actions";

/**
 * Client component that handles auto-accepting invitations from URL params.
 * Shows error alerts if auto-accept fails.
 * Redirects to home on success (via redirect in server action).
 */
export function InvitationHandler() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const invitationToken = searchParams.get("invitation_token");

    if (!invitationToken) {
      return;
    }

    const attemptAutoAccept = async () => {
      setProcessing(true);
      try {
        await autoAcceptInvitation(invitationToken);
      } catch (err) {
        if (isRedirectError(err)) {
          // Redirect is expected on success
          throw err;
        }
        setProcessing(false);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to auto-accept invitation. Please try again.");
        }
      }
    };

    attemptAutoAccept();
  }, [searchParams]);

  if (!error) {
    return null;
  }

  return (
    <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
      <p className="text-red-800 text-sm">{error}</p>
    </div>
  );
}
