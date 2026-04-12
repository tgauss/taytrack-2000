'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

function getDaysInfo() {
  const now = new Date();
  const tripStart = new Date('2026-04-12T07:18:00');
  const tripEnd = new Date('2026-04-19T20:25:00');

  if (now < tripStart) {
    const days = Math.ceil((tripStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { label: `${days} day${days !== 1 ? 's' : ''} until departure`, phase: 'pre' };
  }
  if (now > tripEnd) {
    return { label: "Dad is home! 🏠", phase: 'done' };
  }
  const days = Math.ceil((tripEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { label: `${days} day${days !== 1 ? 's' : ''} until Dad's home`, phase: 'during' };
}

export default function HomePage() {
  const info = getDaysInfo();

  const links = [
    {
      href: '/game',
      emoji: '🎮',
      title: "Kids' Adventure",
      subtitle: 'Follow Dad with games & stories',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      href: '/connect',
      emoji: '💌',
      title: 'Talk to Dad',
      subtitle: 'Send messages, photos & voice',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      href: '/game?panel=games',
      emoji: '🧩',
      title: 'Play Games',
      subtitle: 'Packing game & memory cards',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      href: '/prettylady',
      emoji: '💕',
      title: "Amanda's View",
      subtitle: 'Schedule, flights & live status',
      gradient: 'from-purple-500 to-indigo-500',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="text-center mb-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-7xl mb-4"
        >
          ✈️
        </motion.div>
        <h1 className="text-4xl font-bold mb-2">Kiddos</h1>
        <p className="text-lg text-white/50">{info.label}</p>
      </motion.div>

      {/* Navigation cards */}
      <div className="w-full max-w-sm space-y-4">
        {links.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <Link href={link.href}>
              <div className={`bg-gradient-to-r ${link.gradient} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] touch-manipulation`}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{link.emoji}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">{link.title}</h2>
                    <p className="text-sm text-white/70">{link.subtitle}</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 text-center"
      >
        <p className="text-xs text-white/20">April 12–19, 2026</p>
        <p className="text-xs text-white/10 mt-1">Made with love for the family 💕</p>
      </motion.div>
    </main>
  );
}
