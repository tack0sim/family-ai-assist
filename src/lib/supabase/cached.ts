"use server";

import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "./server";

export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  return userData?.user as NonNullable<User>;
});
