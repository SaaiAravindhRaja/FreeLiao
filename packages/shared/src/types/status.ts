/**
 * Status-related type definitions
 */

export type StatusType = 'free' | 'free_later' | 'busy' | 'offline';

export interface ParsedTimeInput {
  freeUntil: Date | null;
  expiresAt: Date;
  displayText: string;
}

export interface FriendStatus {
  userId: string;
  displayName: string;
  telegramUsername: string | null;
  profilePhotoUrl: string | null;
  statusType: StatusType;
  freeUntil: Date | null;
  freeAfter: Date | null;
  vibeText: string | null;
  locationText: string | null;
  updatedAt: Date;
}

export interface StatusUpdate {
  statusType: StatusType;
  freeUntil?: Date;
  freeAfter?: Date;
  vibeText?: string;
  locationText?: string;
  expiresAt?: Date;
}

// Predefined vibe options for quick selection
export interface VibeOption {
  id: string;
  emoji: string;
  text: string;
  callbackData: string;
}
