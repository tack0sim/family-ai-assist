import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      lang="en"
      suppressHydrationWarning
    >
      {children}
    </html>
  );
}
