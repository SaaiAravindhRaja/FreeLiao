/**
 * Message formatting utilities for bot responses
 */

import { STATUS_DISPLAY, JIO_TYPES, JIO_RESPONSE_TEXT } from '@freeliao/shared';
import type { StatusType, JioType, JioResponseType } from '@freeliao/shared';

/**
 * Get status emoji for display
 */
export function getStatusEmoji(status: StatusType): string {
  return STATUS_DISPLAY[status]?.emoji ?? '⚫';
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: StatusType): string {
  return STATUS_DISPLAY[status]?.label ?? 'Unknown';
}

/**
 * Get jio type emoji
 */
export function getJioEmoji(type: JioType): string {
  return JIO_TYPES[type]?.emoji ?? '🎯';
}

/**
 * Get jio type default title
 */
export function getJioTitle(type: JioType): string {
  return JIO_TYPES[type]?.defaultTitle ?? 'Hang out?';
}

/**
 * Get response display info
 */
export function getResponseInfo(response: JioResponseType): {
  emoji: string;
  text: string;
  action: string;
} {
  return JIO_RESPONSE_TEXT[response] ?? { emoji: '❓', text: 'Unknown', action: 'responded' };
}

/**
 * Format a user mention (Telegram markdown)
 */
export function formatUserMention(displayName: string, telegramUsername?: string | null): string {
  if (telegramUsername) {
    return `@${telegramUsername}`;
  }
  return displayName;
}

/**
 * Escape special characters for Telegram MarkdownV2
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Format help message
 */
export function formatHelpMessage(): string {
  return `🤙 *FreeLiao Commands*

*Status Commands:*
/free \\[time\\] \\- Set yourself as free
  Examples: \`/free 2h\`, \`/free 5pm\`, \`/free tonight\`
/busy \\- Set yourself as busy

*Social Commands:*
/whofree \\- See who's available now
/friends \\- Manage your friends

*Jio Commands:*
/kopi \\- Quick coffee jio
/makan \\- Quick food jio
/jio \\[activity\\] \\- Custom hangout invite

*Other:*
/help \\- Show this message
/start \\- Get started or see your profile

_Share your invite link with friends to connect\\!_`;
}

/**
 * Format welcome message for new users
 */
export function formatWelcomeMessage(displayName: string, inviteCode: string): string {
  return `Yo\\! Welcome to FreeLiao 🤙

See when friends are free\\. Make spontaneous plans\\.
No more texting "you free?" to 10 people\\.

*Your invite link:* \`freeliao\\.sg/${inviteCode}\`
Share this with friends\\!

*Quick start:*
/free 2h — "I'm free for 2 hours"
/whofree — See who's available now
/kopi — Jio friends for coffee`;
}

/**
 * Format returning user message
 */
export function formatReturningMessage(displayName: string, inviteCode: string): string {
  return `Welcome back, ${escapeMarkdown(displayName)}\\! 🤙

*Quick commands:*
/free 2h — Set yourself as free
/whofree — See who's available
/kopi — Jio friends for coffee
/makan — Jio friends for food

Your invite link: \`freeliao\\.sg/${inviteCode}\``;
}
