import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "As a mom of three, I was drowning in Google Calendar tabs. The AI assistant is a game-changer - I just tell it what we need and it figures out the logistics.",
    author: "Michelle T.",
    role: "Beta Tester, Mom of 3",
    initials: "MT",
    color: "bg-chart-1",
  },
  {
    quote:
      "Finally, an app that gets how complicated modern family schedules are. The real-time sync means no more 'I didn't know about that!' moments.",
    author: "David K.",
    role: "Beta Tester, Dad of 2",
    initials: "DK",
    color: "bg-chart-2",
  },
  {
    quote:
      "We've tried every family calendar app out there. Famly is the first one that my teenagers actually use because the AI makes it so easy.",
    author: "Rachel M.",
    role: "Beta Tester, Mom of 4",
    initials: "RM",
    color: "bg-chart-3",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="bg-muted/30 px-4 py-20 sm:px-6 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by families in beta
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            See what early testers are saying about Famly
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative border-border/50 bg-card">
              <CardContent className="pt-6">
                <Quote className="mb-4 h-8 w-8 text-primary/20" />
                <blockquote className="text-foreground">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback
                      className={`${testimonial.color} text-white`}
                    >
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
