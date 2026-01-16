/**
 * Cron job endpoint to expire old statuses and jios
 * Should be called every 15 minutes via Vercel Cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    // Expire old statuses
    const { error: statusError } = await supabase.rpc('fl_expire_old_statuses');
    if (statusError) {
      console.error('Error expiring statuses:', statusError);
    }

    // Expire old jios
    const { error: jioError } = await supabase.rpc('fl_expire_old_jios');
    if (jioError) {
      console.error('Error expiring jios:', jioError);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
