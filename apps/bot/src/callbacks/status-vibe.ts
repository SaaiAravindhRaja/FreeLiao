/**
 * Status vibe selection callback handler
 */

import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';
import { VIBE_TEXT_MAP } from '@freeliao/shared';

export async function handleVibeSelect(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId || !ctx.callbackQuery?.data) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  const match = ctx.callbackQuery.data.match(/^vibe:(.+)$/);
  if (!match) {
    await ctx.answerCallbackQuery('Invalid action');
    return;
  }

  const vibeCode = match[1];

  // Handle skip
  if (vibeCode === 'skip') {
    await ctx.answerCallbackQuery('Skipped!');
    await ctx.editMessageText(
      ctx.callbackQuery.message?.text?.replace('\n\nAdd a vibe?', '') || 'Status updated!'
    );
    return;
  }

  // Handle custom vibe request
  if (vibeCode === 'custom') {
    ctx.session.awaitingInput = 'vibe';
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      'What\'s your vibe? Type something short (e.g., "Looking for food", "Bored at home"):'
    );
    return;
  }

  // Get vibe text from predefined options
  const vibeText = VIBE_TEXT_MAP[vibeCode];
  if (!vibeText) {
    await ctx.answerCallbackQuery('Unknown vibe option');
    return;
  }

  // Update status with vibe
  const { error } = await supabase
    .from('fl_user_status')
    .update({
      vibe_text: vibeText,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', ctx.session.userId);

  if (error) {
    console.error('Error updating vibe:', error);
    await ctx.answerCallbackQuery('Something went wrong!');
    return;
  }

  await ctx.answerCallbackQuery('Vibe added!');

  // Update message to show vibe was added
  const originalText = ctx.callbackQuery.message?.text || '';
  const updatedText = originalText
    .replace('\n\nAdd a vibe?', '')
    .replace('✅ Status updated!', `✅ Status updated!\n\n💭 "${vibeText}"`);

  await ctx.editMessageText(updatedText);
}

/**
 * Handle custom vibe text input
 */
export async function handleCustomVibe(ctx: BotContext, vibeText: string): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.reply('Please /start first!');
    return;
  }

  // Limit vibe text length
  const cleanedVibe = vibeText.trim().slice(0, 100);

  if (!cleanedVibe) {
    await ctx.reply('Please enter a vibe text, or use /free to set a new status.');
    return;
  }

  // Update status with custom vibe
  const { error } = await supabase
    .from('fl_user_status')
    .update({
      vibe_text: cleanedVibe,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', ctx.session.userId);

  if (error) {
    console.error('Error updating custom vibe:', error);
    await ctx.reply('Something went wrong. Try again!');
    return;
  }

  await ctx.reply(`✅ Vibe set: "${cleanedVibe}"\n\nYour friends can now see what you're up to!`);
}
