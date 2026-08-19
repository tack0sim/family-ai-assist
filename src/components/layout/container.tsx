import { cn } from "@/lib/utils";

export function Container({
  variant = "default",
  children,
  className = "",
}: {
  variant?: "default" | "narrow" | "wide";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 md:px-8 lg:px-10",
        {
          "max-w-7xl": variant === "default",
          "max-w-3xl": variant === "narrow",
          "max-w-9xl": variant === "wide",
        },
        className
      )}
    >
      {children}
    </div>
  );
}
