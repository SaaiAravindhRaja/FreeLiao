/**
 * /free command - Set status as free
 */

import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';
import { parseTimeInput, formatRelativeTime } from '../utils/time-parser.js';

export async function freeCommand(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.reply("Please /start first to register!");
    return;
  }

  // Get the time argument from command
  const input = ctx.message?.text?.replace(/^\/free\s*/i, '').trim();

  if (!input) {
    // No duration specified - show options
    await ctx.reply('🟢 How long are you free?', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '1 hour', callback_data: 'free:1h' },
            { text: '2 hours', callback_data: 'free:2h' },
            { text: '3 hours', callback_data: 'free:3h' },
          ],
          [
            { text: 'Until 5pm', callback_data: 'free:until_17' },
            { text: 'Until 8pm', callback_data: 'free:until_20' },
            { text: 'Until tonight', callback_data: 'free:until_22' },
          ],
          [{ text: 'All day', callback_data: 'free:all_day' }],
        ],
      },
    });
    return;
  }

  // Parse the time input
  const { freeUntil, expiresAt, displayText } = parseTimeInput(input);

  if (!freeUntil) {
    await ctx.reply(
      `Couldn't understand "${input}"\n\n` +
        `Try:\n` +
        `• /free 2h — Free for 2 hours\n` +
        `• /free 5pm — Free until 5pm\n` +
        `• /free 30m — Free for 30 minutes\n` +
        `• /free tonight — Free until tonight`
    );
    return;
  }

  // Update status in database
  const { error } = await supabase
    .from('user_status')
    .upsert(
      {
        user_id: ctx.session.userId,
        status_type: 'free',
        free_until: freeUntil.toISOString(),
        free_after: null,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.error('Error updating status:', error);
    await ctx.reply('Something went wrong. Try again!');
    return;
  }

  // Get count of free friends
  const { data: freeFriends } = await supabase.rpc('get_friends_statuses', {
    p_user_id: ctx.session.userId,
  });

  const freeCount = freeFriends?.filter((f) => f.status_type === 'free').length || 0;

  const friendMessage =
    freeCount > 0
      ? `${freeCount} friend${freeCount > 1 ? 's' : ''} also free right now!`
      : 'No friends free right now.';

  await ctx.reply(
    `✅ Status updated!\n\n` +
      `🟢 Free ${displayText}\n\n` +
      `${friendMessage}\n\n` +
      `Add a vibe?`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '😎 Down for anything', callback_data: 'vibe:down' }],
          [
            { text: '🍜 Need food', callback_data: 'vibe:food' },
            { text: '😴 Bored af', callback_data: 'vibe:bored' },
          ],
          [
            { text: '📚 Can study', callback_data: 'vibe:study' },
            { text: '✍️ Custom', callback_data: 'vibe:custom' },
          ],
          [{ text: '➡️ Skip', callback_data: 'vibe:skip' }],
        ],
      },
    }
  );
}

/**
 * Handle free time selection from inline keyboard
 */
export async function handleFreeTimeSelection(
  ctx: BotContext,
  timeCode: string
): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  let freeUntil: Date;
  let displayText: string;
  const now = new Date();

  switch (timeCode) {
    case '1h':
      freeUntil = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      displayText = 'for 1 hour';
      break;
    case '2h':
      freeUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      displayText = 'for 2 hours';
      break;
    case '3h':
      freeUntil = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      displayText = 'for 3 hours';
      break;
    case 'until_17':
      freeUntil = new Date(now);
      freeUntil.setHours(17, 0, 0, 0);
      if (freeUntil <= now) freeUntil.setDate(freeUntil.getDate() + 1);
      displayText = 'until 5pm';
      break;
    case 'until_20':
      freeUntil = new Date(now);
      freeUntil.setHours(20, 0, 0, 0);
      if (freeUntil <= now) freeUntil.setDate(freeUntil.getDate() + 1);
      displayText = 'until 8pm';
      break;
    case 'until_22':
      freeUntil = new Date(now);
      freeUntil.setHours(22, 0, 0, 0);
      if (freeUntil <= now) freeUntil.setDate(freeUntil.getDate() + 1);
      displayText = 'until tonight';
      break;
    case 'all_day':
      freeUntil = new Date(now);
      freeUntil.setHours(23, 59, 59, 999);
      displayText = 'all day';
      break;
    default:
      await ctx.answerCallbackQuery('Unknown time option');
      return;
  }

  // Update status
  const { error } = await supabase
    .from('user_status')
    .upsert(
      {
        user_id: ctx.session.userId,
        status_type: 'free',
        free_until: freeUntil.toISOString(),
        free_after: null,
        expires_at: freeUntil.toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    await ctx.answerCallbackQuery('Something went wrong!');
    return;
  }

  await ctx.answerCallbackQuery('Status updated!');

  // Update the message
  await ctx.editMessageText(
    `✅ Status updated!\n\n` +
      `🟢 Free ${displayText}\n\n` +
      `Add a vibe?`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '😎 Down for anything', callback_data: 'vibe:down' }],
          [
            { text: '🍜 Need food', callback_data: 'vibe:food' },
            { text: '😴 Bored af', callback_data: 'vibe:bored' },
          ],
          [
            { text: '📚 Can study', callback_data: 'vibe:study' },
            { text: '✍️ Custom', callback_data: 'vibe:custom' },
          ],
          [{ text: '➡️ Skip', callback_data: 'vibe:skip' }],
        ],
      },
    }
  );
}
