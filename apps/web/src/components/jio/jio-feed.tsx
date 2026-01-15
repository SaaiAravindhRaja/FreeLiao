'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { JIO_TYPES, JIO_RESPONSE_TEXT } from '@freeliao/shared';
import type { JioType, JioResponseType } from '@freeliao/shared';

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

interface JioFeedProps {
  jios: JioData[];
  userId: string;
}

export function JioFeed({ jios, userId }: JioFeedProps) {
  if (jios.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {jios.map((jio) => (
        <JioCard key={jio.jio_id} jio={jio} userId={userId} />
      ))}
    </div>
  );
}

function JioCard({ jio, userId }: { jio: JioData; userId: string }) {
  const [userResponse, setUserResponse] = useState<string | null>(
    jio.user_response
  );
  const [isResponding, setIsResponding] = useState(false);

  const supabase = createClient();
  const jioTypeInfo = JIO_TYPES[jio.jio_type as JioType];
  const isCreator = jio.creator_id === userId;

  const handleRespond = async (response: JioResponseType) => {
    setIsResponding(true);

    const { error } = await supabase.from('jio_responses').upsert(
      {
        jio_id: jio.jio_id,
        user_id: userId,
        response,
        responded_at: new Date().toISOString(),
      },
      { onConflict: 'jio_id,user_id' }
    );

    if (!error) {
      setUserResponse(response);
    }
    setIsResponding(false);
  };

  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const formatExpiresIn = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';

    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m left`;
    const diffHours = Math.round(diffMs / 3600000);
    return `${diffHours}h left`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        {jio.creator_photo ? (
          <img
            src={jio.creator_photo}
            alt=""
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">
              {jio.creator_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{jio.creator_name}</span>
            {isCreator && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{formatTimeAgo(jio.created_at)}</p>
        </div>
        <span className="text-2xl">{jioTypeInfo?.emoji || '🎯'}</span>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-gray-900 mb-1">{jio.title}</h3>
        {jio.description && (
          <p className="text-sm text-gray-600 mb-2">{jio.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {jio.location_text && <span>📍 {jio.location_text}</span>}
          <span>⏰ {formatExpiresIn(jio.expires_at)}</span>
          {jio.response_count > 0 && (
            <span>
              👥 {jio.response_count} interested
            </span>
          )}
        </div>
      </div>

      {/* Response section */}
      {!isCreator && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          {userResponse ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {JIO_RESPONSE_TEXT[userResponse as JioResponseType]?.emoji}{' '}
                {JIO_RESPONSE_TEXT[userResponse as JioResponseType]?.text}
              </span>
              <button
                onClick={() => setUserResponse(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleRespond('joined')}
                disabled={isResponding}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                I'm in!
              </button>
              <button
                onClick={() => handleRespond('maybe')}
                disabled={isResponding}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Maybe
              </button>
              <button
                onClick={() => handleRespond('declined')}
                disabled={isResponding}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Can't
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
