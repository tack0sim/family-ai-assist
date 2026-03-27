export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Talha Minhas. All rights reserved.
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Built with Next.js, AI SDK, Supabase, TailwindCSS and more. Landing
          page designed by v0.
        </p>
      </div>
    </footer>
  );
}
