"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { FamilyInvitation, FamilyMember } from "@/lib/types/settings";
import { InviteMembersSection } from "./family/invite-members-section.client";
import { MembersSection } from "./family/members-section.client";
import { PendingInvitationsSection } from "./family/pending-invitations-section.client";

export function FamilyTab({
  familyId,
  members,
  invitations,
  userRole,
}: {
  familyId: string;
  members: FamilyMember[];
  invitations: FamilyInvitation[];
  userRole: "admin" | "member";
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!familyId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-600">No family found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <MembersSection
        currentUserRole={userRole}
        familyId={familyId}
        members={members}
      />

      {userRole === "admin" && (
        <>
          <PendingInvitationsSection
            familyId={familyId}
            invitations={invitations}
          />

          <InviteMembersSection familyId={familyId} />
        </>
      )}
    </div>
  );
}
