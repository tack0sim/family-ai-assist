import { cn } from "@/lib/utils";

export function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto w-full py-8 lg:py-12", className)}>
      {children}
    </section>
  );
}
