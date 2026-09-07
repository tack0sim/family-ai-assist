import { SettingsPopover } from "@/components/layout/settings-popover";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-border/40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <p className="text-muted-foreground text-xs">
          © {currentYear} Family Assist. All rights reserved.
        </p>
        <SettingsPopover />
      </div>
    </footer>
  );
}
