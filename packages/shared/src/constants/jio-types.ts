/**
 * Jio type constants and configuration
 */

import type { JioTypeInfo, JioType } from '../types/jio';

// Jio type definitions with display information
export const JIO_TYPES: Record<JioType, JioTypeInfo> = {
  kopi: {
    type: 'kopi',
    emoji: '☕',
    defaultTitle: 'Kopi anyone?',
    description: 'Coffee or tea hangout',
  },
  makan: {
    type: 'makan',
    emoji: '🍜',
    defaultTitle: 'Makan anyone?',
    description: 'Food adventure',
  },
  study: {
    type: 'study',
    emoji: '📚',
    defaultTitle: 'Study session?',
    description: 'Study or work together',
  },
  game: {
    type: 'game',
    emoji: '🎮',
    defaultTitle: 'Game sesh?',
    description: 'Gaming session',
  },
  movie: {
    type: 'movie',
    emoji: '🎬',
    defaultTitle: 'Movie anyone?',
    description: 'Watch a movie together',
  },
  chill: {
    type: 'chill',
    emoji: '😎',
    defaultTitle: 'Chill?',
    description: 'Just hang out',
  },
  custom: {
    type: 'custom',
    emoji: '🎯',
    defaultTitle: 'Hang out?',
    description: 'Custom activity',
  },
};

// Quick jio options for inline keyboards
export const QUICK_JIO_OPTIONS: JioType[] = ['kopi', 'makan', 'study', 'game', 'movie', 'chill'];

// Default jio expiry time (2 hours in milliseconds)
export const DEFAULT_JIO_EXPIRY_MS = 2 * 60 * 60 * 1000;

// Max participants default
export const DEFAULT_MAX_PARTICIPANTS = 10;
export const DEFAULT_MIN_PARTICIPANTS = 1;

// Response display text
export const JIO_RESPONSE_TEXT = {
  interested: { emoji: '👀', text: 'Interested', action: 'is interested' },
  joined: { emoji: '🙋', text: "I'm in!", action: 'is in' },
  declined: { emoji: '😢', text: "Can't make it", action: "can't make it" },
  maybe: { emoji: '🤔', text: 'Maybe', action: 'might join' },
} as const;

// Get emoji for jio type
export function getJioEmoji(type: JioType): string {
  return JIO_TYPES[type]?.emoji ?? '🎯';
}

// Get default title for jio type
export function getJioDefaultTitle(type: JioType): string {
  return JIO_TYPES[type]?.defaultTitle ?? 'Hang out?';
}
