/**
 * Supabase client for the bot
 * Uses service role key for full database access
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@freeliao/shared';
import { config } from './config.js';

export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type SupabaseClient = typeof supabase;
