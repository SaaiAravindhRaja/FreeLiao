/**
 * /friends command - Friend management
 */

import type { BotContext } from '../types.js';
import { supabase } from '../supabase.js';

export async function friendsCommand(ctx: BotContext): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.reply("Please /start first to register!");
    return;
  }

  // Get user's invite code
  const { data: user } = await supabase
    .from('fl_users')
    .select('invite_code')
    .eq('id', ctx.session.userId)
    .single();

  // Get friend count
  const { data: friends } = await supabase.rpc('fl_get_friends_statuses', {
    p_user_id: ctx.session.userId,
  });

  // Get pending friend requests
  const { data: pendingRequests } = await supabase.rpc('fl_get_pending_friend_requests', {
    p_user_id: ctx.session.userId,
  });

  const friendCount = friends?.length || 0;
  const pendingCount = pendingRequests?.length || 0;

  let message = '👥 Friends\n\n';
  message += `You have ${friendCount} friend${friendCount !== 1 ? 's' : ''} on FreeLiao.\n\n`;

  if (pendingCount > 0) {
    message += `📨 ${pendingCount} pending friend request${pendingCount !== 1 ? 's' : ''}\n\n`;
  }

  message += `🔗 Your invite code: ${user?.invite_code || 'N/A'}\n`;
  message += `Share this code with friends to connect!`;

  const buttons: { text: string; callback_data: string }[][] = [];

  if (pendingCount > 0) {
    buttons.push([{ text: `📨 View Requests (${pendingCount})`, callback_data: 'friends:pending' }]);
  }

  buttons.push([{ text: '📋 Copy Invite Code', callback_data: 'friends:copy_code' }]);
  buttons.push([{ text: '➕ Add Friend by Code', callback_data: 'friends:add' }]);

  if (friendCount > 0) {
    buttons.push([{ text: '👥 View All Friends', callback_data: 'friends:list' }]);
  }

  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
}

/**
 * Send friend request by invite code
 */
export async function sendFriendRequest(
  ctx: BotContext,
  inviteCode: string
): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.reply("Please /start first!");
    return;
  }

  // Find user by invite code
  const { data: targetUser } = await supabase
    .from('fl_users')
    .select('id, display_name')
    .eq('invite_code', inviteCode.toLowerCase())
    .single();

  if (!targetUser) {
    await ctx.reply(
      `Couldn't find anyone with invite code "${inviteCode}".\n` +
        `Make sure you entered it correctly!`
    );
    return;
  }

  // Check if not self
  if (targetUser.id === ctx.session.userId) {
    await ctx.reply("You can't add yourself as a friend! 😄");
    return;
  }

  // Check if already friends or request pending
  const { data: existingFriendship } = await supabase
    .from('fl_friendships')
    .select('status')
    .or(
      `and(user_id.eq.${ctx.session.userId},friend_id.eq.${targetUser.id}),` +
        `and(user_id.eq.${targetUser.id},friend_id.eq.${ctx.session.userId})`
    )
    .single();

  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      await ctx.reply(`You're already friends with ${targetUser.display_name}! 🤝`);
    } else if (existingFriendship.status === 'pending') {
      await ctx.reply(
        `There's already a pending friend request with ${targetUser.display_name}!`
      );
    } else {
      await ctx.reply(`Cannot send friend request to ${targetUser.display_name}.`);
    }
    return;
  }

  // Create friend request
  const { error } = await supabase.from('fl_friendships').insert({
    user_id: ctx.session.userId,
    friend_id: targetUser.id,
    status: 'pending',
  });

  if (error) {
    console.error('Error creating friendship:', error);
    await ctx.reply('Something went wrong. Try again!');
    return;
  }

  await ctx.reply(
    `📨 Friend request sent to ${targetUser.display_name}!\n\n` +
      `They'll be notified and can accept your request.`
  );

  // TODO: Notify the target user via bot
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
  ctx: BotContext,
  friendshipId: string
): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  // Update friendship status
  const { data: friendship, error } = await supabase
    .from('fl_friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('friend_id', ctx.session.userId)
    .eq('status', 'pending')
    .select('user_id')
    .single();

  if (error || !friendship) {
    await ctx.answerCallbackQuery('Could not accept request');
    return;
  }

  // Get requester info
  const { data: requester } = await supabase
    .from('fl_users')
    .select('display_name, telegram_id')
    .eq('id', friendship.user_id)
    .single();

  await ctx.answerCallbackQuery('Friend request accepted!');
  await ctx.editMessageText(
    `✅ You're now friends with ${requester?.display_name || 'this user'}!\n\n` +
      `You can now see each other's status and jios.`
  );

  // TODO: Notify the requester
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(
  ctx: BotContext,
  friendshipId: string
): Promise<void> {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery('Please /start first!');
    return;
  }

  // Delete the friendship request
  const { error } = await supabase
    .from('fl_friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('friend_id', ctx.session.userId)
    .eq('status', 'pending');

  if (error) {
    await ctx.answerCallbackQuery('Could not decline request');
    return;
  }

  await ctx.answerCallbackQuery('Request declined');
  await ctx.editMessageText('Friend request declined.');
}
