/**
 * Status-related constants
 */

import type { VibeOption, StatusType } from '../types/status';

// Status type display information
export const STATUS_DISPLAY = {
  free: {
    emoji: '🟢',
    label: 'Free',
    description: 'Available to hang out',
  },
  free_later: {
    emoji: '🟡',
    label: 'Free Later',
    description: 'Will be available soon',
  },
  busy: {
    emoji: '🔴',
    label: 'Busy',
    description: 'Not available right now',
  },
  offline: {
    emoji: '⚫',
    label: 'Offline',
    description: 'Status not set',
  },
} as const satisfies Record<StatusType, { emoji: string; label: string; description: string }>;

// Predefined vibe options
export const VIBE_OPTIONS: VibeOption[] = [
  { id: 'down', emoji: '😎', text: 'Down for anything', callbackData: 'vibe:down' },
  { id: 'food', emoji: '🍜', text: 'Need food', callbackData: 'vibe:food' },
  { id: 'bored', emoji: '😴', text: 'Bored af', callbackData: 'vibe:bored' },
  { id: 'study', emoji: '📚', text: 'Can study', callbackData: 'vibe:study' },
  { id: 'chill', emoji: '🛋️', text: 'Just wanna chill', callbackData: 'vibe:chill' },
  { id: 'active', emoji: '🏃', text: 'Feeling active', callbackData: 'vibe:active' },
];

// Vibe text mapping for callback data
export const VIBE_TEXT_MAP: Record<string, string> = {
  down: 'Down for anything',
  food: 'Need food',
  bored: 'Bored af',
  study: 'Can study',
  chill: 'Just wanna chill',
  active: 'Feeling active',
};

// Default status expiry (4 hours in milliseconds)
export const DEFAULT_STATUS_EXPIRY_MS = 4 * 60 * 60 * 1000;

// Quick time options for setting free status
export const QUICK_TIME_OPTIONS = [
  { label: '1 hour', value: '1h', ms: 1 * 60 * 60 * 1000 },
  { label: '2 hours', value: '2h', ms: 2 * 60 * 60 * 1000 },
  { label: '3 hours', value: '3h', ms: 3 * 60 * 60 * 1000 },
  { label: 'All day', value: 'all_day', ms: null }, // Special handling needed
];
