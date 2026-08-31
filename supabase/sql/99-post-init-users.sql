-- Set passwords for auth and rest service users
-- This runs after Supabase migrations via migrate.sh hook

ALTER USER supabase_auth_admin WITH PASSWORD 'postgres';
ALTER USER authenticator WITH PASSWORD 'postgres';

