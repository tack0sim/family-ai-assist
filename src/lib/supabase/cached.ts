"use server";

import { cache } from "react";
import { createClient } from "./server";

export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
});
