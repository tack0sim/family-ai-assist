"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Calendar, Users } from "lucide-react";

export function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-32 sm:pt-24 lg:px-8">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-chart-1/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Coming Soon in Beta</span>
          </Badge>

          {/* Headline */}
          <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your family&apos;s command center,{" "}
            <span className="text-primary">powered by AI</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            Keep everyone in sync with smart scheduling, real-time collaborative
            calendars, and an AI assistant that understands your family&apos;s
            unique rhythm.
          </p>

          {/* Waitlist Form */}
          <div id="waitlist" className="mt-10 w-full max-w-md">
            {submitted ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="font-medium text-primary">
                  Mailing list not implemented yet, but we appreciate your
                  enthusiasm!
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 flex-1"
                />
                <Button type="submit" size="lg" className="h-12 gap-2">
                  Join Waitlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              Be the first to know when we launch. No spam, ever.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t border-border pt-10 sm:gap-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">100+</p>
                <p className="text-sm text-muted-foreground">
                  Families waiting
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/10">
                <Calendar className="h-5 w-5 text-chart-2" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">Q4 2026</p>
                <p className="text-sm text-muted-foreground">Beta launch</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-3/10">
                <Sparkles className="h-5 w-5 text-chart-3" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">Free</p>
                <p className="text-sm text-muted-foreground">
                  For early adopters
                </p>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative mt-16 w-full max-w-4xl">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-primary/5">
              {/* App Preview Header */}
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-chart-1/60" />
                  <div className="h-3 w-3 rounded-full bg-chart-3/60" />
                </div>
                <span className="text-xs text-muted-foreground">
                  Famly Dashboard
                </span>
                <div className="w-12" />
              </div>

              {/* App Preview Content */}
              <div className="grid gap-4 p-6 md:grid-cols-3">
                {/* Calendar Preview */}
                <div className="col-span-2 rounded-lg border border-border bg-background p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">March 2026</h3>
                    <div className="flex gap-1">
                      <div className="h-6 w-6 rounded bg-muted" />
                      <div className="h-6 w-6 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div
                        key={i}
                        className="py-1 text-center text-xs font-medium text-muted-foreground"
                      >
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 5;
                      const isToday = day === 26;
                      const hasEvent = [8, 12, 15, 22, 28].includes(day);
                      return (
                        <div
                          key={i}
                          className={`relative flex h-8 items-center justify-center rounded text-sm ${
                            day < 1 || day > 31
                              ? "text-muted-foreground/30"
                              : isToday
                                ? "bg-primary font-semibold text-primary-foreground"
                                : "hover:bg-muted"
                          }`}
                        >
                          {day > 0 && day <= 31 ? day : ""}
                          {hasEvent && day > 0 && day <= 31 && !isToday && (
                            <div className="absolute bottom-1 h-1 w-1 rounded-full bg-chart-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Assistant Preview */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium">AI Assistant</span>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        &quot;Schedule soccer practice for kids on
                        Saturday&quot;
                      </p>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="text-xs">
                        Done! I&apos;ve added soccer practice for Emma and Jake
                        on Saturday at 10 AM. I also noticed it conflicts with
                        your dentist appointment - would you like me to
                        reschedule?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -left-4 top-1/3 hidden rounded-lg border border-border bg-card p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-chart-1" />
                <div>
                  <p className="text-sm font-medium">Sarah joined</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/4 hidden rounded-lg border border-border bg-card p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-chart-2" />
                <div>
                  <p className="text-sm font-medium">Event synced</p>
                  <p className="text-xs text-muted-foreground">
                    Across all devices
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
