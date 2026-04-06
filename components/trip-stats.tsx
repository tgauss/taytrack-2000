'use client';

import { tripStats } from '@/lib/trip-data';

const stats = [
  { value: tripStats.totalDays, label: 'Days', emoji: '📆', color: 'text-primary' },
  { value: `${tripStats.totalMiles}+`, label: 'Miles', emoji: '🛣️', color: 'text-secondary' },
  { value: tripStats.cities, label: 'Cities', emoji: '🏙️', color: 'text-accent' },
  { value: tripStats.flights, label: 'Flights', emoji: '✈️', color: 'text-chart-4' },
];

export function TripStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {stats.map(({ value, label, emoji, color }) => (
        <div
          key={label}
          className="bg-card border border-border rounded-2xl p-4 md:p-6 text-center hover:scale-105 transition-transform cursor-default"
        >
          <span className="text-3xl md:text-4xl block mb-2">{emoji}</span>
          <div className={`text-2xl md:text-3xl font-mono font-bold ${color}`}>
            {value}
          </div>
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniStats() {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-sm">
      {stats.map(({ value, label, emoji }) => (
        <div key={label} className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
          <span>{emoji}</span>
          <span className="font-mono font-bold text-foreground">{value}</span>
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
