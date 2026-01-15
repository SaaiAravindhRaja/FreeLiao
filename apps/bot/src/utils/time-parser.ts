/**
 * Time parsing utilities for natural language time input
 * Handles inputs like "2h", "30m", "5pm", "until tonight", "all day"
 */

import type { ParsedTimeInput } from '@freeliao/shared';

/**
 * Parse a natural language time input into a Date
 * @param input - User input like "2h", "5pm", "tonight"
 * @returns Parsed time information or null values if parsing fails
 */
export function parseTimeInput(input: string): ParsedTimeInput {
  const now = new Date();
  const inputLower = input.toLowerCase().trim();

  // Handle "Xh" or "X hours" format
  const hoursMatch = inputLower.match(/^(\d+)\s*(h|hr|hrs|hour|hours?)$/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1], 10);
    if (hours > 0 && hours <= 24) {
      const freeUntil = new Date(now.getTime() + hours * 60 * 60 * 1000);
      return {
        freeUntil,
        expiresAt: freeUntil,
        displayText: `for ${hours} hour${hours > 1 ? 's' : ''}`,
      };
    }
  }

  // Handle "Xm" or "X mins" format
  const minsMatch = inputLower.match(/^(\d+)\s*(m|min|mins|minute|minutes?)$/);
  if (minsMatch) {
    const mins = parseInt(minsMatch[1], 10);
    if (mins > 0 && mins <= 480) {
      // Max 8 hours in minutes
      const freeUntil = new Date(now.getTime() + mins * 60 * 1000);
      return {
        freeUntil,
        expiresAt: freeUntil,
        displayText: `for ${mins} min${mins > 1 ? 's' : ''}`,
      };
    }
  }

  // Handle "until Xpm/am" or just "Xpm/am" or "X:XX pm"
  const timeMatch = inputLower.match(/^(?:until\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3];

    // Validate hours
    if (hours < 0 || hours > 23 || (meridiem && hours > 12)) {
      return createInvalidResult();
    }

    // Convert to 24-hour format
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    // If no am/pm specified, assume the next occurrence of that time
    if (!meridiem) {
      // If the specified hour is less than current, assume PM if before noon else next day
      const currentHour = now.getHours();
      if (hours <= currentHour || (hours === currentHour && mins <= now.getMinutes())) {
        // Assume they mean later today if reasonable, otherwise add 12 or go to tomorrow
        if (hours < 12 && currentHour < 12) {
          hours += 12; // Assume PM
        } else if (hours < 12) {
          // It's already past noon, so they probably mean tomorrow morning
          // We'll add a day below
        }
      }
    }

    const freeUntil = new Date(now);
    freeUntil.setHours(hours, mins, 0, 0);

    // If time is in the past, assume tomorrow
    if (freeUntil <= now) {
      freeUntil.setDate(freeUntil.getDate() + 1);
    }

    const displayTime = freeUntil.toLocaleTimeString('en-SG', {
      hour: 'numeric',
      minute: mins > 0 ? '2-digit' : undefined,
      hour12: true,
    });

    return {
      freeUntil,
      expiresAt: freeUntil,
      displayText: `until ${displayTime}`,
    };
  }

  // Handle "all day" or "today"
  if (inputLower === 'all day' || inputLower === 'today' || inputLower === 'whole day') {
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return {
      freeUntil: endOfDay,
      expiresAt: endOfDay,
      displayText: 'all day',
    };
  }

  // Handle "tonight"
  if (inputLower === 'tonight' || inputLower === 'until tonight' || inputLower === 'til tonight') {
    const tonight = new Date(now);
    tonight.setHours(22, 0, 0, 0);
    if (tonight <= now) {
      tonight.setDate(tonight.getDate() + 1);
    }
    return {
      freeUntil: tonight,
      expiresAt: tonight,
      displayText: 'until tonight',
    };
  }

  // Handle "now" - default to 2 hours
  if (inputLower === 'now' || inputLower === 'rn') {
    const freeUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return {
      freeUntil,
      expiresAt: freeUntil,
      displayText: 'for 2 hours',
    };
  }

  // Couldn't parse
  return createInvalidResult();
}

function createInvalidResult(): ParsedTimeInput {
  return {
    freeUntil: null,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // Default 2 hour expiry
    displayText: '',
  };
}

/**
 * Format a relative time string (e.g., "2h left", "30m left")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);

  if (diffMs < 0) {
    return 'expired';
  }

  if (diffMins < 1) {
    return 'less than a minute';
  }

  if (diffMins < 60) {
    return `${diffMins}m left`;
  }

  if (diffHours < 24) {
    const remainingMins = diffMins % 60;
    if (remainingMins > 0 && diffHours < 4) {
      return `${diffHours}h ${remainingMins}m left`;
    }
    return `${diffHours}h left`;
  }

  return date.toLocaleTimeString('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a time until display (e.g., "5:30 PM")
 */
export function formatTimeUntil(date: Date): string {
  return date.toLocaleTimeString('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get the end of today
 */
export function getEndOfDay(): Date {
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Get a specific hour today (or tomorrow if already passed)
 */
export function getTimeToday(hour: number, minute: number = 0): Date {
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (target <= new Date()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}
