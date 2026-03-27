import { Badge } from "@/components/ui/badge";

const steps = [
  {
    number: "01",
    title: "Create your family",
    description:
      "Set up your family group in seconds. Invite members via email or share a link - it works across iOS, Android, and web.",
  },
  {
    number: "02",
    title: "Connect your calendars",
    description:
      "Import from Google Calendar, Apple Calendar, or Outlook. Our AI merges everything into one unified view.",
  },
  {
    number: "03",
    title: "Let AI do the work",
    description:
      'Just tell Famly what you need. "Schedule dinner with grandma next week" or "Find time for family movie night" - it handles the coordination.',
  },
  {
    number: "04",
    title: "Stay in sync",
    description:
      "Real-time updates keep everyone on the same page. Changes sync instantly, and smart notifications keep everyone informed.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Simple Setup
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            No complicated onboarding. No learning curve. Just your family,
            organized.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex gap-6">
                {/* Step number */}
                <div className="flex-shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
                    <span className="text-lg font-bold text-primary">
                      {step.number}
                    </span>
                  </div>
                  {/* Connector line */}
                  {index < steps.length - 1 && index % 2 === 0 && (
                    <div className="absolute left-7 top-14 hidden h-[calc(100%+2rem)] w-px bg-border lg:block" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 lg:pb-0">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
