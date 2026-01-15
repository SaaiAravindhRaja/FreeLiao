/**
 * Authentication middleware
 * Ensures user exists in database and attaches userId to session
 */

import type { NextFunction } from 'grammy';
import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';

/**
 * Middleware to check if user exists and set session userId
 */
export async function authMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  // Skip if no user info (e.g., channel posts)
  if (!ctx.from) {
    await next();
    return;
  }

  // If we already have userId in session, continue
  if (ctx.session.userId) {
    await next();
    return;
  }

  // Look up user by Telegram ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', ctx.from.id)
    .single();

  if (user) {
    ctx.session.userId = user.id;
  }

  await next();
}

/**
 * Middleware that requires user to be registered
 * Use this for commands that need an existing user
 */
export async function requireAuth(ctx: BotContext, next: NextFunction): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.reply(
      "You're not registered yet! Please use /start to get started.",
      {
        reply_markup: {
          inline_keyboard: [[{ text: 'Get Started', callback_data: 'cmd:start' }]],
        },
      }
    );
    return;
  }

  await next();
}
