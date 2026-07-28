"use client";

import { useState } from "react";
import { resendInvitation, revokeInvitation } from "@/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { FamilyInvitation } from "@/lib/types/settings";

interface PendingInvitationsSectionProps {
  familyId: string;
  invitations: FamilyInvitation[];
  onInvitationsUpdate: () => Promise<void>;
}

interface ConfirmDialogState {
  email: string;
  invitationId: string;
  open: boolean;
  type: "revoke";
}

export function PendingInvitationsSection({
  invitations,
  familyId,
  onInvitationsUpdate,
}: PendingInvitationsSectionProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    type: "revoke",
    invitationId: "",
    email: "",
  });
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    setError(null);

    try {
      await resendInvitation(familyId, invitationId);
      await onInvitationsUpdate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resend invitation"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    setError(null);

    try {
      await revokeInvitation(familyId, invitationId);
      await onInvitationsUpdate();
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke invitation"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending"
  );
  const isEmptyState = pendingInvitations.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          Manage invitations sent to family members
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {isEmptyState ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <p>No pending invitations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4"
                key={invitation.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {invitation.email}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Sent {formatDate(invitation.created_at)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Expires {formatDate(invitation.expires_at)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    disabled={actionLoading === invitation.id}
                    onClick={() => handleResendInvitation(invitation.id)}
                    size="sm"
                    variant="outline"
                  >
                    {actionLoading === invitation.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      "Resend"
                    )}
                  </Button>
                  <Button
                    disabled={actionLoading === invitation.id}
                    onClick={() =>
                      setConfirmDialog({
                        open: true,
                        type: "revoke",
                        invitationId: invitation.id,
                        email: invitation.email,
                      })
                    }
                    size="sm"
                    variant="destructive"
                  >
                    {actionLoading === invitation.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      "Revoke"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        open={confirmDialog.open}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the invitation to{" "}
              {confirmDialog.email}? They will not be able to join with the
              current invitation link.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              disabled={actionLoading === confirmDialog.invitationId}
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={actionLoading === confirmDialog.invitationId}
              onClick={() => handleRevokeInvitation(confirmDialog.invitationId)}
            >
              {actionLoading === confirmDialog.invitationId ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Revoke
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
