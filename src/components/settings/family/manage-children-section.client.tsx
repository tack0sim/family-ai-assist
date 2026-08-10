"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { createChildProfile } from "@/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createChildProfileSchema } from "@/lib/schemas/settings";
import type { FamilyMember } from "@/lib/types/settings";

interface ManageChildrenSectionProps {
  familyId: string;
  members: FamilyMember[];
}

interface CreateChildFormState {
  dateOfBirth: string;
  displayName: string;
  error?: string;
}

export function ManageChildrenSection({
  familyId,
  members,
}: ManageChildrenSectionProps) {
  // Child profiles are members who are marked as children
  const childProfiles = members.filter(
    (m) => m.status === "active" && m.is_child
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    childId: string;
    childName: string;
  }>({
    open: false,
    childId: "",
    childName: "",
  });
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<CreateChildFormState>({
    displayName: "",
    dateOfBirth: "",
  });

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

  const handleCreateChild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState({ ...formState, error: undefined });

    // Validate with zod
    const validation = createChildProfileSchema.safeParse({
      displayName: formState.displayName,
      dateOfBirth: formState.dateOfBirth,
    });

    if (!validation.success) {
      const firstError = Object.values(
        validation.error.flatten().fieldErrors
      )[0]?.[0];
      setFormState({ ...formState, error: firstError || "Validation failed" });
      return;
    }

    setLoading(true);

    try {
      const dateOfBirth = validation.data.dateOfBirth
        ? validation.data.dateOfBirth
        : undefined;
      await createChildProfile(
        familyId,
        validation.data.displayName,
        dateOfBirth
      );
      setCreateDialogOpen(false);
      setFormState({ displayName: "", dateOfBirth: "" });
    } catch (err) {
      setFormState({
        ...formState,
        error:
          err instanceof Error ? err.message : "Failed to create child profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChild = async (childId: string) => {
    // TODO: Implement removeChildProfile action when backend is ready
    // For now, show a placeholder message
    console.log("Remove child:", childId);
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const isEmptyState = childProfiles.length === 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Children</CardTitle>
          <CardDescription>
            Create and manage child profiles for minors in your family
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEmptyState ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-gray-500">
              <p>No child profiles yet</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Child
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {childProfiles.map((child) => (
                  <div
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4"
                    key={child.id}
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(child.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">
                          {child.display_name || "Unknown"}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Created {formatDate(child.joined_at)}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          childId: child.id,
                          childName: child.display_name || "this child",
                        })
                      }
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Child
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Child Dialog */}
      <Dialog
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setFormState({ displayName: "", dateOfBirth: "" });
          }
        }}
        open={createDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Child Profile</DialogTitle>
            <DialogDescription>
              Create a new child profile for a minor in your family
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateChild}>
            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="child-name">Child's Name *</FieldLabel>
                <Input
                  disabled={loading}
                  id="child-name"
                  onChange={(e) =>
                    setFormState({ ...formState, displayName: e.target.value })
                  }
                  placeholder="Enter child's name"
                  type="text"
                  value={formState.displayName}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="child-dob">
                  Date of Birth (optional)
                </FieldLabel>
                <Input
                  disabled={loading}
                  id="child-dob"
                  onChange={(e) =>
                    setFormState({ ...formState, dateOfBirth: e.target.value })
                  }
                  placeholder="YYYY-MM-DD"
                  type="date"
                  value={formState.dateOfBirth}
                />
              </Field>

              {formState.error && (
                <p className="text-red-600 text-sm">{formState.error}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  disabled={loading}
                  onClick={() => setCreateDialogOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button disabled={loading} type="submit">
                  {loading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Creating...
                    </>
                  ) : (
                    "Create Profile"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        open={confirmDialog.open}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Child Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {confirmDialog.childName} from the
              family? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              disabled={loading}
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={() => handleRemoveChild(confirmDialog.childId)}
              variant="destructive"
            >
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
