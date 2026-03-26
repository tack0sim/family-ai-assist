CREATE TABLE invitations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid REFERENCES families(id) ON DELETE CASCADE,
  email      text NOT NULL,
  token      uuid UNIQUE DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES profiles(id),
  expires_at timestamptz NOT NULL,
  status     text CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending'
);