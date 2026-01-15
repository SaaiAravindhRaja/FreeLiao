/**
 * Command registration
 * Registers all bot commands with the Grammy bot instance
 */

import type { Bot } from 'grammy';
import type { BotContext } from '../types.js';

// Import command handlers
import { startCommand } from './start.js';
import { freeCommand } from './free.js';
import { busyCommand } from './busy.js';
import { whofreeCommand } from './whofree.js';
import { jioCommand, kopiCommand, makanCommand } from './jio.js';
import { friendsCommand } from './friends.js';
import { helpCommand } from './help.js';

/**
 * Register all commands with the bot
 */
export function registerCommands(bot: Bot<BotContext>): void {
  // Core commands
  bot.command('start', startCommand);
  bot.command('help', helpCommand);

  // Status commands
  bot.command('free', freeCommand);
  bot.command('busy', busyCommand);
  bot.command('whofree', whofreeCommand);

  // Jio commands
  bot.command('jio', jioCommand);
  bot.command('kopi', kopiCommand);
  bot.command('makan', makanCommand);

  // Friend commands
  bot.command('friends', friendsCommand);

  console.log('📝 Commands registered');
}

// Re-export individual commands for testing
export { startCommand, freeCommand, busyCommand, whofreeCommand };
export { jioCommand, kopiCommand, makanCommand };
export { friendsCommand, helpCommand };
