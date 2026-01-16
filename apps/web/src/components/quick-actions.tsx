'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { JIO_TYPES, DEFAULT_JIO_EXPIRY_MS } from '@freeliao/shared';
import type { JioType } from '@freeliao/shared';

interface QuickActionsProps {
  userId: string;
}

export function QuickActions({ userId }: QuickActionsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [createdJio, setCreatedJio] = useState<string | null>(null);

  const supabase = createClient();

  const handleQuickJio = async (type: JioType) => {
    setIsCreating(true);
    const jioInfo = JIO_TYPES[type];
    const expiresAt = new Date(Date.now() + DEFAULT_JIO_EXPIRY_MS);

    const { data, error } = await supabase
      .from('fl_jios')
      .insert({
        creator_id: userId,
        jio_type: type,
        title: jioInfo.defaultTitle,
        is_now: true,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (data) {
      setCreatedJio(type);
      setTimeout(() => setCreatedJio(null), 3000);
    }
    setIsCreating(false);
  };

  const quickJioOptions: { type: JioType; emoji: string; label: string }[] = [
    { type: 'kopi', emoji: '☕', label: 'Kopi' },
    { type: 'makan', emoji: '🍜', label: 'Makan' },
    { type: 'study', emoji: '📚', label: 'Study' },
    { type: 'chill', emoji: '😎', label: 'Chill' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Jio</h3>

      {createdJio ? (
        <div className="text-center py-2">
          <p className="text-green-600 font-medium">
            {JIO_TYPES[createdJio].emoji} Jio sent!
          </p>
          <p className="text-sm text-gray-500">
            Your free friends have been notified
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {quickJioOptions.map(({ type, emoji, label }) => (
            <button
              key={type}
              onClick={() => handleQuickJio(type)}
              disabled={isCreating}
              className="flex flex-col items-center gap-1 py-3 px-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs text-gray-600">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
