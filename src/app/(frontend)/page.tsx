import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/hero-section";
import { IntroSection } from "@/components/intro-section";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const userName = user?.user_metadata?.full_name ?? user?.email;

  return (
    <div className="flex grow flex-col">
      {isAuthenticated ? <IntroSection userName={userName} /> : <HeroSection />}
    </div>
  );
}
