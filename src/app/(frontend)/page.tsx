import { HeroSection } from "@/components/hero-section";
import { IntroSection } from "@/components/intro-section";
import { createClient } from "@/lib/supabase/server";
import { getUserDisplayName } from "@/lib/supabase/user";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const userName = getUserDisplayName(user);

  return (
    <>
      {isAuthenticated ? <IntroSection userName={userName} /> : <HeroSection />}
    </>
  );
}
