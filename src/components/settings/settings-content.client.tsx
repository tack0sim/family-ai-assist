"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { EventTag } from "@/lib/schemas/settings";
import type { FamilyData } from "@/lib/types/settings";
import { EventsTab } from "./events-tab.client";
import { FamilyTab } from "./family-tab.client";
import { ProfileTab } from "./profile-tab.client";

const TABS = [
  { id: "family", label: "Family" },
  { id: "events", label: "Events" },
  { id: "profile", label: "Profile" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsContent({
  familyData,
  initialEventTags,
  initialDisplayName,
}: {
  familyData: FamilyData;
  initialEventTags: EventTag[];
  initialDisplayName: string;
}) {
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") || "family") as TabId;
  const { familyId, members, invitations, userRole } = familyData;

  const isValidTab = TABS.some((tab) => tab.id === currentTab);
  const activeTab = isValidTab ? currentTab : "family";

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tabId);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-gray-200 border-b">
        {TABS.map((tab) => (
          <Button
            className={
              activeTab === tab.id
                ? "rounded-none border-current border-b-2"
                : ""
            }
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            variant={activeTab === tab.id ? "default" : "ghost"}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "family" && (
          <FamilyTab
            familyId={familyId}
            invitations={invitations}
            members={members}
            userRole={userRole}
          />
        )}
        {activeTab === "events" && (
          <EventsTab
            familyId={familyId}
            initialEventTags={initialEventTags}
            userRole={userRole}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab initialDisplayName={initialDisplayName} />
        )}
      </div>
    </div>
  );
}
