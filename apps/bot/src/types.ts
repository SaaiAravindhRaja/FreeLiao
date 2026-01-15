/**
 * Bot-specific type definitions
 */

import type { Context, SessionFlavor } from 'grammy';
import type { JioType } from '@freeliao/shared';

/**
 * Session data stored for each user conversation
 */
export interface SessionData {
  /** The FreeLiao user ID (UUID) */
  userId?: string;

  /** What kind of input we're awaiting from the user */
  awaitingInput?: 'vibe' | 'location' | 'jio_title' | 'jio_location' | 'custom_time';

  /** Pending jio creation data */
  pendingJio?: {
    type: JioType;
    title?: string;
    location?: string;
  };
}

/**
 * Extended context type with session support
 */
export type BotContext = Context & SessionFlavor<SessionData>;

/**
 * Command handler function type
 */
export type CommandHandler = (ctx: BotContext) => Promise<void>;

/**
 * Callback query handler function type
 */
export type CallbackHandler = (ctx: BotContext) => Promise<void>;
