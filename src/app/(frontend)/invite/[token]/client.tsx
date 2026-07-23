"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { autoAcceptInvitation } from "@/actions";
import { Spinner } from "@/components/ui/spinner";

interface InvitePageClientProps {
  token: string;
}

/**
 * Client component that handles auto-accepting invitations for authenticated users
 *
 * Shows loading state during auto-accept, then redirects to home on success.
 * Displays error messages for invalid/expired/already-accepted tokens.
 */
export function InvitePageClient({ token }: InvitePageClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error" | "idle">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const attemptAutoAccept = async () => {
      try {
        await autoAcceptInvitation(token);
        // If we get here, the redirect didn't work as expected
        // This shouldn't happen in normal flow since autoAcceptInvitation redirects on success
        setStatus("idle");
        router.push("/");
      } catch (err) {
        // Check if this is a redirect error (success case)
        if (isRedirectError(err)) {
          throw err;
        }

        // Handle error
        setStatus("error");
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      }
    };

    attemptAutoAccept();
  }, [token, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md px-4">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <Spinner className="size-8" />
            </div>
            <p className="text-gray-600">Accepting your invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md px-4">
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                aria-label="Error"
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="mb-2 font-bold text-xl">Invitation Error</h1>
            <p className="mb-6 text-gray-600">{errorMessage}</p>

            <a
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
              href="/"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Idle state (should not reach here normally due to redirect)
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md px-4">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    </div>
  );
}
