/**
 * User-related type definitions
 */

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface UserProfile {
  id: string;
  telegramId: number;
  telegramUsername: string | null;
  displayName: string;
  profilePhotoUrl: string | null;
  inviteCode: string;
  createdAt: Date;
}

export interface FriendRequest {
  id: string;
  fromUser: {
    id: string;
    displayName: string;
    telegramUsername: string | null;
    profilePhotoUrl: string | null;
  };
  status: FriendshipStatus;
  createdAt: Date;
}

export interface Friend {
  id: string;
  displayName: string;
  telegramUsername: string | null;
  profilePhotoUrl: string | null;
  closenessScore: number;
  friendsSince: Date;
}
