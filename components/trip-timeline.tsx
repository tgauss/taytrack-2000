'use client';

import { useState } from 'react';
import { tripEvents, type TripEvent } from '@/lib/trip-data';
import { cn } from '@/lib/utils';

const dateLabels: Record<string, string> = {
  '2026-04-12': 'Sunday, April 12',
  '2026-04-13': 'Monday, April 13',
  '2026-04-14': 'Tuesday, April 14',
  '2026-04-15': 'Wednesday, April 15',
  '2026-04-16': 'Thursday, April 16',
  '2026-04-17': 'Friday, April 17',
  '2026-04-18': 'Saturday, April 18',
  '2026-04-19': 'Sunday, April 19',
};

const dayThemes: Record<string, { label: string; emoji: string }> = {
  '2026-04-12': { label: 'Travel Day', emoji: '✈️' },
  '2026-04-13': { label: 'Conference Day 1', emoji: '🎭' },
  '2026-04-14': { label: 'Conference Day 2', emoji: '📚' },
  '2026-04-15': { label: 'Conference + Road Trip', emoji: '🚗' },
  '2026-04-16': { label: 'Pickup Night', emoji: '🌙' },
  '2026-04-17': { label: 'THE BIG DAY', emoji: '🔥' },
  '2026-04-18': { label: 'Final Pickup Day', emoji: '✅' },
  '2026-04-19': { label: 'Coming Home!', emoji: '🏠' },
};

function EventCard({ event, isExpanded, onToggle }: { 
  event: TripEvent; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const typeColors = {
    flight: 'border-l-primary bg-primary/5',
    conference: 'border-l-secondary bg-secondary/5',
    work: 'border-l-accent bg-accent/5',
    drive: 'border-l-chart-4 bg-chart-4/5',
    milestone: 'border-l-chart-2 bg-chart-2/5',
  };

  return (
    <div
      className={cn(
        'relative border-l-4 rounded-r-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02]',
        typeColors[event.type],
        isExpanded && 'ring-2 ring-primary/50'
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">{event.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {event.time && (
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {event.time}
                {event.endTime && ` - ${event.endTime}`}
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg text-foreground mt-1">{event.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
          <p className="text-xs text-muted-foreground mt-2 font-mono">📍 {event.location}</p>
          
          {/* Expanded details */}
          {isExpanded && event.details && (
            <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Details for Mom:</p>
              <ul className="space-y-1">
                {event.details.map((detail, i) => (
                  <li key={i} className="text-sm text-foreground flex items-center gap-2">
                    <span className="text-primary">→</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="text-muted-foreground text-sm">
          {event.details && (isExpanded ? '▲' : '▼')}
        </div>
      </div>
    </div>
  );
}

export function TripTimeline() {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Group events by date
  const eventsByDate = tripEvents.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, TripEvent[]>);

  const dates = Object.keys(eventsByDate).sort();
  const filteredDates = selectedDay ? [selectedDay] : dates;

  return (
    <div className="space-y-6">
      {/* Day filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedDay(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-mono transition-all',
            !selectedDay
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          All Days
        </button>
        {dates.map(date => (
          <button
            key={date}
            onClick={() => setSelectedDay(selectedDay === date ? null : date)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1',
              selectedDay === date
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <span>{dayThemes[date]?.emoji}</span>
            <span className="hidden sm:inline">{dateLabels[date]?.split(',')[0]}</span>
            <span className="sm:hidden">{date.split('-')[2]}</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {filteredDates.map((date, dateIndex) => (
          <div key={date} className="mb-8 last:mb-0">
            {/* Date header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{dayThemes[date]?.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{dateLabels[date]}</h2>
                  <p className="text-sm text-primary font-mono">{dayThemes[date]?.label}</p>
                </div>
              </div>
            </div>

            {/* Events for this date */}
            <div className="relative pl-4 md:pl-8">
              {/* Vertical timeline line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {eventsByDate[date].map((event, eventIndex) => (
                  <div key={event.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-4 md:-left-8 top-6 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    
                    <EventCard
                      event={event}
                      isExpanded={expandedEvent === event.id}
                      onToggle={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
