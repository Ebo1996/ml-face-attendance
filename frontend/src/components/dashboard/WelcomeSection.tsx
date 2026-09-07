/**
 * WelcomeSection — professional gradient banner with live clock
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const WelcomeSection: React.FC = () => {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  // Live clock — tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const getGreeting = () => {
    const h = now.getHours();
    if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (h < 18) return { text: 'Good Afternoon', emoji: '🌤️' };
    return { text: 'Good Evening', emoji: '🌙' };
  };

  const greeting = getGreeting();
  const name = user?.email?.split('@')[0] ?? 'User';
  const initials = name.slice(0, 2).toUpperCase();

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-xl"
      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-32 w-20 h-20 rounded-full bg-white/5" />
        {/* Grid dots */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left — greeting */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg">
            {initials}
          </div>

          <div>
            <p className="text-white/70 text-sm font-medium mb-0.5">
              {greeting.emoji} {greeting.text}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight capitalize">
              {name}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {user?.role}
              </span>
              <span className="text-white/50 text-xs">{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Right — live clock */}
        <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-center shadow-lg min-w-[140px]">
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {timeStr.slice(0, 5)}
          </p>
          <p className="text-white/60 text-xs mt-1 tabular-nums">
            {timeStr.slice(6)}
          </p>
          <p className="text-white/50 text-[10px] mt-1 uppercase tracking-widest">
            {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Bottom tagline */}
      <p className="relative mt-4 text-white/50 text-xs">
        Welcome to your attendance dashboard — track, report, and manage all in one place.
      </p>
    </div>
  );
};
