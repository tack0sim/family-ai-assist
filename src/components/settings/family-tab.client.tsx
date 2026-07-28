"use client";

import { useEffect, useState } from "react";
import { getFamilyData } from "@/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { FamilyInvitation, FamilyMember } from "@/lib/types/settings";
import { InviteMembersSection } from "./family/invite-members-section.client";
import { MembersSection } from "./family/members-section.client";
import { PendingInvitationsSection } from "./family/pending-invitations-section.client";

export function FamilyTab() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<
    "admin" | "member" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getFamilyData();
        setFamilyId(data.familyId);
        setCurrentUserRole(data.userRole);
        setMembers(data.members);
        setInvitations(data.invitations);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching family data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load family data"
        );
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMembersUpdate = async () => {
    try {
      const data = await getFamilyData();
      setMembers(data.members);
      setInvitations(data.invitations);
    } catch (err) {
      console.error("Error refetching family data:", err);
    }
  };

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
        currentUserRole={currentUserRole}
        familyId={familyId}
        members={members}
        onMembersUpdate={handleMembersUpdate}
      />

      {currentUserRole === "admin" && (
        <>
          <PendingInvitationsSection
            familyId={familyId}
            invitations={invitations}
            onInvitationsUpdate={handleMembersUpdate}
          />

          <InviteMembersSection
            familyId={familyId}
            onInvitationsUpdate={handleMembersUpdate}
          />
        </>
      )}
    </div>
  );
}
