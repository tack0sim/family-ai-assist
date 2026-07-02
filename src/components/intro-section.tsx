import Link from "next/link";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { CalendarUI } from "./calendar.client";
import { ArrowRight } from "lucide-react";

interface IntroSectionProps {
  userName?: string;
}

export function IntroSection({ userName }: IntroSectionProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome back, {userName?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's your family dashboard overview
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <div className="space-y-4 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Upcoming Events
                  </p>
                  <p className="text-3xl font-bold">5</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Family Members
                  </p>
                  <p className="text-3xl font-bold">4</p>
                </div>
              </CardContent>
            </Card>

            <Link href="/app" className="w-full">
              <Button className="w-full gap-2 h-10">
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
                <p className="text-sm text-muted-foreground">
                  Saturday, 6:00 PM
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
