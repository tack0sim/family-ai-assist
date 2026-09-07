import { useEffect, useState } from "react";

export type ViewportBreakpoint = "mobile" | "tablet" | "desktop";
export type VisibleDays = 2 | 5 | 7;

interface ResponsiveDaysConfig {
  breakpoint: ViewportBreakpoint;
  dayWidthClass: string;
  visibleDays: VisibleDays;
}

/**
 * Determines the responsive breakpoint and visible day count based on viewport width.
 *
 * Breakpoints:
 * - Mobile: < 640px → 2 days max visible, 50vw per day, horizontal scroll all 7 days
 * - Tablet: 640px-1024px → 5 days max visible, 20vw per day, horizontal scroll all 7 days
 * - Desktop: ≥ 1024px → 7 days visible, ~14.3vw per day (flex-1 distribution)
 *
 * Note: visibleDays is the initial viewport size. Users can scroll to see additional days.
 * All 7 days are always rendered; they're just hidden off-screen on mobile/tablet.
 */
export function useResponsiveDays(): ResponsiveDaysConfig {
  const [config, setConfig] = useState<ResponsiveDaysConfig>({
    breakpoint: "desktop",
    visibleDays: 7,
    dayWidthClass: "flex-1",
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = typeof window === "undefined" ? 1024 : window.innerWidth;

      // Mobile: < 640px
      if (width < 640) {
        setConfig({
          breakpoint: "mobile",
          visibleDays: 2,
          dayWidthClass: "w-[50vw]",
        });
      }
      // Tablet: 640px to < 1024px
      // 20vw per day ensures 5 days fill viewport: 5 * 20vw = 100vw
      else if (width < 1024) {
        setConfig({
          breakpoint: "tablet",
          visibleDays: 5,
          dayWidthClass: "w-[20vw]",
        });
      }
      // Desktop: >= 1024px
      else {
        setConfig({
          breakpoint: "desktop",
          visibleDays: 7,
          dayWidthClass: "flex-1",
        });
      }
    };

    updateConfig();

    const handleResize = () => updateConfig();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return config;
}
