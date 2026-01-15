/**
 * Supabase client for the bot
 * Uses service role key for full database access
 */

import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import { config } from './config.js';

// Using any for MVP - will use generated types from Supabase CLI in production
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type SupabaseClient = SupabaseClientType;
