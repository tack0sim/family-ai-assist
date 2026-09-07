"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        className="w-full justify-start"
        disabled
        size="sm"
        variant="outline"
      >
        <Sun className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1"
        onClick={() => setTheme("light")}
        size="sm"
        variant={theme === "light" ? "default" : "outline"}
      >
        <Sun className="mr-2 h-4 w-4" />
        Light
      </Button>
      <Button
        className="flex-1"
        onClick={() => setTheme("dark")}
        size="sm"
        variant={theme === "dark" ? "default" : "outline"}
      >
        <Moon className="mr-2 h-4 w-4" />
        Dark
      </Button>
    </div>
  );
}
