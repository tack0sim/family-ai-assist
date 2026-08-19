"use client";

import { useEffect, useState } from "react";
import { createEvent, updateEvent } from "@/actions";
import { EventAssigneeSelectorClient } from "@/components/calendar/event-assignee-selector.client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Spinner } from "@/components/ui/spinner";
import {
  type CreateEventFormData,
  createEventSchema,
} from "@/lib/schemas/events";
import type { FamilyMember } from "@/lib/types/settings";

type AssigneeProfile = Pick<FamilyMember, "id" | "display_name">;

interface EventFormProps {
  familyId: string;
  familyMembers: AssigneeProfile[];
  initialData?: Partial<CreateEventFormData> & { id?: string };
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
}

export function EventForm({
  open,
  onOpenChange,
  onSuccess,
  familyId,
  familyMembers,
  initialData,
}: EventFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [startAt, setStartAt] = useState(initialData?.startAt ?? "");
  const [endAt, setEndAt] = useState(initialData?.endAt ?? "");
  const [allDay, setAllDay] = useState(initialData?.allDay ?? false);
  const [type, setType] = useState<
    "event" | "appointment" | "reminder" | "deadline"
  >((initialData?.type as any) ?? "event");
  const [visibility, setVisibility] = useState<"family" | "personal">(
    (initialData?.visibility as any) ?? "family"
  );
  const [assignees, setAssignees] = useState<string[]>(
    initialData?.assignees ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Update form state when initialData changes (e.g., when time slot is clicked)
  useEffect(() => {
    if (open) {
      setTitle(initialData?.title ?? "");
      setDescription(initialData?.description ?? "");
      setStartAt(initialData?.startAt ?? "");
      setEndAt(initialData?.endAt ?? "");
      setAllDay(initialData?.allDay ?? false);
      setType((initialData?.type as any) ?? "event");
      setVisibility((initialData?.visibility as any) ?? "family");
      setAssignees(initialData?.assignees ?? []);
      setError(null);
      setFieldErrors({});
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = {
      title,
      description,
      startAt,
      endAt,
      allDay,
      type,
      visibility,
      assignees,
      tags: [],
    };

    const validation = createEventSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      const flattened = validation.error.flatten();

      // Add field errors
      Object.entries(flattened.fieldErrors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          errors[field] = messages[0];
        }
      });

      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      if (initialData?.id) {
        await updateEvent(initialData.id, validation.data);
      } else {
        await createEvent(familyId, validation.data);
      }
      setTitle("");
      setDescription("");
      setStartAt("");
      setEndAt("");
      setAllDay(false);
      setType("event");
      setVisibility("family");
      setAssignees([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? "Edit Event" : "Create Event"}
          </DialogTitle>
          <DialogDescription>
            {initialData?.id
              ? "Update event details"
              : "Add a new event to the calendar"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel>Title</FieldLabel>
            <FieldContent>
              <Input
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                required
                type="text"
                value={title}
              />
              {fieldErrors.title && (
                <FieldError>{fieldErrors.title}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <FieldContent>
              <Input
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                type="text"
                value={description}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Start Date & Time</FieldLabel>
            <FieldContent>
              <Input
                onChange={(e) => setStartAt(e.target.value)}
                required
                type="datetime-local"
                value={startAt}
              />
              {fieldErrors.startAt && (
                <FieldError>{fieldErrors.startAt}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>End Date & Time</FieldLabel>
            <FieldContent>
              <Input
                onChange={(e) => setEndAt(e.target.value)}
                required
                type="datetime-local"
                value={endAt}
              />
              {fieldErrors.endAt && (
                <FieldError>{fieldErrors.endAt}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field orientation="horizontal">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={allDay}
                className="h-4 w-4"
                onChange={(e) => setAllDay(e.target.checked)}
                type="checkbox"
              />
              <span className="text-sm">All day event</span>
            </label>
          </Field>

          <Field>
            <FieldLabel>Type</FieldLabel>
            <FieldContent>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                onChange={(e) => setType(e.target.value as any)}
                value={type}
              >
                <option value="event">Event</option>
                <option value="appointment">Appointment</option>
                <option value="reminder">Reminder</option>
                <option value="deadline">Deadline</option>
              </select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Visibility</FieldLabel>
            <FieldContent>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                onChange={(e) => setVisibility(e.target.value as any)}
                value={visibility}
              >
                <option value="family">Family</option>
                <option value="personal">Personal</option>
              </select>
            </FieldContent>
          </Field>

          <EventAssigneeSelectorClient
            disabled={loading}
            members={familyMembers}
            onChange={setAssignees}
            selected={assignees}
          />

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              disabled={loading}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={loading} type="submit">
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
