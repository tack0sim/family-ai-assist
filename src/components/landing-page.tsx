import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "./layout/container";
import { Section } from "./layout/section";
import { Button } from "./ui/button";

export function LandingPage() {
  return (
    <>
      <Section className="pt-20!">
        <Container className="flex flex-col items-center justify-center gap-y-4 md:gap-y-8">
          <div className="space-y-4 text-center">
            <h1 className="font-bold text-4xl tracking-tight sm:text-5xl md:text-6xl">
              Welcome to Family Assist
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
        </Container>
      </Section>

      <Section className="pt-0!">
        <Container variant="narrow">
          <div className="grid grid-cols-3 gap-4 border-border/40 border-t pt-8 text-center lg:pt-12">
            <div className="space-y-1">
              <p className="font-bold text-2xl">10+</p>
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
        </Container>
      </Section>

      <Section className="pt-0!">
        <Container variant="narrow">
          <div className="border-border/40 border-t pt-8 lg:pt-12">
            <p className="mx-auto max-w-xl text-muted-foreground text-sm sm:text-base">
              Family Assist is currently in active Beta-testing. Join the early
              access program to become an active part of shaping Family Assist.
              Your feedback will provide first-hand insights that will help us
              improve and tailor the platform to better serve your family's
              needs.
              <br />
              <br />
              Please read the Letter of Intent to understand the terms and
              conditions of participating in the beta program.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
