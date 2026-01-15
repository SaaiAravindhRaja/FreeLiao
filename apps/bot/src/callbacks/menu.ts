/**
 * Menu callback handler - handles menu:* callbacks
 */

import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';

export async function handleMenuCallback(ctx: BotContext): Promise<void> {
  if (!ctx.callbackQuery?.data) {
    await ctx.answerCallbackQuery('Invalid action');
    return;
  }

  const match = ctx.callbackQuery.data.match(/^menu:(.+)$/);
  if (!match) {
    await ctx.answerCallbackQuery('Invalid menu action');
    return;
  }

  const action = match[1];

  switch (action) {
    case 'status':
      await handleStatusMenu(ctx);
      break;
    case 'whofree':
      await handleWhofreeMenu(ctx);
      break;
    case 'jio':
      await handleJioMenu(ctx);
      break;
    case 'invite':
      await handleInviteMenu(ctx);
      break;
    default:
      await ctx.answerCallbackQuery('Unknown menu option');
  }
}

async function handleStatusMenu(ctx: BotContext): Promise<void> {
  await ctx.answerCallbackQuery();
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
        [{ text: '🔴 Set as Busy', callback_data: 'status:busy' }],
      ],
    },
  });
}

async function handleWhofreeMenu(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  await ctx.answerCallbackQuery();

  // Import and call whofree command
  const { whofreeCommand } = await import('../commands/whofree.js');
  await whofreeCommand(ctx);
}

async function handleJioMenu(ctx: BotContext): Promise<void> {
  await ctx.answerCallbackQuery();
  await ctx.reply('🎯 What kind of jio?', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '☕ Kopi', callback_data: 'jio_type:kopi' },
          { text: '🍜 Makan', callback_data: 'jio_type:makan' },
        ],
        [
          { text: '📚 Study', callback_data: 'jio_type:study' },
          { text: '🎮 Game', callback_data: 'jio_type:game' },
        ],
        [
          { text: '🎬 Movie', callback_data: 'jio_type:movie' },
          { text: '😎 Chill', callback_data: 'jio_type:chill' },
        ],
        [{ text: '✍️ Custom', callback_data: 'jio_type:custom' }],
      ],
    },
  });
}

async function handleInviteMenu(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  // Get user's invite code
  const { data: user } = await supabase
    .from('users')
    .select('invite_code')
    .eq('id', ctx.session.userId)
    .single();

  if (!user) {
    await ctx.answerCallbackQuery('Could not get invite code');
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.reply(
    `📨 Share FreeLiao with friends!\n\n` +
      `Your invite code: \`${user.invite_code}\`\n\n` +
      `Friends can add you by:\n` +
      `1. Starting @FreeLiaoBot\n` +
      `2. Using /friends command\n` +
      `3. Entering your invite code\n\n` +
      `Or share this link: freeliao.sg/${user.invite_code}`,
    {
      parse_mode: 'Markdown',
    }
  );
}
