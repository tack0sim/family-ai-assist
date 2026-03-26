CREATE TABLE profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  created_at   timestamptz DEFAULT now()
);