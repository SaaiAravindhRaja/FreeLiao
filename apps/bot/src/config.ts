/**
 * Bot configuration and environment variables
 */

import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config = {
  // Telegram Bot
  telegram: {
    botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
    webhookSecret: optionalEnv('TELEGRAM_WEBHOOK_SECRET', ''),
    webhookUrl: optionalEnv('WEBHOOK_URL', ''),
  },

  // Supabase
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },

  // Bot mode: 'polling' for development, 'webhook' for production
  botMode: optionalEnv('BOT_MODE', 'polling') as 'polling' | 'webhook',

  // Environment
  isDevelopment: process.env.NODE_ENV !== 'production',
} as const;

export type Config = typeof config;
