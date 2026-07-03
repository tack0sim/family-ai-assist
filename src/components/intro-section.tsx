import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CalendarUI } from "./calendar.client";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface IntroSectionProps {
  userName?: string;
}

export function IntroSection({ userName }: IntroSectionProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-4">
          <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Welcome back, {userName?.split(" ")[0]}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Here's your family dashboard overview
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Family Calendar</CardTitle>
              <CardDescription>
                Upcoming events and family activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarUI />
            </CardContent>
          </Card>

          <div className="flex flex-col space-y-4">
            <Card className="flex flex-1 flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-center space-y-3">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Upcoming Events
                  </p>
                  <p className="font-bold text-3xl">5</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Family Members
                  </p>
                  <p className="font-bold text-3xl">4</p>
                </div>
              </CardContent>
            </Card>

            <Link className="w-full" href="/app">
              <Button className="h-10 w-full gap-2">
                Go to App
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Next Family Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">Weekly Family Dinner</p>
                <p className="text-muted-foreground text-sm">
                  Saturday, 6:00 PM
                </p>
              </div>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
