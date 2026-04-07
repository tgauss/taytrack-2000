'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { TayHeader } from '@/components/tay-header';
import { CountdownTimer } from '@/components/countdown-timer';
import { TripStats } from '@/components/trip-stats';
import { TripTimeline } from '@/components/trip-timeline';
import { FunFacts } from '@/components/fun-facts';
import { QuickInfo } from '@/components/quick-info';

// Dynamically import the map to avoid SSR issues with Mapbox
const TripMap = dynamic(
  () => import('@/components/trip-map').then((mod) => mod.TripMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] md:h-[500px] rounded-2xl bg-card border-2 border-primary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-2">🛰️</div>
          <p className="text-muted-foreground font-mono text-sm">Loading satellite view...</p>
        </div>
      </div>
    )
  }
);

const TripGlobe3D = dynamic(
  () => import('@/components/trip-globe-3d').then((mod) => mod.TripGlobe3D),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] md:h-[600px] rounded-2xl bg-card border-2 border-primary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-2">🌍</div>
          <p className="text-muted-foreground font-mono text-sm">Loading 3D Mission View...</p>
        </div>
      </div>
    )
  }
);

type TabId = 'overview' | 'timeline' | 'map' | '3d' | 'info';

export default function TayTrack2000() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string; emoji: string }[] = [
    { id: 'overview', label: 'Overview', emoji: '🏠' },
    { id: 'timeline', label: 'Timeline', emoji: '📅' },
    { id: 'map', label: 'Map', emoji: '🗺️' },
    { id: '3d', label: '3D Globe', emoji: '🌍' },
    { id: 'info', label: 'Details', emoji: '📋' },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,170,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,170,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 pb-24">
        {/* Header */}
        <TayHeader />

        {/* Game Mode Banner */}
        <Link href="/game">
          <div className="mb-6 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Gamepad2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary-foreground">
                    Play Adventure Mode!
                  </h2>
                  <p className="text-sm text-primary-foreground/80">
                    For the kids - follow Dad&apos;s journey with games and badges!
                  </p>
                </div>
              </div>
              <div className="text-3xl group-hover:scale-125 transition-transform">
                🎮
              </div>
            </div>
          </div>
        </Link>

        {/* Countdown timers */}
        <section className="mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
              <CountdownTimer
                targetDate="2026-04-12T07:18:00"
                label="Until Dad Leaves"
                completedLabel="Dad has departed! 🛫"
              />
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
              <CountdownTimer
                targetDate="2026-04-19T20:25:00"
                label="Until Dad Returns"
                completedLabel="Dad is home! 🏠"
              />
            </div>
          </div>
        </section>

        {/* Navigation tabs */}
        <nav className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg py-3 mb-6 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Tab content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Trip Stats */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>📊</span> Trip Stats
                </h2>
                <TripStats />
              </section>

              {/* Map preview */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>🛰️</span> Mission Route
                </h2>
                <TripMap />
              </section>

              {/* Fun Facts */}
              <section>
                <FunFacts />
              </section>

              {/* Quick Timeline Preview */}
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>⚡</span> Quick Summary
                </h2>
                <div className="grid gap-3">
                  {[
                    { date: 'Apr 12', event: 'Dad flies from PDX to Tulsa! ✈️', type: 'flight' },
                    { date: 'Apr 13-15', event: 'Main Street Conference 🎭', type: 'conference' },
                    { date: 'Apr 15', event: 'Road trip to Nebraska! 🚗', type: 'drive' },
                    { date: 'Apr 16-18', event: 'Rare Goods Pickup Event 📦', type: 'work' },
                    { date: 'Apr 19', event: 'Dad comes HOME! 🏠', type: 'milestone' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded w-20 text-center">
                        {item.date}
                      </div>
                      <div className="flex-1 font-medium text-foreground">{item.event}</div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <span>📅</span> Full Trip Timeline
              </h2>
              <TripTimeline />
            </section>
          )}

          {/* Map Tab */}
          {activeTab === 'map' && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span>🗺️</span> Interactive Mission Map
              </h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Click on the markers to see what Dad is doing at each location! Use the buttons to zoom to different cities.
              </p>
              <TripMap />
              
              {/* Legend */}
              <div className="mt-4 bg-card border border-border rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-3 text-sm">Map Legend</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span>🏠</span>
                    <span className="text-muted-foreground">Vancouver, WA (Home)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>☕</span>
                    <span className="text-muted-foreground">Seattle (Layover)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🤠</span>
                    <span className="text-muted-foreground">Tulsa (Conference)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🌽</span>
                    <span className="text-muted-foreground">Lincoln</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📦</span>
                    <span className="text-muted-foreground">Roca (Warehouse)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🥩</span>
                    <span className="text-muted-foreground">Omaha (Return)</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3D Globe Tab */}
          {activeTab === '3d' && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span>🌍</span> 3D Mission Globe
              </h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Watch Dad&apos;s adventure around the globe! Press play to see the journey, or drag to spin the Earth. Click on any city marker for details.
              </p>
              <TripGlobe3D />
              
              <div className="mt-4 bg-card border border-border rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-3 text-sm">Controls</h3>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">Drag</span>
                    <span>Rotate the globe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">Scroll</span>
                    <span>Zoom in/out</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">Click marker</span>
                    <span>Jump to location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">Play button</span>
                    <span>Animate the trip!</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span>📋</span> Details for Mom
              </h2>
              <p className="text-muted-foreground mb-6 text-sm">
                All the important information in one place. Tap each section for more details!
              </p>
              <QuickInfo />
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center py-8 border-t border-border">
          <p className="text-4xl mb-4">💕</p>
          <p className="text-muted-foreground text-sm">
            Made with love for the family
          </p>
          <p className="text-xs text-muted-foreground/50 mt-2 font-mono">
            TayTrack 2000 v1.0 • Mission Duration: April 12-19, 2026
          </p>
        </footer>
      </div>

      {/* Floating home button on mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/25 flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        >
          ⬆️
        </button>
      </div>
    </main>
  );
}
