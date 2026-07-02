import { HeroSection } from "@/components/hero-section";
import { IntroSection } from "@/components/intro-section";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const userName = user?.user_metadata?.full_name ?? user?.email;

  return (
    <>
      {isAuthenticated ? <IntroSection userName={userName} /> : <HeroSection />}
    </>
  );
}
