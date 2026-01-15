/**
 * Callback query handlers registration
 */

import type { Bot } from 'grammy';
import type { BotContext } from '../types.js';

import { handleJioResponse } from './jio-response.js';
import { handleVibeSelect } from './status-vibe.js';
import { handleFreeTimeSelection } from '../commands/free.js';
import { handleJioTypeSelection, handleJioLocationSelection } from '../commands/jio.js';
import { refreshWhofree } from '../commands/whofree.js';
import { acceptFriendRequest, declineFriendRequest } from '../commands/friends.js';
import { handleMenuCallback } from './menu.js';

/**
 * Register all callback query handlers
 */
export function registerCallbacks(bot: Bot<BotContext>): void {
  // Jio responses (interested, joined, declined, maybe)
  bot.callbackQuery(/^jio:(interested|joined|declined|maybe):(.+)$/, handleJioResponse);

  // Vibe selection
  bot.callbackQuery(/^vibe:(.+)$/, handleVibeSelect);

  // Free time selection
  bot.callbackQuery(/^free:(.+)$/, async (ctx) => {
    const timeCode = ctx.match[1];
    await handleFreeTimeSelection(ctx, timeCode);
  });

  // Jio type selection
  bot.callbackQuery(/^jio_type:(.+)$/, async (ctx) => {
    const type = ctx.match[1];
    await handleJioTypeSelection(ctx, type);
  });

  // Jio location selection
  bot.callbackQuery(/^jio_loc:(.+)$/, async (ctx) => {
    const location = ctx.match[1];
    await handleJioLocationSelection(ctx, location);
  });

  // Quick jio from whofree
  bot.callbackQuery(/^quick_jio:(.+)$/, async (ctx) => {
    const type = ctx.match[1];
    await handleJioTypeSelection(ctx, type);
  });

  // Refresh whofree
  bot.callbackQuery('refresh:whofree', refreshWhofree);

  // Friend request responses
  bot.callbackQuery(/^friend:accept:(.+)$/, async (ctx) => {
    const friendshipId = ctx.match[1];
    await acceptFriendRequest(ctx, friendshipId);
  });

  bot.callbackQuery(/^friend:decline:(.+)$/, async (ctx) => {
    const friendshipId = ctx.match[1];
    await declineFriendRequest(ctx, friendshipId);
  });

  // Menu callbacks
  bot.callbackQuery(/^menu:(.+)$/, handleMenuCallback);

  // Cancel jio
  bot.callbackQuery(/^cancel_jio:(.+)$/, async (ctx) => {
    await handleCancelJio(ctx, ctx.match[1]);
  });

  // View jio responses
  bot.callbackQuery(/^view_responses:(.+)$/, async (ctx) => {
    await handleViewResponses(ctx, ctx.match[1]);
  });

  // Fallback for unknown callbacks
  bot.on('callback_query:data', async (ctx) => {
    console.log('Unknown callback:', ctx.callbackQuery.data);
    await ctx.answerCallbackQuery('Unknown action');
  });

  console.log('📝 Callbacks registered');
}

async function handleCancelJio(ctx: BotContext, jioId: string): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  const { supabase } = await import('../supabase.js');

  // Update jio status to cancelled
  const { error } = await supabase
    .from('jios')
    .update({ status: 'cancelled' })
    .eq('id', jioId)
    .eq('creator_id', ctx.session.userId);

  if (error) {
    await ctx.answerCallbackQuery('Could not cancel jio');
    return;
  }

  await ctx.answerCallbackQuery('Jio cancelled');
  await ctx.editMessageText('❌ Jio cancelled.\n\nYour friends have been notified.');
}

async function handleViewResponses(ctx: BotContext, jioId: string): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  const { supabase } = await import('../supabase.js');

  // Get responses for this jio
  const { data: responses } = await supabase
    .from('jio_responses')
    .select('response, user:users(display_name)')
    .eq('jio_id', jioId);

  if (!responses || responses.length === 0) {
    await ctx.answerCallbackQuery('No responses yet');
    return;
  }

  const joined = responses.filter((r) => r.response === 'joined');
  const interested = responses.filter((r) => r.response === 'interested');
  const maybe = responses.filter((r) => r.response === 'maybe');

  let message = '👥 Responses\n\n';

  if (joined.length > 0) {
    message += '🙋 In:\n';
    joined.forEach((r) => {
      message += `• ${(r.user as any)?.display_name || 'Unknown'}\n`;
    });
    message += '\n';
  }

  if (interested.length > 0) {
    message += '👀 Interested:\n';
    interested.forEach((r) => {
      message += `• ${(r.user as any)?.display_name || 'Unknown'}\n`;
    });
    message += '\n';
  }

  if (maybe.length > 0) {
    message += '🤔 Maybe:\n';
    maybe.forEach((r) => {
      message += `• ${(r.user as any)?.display_name || 'Unknown'}\n`;
    });
  }

  await ctx.answerCallbackQuery();
  await ctx.reply(message);
}

export { handleJioResponse, handleVibeSelect };
