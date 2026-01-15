/**
 * Jio (hangout invitation) type definitions
 */

export type JioType = 'kopi' | 'makan' | 'study' | 'game' | 'movie' | 'chill' | 'custom';
export type JioStatus = 'active' | 'confirmed' | 'expired' | 'cancelled';
export type JioVisibility = 'all_friends' | 'close_friends' | 'specific';
export type JioResponseType = 'interested' | 'joined' | 'declined' | 'maybe';

export interface JioTypeInfo {
  type: JioType;
  emoji: string;
  defaultTitle: string;
  description: string;
}

export interface CreateJioInput {
  jioType: JioType;
  title: string;
  description?: string;
  locationText?: string;
  proposedTime?: Date;
  isNow?: boolean;
  visibility?: JioVisibility;
  expiresIn?: number; // milliseconds
}

export interface JioWithCreator {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPhoto: string | null;
  jioType: JioType;
  title: string;
  description: string | null;
  locationText: string | null;
  proposedTime: Date | null;
  isNow: boolean;
  status: JioStatus;
  createdAt: Date;
  expiresAt: Date;
  responseCount: number;
  userResponse: JioResponseType | null;
}

export interface JioResponseInput {
  jioId: string;
  response: JioResponseType;
}
