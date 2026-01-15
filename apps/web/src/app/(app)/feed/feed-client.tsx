'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatusCard } from '@/components/status/status-card';
import { FriendStatusList } from '@/components/friends/friend-status-list';
import { JioFeed } from '@/components/jio/jio-feed';
import { QuickActions } from '@/components/quick-actions';
import type { User, UserStatus, Jio } from '@freeliao/shared';

interface FriendStatusData {
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
}

interface JioData {
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
}

interface FeedClientProps {
  user: User;
  currentStatus: UserStatus | null;
  friendStatuses: FriendStatusData[];
  jios: JioData[];
}

export function FeedClient({
  user,
  currentStatus: initialStatus,
  friendStatuses: initialFriends,
  jios: initialJios,
}: FeedClientProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [friendStatuses, setFriendStatuses] = useState(initialFriends);
  const [jios, setJios] = useState(initialJios);

  const supabase = createClient();

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to status changes
    const statusChannel = supabase
      .channel('status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status',
        },
        (payload) => {
          if (payload.new) {
            const newStatus = payload.new as UserStatus;
            // Update own status or friend status
            if (newStatus.user_id === user.id) {
              setCurrentStatus(newStatus);
            } else {
              setFriendStatuses((prev) =>
                prev.map((f) =>
                  f.user_id === newStatus.user_id
                    ? {
                        ...f,
                        status_type: newStatus.status_type,
                        free_until: newStatus.free_until,
                        free_after: newStatus.free_after,
                        vibe_text: newStatus.vibe_text,
                        location_text: newStatus.location_text,
                        updated_at: newStatus.updated_at,
                      }
                    : f
                )
              );
            }
          }
        }
      )
      .subscribe();

    // Subscribe to new jios
    const jioChannel = supabase
      .channel('jio-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jios',
        },
        async (payload) => {
          // Fetch full jio data with creator info
          const { data } = await supabase.rpc('get_visible_jios', {
            p_user_id: user.id,
          });
          if (data) {
            setJios(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(jioChannel);
    };
  }, [supabase, user.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-600">FreeLiao</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user.display_name}</span>
            {user.profile_photo_url && (
              <img
                src={user.profile_photo_url}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6 safe-area-bottom pb-20">
        {/* Your Status */}
        <section>
          <StatusCard
            status={currentStatus}
            userId={user.id}
            onStatusUpdate={setCurrentStatus}
          />
        </section>

        {/* Quick Actions */}
        <section>
          <QuickActions userId={user.id} />
        </section>

        {/* Active Jios */}
        {jios.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
              Active Jios
            </h2>
            <JioFeed jios={jios} userId={user.id} />
          </section>
        )}

        {/* Friends Status */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            Friends ({friendStatuses.length})
          </h2>
          <FriendStatusList friends={friendStatuses} />
        </section>
      </main>
    </div>
  );
}
