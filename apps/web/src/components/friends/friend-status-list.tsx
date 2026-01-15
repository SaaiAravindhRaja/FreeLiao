'use client';

import { STATUS_DISPLAY } from '@freeliao/shared';
import type { StatusType } from '@freeliao/shared';

interface FriendStatus {
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

interface FriendStatusListProps {
  friends: FriendStatus[];
}

export function FriendStatusList({ friends }: FriendStatusListProps) {
  if (friends.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
        <p className="text-gray-500 mb-2">No friends on FreeLiao yet</p>
        <p className="text-sm text-gray-400">
          Share your invite code to connect with friends
        </p>
      </div>
    );
  }

  // Group friends by status
  const freeNow = friends.filter((f) => f.status_type === 'free');
  const freeLater = friends.filter((f) => f.status_type === 'free_later');
  const busy = friends.filter((f) => f.status_type === 'busy');
  const offline = friends.filter((f) => f.status_type === 'offline');

  const formatTimeLeft = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) return null;

    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.round(diffMs / 3600000);
    return `${diffHours}h`;
  };

  return (
    <div className="space-y-3">
      {/* Free Now */}
      {freeNow.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-2 bg-green-50 border-b border-green-100">
            <span className="text-sm font-medium text-green-700">
              Free Now ({freeNow.length})
            </span>
          </div>
          <div className="divide-y">
            {freeNow.map((friend) => (
              <FriendRow
                key={friend.user_id}
                friend={friend}
                timeText={formatTimeLeft(friend.free_until)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Free Later */}
      {freeLater.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100">
            <span className="text-sm font-medium text-yellow-700">
              Free Later ({freeLater.length})
            </span>
          </div>
          <div className="divide-y">
            {freeLater.map((friend) => (
              <FriendRow
                key={friend.user_id}
                friend={friend}
                timeText={
                  friend.free_after
                    ? `in ${formatTimeLeft(friend.free_after)}`
                    : null
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Busy */}
      {busy.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b">
            <span className="text-sm font-medium text-gray-600">
              Busy ({busy.length})
            </span>
          </div>
          <div className="divide-y">
            {busy.map((friend) => (
              <FriendRow key={friend.user_id} friend={friend} />
            ))}
          </div>
        </div>
      )}

      {/* Offline */}
      {offline.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b">
            <span className="text-sm font-medium text-gray-400">
              Offline ({offline.length})
            </span>
          </div>
          <div className="divide-y">
            {offline.slice(0, 5).map((friend) => (
              <FriendRow key={friend.user_id} friend={friend} />
            ))}
            {offline.length > 5 && (
              <div className="px-4 py-2 text-sm text-gray-400">
                +{offline.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FriendRow({
  friend,
  timeText,
}: {
  friend: FriendStatus;
  timeText?: string | null;
}) {
  const statusInfo = STATUS_DISPLAY[friend.status_type as StatusType];

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      {/* Avatar */}
      <div className="relative">
        {friend.profile_photo_url ? (
          <img
            src={friend.profile_photo_url}
            alt=""
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">
              {friend.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Status indicator */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
            friend.status_type === 'free'
              ? 'bg-green-500'
              : friend.status_type === 'free_later'
              ? 'bg-yellow-500'
              : friend.status_type === 'busy'
              ? 'bg-red-500'
              : 'bg-gray-400'
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">
            {friend.display_name}
          </span>
          {timeText && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {timeText}
            </span>
          )}
        </div>
        {friend.vibe_text && (
          <p className="text-sm text-gray-500 truncate">{friend.vibe_text}</p>
        )}
        {friend.location_text && (
          <p className="text-xs text-gray-400 truncate">
            📍 {friend.location_text}
          </p>
        )}
      </div>
    </div>
  );
}
