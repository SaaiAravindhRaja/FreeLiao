/**
 * /start command - User registration and welcome
 */

import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';

export async function startCommand(ctx: BotContext): Promise<void> {
  if (!ctx.from) {
    await ctx.reply('Something went wrong. Please try again.');
    return;
  }

  const telegramId = ctx.from.id;
  const telegramUsername = ctx.from.username;
  const displayName = ctx.from.first_name || telegramUsername || 'Friend';

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('fl_users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (existingUser) {
    // Returning user
    ctx.session.userId = existingUser.id;

    // Update username if changed
    if (existingUser.telegram_username !== telegramUsername) {
      await supabase
        .from('fl_users')
        .update({ telegram_username: telegramUsername })
        .eq('id', existingUser.id);
    }

    await ctx.reply(
      `Welcome back, ${existingUser.display_name}! 🤙\n\n` +
        `Quick commands:\n` +
        `/free 2h — Set yourself as free\n` +
        `/whofree — See who's available\n` +
        `/kopi — Jio friends for coffee\n` +
        `/makan — Jio friends for food\n\n` +
        `Your invite code: ${existingUser.invite_code}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🟢 Set Status', callback_data: 'menu:status' }],
            [{ text: '👀 Who\'s Free', callback_data: 'menu:whofree' }],
            [{ text: '🎯 Create Jio', callback_data: 'menu:jio' }],
          ],
        },
      }
    );
    return;
  }

  // New user - create account
  const { data: newUser, error } = await supabase
    .from('fl_users')
    .insert({
      telegram_id: telegramId,
      telegram_username: telegramUsername,
      display_name: displayName,
      profile_photo_url: null,
    })
    .select()
    .single();

  if (error || !newUser) {
    console.error('Error creating user:', error);
    await ctx.reply('Oops, something went wrong. Please try again!');
    return;
  }

  ctx.session.userId = newUser.id;

  // Create initial offline status
  await supabase.from('fl_user_status').insert({
    user_id: newUser.id,
    status_type: 'offline',
  });

  // Welcome message for new user
  await ctx.reply(
    `Yo! Welcome to FreeLiao 🤙\n\n` +
      `See when friends are free. Make spontaneous plans.\n` +
      `No more texting "you free?" to 10 people.\n\n` +
      `Your invite code: ${newUser.invite_code}\n` +
      `Share this with friends!\n\n` +
      `Quick start:\n` +
      `/free 2h — "I'm free for 2 hours"\n` +
      `/whofree — See who's available now\n` +
      `/kopi — Jio friends for coffee`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📨 Invite Friends', callback_data: 'menu:invite' }],
          [{ text: '🟢 Set My Status', callback_data: 'menu:status' }],
        ],
      },
    }
  );
}
