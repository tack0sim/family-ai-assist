"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { createEventTag, deleteEventTag, updateEventTag } from "@/actions";
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
import { type EventTag, eventTagSchema } from "@/lib/schemas/settings";

interface EventTagsSectionProps {
  familyId: string;
  initialTags: EventTag[];
}

interface FormState {
  color: string;
  error?: string;
  name: string;
}

export function EventTagsSection({
  familyId,
  initialTags,
}: EventTagsSectionProps) {
  const [tags, setTags] = useState<EventTag[]>(initialTags);
  const [isPending, startTransition] = useTransition();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<EventTag | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    tagId: string;
    tagName: string;
  }>({
    open: false,
    tagId: "",
    tagName: "",
  });
  const [formState, setFormState] = useState<FormState>({
    name: "",
    color: "#6366f1",
  });

  const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState((s) => ({ ...s, error: undefined }));

    // Validate with zod
    const validation = eventTagSchema.safeParse({
      name: formState.name,
      color: formState.color || undefined,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message;
      setFormState((s) => ({ ...s, error: firstError || "Validation failed" }));
      return;
    }

    startTransition(async () => {
      try {
        const newTag = await createEventTag(
          familyId,
          validation.data.name,
          validation.data.color
        );
        setTags((prevTags) => [newTag, ...prevTags]);
        setCreateDialogOpen(false);
        setFormState({ name: "", color: "#6366f1" });
      } catch (err) {
        setFormState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Failed to create tag",
        }));
      }
    });
  };

  const handleEditTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTag) {
      return;
    }

    setFormState((s) => ({ ...s, error: undefined }));

    // Validate with zod
    const validation = eventTagSchema.safeParse({
      name: formState.name,
      color: formState.color || undefined,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message;
      setFormState((s) => ({ ...s, error: firstError || "Validation failed" }));
      return;
    }

    startTransition(async () => {
      try {
        const updated = await updateEventTag(
          familyId,
          editingTag.id,
          validation.data.name,
          validation.data.color
        );
        setTags((prevTags) =>
          prevTags.map((t) => (t.id === editingTag.id ? updated : t))
        );
        setEditDialogOpen(false);
        setEditingTag(null);
        setFormState({ name: "", color: "#6366f1" });
      } catch (err) {
        setFormState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Failed to update tag",
        }));
      }
    });
  };

  const handleDeleteTag = async () => {
    const { tagId } = confirmDialog;
    setConfirmDialog({ ...confirmDialog, open: false });

    startTransition(async () => {
      try {
        await deleteEventTag(familyId, tagId);
        setTags((prevTags) => prevTags.filter((t) => t.id !== tagId));
      } catch (err) {
        console.error(
          "Failed to delete tag:",
          err instanceof Error ? err.message : "Unknown error"
        );
        // Re-show the delete dialog on error
        const tag = tags.find((t) => t.id === tagId);
        if (tag) {
          setConfirmDialog({
            open: true,
            tagId: tag.id,
            tagName: tag.name,
          });
        }
      }
    });
  };

  const openEditDialog = (tag: EventTag) => {
    setEditingTag(tag);
    setFormState({
      name: tag.name,
      color: tag.color || "#6366f1",
    });
    setEditDialogOpen(true);
  };

  const isEmptyState = tags.length === 0;

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Event Tags</CardTitle>
          <CardDescription>
            Create and manage event tags for organizing family events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEmptyState ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-gray-500">
              <p>No event tags yet</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tags.map((tag) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
                    key={tag.id}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {tag.color && (
                        <div
                          className="h-4 w-4 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      <p className="truncate font-medium text-gray-900">
                        {tag.name}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 gap-1">
                      <Button
                        disabled={isPending}
                        onClick={() => openEditDialog(tag)}
                        size="sm"
                        variant="ghost"
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={isPending}
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            tagId: tag.id,
                            tagName: tag.name,
                          })
                        }
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Tag Dialog */}
      <Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Event Tag</DialogTitle>
            <DialogDescription>
              Add a new tag to organize your family events
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateTag}>
            <Field>
              <FieldLabel htmlFor="create-name">Tag Name</FieldLabel>
              <Input
                autoFocus
                disabled={isPending}
                id="create-name"
                onChange={(e) =>
                  setFormState((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="e.g., Birthday, Holiday"
                value={formState.name}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="create-color">Color (Optional)</FieldLabel>
              <div className="flex gap-2">
                <input
                  className="h-10 rounded border border-gray-200"
                  disabled={isPending}
                  id="create-color"
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, color: e.target.value }))
                  }
                  type="color"
                  value={formState.color}
                />
                <span className="flex items-center text-gray-500 text-sm">
                  {formState.color}
                </span>
              </div>
            </Field>

            {formState.error && (
              <p className="text-red-600 text-sm">{formState.error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                disabled={isPending}
                onClick={() => setCreateDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Tag"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog onOpenChange={setEditDialogOpen} open={editDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event Tag</DialogTitle>
            <DialogDescription>Update the tag details</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditTag}>
            <Field>
              <FieldLabel htmlFor="edit-name">Tag Name</FieldLabel>
              <Input
                autoFocus
                disabled={isPending}
                id="edit-name"
                onChange={(e) =>
                  setFormState((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="e.g., Birthday, Holiday"
                value={formState.name}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-color">Color (Optional)</FieldLabel>
              <div className="flex gap-2">
                <input
                  className="h-10 rounded border border-gray-200"
                  disabled={isPending}
                  id="edit-color"
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, color: e.target.value }))
                  }
                  type="color"
                  value={formState.color}
                />
                <span className="flex items-center text-gray-500 text-sm">
                  {formState.color}
                </span>
              </div>
            </Field>

            {formState.error && (
              <p className="text-red-600 text-sm">{formState.error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                disabled={isPending}
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingTag(null);
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Tag"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ ...confirmDialog, open: false });
          }
        }}
        open={confirmDialog.open}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tag "{confirmDialog.tagName}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button
              disabled={isPending}
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={handleDeleteTag}
              variant="destructive"
            >
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Tag"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
