'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default function LoginPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle Telegram callback
    window.onTelegramAuth = async (user: TelegramUser) => {
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        if (res.ok) {
          router.push('/feed');
        } else {
          const data = await res.json();
          alert(data.error || 'Login failed. Please try again.');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    };

    // Load Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute(
      'data-telegram-login',
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'FreeLiaoBot'
    );
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">FreeLiao</h1>
        <p className="text-gray-600 max-w-xs mx-auto">
          See when friends are free. Make spontaneous plans.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <h2 className="text-xl font-semibold text-center mb-6">
          Login with Telegram
        </h2>

        <div ref={containerRef} className="flex justify-center min-h-[44px]" />

        <p className="text-xs text-gray-500 text-center mt-6">
          We use Telegram for login because that&apos;s where you chat with
          friends anyway
        </p>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Don&apos;t have Telegram?{' '}
          <a
            href="https://telegram.org/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline"
          >
            Download it here
          </a>
        </p>
      </div>
    </div>
  );
}
