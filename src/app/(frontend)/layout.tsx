import type { Metadata } from "next";
import "../globals.css";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Family Assist",
  description:
    "Family Assist is an AI-powered SaaS platform to help manage family tasks and activities. The platform simplifies family organization and communication. It features include shared calendars, task management, and an AI assistant for task management.",
  openGraph: {
    type: "website",
    title: "Family Assist",
    description:
      "Family Assist is an AI-powered SaaS platform to help manage family tasks and activities. The platform simplifies family organization and communication. It features include shared calendars, task management, and an AI assistant for task management.",
    siteName: "Family Assist",
  },
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <body className="theme flex grow flex-col">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SidebarProvider>
          <AuthenticatedLayout>
            <Header />
            <main className="flex grow flex-col">{children}</main>
            <Footer />
          </AuthenticatedLayout>
        </SidebarProvider>
      </ThemeProvider>
    </body>
  );
}
