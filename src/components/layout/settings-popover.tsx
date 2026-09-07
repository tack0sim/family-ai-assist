"use client";

import { Settings } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { APP_VERSION } from "@/lib/utils";

export function SettingsPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Settings"
          className="h-4 w-4"
          size="icon"
          variant="ghost"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="space-y-4">
          {/* Dark Mode Toggle */}
          <div className="space-y-2">
            <p className="font-medium text-sm">Theme</p>
            <ModeToggle />
          </div>

          {/* Version */}
          <div className="space-y-2 border-t pt-4">
            <p className="text-muted-foreground text-xs">App Version</p>
            <p className="font-mono text-sm">{APP_VERSION}</p>
          </div>

          {/* Contact Form */}
          <div className="space-y-2 border-t pt-4">
            <p className="font-medium text-sm">Contact</p>
            <Button className="w-full" size="sm" variant="outline">
              Send Feedback
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
