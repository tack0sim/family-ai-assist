import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <body className="theme">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <main className="flex h-dvh items-center justify-center px-4">
          <div className="text-center">
            <h1 className="mb-4 font-bold text-6xl text-foreground">404</h1>
            <p className="mb-8 text-lg text-muted-foreground">Page not found</p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </ThemeProvider>
    </body>
  );
}
