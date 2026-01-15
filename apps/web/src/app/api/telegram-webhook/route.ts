/**
 * Telegram webhook handler
 * Receives updates from Telegram and processes them via the bot
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('x-telegram-bot-api-secret-token');

  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In production, this would forward to the bot
    // For now, we just acknowledge the request
    const update = await request.json();
    console.log('Received Telegram update:', update.update_id);

    // TODO: Process update via Grammy webhookCallback
    // This requires importing the bot instance and using webhookCallback

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook endpoint' });
}
