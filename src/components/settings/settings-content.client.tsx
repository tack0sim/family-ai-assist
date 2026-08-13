"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { EventTag } from "@/lib/schemas/settings";
import type { FamilyData } from "@/lib/types/settings";
import { EventsTab } from "./events-tab.client";
import { FamilyTab } from "./family-tab.client";
import { ProfileTab } from "./profile-tab.client";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "family", label: "Family" },
  { id: "events", label: "Events" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsContent({
  familyData,
  initialEventTags,
}: {
  familyData: FamilyData;
  initialEventTags: EventTag[];
}) {
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") || "profile") as TabId;
  const { familyId, members, invitations, userRole } = familyData;

  const isValidTab = TABS.some((tab) => tab.id === currentTab);
  const activeTab = isValidTab ? currentTab : "profile";

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
        {activeTab === "profile" && <ProfileTab />}
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
      </div>
    </div>
  );
}
