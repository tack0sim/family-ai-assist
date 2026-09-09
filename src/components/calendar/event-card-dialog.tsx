"use client";

import { EditIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { updateEvent } from "@/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateEventSchema } from "@/lib/schemas/events";
import type { EventWithDetails } from "@/lib/types/events";
import {
  datetimeLocalToISO,
  formatDateTimeLocal,
} from "@/lib/utils/format-datetime-local";

type EditableField =
  | "title"
  | "description"
  | "type"
  | "visibility"
  | "startAt"
  | "endAt"
  | "allDay";

interface DialogErrors {
  [key: string]: string;
}

interface FormData {
  allDay: EventWithDetails["event"]["all_day"];
  description: EventWithDetails["event"]["description"];
  endAt: string;
  startAt: string;
  title: EventWithDetails["event"]["title"];
  type: EventWithDetails["event"]["type"];
  visibility: EventWithDetails["event"]["visibility"];
}

interface EventCardDialogProps {
  event: EventWithDetails;
  onClose: () => void;
  open: boolean;
}

export function EventCardDialog({
  event,
  open,
  onClose,
}: EventCardDialogProps) {
  const [isOpen, setIsOpen] = useState(open);
  const [isLoading, setIsLoading] = useState(false);
  const [editingFields, setEditingFields] = useState<Set<EditableField>>(
    new Set()
  );
  const [formData, setFormData] = useState<FormData>({
    title: event.event.title,
    description: event.event.description,
    type: event.event.type,
    visibility: event.event.visibility,
    startAt: formatDateTimeLocal(new Date(event.event.start_at)),
    endAt: formatDateTimeLocal(new Date(event.event.end_at)),
    allDay: event.event.all_day,
  });
  const [errors, setErrors] = useState<DialogErrors>({});

  const toggleEditField = (field: EditableField) => {
    const newEditingFields = new Set(editingFields);
    if (newEditingFields.has(field)) {
      newEditingFields.delete(field);
      resetFormData();
    } else {
      newEditingFields.add(field);
    }
    setEditingFields(newEditingFields);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const resetFormData = () => {
    setFormData({
      title: event.event.title,
      description: event.event.description,
      type: event.event.type,
      visibility: event.event.visibility,
      startAt: formatDateTimeLocal(new Date(event.event.start_at)),
      endAt: formatDateTimeLocal(new Date(event.event.end_at)),
      allDay: event.event.all_day,
    });
  };

  const handleFieldChange = (field: EditableField, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const updatePayload: Record<string, unknown> = {};
    editingFields.forEach((field) => {
      if (field === "startAt") {
        updatePayload.startAt = datetimeLocalToISO(formData.startAt);
      } else if (field === "endAt") {
        updatePayload.endAt = datetimeLocalToISO(formData.endAt);
      } else {
        updatePayload[field] = formData[field];
      }
    });

    const validation = updateEventSchema.safeParse(updatePayload);

    if (!validation.success) {
      const fieldErrors: DialogErrors = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field) {
          fieldErrors[field as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await updateEvent(event.event.id, validation.data);
      toast.success("Event updated successfully!");
      setEditingFields(new Set());

      // Close dialog immediately
      // Note: Realtime sync for multi-user updates will be implemented in #36
      handleDialogClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update event";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    onClose();
    setIsOpen(false);
  };

  const hasChanges = editingFields.size > 0;

  return (
    <Dialog
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleDialogClose();
        }
      }}
      open={isOpen}
    >
      <DialogContent className="px-4">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Edit the details of your event below
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Title Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Title</FieldLabel>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => toggleEditField("title")}
                type="button"
              >
                {editingFields.has("title") ? (
                  <XIcon size={16} />
                ) : (
                  <EditIcon size={16} />
                )}
              </button>
            </div>
            <FieldContent>
              {editingFields.has("title") ? (
                <Input
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="Event title"
                  value={formData.title}
                />
              ) : (
                <p className="text-gray-900 text-sm dark:text-gray-100">
                  {formData.title}
                </p>
              )}
              {errors.title && <FieldError>{errors.title}</FieldError>}
            </FieldContent>
          </Field>

          {/* Description Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Description</FieldLabel>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => toggleEditField("description")}
                type="button"
              >
                {editingFields.has("description") ? (
                  <XIcon size={16} />
                ) : (
                  <EditIcon size={16} />
                )}
              </button>
            </div>
            <FieldContent>
              {editingFields.has("description") ? (
                <Input
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  placeholder="Optional description"
                  type="text"
                  value={formData.description || ""}
                />
              ) : (
                <p className="text-gray-900 text-sm dark:text-gray-100">
                  {formData.description || "-"}
                </p>
              )}
              {errors.description && (
                <FieldError>{errors.description}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Type Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Type</FieldLabel>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => toggleEditField("type")}
                type="button"
              >
                {editingFields.has("type") ? (
                  <XIcon size={16} />
                ) : (
                  <EditIcon size={16} />
                )}
              </button>
            </div>
            <FieldContent>
              {editingFields.has("type") ? (
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(e) =>
                    handleFieldChange(
                      "type",
                      e.target.value as EventWithDetails["event"]["type"]
                    )
                  }
                  value={formData.type}
                >
                  <option value="event">Event</option>
                  <option value="appointment">Appointment</option>
                  <option value="reminder">Reminder</option>
                  <option value="deadline">Deadline</option>
                </select>
              ) : (
                <Badge>{formData.type}</Badge>
              )}
              {errors.type && <FieldError>{errors.type}</FieldError>}
            </FieldContent>
          </Field>

          {/* Visibility Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Visibility</FieldLabel>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => toggleEditField("visibility")}
                type="button"
              >
                {editingFields.has("visibility") ? (
                  <XIcon size={16} />
                ) : (
                  <EditIcon size={16} />
                )}
              </button>
            </div>
            <FieldContent>
              {editingFields.has("visibility") ? (
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(e) =>
                    handleFieldChange(
                      "visibility",
                      e.target.value as EventWithDetails["event"]["visibility"]
                    )
                  }
                  value={formData.visibility}
                >
                  <option value="family">Family</option>
                  <option value="personal">Personal</option>
                </select>
              ) : (
                <p className="text-gray-900 text-sm capitalize dark:text-gray-100">
                  {formData.visibility}
                </p>
              )}
              {errors.visibility && (
                <FieldError>{errors.visibility}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Start Date & Time Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Start Date & Time</FieldLabel>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => toggleEditField("startAt")}
                type="button"
              >
                {editingFields.has("startAt") ? (
                  <XIcon size={16} />
                ) : (
                  <EditIcon size={16} />
                )}
              </button>
            </div>
            <FieldContent>
              {editingFields.has("startAt") ? (
                <Input
                  onChange={(e) => handleFieldChange("startAt", e.target.value)}
                  type="datetime-local"
                  value={formData.startAt}
                />
              ) : (
                <p className="text-gray-900 text-sm dark:text-gray-100">
                  {new Date(event.event.start_at).toLocaleString()}
                </p>
              )}
              {errors.startAt && <FieldError>{errors.startAt}</FieldError>}
            </FieldContent>
          </Field>

          {/* End Date & Time Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>End Date & Time</FieldLabel>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => toggleEditField("endAt")}
                type="button"
              >
                {editingFields.has("endAt") ? (
                  <XIcon size={16} />
                ) : (
                  <EditIcon size={16} />
                )}
              </button>
            </div>
            <FieldContent>
              {editingFields.has("endAt") ? (
                <Input
                  onChange={(e) => handleFieldChange("endAt", e.target.value)}
                  type="datetime-local"
                  value={formData.endAt}
                />
              ) : (
                <p className="text-gray-900 text-sm dark:text-gray-100">
                  {new Date(event.event.end_at).toLocaleString()}
                </p>
              )}
              {errors.endAt && <FieldError>{errors.endAt}</FieldError>}
            </FieldContent>
          </Field>

          {/* All Day Field */}
          <Field orientation="horizontal">
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  checked={formData.allDay}
                  className="h-4 w-4"
                  onChange={(e) =>
                    handleFieldChange("allDay", e.target.checked)
                  }
                  type="checkbox"
                />
                <span className="text-sm">All day event</span>
              </label>
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => toggleEditField("allDay")}
                type="button"
              >
                {editingFields.has("allDay") ? (
                  <XIcon size={16} />
                ) : (
                  <EditIcon size={16} />
                )}
              </button>
            </div>
          </Field>

          {/* Footer */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={handleDialogClose}
              type="button"
              variant="outline"
            >
              Close
            </Button>
            {hasChanges && (
              <Button className="flex-1" disabled={isLoading} type="submit">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
