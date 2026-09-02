"use client";

import { useState } from "react";
import { removeMember, updateMemberRole } from "@/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { FamilyMember } from "@/lib/types/settings";

interface MembersSectionProps {
  currentUserRole: "admin" | "member" | null;
  familyId: string;
  members: FamilyMember[];
}

export function MembersSection({
  members,
  currentUserRole,
  familyId,
}: MembersSectionProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "remove" | "promote" | "demote";
    memberId: string;
    memberName: string;
  }>({
    open: false,
    type: "remove",
    memberId: "",
    memberName: "",
  });
  const [error, setError] = useState<string | null>(null);

  const getInitials = (name?: string) => {
    if (!name) {
      return "?";
    }
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    setActionLoading(memberId);
    setError(null);

    try {
      await removeMember(familyId, memberId);
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: "admin" | "member"
  ) => {
    setActionLoading(memberId);
    setError(null);

    try {
      await updateMemberRole(familyId, memberId, newRole);

      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update member role"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const activeMembers = members.filter((m) => m.status === "active");

  const isEmptyState = activeMembers.length === 0;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Family Members</CardTitle>
        <CardDescription>Manage family members and their roles</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {isEmptyState ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <p>No family members yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeMembers.map((member) => (
              <div
                className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center"
                key={member.id}
              >
                <div className="flex flex-1 items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      alt={member.display_name}
                      src={member.avatar_url}
                    />
                    <AvatarFallback>
                      {getInitials(member.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {member.display_name || "Unknown"}
                    </p>
                    {/* <p className="text-gray-500 text-sm">
                      {member.email || "No email"}
                    </p> */}
                    <p className="text-gray-400 text-xs">
                      Joined {formatDate(member.joined_at)}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 text-xs">
                      {member.role === "admin" ? "Admin" : "Member"}
                    </span>

                    {currentUserRole === "admin" && (
                      <div className="flex gap-2">
                        <Button
                          disabled={actionLoading === member.user_id}
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              type:
                                member.role === "admin" ? "demote" : "promote",
                              memberId: member.user_id,
                              memberName: member.display_name || "this member",
                            })
                          }
                          size="sm"
                          variant="outline"
                        >
                          {member.role === "admin" ? "Demote" : "Promote"}
                        </Button>
                        <Button
                          disabled={actionLoading === member.user_id}
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              type: "remove",
                              memberId: member.user_id,
                              memberName: member.display_name || "this member",
                            })
                          }
                          size="sm"
                          variant="destructive"
                        >
                          {actionLoading === member.user_id ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            "Remove"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
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
            <DialogTitle>
              {confirmDialog.type === "remove"
                ? "Remove Member"
                : confirmDialog.type === "promote"
                  ? "Promote Member"
                  : "Demote Member"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "remove"
                ? `Are you sure you want to remove ${confirmDialog.memberName} from the family?`
                : confirmDialog.type === "promote"
                  ? `Promote ${confirmDialog.memberName} to admin?`
                  : `Demote ${confirmDialog.memberName} to member?`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              disabled={actionLoading === confirmDialog.memberId}
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={actionLoading === confirmDialog.memberId}
              onClick={() => {
                if (confirmDialog.type === "remove") {
                  handleRemoveMember(confirmDialog.memberId);
                } else if (confirmDialog.type === "promote") {
                  handleUpdateRole(confirmDialog.memberId, "admin");
                } else {
                  handleUpdateRole(confirmDialog.memberId, "member");
                }
              }}
            >
              {actionLoading === confirmDialog.memberId ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              {confirmDialog.type === "remove"
                ? "Remove"
                : confirmDialog.type === "promote"
                  ? "Promote"
                  : "Demote"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
