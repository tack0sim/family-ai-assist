import type { User } from "@supabase/supabase-js";

type UserLike = Pick<User, "email" | "user_metadata">;

function getMetadataString(
  metadata: User["user_metadata"] | undefined,
  key: string
) {
  const value = (metadata as Record<string, unknown> | undefined)?.[key];

  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

export function getUserDisplayName(user?: UserLike | null) {
  return (
    getMetadataString(user?.user_metadata, "full_name") ??
    getMetadataString(user?.user_metadata, "display_name") ??
    getMetadataString(user?.user_metadata, "name") ??
    user?.email
  );
}

export function getUserAvatarUrl(user?: UserLike | null) {
  return (
    getMetadataString(user?.user_metadata, "avatar_url") ??
    getMetadataString(user?.user_metadata, "picture") ??
    getMetadataString(user?.user_metadata, "avatar") ??
    getMetadataString(user?.user_metadata, "image")
  );
}
