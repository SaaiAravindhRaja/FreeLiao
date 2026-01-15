/**
 * Main bot instance and configuration
 */

import { Bot, session } from 'grammy';
import { config } from './config.js';
import type { BotContext, SessionData } from './types.js';

// Create bot instance
export const bot = new Bot<BotContext>(config.telegram.botToken);

// Session middleware - stores user session data
bot.use(
  session({
    initial: (): SessionData => ({}),
  })
);

// Error handling middleware
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  console.error(err.error);

  // Try to notify user of error
  try {
    ctx.reply('Oops, something went wrong. Please try again!').catch(() => {
      // Ignore if we can't send error message
    });
  } catch {
    // Ignore
  }
});

export type { BotContext };
