/**
 * Notification service - Send notifications to users
 */

import { bot } from '../bot.js';
import { supabase } from '../supabase.js';
import { getJioEmoji } from '../utils/messages.js';
import type { Jio } from '@freeliao/shared';
import { InlineKeyboard } from 'grammy';

/**
 * Notify free friends about a new jio
 * @returns Number of friends notified
 */
export async function notifyFriendsOfJio(
  creatorUserId: string,
  jio: Jio
): Promise<number> {
  // Get creator info
  const { data: creator } = await supabase
    .from('users')
    .select('display_name, telegram_username')
    .eq('id', creatorUserId)
    .single();

  if (!creator) return 0;

  // Get free friends with their telegram IDs
  const { data: friends } = await supabase.rpc('get_friends_statuses', {
    p_user_id: creatorUserId,
  });

  if (!friends || friends.length === 0) return 0;

  // Filter to only free friends
  const freeFriends = friends.filter(
    (f) => f.status_type === 'free' || f.status_type === 'free_later'
  );

  if (freeFriends.length === 0) return 0;

  // Get telegram IDs for free friends
  const { data: friendUsers } = await supabase
    .from('users')
    .select('id, telegram_id')
    .in(
      'id',
      freeFriends.map((f) => f.user_id)
    );

  if (!friendUsers || friendUsers.length === 0) return 0;

  let notifiedCount = 0;
  const emoji = getJioEmoji(jio.jio_type as any);

  // Build response keyboard
  const keyboard = new InlineKeyboard()
    .text("I'm in! 🙋", `jio:joined:${jio.id}`)
    .text('Maybe 🤔', `jio:maybe:${jio.id}`)
    .row()
    .text("Can't 😢", `jio:declined:${jio.id}`);

  // Send notification to each free friend
  for (const friend of friendUsers) {
    try {
      const message =
        `${emoji} ${creator.display_name} wants to hang!\n\n` +
        `"${jio.title}"\n` +
        (jio.location_text ? `📍 ${jio.location_text}\n` : '') +
        `${jio.is_now ? '⏰ Now' : `⏰ ${formatTime(jio.proposed_time)}`}\n\n` +
        `You're marked as free. You in?`;

      await bot.api.sendMessage(friend.telegram_id, message, {
        reply_markup: keyboard,
      });

      notifiedCount++;
    } catch (error) {
      console.error(`Failed to notify ${friend.telegram_id}:`, error);
    }
  }

  // Store who was invited
  if (notifiedCount > 0) {
    await supabase.from('jio_invites').insert(
      friendUsers.map((f) => ({
        jio_id: jio.id,
        user_id: f.id,
        notified: true,
        notified_at: new Date().toISOString(),
      }))
    );
  }

  return notifiedCount;
}

/**
 * Notify jio creator of a response
 */
export async function notifyCreatorOfResponse(
  jioId: string,
  responderUserId: string,
  response: 'interested' | 'joined' | 'declined' | 'maybe'
): Promise<void> {
  // Get jio and creator info
  const { data: jio } = await supabase
    .from('jios')
    .select('creator_id, title')
    .eq('id', jioId)
    .single();

  if (!jio) return;

  // Get creator's telegram ID
  const { data: creator } = await supabase
    .from('users')
    .select('telegram_id')
    .eq('id', jio.creator_id)
    .single();

  if (!creator) return;

  // Get responder info
  const { data: responder } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', responderUserId)
    .single();

  if (!responder) return;

  // Only notify for positive responses
  if (response === 'joined' || response === 'interested') {
    const emoji = response === 'joined' ? '🙋' : '👀';
    const action = response === 'joined' ? 'is in' : 'is interested';

    try {
      await bot.api.sendMessage(
        creator.telegram_id,
        `${emoji} ${responder.display_name} ${action} for your jio!\n\n"${jio.title}"`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '👥 See responses', callback_data: `view_responses:${jioId}` }],
              [{ text: '💬 Start group chat', callback_data: `start_group:${jioId}` }],
            ],
          },
        }
      );
    } catch (error) {
      console.error('Failed to notify creator:', error);
    }
  }
}

/**
 * Notify user of a friend request
 */
export async function notifyOfFriendRequest(
  targetUserId: string,
  requesterUserId: string,
  friendshipId: string
): Promise<void> {
  // Get target user's telegram ID
  const { data: targetUser } = await supabase
    .from('users')
    .select('telegram_id')
    .eq('id', targetUserId)
    .single();

  if (!targetUser) return;

  // Get requester info
  const { data: requester } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', requesterUserId)
    .single();

  if (!requester) return;

  try {
    await bot.api.sendMessage(
      targetUser.telegram_id,
      `📨 ${requester.display_name} wants to be your friend on FreeLiao!`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Accept', callback_data: `friend:accept:${friendshipId}` },
              { text: '❌ Decline', callback_data: `friend:decline:${friendshipId}` },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.error('Failed to notify of friend request:', error);
  }
}

function formatTime(isoString: string | null): string {
  if (!isoString) return 'TBD';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
