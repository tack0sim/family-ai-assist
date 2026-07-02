import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-32">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Family Intelligence Simplified
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Organize your family's life with AI-powered insights, shared
            calendars, and intelligent planning.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="gap-2">
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

        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/40">
          <div className="space-y-1">
            <p className="text-2xl font-bold">1000+</p>
            <p className="text-sm text-muted-foreground">Families</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">24/7</p>
            <p className="text-sm text-muted-foreground">AI Support</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">99.9%</p>
            <p className="text-sm text-muted-foreground">Uptime</p>
          </div>
        </div>
      </div>
    </section>
  );
}
