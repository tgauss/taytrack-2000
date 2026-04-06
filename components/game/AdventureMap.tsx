'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, getNextLocation, getSegmentType, type GameLocation } from '@/lib/game-state';
import { soundManager } from '@/lib/sounds';
import { ProgressCaterpillar } from './ProgressCaterpillar';
import { SleepsCounter } from './SleepsCounter';

mapboxgl.accessToken = 'pk.eyJ1IjoidGdhdXNzIiwiYSI6ImUxelFyZWsifQ.ewANL0BvfdZa9RRcOIQSVA';

// Real coordinates for each location
const LOCATIONS: Record<string, { name: string; lng: number; lat: number; emoji: string; color: string }> = {
  vancouver: { name: 'Vancouver', lng: -122.6587, lat: 45.6387, emoji: '🏠', color: '#4ade80' },
  seattle: { name: 'Seattle', lng: -122.3321, lat: 47.6062, emoji: '☕', color: '#60a5fa' },
  tulsa: { name: 'Tulsa', lng: -95.9928, lat: 36.1540, emoji: '🤠', color: '#f97316' },
  lincoln: { name: 'Lincoln', lng: -96.6852, lat: 40.8136, emoji: '🌽', color: '#eab308' },
  roca: { name: 'Roca', lng: -96.6653, lat: 40.6481, emoji: '📦', color: '#a855f7' },
  omaha: { name: 'Omaha', lng: -95.9345, lat: 41.2565, emoji: '✈️', color: '#ec4899' },
  'vancouver-return': { name: 'Home!', lng: -122.6587, lat: 45.6387, emoji: '🎉', color: '#4ade80' },
};

// Route segments
const ROUTE_SEGMENTS = [
  { from: 'vancouver', to: 'seattle', type: 'flight' },
  { from: 'seattle', to: 'tulsa', type: 'flight' },
  { from: 'tulsa', to: 'lincoln', type: 'drive' },
  { from: 'lincoln', to: 'roca', type: 'drive' },
  { from: 'roca', to: 'omaha', type: 'drive' },
  { from: 'omaha', to: 'seattle', type: 'flight' },
  { from: 'seattle', to: 'vancouver-return', type: 'flight' },
];

interface AdventureMapProps {
  onCityTap: (cityId: string) => void;
}

export function AdventureMap({ onCityTap }: AdventureMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const mapInitialized = useRef(false);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const {
    currentLocation,
    visitedLocations,
    isAnimating,
    isMuted,
    moveToLocation,
    setAnimating,
    earnBadge,
    showAchievement
  } = useGameStore();

  // Sync sound manager with mute state
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInitialized.current) return;
    mapInitialized.current = true;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-105, 40],
      zoom: 3.8,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;
      setMapLoaded(true);

      // Add 3D terrain
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Add sky
      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });

      // Add route lines
      const flightCoords: [number, number][][] = [];
      const driveCoords: [number, number][][] = [];

      ROUTE_SEGMENTS.forEach(seg => {
        const fromKey = seg.from === 'vancouver-return' ? 'vancouver' : seg.from;
        const toKey = seg.to === 'vancouver-return' ? 'vancouver' : seg.to;
        const from = LOCATIONS[fromKey];
        const to = LOCATIONS[toKey];
        if (!from || !to) return;

        const coords: [number, number][] = [[from.lng, from.lat], [to.lng, to.lat]];
        if (seg.type === 'flight') {
          flightCoords.push(coords);
        } else {
          driveCoords.push(coords);
        }
      });

      // Flight routes (curved arcs)
      flightCoords.forEach((coords, i) => {
        const arcCoords = generateArc(coords[0], coords[1], 50);
        map.current!.addSource(`flight-route-${i}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: arcCoords,
            },
          },
        });

        map.current!.addLayer({
          id: `flight-route-line-${i}`,
          type: 'line',
          source: `flight-route-${i}`,
          paint: {
            'line-color': '#00d4ff',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });
      });

      // Drive routes (straight lines)
      driveCoords.forEach((coords, i) => {
        map.current!.addSource(`drive-route-${i}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
          },
        });

        map.current!.addLayer({
          id: `drive-route-line-${i}`,
          type: 'line',
          source: `drive-route-${i}`,
          paint: {
            'line-color': '#ffd93d',
            'line-width': 4,
            'line-opacity': 0.8,
            'line-dasharray': [2, 1],
          },
        });
      });

      // Add city markers
      Object.entries(LOCATIONS).forEach(([id, loc]) => {
        if (id === 'vancouver-return') return;

        const el = document.createElement('div');
        el.className = 'city-marker';
        el.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transform: translate(-50%, -100%);
          ">
            <div style="
              font-size: 36px;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
              transition: transform 0.2s;
            " class="marker-emoji">${loc.emoji}</div>
            <div style="
              background: ${loc.color};
              color: white;
              padding: 6px 14px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 14px;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              margin-top: -4px;
            ">${loc.name}</div>
          </div>
        `;

        el.addEventListener('click', () => {
          soundManager.tap();
          onCityTap(id);
        });

        el.addEventListener('mouseenter', () => {
          const emoji = el.querySelector('.marker-emoji') as HTMLElement;
          if (emoji) emoji.style.transform = 'scale(1.3)';
        });
        el.addEventListener('mouseleave', () => {
          const emoji = el.querySelector('.marker-emoji') as HTMLElement;
          if (emoji) emoji.style.transform = 'scale(1)';
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map.current!);

        markersRef.current[id] = marker;
      });

      // Add vehicle marker
      const vehicleEl = document.createElement('div');
      vehicleEl.innerHTML = `
        <div style="
          font-size: 44px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
          animation: bounce 0.5s ease-in-out infinite alternate;
        ">✈️</div>
      `;
      vehicleEl.style.cssText = `transform: translate(-50%, -50%);`;

      vehicleMarkerRef.current = new mapboxgl.Marker({ element: vehicleEl })
        .setLngLat([LOCATIONS.vancouver.lng, LOCATIONS.vancouver.lat])
        .addTo(map.current);

      // Add bounce animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }
      `;
      document.head.appendChild(style);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      mapInitialized.current = false;
    };
  }, [onCityTap]);

  // Update vehicle position when location changes
  useEffect(() => {
    if (!vehicleMarkerRef.current) return;

    const locKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
    const loc = LOCATIONS[locKey];
    if (loc) {
      vehicleMarkerRef.current.setLngLat([loc.lng, loc.lat]);

      // Update vehicle emoji based on segment type
      const nextLoc = getNextLocation(currentLocation);
      if (nextLoc) {
        const segType = getSegmentType(currentLocation, nextLoc);
        const el = vehicleMarkerRef.current.getElement();
        const div = el.querySelector('div');
        if (div) {
          div.innerHTML = segType === 'flight' ? '✈️' : '🚗';
        }
      }
    }
  }, [currentLocation]);

  // Animate vehicle along route
  const animateVehicle = useCallback((
    fromLoc: { lng: number; lat: number },
    toLoc: { lng: number; lat: number },
    type: 'flight' | 'drive',
    onComplete: () => void
  ) => {
    if (!vehicleMarkerRef.current || !map.current) return;

    const duration = type === 'flight' ? 3000 : 2000;
    const startTime = performance.now();

    // Generate path points
    const points = type === 'flight'
      ? generateArc([fromLoc.lng, fromLoc.lat], [toLoc.lng, toLoc.lat], 50)
      : [[fromLoc.lng, fromLoc.lat], [toLoc.lng, toLoc.lat]];

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolate position along path
      let currentPos: [number, number];
      if (type === 'flight') {
        const idx = Math.floor(eased * (points.length - 1));
        const nextIdx = Math.min(idx + 1, points.length - 1);
        const t = (eased * (points.length - 1)) - idx;
        currentPos = [
          points[idx][0] + (points[nextIdx][0] - points[idx][0]) * t,
          points[idx][1] + (points[nextIdx][1] - points[idx][1]) * t,
        ];
      } else {
        currentPos = [
          fromLoc.lng + (toLoc.lng - fromLoc.lng) * eased,
          fromLoc.lat + (toLoc.lat - fromLoc.lat) * eased,
        ];
      }

      vehicleMarkerRef.current?.setLngLat(currentPos);

      // Move camera to follow
      if (progress < 0.1 || progress > 0.9) {
        map.current?.easeTo({
          center: currentPos,
          duration: 100,
        });
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const handleGoNext = useCallback(() => {
    if (isAnimating || !map.current) return;

    const nextLocation = getNextLocation(currentLocation);
    if (!nextLocation) return;

    const segmentType = getSegmentType(currentLocation, nextLocation) || 'drive';

    // Update vehicle emoji
    if (vehicleMarkerRef.current) {
      const el = vehicleMarkerRef.current.getElement();
      const div = el.querySelector('div');
      if (div) {
        div.innerHTML = segmentType === 'flight' ? '✈️' : '🚗';
      }
    }

    // Play sound
    if (segmentType === 'flight') {
      soundManager.whoosh();
    } else {
      soundManager.vroom();
    }

    setAnimating(true);
    setIsMoving(true);

    const fromKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
    const toKey = nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation;
    const fromLoc = LOCATIONS[fromKey];
    const toLoc = LOCATIONS[toKey];

    if (!fromLoc || !toLoc) return;

    // Fly to route overview first
    const bounds = new mapboxgl.LngLatBounds()
      .extend([fromLoc.lng, fromLoc.lat])
      .extend([toLoc.lng, toLoc.lat]);

    map.current.fitBounds(bounds, {
      padding: 100,
      pitch: 60,
      duration: 1000,
    });

    setTimeout(() => {
      animateVehicle(fromLoc, toLoc, segmentType, () => {
        setIsMoving(false);
        setAnimating(false);
        moveToLocation(nextLocation);
        soundManager.arrive();

        // Fly to destination
        map.current?.flyTo({
          center: [toLoc.lng, toLoc.lat],
          zoom: 8,
          pitch: 60,
          duration: 1500,
        });

        // Award achievements based on location
        if (nextLocation === 'seattle') {
          earnBadge('wheels-up');
          earnBadge('coffee-break');
          setTimeout(() => showAchievement('wheels-up'), 500);
        } else if (nextLocation === 'tulsa') {
          earnBadge('howdy-partner');
          setTimeout(() => showAchievement('howdy-partner'), 500);
        } else if (nextLocation === 'lincoln') {
          earnBadge('conference-champ');
          earnBadge('road-tripper');
          earnBadge('cornhusker');
          setTimeout(() => showAchievement('cornhusker'), 500);
        } else if (nextLocation === 'roca') {
          earnBadge('packing-pro');
          setTimeout(() => showAchievement('packing-pro'), 500);
        } else if (nextLocation === 'omaha') {
          earnBadge('omaha-explorer');
          setTimeout(() => showAchievement('omaha-explorer'), 500);
        } else if (nextLocation === 'vancouver-return') {
          earnBadge('home-sweet-home');
          earnBadge('super-tracker');
          setTimeout(() => showAchievement('home-sweet-home'), 500);
        }
      });
    }, 1000);
  }, [currentLocation, isAnimating, moveToLocation, setAnimating, earnBadge, showAchievement, animateVehicle]);

  const nextLocation = getNextLocation(currentLocation);
  const isJourneyComplete = currentLocation === 'vancouver-return';

  // Calculate distance from home
  const currentLocKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
  const currentLocData = LOCATIONS[currentLocKey];
  const homeData = LOCATIONS.vancouver;
  const distanceFromHome = currentLocData && homeData
    ? Math.round(getDistanceMiles(homeData.lat, homeData.lng, currentLocData.lat, currentLocData.lng))
    : 0;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-background flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-6xl"
          >
            🌍
          </motion.div>
          <p className="text-muted-foreground mt-4 font-mono text-sm">Loading map...</p>
        </div>
      )}

      {/* Distance from home badge */}
      {mapLoaded && distanceFromHome > 0 && !isJourneyComplete && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-20 left-4 z-20 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20"
        >
          <div className="text-xs font-bold text-white/80 mb-1">FROM HOME</div>
          <div className="text-xl font-bold text-cyan-400 font-mono">
            {distanceFromHome.toLocaleString()} mi
          </div>
        </motion.div>
      )}

      {/* Sleeps counter */}
      <SleepsCounter />

      {/* GO Button */}
      {!isJourneyComplete && nextLocation && mapLoaded && (
        <motion.button
          onClick={handleGoNext}
          disabled={isAnimating}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 px-10 py-5 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-3xl rounded-full shadow-2xl disabled:opacity-50 z-20 touch-manipulation"
          style={{ minWidth: 200, minHeight: 64 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isAnimating
              ? '0 0 20px rgba(0,212,170,0.3)'
              : ['0 0 30px rgba(0,212,170,0.4)', '0 0 60px rgba(0,212,170,0.7)', '0 0 30px rgba(0,212,170,0.4)'],
          }}
          transition={{
            boxShadow: { duration: 1.5, repeat: Infinity },
          }}
        >
          {isAnimating ? (
            <span className="flex items-center gap-3">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                {(getSegmentType(currentLocation, nextLocation) || 'drive') === 'flight' ? '✈️' : '🚗'}
              </motion.span>
              Traveling...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              GO! <span className="text-4xl">👆</span>
            </span>
          )}
        </motion.button>
      )}

      {/* Journey Complete Message */}
      <AnimatePresence>
        {isJourneyComplete && mapLoaded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 px-10 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-bold text-2xl rounded-full shadow-2xl z-20 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🎉 Dad is HOME! 🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Caterpillar */}
      <ProgressCaterpillar />

      {/* Legend */}
      <div className="absolute top-20 right-4 z-20 bg-black/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="text-xs font-bold text-white/80 mb-2">ROUTE KEY</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-[#00d4ff] rounded" />
            <span className="text-white text-sm">✈️ Flying</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0 border-t-2 border-dashed border-[#ffd93d]" />
            <span className="text-white text-sm">🚗 Driving</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate arc points between two coordinates for flight paths
function generateArc(start: [number, number], end: [number, number], numPoints: number): [number, number][] {
  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;

    // Add arc height based on distance
    const distance = Math.sqrt(
      Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
    );
    const arcHeight = distance * 0.15;
    const heightOffset = Math.sin(t * Math.PI) * arcHeight;

    points.push([lng, lat + heightOffset]);
  }

  return points;
}

// Haversine formula for distance in miles
function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
