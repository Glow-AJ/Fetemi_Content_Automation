import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Administrative client with service_role privileges.
 * ONLY use this in Server Actions or API Routes.
 * NEVER expose to the client.
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin environment variables are missing');
  }

  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};
