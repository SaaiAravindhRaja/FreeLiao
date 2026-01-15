/**
 * Jio commands - Create hangout invitations
 * /jio, /kopi, /makan
 */

import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';
import { JIO_TYPES, DEFAULT_JIO_EXPIRY_MS } from '@freeliao/shared';
import type { JioType } from '@freeliao/shared';
import { notifyFriendsOfJio } from '../services/notifications.js';

/**
 * /kopi - Quick coffee jio
 */
export async function kopiCommand(ctx: BotContext): Promise<void> {
  await createQuickJio(ctx, 'kopi');
}

/**
 * /makan - Quick food jio
 */
export async function makanCommand(ctx: BotContext): Promise<void> {
  await createQuickJio(ctx, 'makan');
}

/**
 * /jio [activity] - Create a jio
 */
export async function jioCommand(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.reply("Please /start first to register!");
    return;
  }

  const customTitle = ctx.message?.text?.replace(/^\/jio\s*/i, '').trim();

  if (customTitle) {
    // Quick custom jio with provided title
    ctx.session.pendingJio = {
      type: 'custom',
      title: customTitle,
    };
    ctx.session.awaitingInput = 'jio_location';

    await ctx.reply(`📍 Where?\n\nType a location or pick one:`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📍 Nearby', callback_data: 'jio_loc:nearby' },
            { text: '🤷 Flexible', callback_data: 'jio_loc:flexible' },
          ],
          [{ text: '➡️ Skip location', callback_data: 'jio_loc:skip' }],
        ],
      },
    });
    return;
  }

  // Show jio type selection
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

/**
 * Create a quick jio with default settings
 */
async function createQuickJio(ctx: BotContext, type: JioType): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.reply("Please /start first to register!");
    return;
  }

  const jioInfo = JIO_TYPES[type];
  const expiresAt = new Date(Date.now() + DEFAULT_JIO_EXPIRY_MS);

  // Create the jio
  const { data: jio, error } = await supabase
    .from('jios')
    .insert({
      creator_id: ctx.session.userId,
      jio_type: type,
      title: jioInfo.defaultTitle,
      is_now: true,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error || !jio) {
    console.error('Error creating jio:', error);
    await ctx.reply('Something went wrong creating the jio. Try again!');
    return;
  }

  // Notify free friends
  const notifiedCount = await notifyFriendsOfJio(ctx.session.userId, jio);

  await ctx.reply(
    `${jioInfo.emoji} Jio sent!\n\n` +
      `"${jioInfo.defaultTitle}"\n\n` +
      `📢 Notified ${notifiedCount} free friend${notifiedCount !== 1 ? 's' : ''}\n` +
      `⏰ Expires in 2 hours\n\n` +
      `I'll let you know when people respond!`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel Jio', callback_data: `cancel_jio:${jio.id}` }],
          [{ text: '👥 View Responses', callback_data: `view_responses:${jio.id}` }],
        ],
      },
    }
  );
}

/**
 * Handle jio type selection from inline keyboard
 */
export async function handleJioTypeSelection(
  ctx: BotContext,
  type: string
): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  if (type === 'custom') {
    // Ask for custom title
    ctx.session.awaitingInput = 'jio_title';
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      '✍️ What do you want to do?\n\nType your activity (e.g., "Go cycling", "Watch football"):'
    );
    return;
  }

  // Valid jio type
  const jioType = type as JioType;
  if (!JIO_TYPES[jioType]) {
    await ctx.answerCallbackQuery('Invalid jio type');
    return;
  }

  const jioInfo = JIO_TYPES[jioType];
  const expiresAt = new Date(Date.now() + DEFAULT_JIO_EXPIRY_MS);

  // Create the jio
  const { data: jio, error } = await supabase
    .from('jios')
    .insert({
      creator_id: ctx.session.userId,
      jio_type: jioType,
      title: jioInfo.defaultTitle,
      is_now: true,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error || !jio) {
    await ctx.answerCallbackQuery('Something went wrong!');
    return;
  }

  // Notify free friends
  const notifiedCount = await notifyFriendsOfJio(ctx.session.userId, jio);

  await ctx.answerCallbackQuery('Jio created!');
  await ctx.editMessageText(
    `${jioInfo.emoji} Jio sent!\n\n` +
      `"${jioInfo.defaultTitle}"\n\n` +
      `📢 Notified ${notifiedCount} free friend${notifiedCount !== 1 ? 's' : ''}\n` +
      `⏰ Expires in 2 hours\n\n` +
      `I'll let you know when people respond!`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel Jio', callback_data: `cancel_jio:${jio.id}` }],
          [{ text: '👥 View Responses', callback_data: `view_responses:${jio.id}` }],
        ],
      },
    }
  );
}

/**
 * Handle jio location selection
 */
export async function handleJioLocationSelection(
  ctx: BotContext,
  location: string
): Promise<void> {
  if (!ctx.session.userId || !ctx.session.pendingJio) {
    await ctx.answerCallbackQuery('Session expired. Try again!');
    return;
  }

  const { type, title } = ctx.session.pendingJio;
  const locationText = location === 'skip' ? null : location === 'flexible' ? 'Flexible' : 'Nearby';

  const jioInfo = JIO_TYPES[type];
  const finalTitle = title || jioInfo.defaultTitle;
  const expiresAt = new Date(Date.now() + DEFAULT_JIO_EXPIRY_MS);

  // Create the jio
  const { data: jio, error } = await supabase
    .from('jios')
    .insert({
      creator_id: ctx.session.userId,
      jio_type: type,
      title: finalTitle,
      location_text: locationText,
      is_now: true,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  // Clear session
  ctx.session.pendingJio = undefined;
  ctx.session.awaitingInput = undefined;

  if (error || !jio) {
    await ctx.answerCallbackQuery('Something went wrong!');
    return;
  }

  // Notify free friends
  const notifiedCount = await notifyFriendsOfJio(ctx.session.userId, jio);

  await ctx.answerCallbackQuery('Jio created!');
  await ctx.editMessageText(
    `${jioInfo.emoji} Jio sent!\n\n` +
      `"${finalTitle}"\n` +
      (locationText ? `📍 ${locationText}\n` : '') +
      `\n📢 Notified ${notifiedCount} free friend${notifiedCount !== 1 ? 's' : ''}\n` +
      `⏰ Expires in 2 hours`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel Jio', callback_data: `cancel_jio:${jio.id}` }],
        ],
      },
    }
  );
}
