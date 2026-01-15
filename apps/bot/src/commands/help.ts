/**
 * /help command - Show available commands
 */

import type { BotContext } from '../types.js';

export async function helpCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(
    `🤙 *FreeLiao Commands*\n\n` +
      `*Status Commands:*\n` +
      `/free [time] — Set yourself as free\n` +
      `  Examples: /free 2h, /free 5pm, /free tonight\n` +
      `/busy — Set yourself as busy\n\n` +
      `*Social Commands:*\n` +
      `/whofree — See who's available now\n` +
      `/friends — Manage your friends\n\n` +
      `*Jio Commands:*\n` +
      `/kopi — Quick coffee jio\n` +
      `/makan — Quick food jio\n` +
      `/jio [activity] — Custom hangout invite\n\n` +
      `*Other:*\n` +
      `/help — Show this message\n` +
      `/start — Get started or see your profile\n\n` +
      `_Share your invite code with friends to connect!_`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🟢 Set Status', callback_data: 'menu:status' }],
          [{ text: '👀 Who\'s Free', callback_data: 'menu:whofree' }],
        ],
      },
    }
  );
}
