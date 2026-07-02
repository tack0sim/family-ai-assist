import Link from "next/link";
import { Heart, Home, Settings } from "lucide-react";

const SOCIAL_LINKS = [
  {
    icon: Heart,
    href: "#",
    label: "Contact",
  },
  {
    icon: Settings,
    href: "#",
    label: "Feedback",
  },
  {
    icon: Home,
    href: "#",
    label: "Website",
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <p className="text-xs text-muted-foreground">
          © {currentYear} FamilyAI. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={link.label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
