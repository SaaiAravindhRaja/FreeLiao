/**
 * /busy command - Set status as busy
 */

import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';

export async function busyCommand(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.reply("Please /start first to register!");
    return;
  }

  // Update status to busy
  const { error } = await supabase
    .from('user_status')
    .upsert(
      {
        user_id: ctx.session.userId,
        status_type: 'busy',
        free_until: null,
        free_after: null,
        vibe_text: null,
        expires_at: null, // Busy status doesn't expire automatically
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

  await ctx.reply(
    `🔴 Status set to busy\n\n` +
      `Your friends won't be notified of new jios.\n` +
      `Use /free when you're available again!`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🟢 Set as Free', callback_data: 'menu:status' }],
        ],
      },
    }
  );
}
