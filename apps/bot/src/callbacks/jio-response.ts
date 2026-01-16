/**
 * Jio response callback handler
 */

import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';
import { notifyCreatorOfResponse } from '../services/notifications.js';
import type { JioResponseType } from '@freeliao/shared';

export async function handleJioResponse(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId || !ctx.callbackQuery?.data) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  const match = ctx.callbackQuery.data.match(/^jio:(interested|joined|declined|maybe):(.+)$/);
  if (!match) {
    await ctx.answerCallbackQuery('Invalid action');
    return;
  }

  const [, response, jioId] = match;
  const responseType = response as JioResponseType;

  // Check if jio is still active
  const { data: jio } = await supabase
    .from('fl_jios')
    .select('status, creator_id, title')
    .eq('id', jioId)
    .single();

  if (!jio || jio.status !== 'active') {
    await ctx.answerCallbackQuery('This jio has expired or been cancelled.');
    return;
  }

  // Record response
  const { error } = await supabase.from('fl_jio_responses').upsert(
    {
      jio_id: jioId,
      user_id: ctx.session.userId,
      response: responseType,
      responded_at: new Date().toISOString(),
    },
    {
      onConflict: 'jio_id,user_id',
    }
  );

  if (error) {
    console.error('Error recording jio response:', error);
    await ctx.answerCallbackQuery('Something went wrong. Try again!');
    return;
  }

  // Response text mapping
  const responseText: Record<JioResponseType, string> = {
    joined: "You're in! 🎉",
    maybe: 'Marked as maybe 🤔',
    declined: 'No worries, maybe next time! 👋',
    interested: 'Marked as interested! 👀',
  };

  // Update the message to show response
  const originalText = ctx.callbackQuery.message?.text || '';
  await ctx.editMessageText(
    `${originalText}\n\n✅ ${responseText[responseType]}`,
    { reply_markup: undefined }
  );

  await ctx.answerCallbackQuery(responseText[responseType]);

  // Notify jio creator (for positive responses)
  await notifyCreatorOfResponse(jioId, ctx.session.userId, responseType);
}
