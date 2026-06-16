-- Create function and trigger to auto-create profiles when a new auth.user is created

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
BEGIN
  -- Insert profile if it doesn't exist. Use raw_user_meta_data.display_name if available.
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    -- attempt to read display name from user metadata, fallback to NULL
    (CASE WHEN (NEW.raw_user_meta_data IS NOT NULL) THEN (NEW.raw_user_meta_data->>'display_name') ELSE NULL END),
    NULL,
    now()
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS trigger_handle_auth_user_created ON auth.users;
CREATE TRIGGER trigger_handle_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();
