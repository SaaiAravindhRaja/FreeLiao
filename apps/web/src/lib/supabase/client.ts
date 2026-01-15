/**
 * Supabase client for browser/client components
 */

import { createBrowserClient } from '@supabase/ssr';

// Using any for MVP - will use Supabase CLI generated types in production
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
