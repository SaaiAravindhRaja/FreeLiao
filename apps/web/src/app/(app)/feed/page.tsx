import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FeedClient } from './feed-client';

export default async function FeedPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Get user info
  const { data: user } = await supabase
    .from('fl_users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) {
    redirect('/login');
  }

  // Get user's current status
  const { data: status } = await supabase
    .from('fl_user_status')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get friends' statuses
  const { data: friendStatuses } = await supabase.rpc('fl_get_friends_statuses', {
    p_user_id: userId,
  });

  // Get active jios
  const { data: jios } = await supabase.rpc('fl_get_visible_jios', {
    p_user_id: userId,
  });

  return (
    <FeedClient
      user={user}
      currentStatus={status}
      friendStatuses={friendStatuses || []}
      jios={jios || []}
    />
  );
}
