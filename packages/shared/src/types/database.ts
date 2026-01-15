/**
 * Database types generated from Supabase schema
 * These types mirror the PostgreSQL tables defined in the migrations
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          telegram_id: number;
          telegram_username: string | null;
          display_name: string;
          profile_photo_url: string | null;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_id: number;
          telegram_username?: string | null;
          display_name: string;
          profile_photo_url?: string | null;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          telegram_id?: number;
          telegram_username?: string | null;
          display_name?: string;
          profile_photo_url?: string | null;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          closeness_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          closeness_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          closeness_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_status: {
        Row: {
          id: string;
          user_id: string;
          status_type: 'free' | 'free_later' | 'busy' | 'offline';
          free_until: string | null;
          free_after: string | null;
          vibe_text: string | null;
          location_text: string | null;
          location_lat: number | null;
          location_lng: number | null;
          updated_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status_type?: 'free' | 'free_later' | 'busy' | 'offline';
          free_until?: string | null;
          free_after?: string | null;
          vibe_text?: string | null;
          location_text?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          updated_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status_type?: 'free' | 'free_later' | 'busy' | 'offline';
          free_until?: string | null;
          free_after?: string | null;
          vibe_text?: string | null;
          location_text?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          updated_at?: string;
          expires_at?: string | null;
        };
      };
      jios: {
        Row: {
          id: string;
          creator_id: string;
          jio_type: 'kopi' | 'makan' | 'study' | 'game' | 'movie' | 'chill' | 'custom';
          title: string;
          description: string | null;
          location_text: string | null;
          location_lat: number | null;
          location_lng: number | null;
          proposed_time: string | null;
          is_now: boolean;
          min_participants: number;
          max_participants: number;
          visibility: 'all_friends' | 'close_friends' | 'specific';
          status: 'active' | 'confirmed' | 'expired' | 'cancelled';
          telegram_group_id: number | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          jio_type?: 'kopi' | 'makan' | 'study' | 'game' | 'movie' | 'chill' | 'custom';
          title: string;
          description?: string | null;
          location_text?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          proposed_time?: string | null;
          is_now?: boolean;
          min_participants?: number;
          max_participants?: number;
          visibility?: 'all_friends' | 'close_friends' | 'specific';
          status?: 'active' | 'confirmed' | 'expired' | 'cancelled';
          telegram_group_id?: number | null;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          jio_type?: 'kopi' | 'makan' | 'study' | 'game' | 'movie' | 'chill' | 'custom';
          title?: string;
          description?: string | null;
          location_text?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          proposed_time?: string | null;
          is_now?: boolean;
          min_participants?: number;
          max_participants?: number;
          visibility?: 'all_friends' | 'close_friends' | 'specific';
          status?: 'active' | 'confirmed' | 'expired' | 'cancelled';
          telegram_group_id?: number | null;
          created_at?: string;
          expires_at?: string;
        };
      };
      jio_responses: {
        Row: {
          id: string;
          jio_id: string;
          user_id: string;
          response: 'interested' | 'joined' | 'declined' | 'maybe';
          responded_at: string;
        };
        Insert: {
          id?: string;
          jio_id: string;
          user_id: string;
          response: 'interested' | 'joined' | 'declined' | 'maybe';
          responded_at?: string;
        };
        Update: {
          id?: string;
          jio_id?: string;
          user_id?: string;
          response?: 'interested' | 'joined' | 'declined' | 'maybe';
          responded_at?: string;
        };
      };
      jio_invites: {
        Row: {
          id: string;
          jio_id: string;
          user_id: string;
          notified: boolean;
          notified_at: string | null;
        };
        Insert: {
          id?: string;
          jio_id: string;
          user_id: string;
          notified?: boolean;
          notified_at?: string | null;
        };
        Update: {
          id?: string;
          jio_id?: string;
          user_id?: string;
          notified?: boolean;
          notified_at?: string | null;
        };
      };
      hangouts: {
        Row: {
          id: string;
          jio_id: string | null;
          participants: string[];
          happened_at: string;
          location_text: string | null;
        };
        Insert: {
          id?: string;
          jio_id?: string | null;
          participants: string[];
          happened_at?: string;
          location_text?: string | null;
        };
        Update: {
          id?: string;
          jio_id?: string | null;
          participants?: string[];
          happened_at?: string;
          location_text?: string | null;
        };
      };
    };
    Functions: {
      get_friends_statuses: {
        Args: { p_user_id: string };
        Returns: {
          user_id: string;
          display_name: string;
          telegram_username: string | null;
          profile_photo_url: string | null;
          status_type: string;
          free_until: string | null;
          free_after: string | null;
          vibe_text: string | null;
          location_text: string | null;
          updated_at: string;
        }[];
      };
      get_visible_jios: {
        Args: { p_user_id: string };
        Returns: {
          jio_id: string;
          creator_id: string;
          creator_name: string;
          creator_photo: string | null;
          jio_type: string;
          title: string;
          description: string | null;
          location_text: string | null;
          proposed_time: string | null;
          is_now: boolean;
          status: string;
          created_at: string;
          expires_at: string;
          response_count: number;
          user_response: string | null;
        }[];
      };
      expire_old_statuses: {
        Args: Record<string, never>;
        Returns: void;
      };
      expire_old_jios: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
};

// Convenience type aliases
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type FriendshipInsert = Database['public']['Tables']['friendships']['Insert'];
export type FriendshipUpdate = Database['public']['Tables']['friendships']['Update'];

export type UserStatus = Database['public']['Tables']['user_status']['Row'];
export type UserStatusInsert = Database['public']['Tables']['user_status']['Insert'];
export type UserStatusUpdate = Database['public']['Tables']['user_status']['Update'];

export type Jio = Database['public']['Tables']['jios']['Row'];
export type JioInsert = Database['public']['Tables']['jios']['Insert'];
export type JioUpdate = Database['public']['Tables']['jios']['Update'];

export type JioResponse = Database['public']['Tables']['jio_responses']['Row'];
export type JioResponseInsert = Database['public']['Tables']['jio_responses']['Insert'];
export type JioResponseUpdate = Database['public']['Tables']['jio_responses']['Update'];

export type JioInvite = Database['public']['Tables']['jio_invites']['Row'];
export type JioInviteInsert = Database['public']['Tables']['jio_invites']['Insert'];
export type JioInviteUpdate = Database['public']['Tables']['jio_invites']['Update'];

export type Hangout = Database['public']['Tables']['hangouts']['Row'];
export type HangoutInsert = Database['public']['Tables']['hangouts']['Insert'];
export type HangoutUpdate = Database['public']['Tables']['hangouts']['Update'];
