'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { STATUS_DISPLAY } from '@freeliao/shared';
import type { UserStatus, StatusType } from '@freeliao/shared';

interface StatusCardProps {
  status: UserStatus | null;
  userId: string;
  onStatusUpdate: (status: UserStatus) => void;
}

export function StatusCard({ status, userId, onStatusUpdate }: StatusCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);

  const supabase = createClient();

  const currentStatusType = status?.status_type || 'offline';
  const statusInfo = STATUS_DISPLAY[currentStatusType as StatusType];

  const formatTimeLeft = (freeUntil: string | null) => {
    if (!freeUntil) return null;
    const until = new Date(freeUntil);
    const now = new Date();
    const diffMs = until.getTime() - now.getTime();
    if (diffMs <= 0) return 'expired';

    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m left`;
    const diffHours = Math.round(diffMs / 3600000);
    return `${diffHours}h left`;
  };

  const handleSetFree = async (hours: number) => {
    setIsUpdating(true);
    const freeUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('user_status')
      .upsert(
        {
          user_id: userId,
          status_type: 'free',
          free_until: freeUntil.toISOString(),
          expires_at: freeUntil.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (data) {
      onStatusUpdate(data);
    }
    setIsUpdating(false);
    setShowTimeOptions(false);
  };

  const handleSetBusy = async () => {
    setIsUpdating(true);

    const { data, error } = await supabase
      .from('user_status')
      .upsert(
        {
          user_id: userId,
          status_type: 'busy',
          free_until: null,
          free_after: null,
          vibe_text: null,
          expires_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (data) {
      onStatusUpdate(data);
    }
    setIsUpdating(false);
  };

  const timeLeft = formatTimeLeft(status?.free_until || null);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">Your Status</h3>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${
            currentStatusType === 'free'
              ? 'bg-green-100 text-green-700'
              : currentStatusType === 'busy'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <span>{statusInfo.emoji}</span>
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {currentStatusType === 'free' && (
        <div className="mb-4">
          {timeLeft && timeLeft !== 'expired' && (
            <p className="text-sm text-gray-600">{timeLeft}</p>
          )}
          {status?.vibe_text && (
            <p className="text-sm text-gray-500 mt-1">"{status.vibe_text}"</p>
          )}
        </div>
      )}

      {showTimeOptions ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-2">How long are you free?</p>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((hours) => (
              <button
                key={hours}
                onClick={() => handleSetFree(hours)}
                disabled={isUpdating}
                className="py-2 px-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {hours}h
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowTimeOptions(false)}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setShowTimeOptions(true)}
            disabled={isUpdating}
            className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {currentStatusType === 'free' ? 'Update Time' : "I'm Free"}
          </button>
          {currentStatusType !== 'busy' && (
            <button
              onClick={handleSetBusy}
              disabled={isUpdating}
              className="py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Busy
            </button>
          )}
        </div>
      )}
    </div>
  );
}
