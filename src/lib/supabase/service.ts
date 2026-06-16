import { createClient } from '@supabase/supabase-js';

/**
 * Service-role supabase client for server-side only operations that must bypass RLS.
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set in the server environment.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set');
  }

  return createClient(url, serviceKey, {
    auth: {
      // No automatic auth handling here; this client is for server-side privileged ops
    },
  });
}
