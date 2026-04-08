'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tripEvents } from '@/lib/trip-data';
import Link from 'next/link';

// Group events by date
const TRIP_DAYS = [
  { date: '2026-04-12', label: 'Sun, Apr 12', title: 'Travel Day', color: '#60a5fa' },
  { date: '2026-04-13', label: 'Mon, Apr 13', title: 'Conference Day 1', color: '#f97316' },
  { date: '2026-04-14', label: 'Tue, Apr 14', title: 'Conference Day 2', color: '#f97316' },
  { date: '2026-04-15', label: 'Wed, Apr 15', title: 'Conference + Drive', color: '#eab308' },
  { date: '2026-04-16', label: 'Thu, Apr 16', title: 'Packing + Pickup Night', color: '#a855f7' },
  { date: '2026-04-17', label: 'Fri, Apr 17', title: 'THE BIG DAY', color: '#ef4444' },
  { date: '2026-04-18', label: 'Sat, Apr 18', title: 'Final Pickup Day', color: '#a855f7' },
  { date: '2026-04-19', label: 'Sun, Apr 19', title: 'Coming Home!', color: '#4ade80' },
];

const HOTELS = [
  {
    dates: 'Apr 12-15',
    name: 'Holiday Inn Express & Suites',
    subtitle: 'Tulsa Downtown',
    address: '310 E Archer St, Tulsa, OK 74120',
    phone: '(918) 728-2444',
  },
  {
    dates: 'Apr 15-19',
    name: 'Hyatt Place Lincoln',
    subtitle: 'Downtown - Haymarket',
    address: '600 Q Street, Lincoln, NE 68508',
    phone: '',
  },
];

const FLIGHTS = [
  { dir: 'Outbound', date: 'Sunday, April 12', legs: [
    { route: 'PDX → SEA', flight: 'Alaska AS 2048', departs: '7:18 AM', arrives: '' },
    { route: 'Layover', flight: '', departs: '', arrives: '1h 47m in Seattle' },
    { route: 'SEA → TUL', flight: 'Alaska AS 2350', departs: '', arrives: '4:03 PM' },
  ]},
  { dir: 'Return', date: 'Sunday, April 19', legs: [
    { route: 'OMA → SEA', flight: 'Alaska AS 312', departs: '2:17 PM', arrives: '' },
    { route: 'Layover', flight: '', departs: '', arrives: '3h 29m in Seattle' },
    { route: 'SEA → PDX', flight: 'Alaska AS 2007', departs: '', arrives: '8:25 PM' },
  ]},
];

function getDaysUntilHome(): number {
  const now = new Date();
  const home = new Date('2026-04-19T20:25:00');
  if (now >= home) return 0;
  return Math.ceil((home.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysUntilDeparture(): number {
  const now = new Date();
  const depart = new Date('2026-04-12T07:18:00');
  if (now >= depart) return -1;
  return Math.ceil((depart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type DetailView = 'schedule' | 'flights' | 'hotels' | 'contacts';

export default function PrettyLadyPage() {
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<DetailView>('schedule');
  const daysHome = getDaysUntilHome();
  const daysDeparture = getDaysUntilDeparture();

  const dayEvents = activeDay ? tripEvents.filter(e => e.date === activeDay) : [];
  const activeDayInfo = TRIP_DAYS.find(d => d.date === activeDay);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
          <h1 className="text-sm font-semibold tracking-wide text-white/90">Taylor&apos;s Trip</h1>
          <Link href="/game" className="text-sm text-white/50 hover:text-white/80">
            Kids →
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Hero */}
        <section className="pt-8 pb-6 text-center">
          <p className="text-sm text-white/40 uppercase tracking-widest mb-2">April 12 — 19, 2026</p>
          <h2 className="text-2xl font-bold mb-1">
            {daysDeparture > 0 ? (
              <>{daysDeparture} day{daysDeparture !== 1 ? 's' : ''} until departure</>
            ) : daysHome > 0 ? (
              <>{daysHome} day{daysHome !== 1 ? 's' : ''} until I&apos;m home</>
            ) : (
              <>I&apos;m home! 💕</>
            )}
          </h2>
          <p className="text-white/50 text-sm">Tulsa → Lincoln → Roca → Omaha</p>
        </section>

        {/* Quick nav */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {([
            { id: 'schedule' as DetailView, icon: '📅', label: 'Schedule' },
            { id: 'flights' as DetailView, icon: '✈️', label: 'Flights' },
            { id: 'hotels' as DetailView, icon: '🏨', label: 'Hotels' },
            { id: 'contacts' as DetailView, icon: '📱', label: 'Contact' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setDetailView(tab.id); setActiveDay(null); }}
              className={`p-3 rounded-xl text-center transition-all ${
                detailView === tab.id && !activeDay
                  ? 'bg-white/15 ring-1 ring-white/20'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-xl mb-1">{tab.icon}</div>
              <div className="text-[11px] text-white/60 font-medium">{tab.label}</div>
            </button>
          ))}
        </div>

        {/* ===== SCHEDULE VIEW ===== */}
        {detailView === 'schedule' && !activeDay && (
          <section>
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 px-1">Day by Day</h3>
            <div className="space-y-2">
              {TRIP_DAYS.map((day, i) => {
                const events = tripEvents.filter(e => e.date === day.date);
                const isToday = new Date().toISOString().split('T')[0] === day.date;
                return (
                  <motion.button
                    key={day.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setActiveDay(day.date)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      isToday ? 'bg-white/15 ring-1 ring-white/25' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: day.color + '25', color: day.color }}
                        >
                          {day.date.split('-')[2]}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-white/90">{day.title}</div>
                          <div className="text-xs text-white/40">{day.label} &middot; {events.length} event{events.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      {isToday && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white/80">Today</span>}
                      <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== DAY DETAIL VIEW ===== */}
        <AnimatePresence>
          {activeDay && activeDayInfo && (
            <motion.section
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <button
                onClick={() => setActiveDay(null)}
                className="text-sm text-white/50 hover:text-white/80 mb-4 flex items-center gap-1"
              >
                ← Back to schedule
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: activeDayInfo.color + '25', color: activeDayInfo.color }}
                >
                  {activeDay.split('-')[2]}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{activeDayInfo.title}</h3>
                  <p className="text-sm text-white/40">{activeDayInfo.label}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative pl-8 space-y-4">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />

                {dayEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2"
                      style={{ backgroundColor: activeDayInfo.color, borderColor: activeDayInfo.color }}
                    />

                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{event.icon}</span>
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                        </div>
                        {event.time && (
                          <span className="text-xs text-white/40 font-mono whitespace-nowrap">
                            {event.time}{event.endTime ? ` – ${event.endTime}` : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/50 mb-2">{event.description}</p>
                      <p className="text-xs text-white/30">📍 {event.location}</p>

                      {event.details && event.details.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                          {event.details.map((d, j) => (
                            <p key={j} className="text-xs text-white/40">• {d}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ===== FLIGHTS VIEW ===== */}
        {detailView === 'flights' && !activeDay && (
          <section>
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 px-1">Flight Details</h3>
            <div className="space-y-4">
              {FLIGHTS.map((flight, fi) => (
                <motion.div
                  key={fi}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: fi * 0.1 }}
                  className="bg-white/5 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{flight.dir}</h4>
                    <span className="text-xs text-white/40">{flight.date}</span>
                  </div>
                  <div className="space-y-2">
                    {flight.legs.map((leg, li) => (
                      <div key={li} className={`flex items-center justify-between py-2 ${li > 0 ? 'border-t border-white/5' : ''}`}>
                        <div>
                          <div className="font-mono text-sm font-semibold" style={{ color: leg.route === 'Layover' ? '#fbbf24' : '#60a5fa' }}>
                            {leg.route}
                          </div>
                          {leg.flight && <div className="text-xs text-white/40">{leg.flight}</div>}
                        </div>
                        <div className="text-right">
                          {leg.departs && <div className="text-sm font-mono">{leg.departs}</div>}
                          {leg.arrives && <div className="text-xs text-white/40">{leg.arrives}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ===== HOTELS VIEW ===== */}
        {detailView === 'hotels' && !activeDay && (
          <section>
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 px-1">Accommodations</h3>
            <div className="space-y-3">
              {HOTELS.map((hotel, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{hotel.name}</h4>
                      <p className="text-xs text-white/50">{hotel.subtitle}</p>
                    </div>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{hotel.dates}</span>
                  </div>
                  <p className="text-xs text-white/40 mb-2">📍 {hotel.address}</p>
                  {hotel.phone && (
                    <a href={`tel:${hotel.phone}`} className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                      📞 {hotel.phone}
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ===== CONTACT VIEW ===== */}
        {detailView === 'contacts' && !activeDay && (
          <section>
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 px-1">Reach Me</h3>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <p className="text-4xl mb-4">💕</p>
              <p className="text-sm text-white/60 mb-4">
                I&apos;ll have my phone the whole trip. Call or text anytime!
              </p>
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-xs text-white/40 mb-1">Best times to call</p>
                <p className="font-semibold">Mornings &amp; Evenings</p>
                <p className="text-xs text-white/30 mt-1">
                  May be in sessions or with customers during the day
                </p>
              </div>
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
                <p className="text-sm text-pink-300">
                  Miss you already. See you April 19th. 💕
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Mini calendar */}
        <section className="mt-8">
          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 px-1">April 2026</h3>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-white/30 py-1 font-medium">{d}</div>
              ))}
              {/* April 2026 starts on Wednesday (index 3) */}
              {Array.from({ length: 3 }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const dateStr = `2026-04-${String(day).padStart(2, '0')}`;
                const tripDay = TRIP_DAYS.find(d => d.date === dateStr);
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                const isTripDay = day >= 12 && day <= 19;

                return (
                  <button
                    key={day}
                    onClick={() => { if (tripDay) { setActiveDay(dateStr); setDetailView('schedule'); } }}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isToday
                        ? 'bg-white text-black font-bold'
                        : isTripDay
                          ? 'bg-white/10 text-white hover:bg-white/20'
                          : 'text-white/20'
                    }`}
                    style={tripDay && !isToday ? { backgroundColor: tripDay.color + '20', color: tripDay.color } : {}}
                    disabled={!tripDay}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center py-6">
          <p className="text-xs text-white/20">Made with love for my favorite person</p>
        </footer>
      </div>
    </main>
  );
}
