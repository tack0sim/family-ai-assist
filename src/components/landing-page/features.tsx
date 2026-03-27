import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Calendar, Users, Bell, Share2, Shield } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Assistant",
    description:
      "Natural language scheduling that understands your family. Just tell it what you need, and it handles the rest.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Calendar,
    title: "Real-Time Calendar",
    description:
      "See everyone's schedules update instantly. No more double-bookings or missed events.",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    icon: Users,
    title: "Family Groups",
    description:
      "Organize by household, extended family, or custom groups. Everyone stays connected.",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description:
      "AI learns when and how each family member prefers to be reminded. No more nagging.",
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description:
      "Share specific events or entire calendars with grandparents, babysitters, or coaches.",
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your family data stays yours. End-to-end encryption and granular privacy controls.",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="bg-muted/30 px-4 py-20 sm:px-6 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your family needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Built for modern families who want to spend less time coordinating
            and more time together.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-md"
            >
              <CardHeader>
                <div
                  className={`mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
