"use client";

import { X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field";
import type { FamilyMember } from "@/lib/types/settings";

type AssigneeProfile = Pick<FamilyMember, "id" | "display_name">;

interface EventAssigneeSelectorClientProps {
  disabled?: boolean;
  members: AssigneeProfile[];
  onChange: (assigneeIds: string[]) => void;
  selected: string[];
}

export function EventAssigneeSelectorClient({
  selected,
  onChange,
  members,
  disabled = false,
}: EventAssigneeSelectorClientProps) {
  const [open, setOpen] = useState(false);

  const toggleAssignee = useCallback(
    (profileId: string) => {
      if (selected.includes(profileId)) {
        onChange(selected.filter((id) => id !== profileId));
      } else {
        onChange([...selected, profileId]);
      }
    },
    [selected, onChange]
  );

  const selectedMembers = useMemo(
    () => members.filter((m) => selected.includes(m.id)),
    [members, selected]
  );

  const displayText = useMemo(() => {
    if (selectedMembers.length === 0) {
      return "Select assignees";
    }
    if (selectedMembers.length === 1) {
      return selectedMembers[0].display_name || "Unnamed";
    }
    return `${selectedMembers.length} assigned`;
  }, [selectedMembers]);

  return (
    <div className="space-y-2">
      <FieldLabel>Assignees</FieldLabel>

      <Button
        className="w-full justify-start text-left"
        disabled={disabled}
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        {displayText}
      </Button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <Badge
              className="flex items-center gap-1"
              key={member.id}
              variant="secondary"
            >
              {member.display_name || "Unknown"}
              <button
                className="ml-1 hover:opacity-75"
                onClick={() => toggleAssignee(member.id)}
                tabIndex={-1}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Assignees</DialogTitle>
            <DialogDescription>
              Choose family members to assign to this event
            </DialogDescription>
          </DialogHeader>

          {members.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              No family members available
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {members.map((member) => (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50"
                  key={member.id}
                >
                  <input
                    checked={selected.includes(member.id)}
                    className="h-4 w-4"
                    onChange={() => toggleAssignee(member.id)}
                    type="checkbox"
                  />
                  <span className="text-sm">
                    {member.display_name || "Unnamed"}
                  </span>
                </label>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
