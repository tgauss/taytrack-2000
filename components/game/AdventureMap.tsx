'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, getNextLocation, getSegmentType, type GameLocation } from '@/lib/game-state';
import { soundManager } from '@/lib/sounds';
import { getPOIsForCity, getDriveRoute, type POI } from '@/lib/poi-data';
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

// Route segments for visual rendering
const ROUTE_SEGMENTS = [
  { from: 'vancouver', to: 'seattle', type: 'flight' },
  { from: 'seattle', to: 'tulsa', type: 'flight' },
  { from: 'tulsa', to: 'lincoln', type: 'drive' },
  { from: 'lincoln', to: 'roca', type: 'drive' },
  { from: 'roca', to: 'omaha', type: 'drive' },
  { from: 'omaha', to: 'seattle', type: 'flight' },
  { from: 'seattle', to: 'vancouver-return', type: 'flight' },
];

// Camera presets
const ARRIVAL_ZOOM = 15.5;
const ARRIVAL_PITCH = 62;
const FLIGHT_OVERVIEW_ZOOM = 3.5;
const DRIVE_FOLLOW_ZOOM = 10;

type ExplorationPhase = 'idle' | 'traveling' | 'arrived' | 'exploring' | 'ready';

interface AdventureMapProps {
  onCityTap: (cityId: string) => void;
  onPOITap?: (poi: POI) => void;
  onMapReady?: (controls: { flyBackToCity: () => void }) => void;
}

export function AdventureMap({ onCityTap, onPOITap, onMapReady }: AdventureMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const poiMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const waypointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const mapInitialized = useRef(false);
  const orbitAnimRef = useRef<number | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [phase, setPhase] = useState<ExplorationPhase>('idle');
  const [welcomeCity, setWelcomeCity] = useState<string | null>(null);

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

  // ---- POI MARKER MANAGEMENT ----

  const removePOIMarkers = useCallback(() => {
    poiMarkersRef.current.forEach(m => m.remove());
    poiMarkersRef.current = [];
  }, []);

  const removeWaypointMarkers = useCallback(() => {
    waypointMarkersRef.current.forEach(m => m.remove());
    waypointMarkersRef.current = [];
  }, []);

  const addPOIMarkers = useCallback((cityId: string) => {
    if (!map.current) return;
    removePOIMarkers();

    const pois = getPOIsForCity(cityId);
    pois.forEach((poi, i) => {
      const el = document.createElement('div');
      el.className = 'poi-marker';
      el.style.cssText = `
        cursor: pointer;
        opacity: 0;
        animation: poiFadeIn 0.3s ease forwards;
        animation-delay: ${i * 0.15}s;
      `;
      el.innerHTML = `
        <div style="
          display: flex; flex-direction: column; align-items: center; gap: 2px;
        ">
          <div class="poi-icon" style="
            width: 48px; height: 48px;
            background: rgba(0,0,0,0.8);
            border: 3px solid ${poi.color};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px;
            box-shadow: 0 0 12px ${poi.color}66, 0 2px 8px rgba(0,0,0,0.5);
            transition: transform 0.2s, box-shadow 0.2s;
          ">${poi.emoji}</div>
          <div style="
            background: rgba(0,0,0,0.85);
            color: ${poi.color};
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
            border: 1px solid ${poi.color}44;
          ">${poi.name}</div>
        </div>
      `;

      el.addEventListener('click', () => {
        soundManager.tap();
        stopOrbit();
        // Fly camera to this POI
        const zoomTo = poi.zoomLevel || 16.5;
        map.current?.flyTo({
          center: poi.lngLat,
          zoom: zoomTo,
          pitch: 65,
          bearing: Math.random() * 40 - 20,
          duration: 1500,
          curve: 1.2,
        });
        // Notify parent to show the landmark explorer
        onPOITap?.(poi);
      });

      el.addEventListener('mouseenter', () => {
        const inner = el.querySelector('.poi-icon') as HTMLElement;
        if (inner) {
          inner.style.transform = 'scale(1.25)';
          inner.style.boxShadow = `0 0 20px ${poi.color}aa, 0 4px 12px rgba(0,0,0,0.5)`;
        }
      });
      el.addEventListener('mouseleave', () => {
        const inner = el.querySelector('.poi-icon') as HTMLElement;
        if (inner) {
          inner.style.transform = 'scale(1)';
          inner.style.boxShadow = `0 0 12px ${poi.color}66, 0 2px 8px rgba(0,0,0,0.5)`;
        }
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(poi.lngLat)
        .addTo(map.current!);

      poiMarkersRef.current.push(marker);
    });
  }, [removePOIMarkers, onPOITap, stopOrbit]);

  const addDriveWaypointMarkers = useCallback((from: string, to: string) => {
    if (!map.current) return;
    removeWaypointMarkers();

    const route = getDriveRoute(from, to);
    if (!route || route.interestPoints.length === 0) return;

    route.interestPoints.forEach((wp) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          display: flex; flex-direction: column; align-items: center;
          cursor: pointer;
        ">
          <div style="
            width: 32px; height: 32px;
            background: rgba(0,0,0,0.8);
            border: 2px solid #ffd93d;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ">${wp.emoji}</div>
          <div style="
            background: rgba(0,0,0,0.8);
            color: #ffd93d;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
            margin-top: 2px;
          ">${wp.name}</div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '260px',
        className: 'poi-popup',
      }).setHTML(`
        <div style="font-family: 'Space Grotesk', sans-serif; padding: 4px;">
          <div style="font-size: 24px; text-align: center; margin-bottom: 4px;">${wp.emoji}</div>
          <div style="font-weight: bold; font-size: 14px; text-align: center; margin-bottom: 6px; color: #ffd93d;">${wp.name}</div>
          <div style="font-size: 13px; line-height: 1.4; color: #d1d5db;">${wp.funFact}</div>
        </div>
      `);

      el.addEventListener('click', () => soundManager.tap());

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(wp.lngLat)
        .setPopup(popup)
        .addTo(map.current!);

      waypointMarkersRef.current.push(marker);
    });
  }, [removeWaypointMarkers]);

  // ---- AUTO-ORBIT CAMERA (video game idle feel) ----

  const startOrbit = useCallback(() => {
    if (!map.current) return;
    stopOrbit();
    let bearing = map.current.getBearing();
    const spin = () => {
      if (!map.current) return;
      bearing += 0.15; // slow rotation
      map.current.easeTo({ bearing, duration: 50, easing: (t) => t });
      orbitAnimRef.current = requestAnimationFrame(spin);
    };
    orbitAnimRef.current = requestAnimationFrame(spin);
  }, []);

  const stopOrbit = useCallback(() => {
    if (orbitAnimRef.current) {
      cancelAnimationFrame(orbitAnimRef.current);
      orbitAnimRef.current = null;
    }
  }, []);

  // Start orbit when exploring, stop when traveling
  useEffect(() => {
    if (phase === 'exploring' || phase === 'ready' || phase === 'idle') {
      const timer = setTimeout(startOrbit, 1000);
      return () => { clearTimeout(timer); stopOrbit(); };
    } else {
      stopOrbit();
    }
  }, [phase, startOrbit, stopOrbit]);

  // Stop orbit when user interacts with map
  useEffect(() => {
    if (!map.current) return;
    const handleInteraction = () => stopOrbit();
    map.current.on('mousedown', handleInteraction);
    map.current.on('touchstart', handleInteraction);
    return () => {
      map.current?.off('mousedown', handleInteraction);
      map.current?.off('touchstart', handleInteraction);
    };
  }, [mapLoaded, stopOrbit]);

  // ---- MAP INITIALIZATION ----

  useEffect(() => {
    if (!mapContainer.current || mapInitialized.current) return;
    mapInitialized.current = true;

    // Start at current location street-level
    const startLocKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
    const startLoc = LOCATIONS[startLocKey] || LOCATIONS.vancouver;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [startLoc.lng, startLoc.lat],
      zoom: ARRIVAL_ZOOM,
      pitch: ARRIVAL_PITCH,
      bearing: 0,
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

      // Add 3D buildings layer
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout
      )?.id;

      map.current.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 12,
          paint: {
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['get', 'height'],
              0, '#1a1a3e',
              50, '#2a2a5e',
              100, '#3a3a7e',
              200, '#4a4a9e',
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.85,
          },
        },
        labelLayerId
      );

      // Add vehicle trail source (empty, filled during animation)
      map.current.addSource('vehicle-trail', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      map.current.addLayer({
        id: 'vehicle-trail-glow',
        type: 'line',
        source: 'vehicle-trail',
        paint: { 'line-color': '#00d4ff', 'line-width': 8, 'line-blur': 6, 'line-opacity': 0.5 },
      });
      map.current.addLayer({
        id: 'vehicle-trail-line',
        type: 'line',
        source: 'vehicle-trail',
        paint: { 'line-color': '#00d4ff', 'line-width': 3, 'line-opacity': 0.9 },
      });

      // Draw all route lines (faint background)
      const flightCoords: [number, number][][] = [];
      const driveCoords: [number, number][][] = [];

      ROUTE_SEGMENTS.forEach(seg => {
        const fromKey = seg.from === 'vancouver-return' ? 'vancouver' : seg.from;
        const toKey = seg.to === 'vancouver-return' ? 'vancouver' : seg.to;
        const from = LOCATIONS[fromKey];
        const to = LOCATIONS[toKey];
        if (!from || !to) return;

        if (seg.type === 'flight') {
          flightCoords.push(generateArc([from.lng, from.lat], [to.lng, to.lat], 50));
        } else {
          const driveRoute = getDriveRoute(seg.from, seg.to);
          driveCoords.push(driveRoute ? driveRoute.coordinates : [[from.lng, from.lat], [to.lng, to.lat]]);
        }
      });

      flightCoords.forEach((coords, i) => {
        map.current!.addSource(`flight-route-${i}`, {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.current!.addLayer({
          id: `flight-route-line-${i}`,
          type: 'line',
          source: `flight-route-${i}`,
          paint: { 'line-color': '#00d4ff', 'line-width': 3, 'line-opacity': 0.3 },
        });
      });

      driveCoords.forEach((coords, i) => {
        map.current!.addSource(`drive-route-${i}`, {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.current!.addLayer({
          id: `drive-route-line-${i}`,
          type: 'line',
          source: `drive-route-${i}`,
          paint: { 'line-color': '#ffd93d', 'line-width': 3, 'line-opacity': 0.3, 'line-dasharray': [2, 1] },
        });
      });

      // Add city markers
      Object.entries(LOCATIONS).forEach(([id, loc]) => {
        if (id === 'vancouver-return') return;

        const el = document.createElement('div');
        el.className = 'city-marker';
        el.innerHTML = `
          <div style="
            display: flex; flex-direction: column; align-items: center;
            cursor: pointer; transform: translate(-50%, -100%);
          ">
            <div style="
              font-size: 36px;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
              transition: transform 0.2s;
            " class="marker-emoji">${loc.emoji}</div>
            <div style="
              background: ${loc.color}; color: white;
              padding: 6px 14px; border-radius: 20px;
              font-weight: bold; font-size: 14px; white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3); margin-top: -4px;
            ">${loc.name}</div>
          </div>
        `;

        el.addEventListener('click', () => { soundManager.tap(); onCityTap(id); });
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

      // Add vehicle marker with pulsing ring
      const vehicleEl = document.createElement('div');
      vehicleEl.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div class="vehicle-pulse-ring"></div>
          <div class="vehicle-emoji">✈️</div>
        </div>
      `;
      vehicleEl.style.cssText = 'transform: translate(-50%, -50%);';

      vehicleMarkerRef.current = new mapboxgl.Marker({ element: vehicleEl })
        .setLngLat([startLoc.lng, startLoc.lat])
        .addTo(map.current);

      // Inject CSS animations
      const style = document.createElement('style');
      style.textContent = `
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
        @keyframes poiFadeIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0.6; }
        }
        .vehicle-emoji {
          font-size: 48px;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6));
          animation: bounce 0.5s ease-in-out infinite alternate;
          position: relative;
          z-index: 2;
        }
        .vehicle-pulse-ring {
          position: absolute;
          width: 60px; height: 60px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,255,0.5) 0%, rgba(0,212,255,0) 70%);
          animation: pulseRing 1.5s ease-in-out infinite;
          z-index: 1;
        }
        .mapboxgl-popup-content {
          background: rgba(15, 15, 30, 0.95) !important;
          border-radius: 16px !important;
          padding: 12px !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .mapboxgl-popup-tip { border-top-color: rgba(15, 15, 30, 0.95) !important; }
        .mapboxgl-popup-close-button {
          color: white !important; font-size: 20px !important;
          right: 8px !important; top: 4px !important;
        }
      `;
      document.head.appendChild(style);

      // Show POIs for starting location
      const startCityId = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
      addPOIMarkers(startCityId);

      // Expose flyBackToCity to parent
      onMapReady?.({
        flyBackToCity: () => {
          // Read current location from the store at call time (not stale closure)
          try {
            const state = useGameStore.getState();
            const locKey = state.currentLocation === 'vancouver-return' ? 'vancouver' : state.currentLocation;
            const loc = LOCATIONS[locKey];
            if (loc && map.current) {
              map.current.flyTo({
                center: [loc.lng, loc.lat],
                zoom: ARRIVAL_ZOOM,
                pitch: ARRIVAL_PITCH,
                bearing: 0,
                duration: 1500,
              });
            }
          } catch {
            // Fallback: zoom out to show all
            map.current?.flyTo({ center: [-100, 40], zoom: 4, pitch: 30, duration: 1500 });
          }
        },
      });
    });

    return () => {
      stopOrbit();
      if (map.current) { map.current.remove(); map.current = null; }
      mapInitialized.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update vehicle position when location changes externally
  useEffect(() => {
    if (!vehicleMarkerRef.current || !mapLoaded) return;
    const locKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
    const loc = LOCATIONS[locKey];
    if (loc) {
      vehicleMarkerRef.current.setLngLat([loc.lng, loc.lat]);
      const nextLoc = getNextLocation(currentLocation);
      if (nextLoc) {
        const segType = getSegmentType(currentLocation, nextLoc);
        const el = vehicleMarkerRef.current.getElement();
        const emojiDiv = el.querySelector('.vehicle-emoji');
        if (emojiDiv) emojiDiv.innerHTML = segType === 'flight' ? '✈️' : '🚗';
      }
    }
  }, [currentLocation, mapLoaded]);

  // ---- ANIMATION ENGINE ----

  const animateVehicle = useCallback((
    path: [number, number][],
    type: 'flight' | 'drive',
    onComplete: () => void
  ) => {
    if (!vehicleMarkerRef.current || !map.current) return;

    // Duration proportional to path length
    const baseDuration = type === 'flight' ? 3000 : Math.min(6000, Math.max(2000, path.length * 15));
    const startTime = performance.now();
    const trailCoords: [number, number][] = [];

    // Set trail color
    const trailColor = type === 'flight' ? '#00d4ff' : '#ffd93d';
    map.current.setPaintProperty('vehicle-trail-glow', 'line-color', trailColor);
    map.current.setPaintProperty('vehicle-trail-line', 'line-color', trailColor);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / baseDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      // Interpolate along path
      const pathIndex = eased * (path.length - 1);
      const idx = Math.floor(pathIndex);
      const nextIdx = Math.min(idx + 1, path.length - 1);
      const t = pathIndex - idx;
      const currentPos: [number, number] = [
        path[idx][0] + (path[nextIdx][0] - path[idx][0]) * t,
        path[idx][1] + (path[nextIdx][1] - path[idx][1]) * t,
      ];

      vehicleMarkerRef.current?.setLngLat(currentPos);

      // Update trail
      trailCoords.push(currentPos);
      const trailSource = map.current?.getSource('vehicle-trail') as mapboxgl.GeoJSONSource;
      if (trailSource && trailCoords.length >= 2) {
        trailSource.setData({
          type: 'Feature', properties: {},
          geometry: { type: 'LineString', coordinates: trailCoords },
        });
      }

      // Camera behavior
      if (type === 'drive') {
        // Continuous follow for drives
        if (progress > 0.05 && progress < 0.95) {
          // Calculate bearing from travel direction
          const bearing = getBearing(path[idx][1], path[idx][0], path[nextIdx][1], path[nextIdx][0]);
          map.current?.easeTo({
            center: currentPos,
            zoom: DRIVE_FOLLOW_ZOOM,
            pitch: 50,
            bearing: bearing,
            duration: 200,
          });
        }
      } else {
        // Flights: only at start/end
        if (progress < 0.05 || progress > 0.95) {
          map.current?.easeTo({ center: currentPos, duration: 100 });
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, []);

  // ---- GO BUTTON HANDLER ----

  const handleGoNext = useCallback(() => {
    if (isAnimating || !map.current) return;

    const nextLocation = getNextLocation(currentLocation);
    if (!nextLocation) return;

    const segmentType = getSegmentType(currentLocation, nextLocation) || 'drive';

    // Update vehicle emoji
    if (vehicleMarkerRef.current) {
      const el = vehicleMarkerRef.current.getElement();
      const emojiDiv = el.querySelector('.vehicle-emoji');
      if (emojiDiv) emojiDiv.innerHTML = segmentType === 'flight' ? '✈️' : '🚗';
    }

    // Play sound
    if (segmentType === 'flight') soundManager.whoosh();
    else soundManager.vroom();

    setAnimating(true);
    setPhase('traveling');
    removePOIMarkers();
    removeWaypointMarkers();

    // Clear previous trail
    const trailSource = map.current.getSource('vehicle-trail') as mapboxgl.GeoJSONSource;
    if (trailSource) {
      trailSource.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
    }

    const fromKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
    const toKey = nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation;
    const fromLoc = LOCATIONS[fromKey];
    const toLoc = LOCATIONS[toKey];
    if (!fromLoc || !toLoc) return;

    if (segmentType === 'flight') {
      // FLIGHT: zoom out → animate arc → zoom into destination
      map.current.flyTo({
        center: [(fromLoc.lng + toLoc.lng) / 2, (fromLoc.lat + toLoc.lat) / 2],
        zoom: FLIGHT_OVERVIEW_ZOOM,
        pitch: 30,
        duration: 1500,
      });

      setTimeout(() => {
        const arcPath = generateArc([fromLoc.lng, fromLoc.lat], [toLoc.lng, toLoc.lat], 60);
        animateVehicle(arcPath, 'flight', () => {
          finishTravel(nextLocation, toLoc);
        });
      }, 1600);

    } else {
      // DRIVE: get road-following path, show waypoints, follow camera
      const driveRoute = getDriveRoute(fromKey, toKey);
      const drivePath = driveRoute ? driveRoute.coordinates : [[fromLoc.lng, fromLoc.lat] as [number, number], [toLoc.lng, toLoc.lat] as [number, number]];

      // Show drive interest points
      addDriveWaypointMarkers(fromKey, toKey);

      // Fit bounds to show the route
      const bounds = new mapboxgl.LngLatBounds();
      drivePath.forEach(coord => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 80, pitch: 45, duration: 1200 });

      setTimeout(() => {
        animateVehicle(drivePath, 'drive', () => {
          removeWaypointMarkers();
          finishTravel(nextLocation, toLoc);
        });
      }, 1300);
    }
  }, [currentLocation, isAnimating, setAnimating, removePOIMarkers, removeWaypointMarkers, addDriveWaypointMarkers, animateVehicle]);

  const finishTravel = useCallback((nextLocation: GameLocation, toLoc: { lng: number; lat: number }) => {
    setAnimating(false);
    moveToLocation(nextLocation);
    soundManager.arrive();
    setPhase('arrived');

    const cityName = LOCATIONS[nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation]?.name || '';
    setWelcomeCity(cityName);

    // Dramatic arrival: sweep in from an angle
    const arrivalBearing = Math.random() * 60 - 30; // random approach angle
    map.current?.flyTo({
      center: [toLoc.lng, toLoc.lat],
      zoom: ARRIVAL_ZOOM,
      pitch: ARRIVAL_PITCH,
      bearing: arrivalBearing,
      duration: 2500,
      curve: 1.5,
    });

    // Phase: exploring (show POIs)
    setTimeout(() => {
      setPhase('exploring');
      setWelcomeCity(null);
      const cityId = nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation;
      addPOIMarkers(cityId);
    }, 3000);

    // Phase: ready (show GO button again)
    setTimeout(() => {
      setPhase('ready');
    }, 6000);

    // Award achievements
    awardAchievements(nextLocation);
  }, [moveToLocation, setAnimating, addPOIMarkers]);

  const awardAchievements = (location: GameLocation) => {
    if (location === 'seattle') {
      earnBadge('wheels-up'); earnBadge('coffee-break');
      setTimeout(() => showAchievement('wheels-up'), 500);
    } else if (location === 'tulsa') {
      earnBadge('howdy-partner');
      setTimeout(() => showAchievement('howdy-partner'), 500);
    } else if (location === 'lincoln') {
      earnBadge('conference-champ'); earnBadge('road-tripper'); earnBadge('cornhusker');
      setTimeout(() => showAchievement('cornhusker'), 500);
    } else if (location === 'roca') {
      earnBadge('packing-pro');
      setTimeout(() => showAchievement('packing-pro'), 500);
    } else if (location === 'omaha') {
      earnBadge('omaha-explorer');
      setTimeout(() => showAchievement('omaha-explorer'), 500);
    } else if (location === 'vancouver-return') {
      earnBadge('home-sweet-home'); earnBadge('super-tracker');
      setTimeout(() => showAchievement('home-sweet-home'), 500);
    }
  };

  const nextLocation = getNextLocation(currentLocation);
  const isJourneyComplete = currentLocation === 'vancouver-return';
  const showGoButton = !isJourneyComplete && nextLocation && mapLoaded && (phase === 'idle' || phase === 'ready');
  const nextLocName = nextLocation ? LOCATIONS[nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation]?.name : '';

  // Distance from home
  const currentLocKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
  const currentLocData = LOCATIONS[currentLocKey];
  const homeData = LOCATIONS.vancouver;
  const distanceFromHome = currentLocData && homeData
    ? Math.round(getDistanceMiles(homeData.lat, homeData.lng, currentLocData.lat, currentLocData.lng))
    : 0;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-background flex flex-col items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-6xl">
            🌍
          </motion.div>
          <p className="text-muted-foreground mt-4 font-mono text-sm">Loading adventure map...</p>
        </div>
      )}

      {/* Welcome toast */}
      <AnimatePresence>
        {welcomeCity && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-sm text-white font-bold text-xl px-8 py-4 rounded-full shadow-2xl border border-white/20">
              🎉 Welcome to {welcomeCity}!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distance from home */}
      {mapLoaded && distanceFromHome > 0 && !isJourneyComplete && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-20 left-4 z-20 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20"
        >
          <div className="text-xs font-bold text-white/80 mb-1">FROM HOME</div>
          <div className="text-xl font-bold text-cyan-400 font-mono">{distanceFromHome.toLocaleString()} mi</div>
        </motion.div>
      )}

      {/* Sleeps counter */}
      <SleepsCounter />

      {/* GO Button */}
      <AnimatePresence>
        {showGoButton && (
          <motion.button
            key="go-button"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={handleGoNext}
            disabled={isAnimating}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 px-10 py-5 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-2xl rounded-full shadow-2xl disabled:opacity-50 z-20 touch-manipulation"
            style={{ minWidth: 220, minHeight: 64 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
          >
            <span className="flex items-center gap-3">
              GO to {nextLocName}! <span className="text-3xl">👆</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Traveling indicator */}
      <AnimatePresence>
        {phase === 'traveling' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 px-8 py-4 bg-card/80 backdrop-blur-sm text-foreground font-bold text-xl rounded-full shadow-2xl z-20 border border-border"
          >
            <span className="flex items-center gap-3">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                {(getSegmentType(currentLocation, nextLocation!) || 'drive') === 'flight' ? '✈️' : '🚗'}
              </motion.span>
              Traveling...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journey Complete */}
      <AnimatePresence>
        {isJourneyComplete && mapLoaded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 px-10 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-bold text-2xl rounded-full shadow-2xl z-20 text-center"
          >
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
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

// ---- UTILITY FUNCTIONS ----

function generateArc(start: [number, number], end: [number, number], numPoints: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    const distance = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
    const arcHeight = distance * 0.15;
    const heightOffset = Math.sin(t * Math.PI) * arcHeight;
    points.push([lng, lat + heightOffset]);
  }
  return points;
}

function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
