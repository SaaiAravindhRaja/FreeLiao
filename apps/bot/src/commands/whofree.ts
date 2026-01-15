/**
 * /whofree command - See who's available
 */

import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';
import { formatRelativeTime } from '../utils/time-parser.js';

export async function whofreeCommand(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.reply("Please /start first to register!");
    return;
  }

  // Get friends' statuses
  const { data: friends, error } = await supabase.rpc('get_friends_statuses', {
    p_user_id: ctx.session.userId,
  });

  if (error) {
    console.error('Error fetching friends:', error);
    await ctx.reply('Something went wrong. Try again!');
    return;
  }

  if (!friends || friends.length === 0) {
    await ctx.reply(
      `You don't have any friends on FreeLiao yet! 😢\n\n` +
        `Share your invite link to add friends.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📨 Get Invite Link', callback_data: 'menu:invite' }],
          ],
        },
      }
    );
    return;
  }

  // Group friends by status
  const freeNow = friends.filter((f) => f.status_type === 'free');
  const freeLater = friends.filter((f) => f.status_type === 'free_later');
  const busy = friends.filter((f) => f.status_type === 'busy');
  const offline = friends.filter((f) => f.status_type === 'offline');

  let message = '👥 Friends\' Status\n\n';

  // Free now section
  if (freeNow.length > 0) {
    message += '🟢 FREE NOW\n';
    for (const f of freeNow) {
      const until = f.free_until ? ` (${formatRelativeTime(new Date(f.free_until))})` : '';
      const vibe = f.vibe_text ? ` — "${f.vibe_text}"` : '';
      const location = f.location_text ? ` 📍${f.location_text}` : '';
      message += `• ${f.display_name}${until}${vibe}${location}\n`;
    }
    message += '\n';
  }

  // Free later section
  if (freeLater.length > 0) {
    message += '🟡 FREE LATER\n';
    for (const f of freeLater) {
      const after = f.free_after
        ? ` — free ${formatRelativeTime(new Date(f.free_after))}`
        : '';
      message += `• ${f.display_name}${after}\n`;
    }
    message += '\n';
  }

  // Busy section (limited)
  if (busy.length > 0) {
    message += '🔴 BUSY\n';
    const busyToShow = busy.slice(0, 5);
    for (const f of busyToShow) {
      message += `• ${f.display_name}\n`;
    }
    if (busy.length > 5) {
      message += `  +${busy.length - 5} more\n`;
    }
    message += '\n';
  }

  // Offline count
  if (offline.length > 0) {
    message += `⚫ ${offline.length} offline\n`;
  }

  // Build action buttons
  const buttons = [];

  if (freeNow.length > 0) {
    buttons.push([{ text: '☕ Jio for Kopi', callback_data: 'quick_jio:kopi' }]);
    buttons.push([{ text: '🍜 Jio for Makan', callback_data: 'quick_jio:makan' }]);
  }

  buttons.push([{ text: '🔄 Refresh', callback_data: 'refresh:whofree' }]);

  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
}

/**
 * Refresh the whofree display
 */
export async function refreshWhofree(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  // Get friends' statuses
  const { data: friends, error } = await supabase.rpc('get_friends_statuses', {
    p_user_id: ctx.session.userId,
  });

  if (error) {
    await ctx.answerCallbackQuery('Something went wrong!');
    return;
  }

  if (!friends || friends.length === 0) {
    await ctx.answerCallbackQuery('No friends yet!');
    return;
  }

  // Group friends by status
  const freeNow = friends.filter((f) => f.status_type === 'free');
  const freeLater = friends.filter((f) => f.status_type === 'free_later');
  const busy = friends.filter((f) => f.status_type === 'busy');
  const offline = friends.filter((f) => f.status_type === 'offline');

  let message = '👥 Friends\' Status\n\n';

  if (freeNow.length > 0) {
    message += '🟢 FREE NOW\n';
    for (const f of freeNow) {
      const until = f.free_until ? ` (${formatRelativeTime(new Date(f.free_until))})` : '';
      const vibe = f.vibe_text ? ` — "${f.vibe_text}"` : '';
      message += `• ${f.display_name}${until}${vibe}\n`;
    }
    message += '\n';
  }

  if (freeLater.length > 0) {
    message += '🟡 FREE LATER\n';
    for (const f of freeLater) {
      const after = f.free_after
        ? ` — free ${formatRelativeTime(new Date(f.free_after))}`
        : '';
      message += `• ${f.display_name}${after}\n`;
    }
    message += '\n';
  }

  if (busy.length > 0) {
    message += '🔴 BUSY\n';
    const busyToShow = busy.slice(0, 5);
    for (const f of busyToShow) {
      message += `• ${f.display_name}\n`;
    }
    if (busy.length > 5) {
      message += `  +${busy.length - 5} more\n`;
    }
    message += '\n';
  }

  if (offline.length > 0) {
    message += `⚫ ${offline.length} offline\n`;
  }

  const buttons = [];
  if (freeNow.length > 0) {
    buttons.push([{ text: '☕ Jio for Kopi', callback_data: 'quick_jio:kopi' }]);
    buttons.push([{ text: '🍜 Jio for Makan', callback_data: 'quick_jio:makan' }]);
  }
  buttons.push([{ text: '🔄 Refresh', callback_data: 'refresh:whofree' }]);

  await ctx.answerCallbackQuery('Refreshed!');
  await ctx.editMessageText(message, {
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
}
