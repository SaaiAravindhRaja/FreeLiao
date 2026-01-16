/**
 * Telegram authentication API route
 * Verifies Telegram login widget data and creates/updates user
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verify Telegram login widget authentication data
 * https://core.telegram.org/widgets/login#checking-authorization
 */
function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const { hash, ...authData } = data;

  // Create check string by sorting keys and joining with newlines
  const checkArr = Object.entries(authData)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  const checkString = checkArr.join('\n');

  // Create secret key from bot token
  const secretKey = crypto
    .createHash('sha256')
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();

  // Calculate HMAC
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  return calculatedHash === hash;
}

export async function POST(request: NextRequest) {
  try {
    const data: TelegramAuthData = await request.json();

    // Verify the authentication data
    if (!verifyTelegramAuth(data)) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }

    // Check auth_date is recent (within 24 hours)
    const authAge = Date.now() / 1000 - data.auth_date;
    if (authAge > 86400) {
      return NextResponse.json(
        { error: 'Authentication expired. Please try again.' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Find or create user
    let { data: user, error: findError } = await supabase
      .from('fl_users')
      .select('*')
      .eq('telegram_id', data.id)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok
      throw findError;
    }

    const displayName =
      data.first_name + (data.last_name ? ` ${data.last_name}` : '');

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('fl_users')
        .insert({
          telegram_id: data.id,
          telegram_username: data.username,
          display_name: displayName,
          profile_photo_url: data.photo_url,
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;

      // Create initial offline status
      await supabase.from('fl_user_status').insert({
        user_id: user.id,
        status_type: 'offline',
      });
    } else {
      // Update existing user info
      const { error: updateError } = await supabase
        .from('fl_users')
        .update({
          telegram_username: data.username,
          display_name: displayName,
          profile_photo_url: data.photo_url,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        displayName: user.display_name,
        telegramUsername: user.telegram_username,
        profilePhotoUrl: user.profile_photo_url,
      },
    });

    // Set user session cookie
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Telegram auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
