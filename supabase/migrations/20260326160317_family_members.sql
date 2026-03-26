CREATE TABLE family_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  user_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role      text CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  status    text CHECK (status IN ('pending', 'active')) DEFAULT 'pending',
  joined_at timestamptz,
  UNIQUE (family_id, user_id)
);