import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

export function HeroSection() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-32">
      <div className="max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="font-bold text-4xl tracking-tight sm:text-5xl md:text-6xl">
            Family Intelligence Simplified
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground sm:text-xl">
            Organize your family's life with AI-powered insights, shared
            calendars, and intelligent planning.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/auth/signup">
            <Button className="gap-2" size="lg">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/#features">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 border-border/40 border-t pt-8">
          <div className="space-y-1">
            <p className="font-bold text-2xl">1000+</p>
            <p className="text-muted-foreground text-sm">Families</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-2xl">24/7</p>
            <p className="text-muted-foreground text-sm">AI Support</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-2xl">99.9%</p>
            <p className="text-muted-foreground text-sm">Uptime</p>
          </div>
        </div>
      </div>
    </section>
  );
}
