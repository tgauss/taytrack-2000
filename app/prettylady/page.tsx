'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tripEvents } from '@/lib/trip-data';
import Link from 'next/link';

// Group events by date
const TRIP_DAYS = [
  { date: '2026-04-12', label: 'Sun, Apr 12', title: 'Travel Day', color: '#60a5fa' },
  { date: '2026-04-13', label: 'Mon, Apr 13', title: 'Conference Day 1', color: '#f97316' },
  { date: '2026-04-14', label: 'Tue, Apr 14', title: 'Conference Day 2', color: '#f97316' },
  { date: '2026-04-15', label: 'Wed, Apr 15', title: 'Conference + Drive', color: '#eab308' },
  { date: '2026-04-16', label: 'Thu, Apr 16', title: 'Pickup Day 1 — ~75 pickups 🔥', color: '#ef4444' },
  { date: '2026-04-17', label: 'Fri, Apr 17', title: 'Pickup Day 2 — ~75 pickups 🔥', color: '#ef4444' },
  { date: '2026-04-18', label: 'Sat, Apr 18', title: 'Pickup Day 3 — ~75 pickups 🔥', color: '#ef4444' },
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
    { route: 'PDX → SEA', flight: 'Alaska 2048', flightNum: 'AS2048', departs: '7:18 AM', arrives: '8:18 AM', duration: '1hr', dateCode: '2026-04-12' },
    { route: 'Layover in Seattle', flight: '', flightNum: '', departs: '', arrives: '1h 47m', duration: '', dateCode: '' },
    { route: 'SEA → TUL', flight: 'Alaska 2350', flightNum: 'AS2350', departs: '10:05 AM', arrives: '4:03 PM CT', duration: '3hr 58min', dateCode: '2026-04-12' },
  ]},
  { dir: 'Return', date: 'Sunday, April 19', legs: [
    { route: 'OMA → SEA', flight: 'Alaska 312', flightNum: 'AS312', departs: '2:17 PM CT', arrives: '4:01 PM PT', duration: '3hr 44min', dateCode: '2026-04-19' },
    { route: 'Layover in Seattle', flight: '', flightNum: '', departs: '', arrives: '3h 29m', duration: '', dateCode: '' },
    { route: 'SEA → PDX', flight: 'Alaska 2007', flightNum: 'AS2007', departs: '7:30 PM', arrives: '8:25 PM', duration: '55min', dateCode: '2026-04-19' },
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

// "Happening Now" status engine — returns what Taylor is doing based on timeline
function getHappeningNow(): { status: string; detail: string; location: string; timezone: string; availability: string } | null {
  const now = new Date();
  const tripStart = new Date('2026-04-12T07:18:00');
  const tripEnd = new Date('2026-04-19T20:25:00');

  if (now < tripStart) return null; // trip hasn't started
  if (now > tripEnd) return null; // trip is over

  const dateStr = now.toISOString().split('T')[0];
  const hour = now.getHours();

  // Location & timezone by date
  let location = 'Vancouver, WA';
  let timezone = 'Pacific (same as home)';
  if (dateStr >= '2026-04-12' && dateStr <= '2026-04-15' && !(dateStr === '2026-04-15' && hour >= 16)) {
    location = 'Tulsa, Oklahoma';
    timezone = 'Central (1 hour ahead)';
  } else if (dateStr === '2026-04-15' && hour >= 16) {
    location = 'Driving through Kansas';
    timezone = 'Central (1 hour ahead)';
  } else if (dateStr >= '2026-04-16' && dateStr <= '2026-04-18') {
    location = 'Lincoln / Roca, Nebraska';
    timezone = 'Central (1 hour ahead)';
  } else if (dateStr === '2026-04-19') {
    location = hour < 14 ? 'Omaha, Nebraska' : 'Flying home!';
    timezone = hour < 14 ? 'Central (1 hour ahead)' : 'In the air!';
  }

  // What's happening now based on date + time
  let status = '';
  let detail = '';
  let availability = '';

  if (dateStr === '2026-04-12') {
    if (hour < 7) { status = 'Getting ready to leave'; detail = 'Flight at 7:18 AM from PDX'; availability = '✅ Available to text'; }
    else if (hour < 16) { status = 'In the air / traveling'; detail = 'PDX → Seattle → Tulsa'; availability = '✈️ Limited — on a plane'; }
    else if (hour < 18) { status = 'Checking into hotel'; detail = 'Holiday Inn Express, Tulsa'; availability = '✅ Free to call!'; }
    else { status = 'Welcome reception'; detail = 'Conference networking event'; availability = '📱 Can text, might be slow'; }
  } else if (dateStr >= '2026-04-13' && dateStr <= '2026-04-14') {
    if (hour < 8) { status = 'Sleeping / getting ready'; detail = 'Holiday Inn Express, Tulsa'; availability = '✅ Free to call!'; }
    else if (hour < 17) { status = 'At the conference'; detail = 'Main Street Now Conference sessions'; availability = '📱 Can text between sessions'; }
    else { status = 'Free for the evening'; detail = 'Done with sessions for today'; availability = '✅ Free to FaceTime!'; }
  } else if (dateStr === '2026-04-15') {
    if (hour < 8) { status = 'Getting ready'; detail = 'Last day of conference'; availability = '✅ Free to call!'; }
    else if (hour < 16) { status = 'Final conference sessions'; detail = 'Closing celebration at 4:15 PM'; availability = '📱 Can text between sessions'; }
    else if (hour < 22) { status = 'Driving to Nebraska!'; detail = '~6 hours through Kansas'; availability = '📱 Can talk hands-free'; }
    else { status = 'Arriving in Lincoln'; detail = 'Checking into Hyatt Place'; availability = '✅ Free to call!'; }
  } else if (dateStr === '2026-04-16') {
    if (hour < 8) { status = 'Sleeping / getting ready'; detail = 'Hyatt Place, Lincoln'; availability = '✅ Free to call!'; }
    else if (hour < 17) { status = 'Packing boxes at warehouse'; detail = 'Roca, NE — prepping 180 shipping orders'; availability = '📱 Can text, hands might be full'; }
    else if (hour < 20) { status = 'Pickup event — Day 1'; detail = '~75 customers picking up orders'; availability = '🔥 Super busy — text only'; }
    else { status = 'Wrapping up for the night'; detail = 'Back at hotel soon'; availability = '✅ Free to call!'; }
  } else if (dateStr === '2026-04-17') {
    if (hour < 8) { status = 'Sleeping / getting ready'; detail = 'Hyatt Place, Lincoln'; availability = '✅ Free to call!'; }
    else if (hour < 10) { status = 'Heading to warehouse'; detail = 'Big day — 10 hours of pickups'; availability = '✅ Available'; }
    else if (hour < 20) { status = 'Pickup event — Day 2'; detail = '~75 pickups, busiest day!'; availability = '🔥 Super busy — text only'; }
    else { status = 'Done! Exhausted but happy'; detail = 'Heading back to hotel'; availability = '✅ Free to FaceTime!'; }
  } else if (dateStr === '2026-04-18') {
    if (hour < 8) { status = 'Sleeping / getting ready'; detail = 'Hyatt Place, Lincoln'; availability = '✅ Free to call!'; }
    else if (hour < 10) { status = 'Heading to warehouse'; detail = 'Final pickup day'; availability = '✅ Available'; }
    else if (hour < 19) { status = 'Pickup event — Day 3'; detail = '~75 pickups, last day!'; availability = '🔥 Busy — text only'; }
    else { status = 'Cleaning up & heading to Omaha'; detail = 'Driving to Omaha for tomorrow\'s flight'; availability = '📱 Can talk hands-free'; }
  } else if (dateStr === '2026-04-19') {
    if (hour < 10) { status = 'Morning in Omaha'; detail = 'Getting ready for the flight home'; availability = '✅ Free to call!'; }
    else if (hour < 14) { status = 'Heading to the airport'; detail = 'Eppley Airfield, Omaha'; availability = '✅ Available'; }
    else if (hour < 21) { status = 'Flying home!'; detail = 'OMA → Seattle → PDX'; availability = '✈️ Limited — on a plane'; }
    else { status = 'HOME!'; detail = 'Finally back! 💕'; availability = '🏠 Right here with you!'; }
  }

  return { status, detail, location, timezone, availability };
}

// Emergency contacts
const EMERGENCY_CONTACTS = [
  { name: 'Holiday Inn Express Tulsa', phone: '(918) 728-2444', note: 'Apr 12-15' },
  { name: 'Hyatt Place Lincoln', phone: '(402) 742-6000', note: 'Apr 15-19' },
  { name: 'Arvest Convention Center', phone: '(918) 894-4350', note: 'Conference venue' },
  { name: 'Tulsa Intl Airport (TUL)', phone: '(918) 838-5000', note: '' },
  { name: 'Eppley Airfield (OMA)', phone: '(402) 661-8017', note: '' },
  { name: 'Alaska Airlines', phone: '1-800-252-7522', note: 'Reservations' },
];

type DetailView = 'schedule' | 'flights' | 'hotels' | 'contacts';

export default function PrettyLadyPage() {
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<DetailView>('schedule');
  const [now, setNow] = useState(new Date());
  const daysHome = getDaysUntilHome();
  const daysDeparture = getDaysUntilDeparture();
  const happeningNow = getHappeningNow();

  // Update "now" every minute for live status
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Get time in Central timezone (where Taylor will be most of the trip)
  const centralTime = now.toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

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

        {/* ===== HAPPENING NOW CARD ===== */}
        {happeningNow && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-white/40">Right Now</span>
              </div>

              <h3 className="text-lg font-bold mb-1">{happeningNow.status}</h3>
              <p className="text-sm text-white/50 mb-3">{happeningNow.detail}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-2.5">
                  <div className="text-[10px] text-white/30 uppercase mb-0.5">Location</div>
                  <div className="text-xs font-medium">{happeningNow.location}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5">
                  <div className="text-[10px] text-white/30 uppercase mb-0.5">His Time</div>
                  <div className="text-xs font-medium">{centralTime}</div>
                  <div className="text-[10px] text-white/30">{happeningNow.timezone}</div>
                </div>
              </div>

              <div className="mt-3 bg-white/5 rounded-lg p-2.5">
                <div className="text-[10px] text-white/30 uppercase mb-0.5">Can I reach him?</div>
                <div className="text-sm font-medium">{happeningNow.availability}</div>
              </div>
            </div>
          </motion.section>
        )}

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
                      <div key={li} className={`py-3 ${li > 0 ? 'border-t border-white/5' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <div className="font-mono text-sm font-semibold" style={{ color: leg.route.includes('Layover') ? '#fbbf24' : '#60a5fa' }}>
                              {leg.route}
                            </div>
                            {leg.flight && <div className="text-xs text-white/40">{leg.flight}</div>}
                          </div>
                          {leg.duration && (
                            <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-white/50">{leg.duration}</span>
                          )}
                        </div>
                        {(leg.departs || leg.arrives) && !leg.route.includes('Layover') && (
                          <div className="flex items-center gap-3 text-xs text-white/50 mb-1">
                            {leg.departs && <span>Departs <span className="text-white/80 font-mono">{leg.departs}</span></span>}
                            {leg.departs && leg.arrives && <span className="text-white/20">→</span>}
                            {leg.arrives && <span>Arrives <span className="text-white/80 font-mono">{leg.arrives}</span></span>}
                          </div>
                        )}
                        {leg.route.includes('Layover') && (
                          <div className="text-xs text-yellow-400/60">{leg.arrives} layover</div>
                        )}
                        {leg.flightNum && (
                          <a
                            href={`https://www.flightaware.com/live/flight/${leg.flightNum}/history/${leg.dateCode.replace(/-/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/20 rounded-lg text-xs text-blue-400 font-medium transition-colors"
                          >
                            📡 Track Live Flight
                          </a>
                        )}
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
            <div className="bg-white/5 rounded-xl p-5 text-center mb-4">
              <p className="text-3xl mb-3">💕</p>
              <p className="text-sm text-white/60 mb-3">
                I&apos;ll have my phone the whole trip. Call or text anytime!
              </p>
              {happeningNow && (
                <div className="bg-white/5 rounded-xl p-3 mb-3">
                  <p className="text-xs text-white/40 mb-0.5">Right now</p>
                  <p className="text-sm font-semibold">{happeningNow.availability}</p>
                </div>
              )}
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-0.5">Best times to call</p>
                <p className="font-semibold text-sm">Before 8am &amp; after 6pm his time</p>
              </div>
            </div>

            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 px-1">Emergency Contacts</h3>
            <div className="space-y-2">
              {EMERGENCY_CONTACTS.map((contact, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/5 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">{contact.name}</div>
                    {contact.note && <div className="text-[11px] text-white/30">{contact.note}</div>}
                  </div>
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/20 rounded-lg text-xs text-green-400 font-medium transition-colors whitespace-nowrap"
                  >
                    📞 {contact.phone}
                  </a>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 text-center">
              <p className="text-sm text-pink-300">
                Miss you already. See you April 19th. 💕
              </p>
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
