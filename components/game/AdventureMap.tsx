'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, getNextLocation, getSegmentType, type GameLocation } from '@/lib/game-state';
import { soundManager } from '@/lib/sounds';
import { playTravelAudio, playLocalAudio, stopElevenLabsSpeech } from '@/lib/voice';
import { getDriveRoute, AIRPORTS, getAirportToHotelRoute, getHomeToPDXRoute, type POI } from '@/lib/poi-data';
import { animateRoute, zoomInToRoute, FLIGHT_CONFIG, DRIVE_CONFIG, SHORT_DRIVE_CONFIG, AIRPORT_TO_HOTEL_CONFIG, SEGMENT_DURATIONS } from '@/lib/cinematic';
import { ProgressCaterpillar } from './ProgressCaterpillar';
import { SleepsCounter } from './SleepsCounter';

mapboxgl.accessToken = 'pk.eyJ1IjoidGdhdXNzIiwiYSI6ImUxelFyZWsifQ.ewANL0BvfdZa9RRcOIQSVA';

// Cartoon 3D models from Poly Pizza (CC-BY 3.0 / CC0)
const AIRPLANE_MODEL_URI = 'https://static.poly.pizza/b91d675e-8ebc-46e1-b739-80f5daba8515.glb'; // "Very Cute Airplane" by Akash Rudra
const TRUCK_MODEL_URI = 'https://static.poly.pizza/4e925a01-dbb8-4aab-848b-221306b835ea.glb'; // "Pickup Truck" by Quaternius (CC0)

// City centers — landmarkLng/Lat is where the camera should target on arrival
const LOCATIONS: Record<string, { name: string; lng: number; lat: number; emoji: string; color: string; landmarkLng?: number; landmarkLat?: number }> = {
  vancouver: { name: 'Home', lng: -122.5334, lat: 45.5976, emoji: '🏠', color: '#4ade80' }, // 13418 SE Silver Cir, Vancouver WA
  seattle: { name: 'Seattle', lng: -122.3321, lat: 47.6062, emoji: '☕', color: '#60a5fa', landmarkLng: -122.3493, landmarkLat: 47.6205 }, // Space Needle area
  tulsa: { name: 'Tulsa', lng: -95.9928, lat: 36.1540, emoji: '🤠', color: '#f97316', landmarkLng: -95.9934, landmarkLat: 36.1540 }, // Downtown Tulsa
  lincoln: { name: 'Lincoln', lng: -96.6852, lat: 40.8136, emoji: '🌽', color: '#eab308', landmarkLng: -96.6996, landmarkLat: 40.8088 }, // State Capitol
  roca: { name: 'Roca', lng: -96.6653, lat: 40.6481, emoji: '📦', color: '#a855f7' },
  omaha: { name: 'Omaha', lng: -95.9345, lat: 41.2565, emoji: '✈️', color: '#ec4899' },
  'vancouver-return': { name: 'Home!', lng: -122.6587, lat: 45.6387, emoji: '🎉', color: '#4ade80' },
};

// Flight segments use airport coordinates
const FLIGHT_ROUTES: Record<string, { from: [number, number]; to: [number, number] }> = {
  'vancouver-seattle': { from: AIRPORTS.pdx.lngLat, to: AIRPORTS.sea.lngLat },
  'seattle-tulsa': { from: AIRPORTS.sea.lngLat, to: AIRPORTS.tul.lngLat },
  'omaha-vancouver-return': { from: AIRPORTS.oma.lngLat, to: AIRPORTS.pdx.lngLat }, // OMA → SEA → PDX (shown as one arc)
};

// Camera presets
const ARRIVAL_ZOOM = 15.5;
const ARRIVAL_PITCH = 62;
const DRIVE_FOLLOW_ZOOM = 10;

type ExplorationPhase = 'idle' | 'traveling' | 'arrived' | 'exploring' | 'ready';

interface AdventureMapProps {
  onCityTap: (cityId: string) => void;
  onPOITap?: (poi: POI) => void;
  onMapReady?: (controls: { flyBackToCity: () => void; flyToPOI: (poi: POI) => void; flyToCity: (cityId: string) => void }) => void;
  hideGoButton?: boolean;
}

export function AdventureMap({ onCityTap, onPOITap, onMapReady, hideGoButton }: AdventureMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  // poiMarkersRef removed — CityExplorer bar handles POIs
  const waypointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const mapInitialized = useRef(false);
  const orbitAnimRef = useRef<number | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [phase, setPhase] = useState<ExplorationPhase>('idle');
  const [welcomeCity, setWelcomeCity] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState('init');
  const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=true');

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

  useEffect(() => { soundManager.setMuted(isMuted); }, [isMuted]);

  // ---- ORBIT CAMERA ----
  const stopOrbit = useCallback(() => {
    if (orbitAnimRef.current) { cancelAnimationFrame(orbitAnimRef.current); orbitAnimRef.current = null; }
  }, []);

  const startOrbit = useCallback(() => {
    if (!map.current) return;
    stopOrbit();
    let bearing = map.current.getBearing();
    const spin = () => {
      if (!map.current) return;
      bearing += 0.12;
      map.current.easeTo({ bearing, duration: 50, easing: (t) => t });
      orbitAnimRef.current = requestAnimationFrame(spin);
    };
    orbitAnimRef.current = requestAnimationFrame(spin);
  }, [stopOrbit]);

  // POI markers removed — CityExplorer bar handles all POI interaction now.
  // Map pins were unreliable (clustering at edges, viewport culling issues).

  const removeWaypointMarkers = useCallback(() => {
    waypointMarkersRef.current.forEach(m => m.remove());
    waypointMarkersRef.current = [];
  }, []);

  const addDriveWaypointMarkers = useCallback((from: string, to: string) => {
    if (!map.current) return;
    removeWaypointMarkers();
    const route = getDriveRoute(from, to);
    if (!route || !route.interestPoints.length) return;
    route.interestPoints.forEach(wp => {
      const el = document.createElement('div');
      el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="width:32px;height:32px;background:rgba(0,0,0,0.8);border:2px solid #ffd93d;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${wp.emoji}</div>
        <div style="background:rgba(0,0,0,0.8);color:#ffd93d;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;white-space:nowrap;margin-top:2px;">${wp.name}</div>
      </div>`;
      const popup = new mapboxgl.Popup({ offset: 20, closeButton: true, closeOnClick: false, maxWidth: '260px', className: 'poi-popup' })
        .setHTML(`<div style="font-family:'Space Grotesk',sans-serif;padding:4px;"><div style="font-size:24px;text-align:center;margin-bottom:4px;">${wp.emoji}</div><div style="font-weight:bold;font-size:14px;text-align:center;margin-bottom:6px;color:#ffd93d;">${wp.name}</div><div style="font-size:13px;line-height:1.4;color:#d1d5db;">${wp.funFact}</div></div>`);
      el.addEventListener('click', () => soundManager.tap());
      waypointMarkersRef.current.push(new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat(wp.lngLat).setPopup(popup).addTo(map.current!));
    });
  }, [removeWaypointMarkers]);

  // Orbit start/stop on phase change
  useEffect(() => {
    if (phase === 'exploring' || phase === 'ready' || phase === 'idle') {
      const t = setTimeout(startOrbit, 1500);
      return () => { clearTimeout(t); stopOrbit(); };
    } else { stopOrbit(); }
  }, [phase, startOrbit, stopOrbit]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const stop = () => stopOrbit();
    map.current.on('mousedown', stop);
    map.current.on('touchstart', stop);
    return () => { map.current?.off('mousedown', stop); map.current?.off('touchstart', stop); };
  }, [mapLoaded, stopOrbit]);

  // ---- MAP INITIALIZATION ----
  useEffect(() => {
    if (!mapContainer.current || mapInitialized.current) return;

    // Wait for container to have real dimensions before initializing map
    // (next/dynamic can mount the component before layout is complete on iPad)
    const rect = mapContainer.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('[TAYTRACK] Map container has zero dimensions, deferring init...');
      const retryTimer = setInterval(() => {
        if (!mapContainer.current) return;
        const r = mapContainer.current.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          clearInterval(retryTimer);
          mapInitialized.current = false; // Allow the effect to re-run
          // Force re-render to trigger the effect again
          setMapLoaded(prev => prev); // No-op state update to re-trigger
          // Directly initialize
          initMap();
        }
      }, 100);
      setTimeout(() => clearInterval(retryTimer), 10000); // Give up after 10s
      return () => clearInterval(retryTimer);
    }

    initMap();

    function initMap() {
      if (!mapContainer.current || mapInitialized.current) return;
      mapInitialized.current = true;

      const startLocKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
      const startLoc = LOCATIONS[startLocKey] || LOCATIONS.vancouver;

      // Start at HOME when fresh, otherwise at current city
      const isAtStart = currentLocation === 'vancouver';
      const initialCenter: [number, number] = isAtStart
        ? [LOCATIONS.vancouver.lng, LOCATIONS.vancouver.lat]
        : [startLoc.lng, startLoc.lat];

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/standard',
        center: initialCenter,
        zoom: isAtStart ? 16 : ARRIVAL_ZOOM,
        pitch: isAtStart ? 55 : ARRIVAL_PITCH,
        bearing: 0,
        antialias: true,
      });

      // Force resize after a delay — fixes iPad blank map issue
      setTimeout(() => { map.current?.resize(); }, 500);
      setTimeout(() => { map.current?.resize(); }, 1500);
      setTimeout(() => { map.current?.resize(); }, 3000);

    const onMapLoad = () => {
      if (!map.current) return;
      // Resize again when style loads — critical for iPad
      map.current.resize();
      setMapLoaded(true);

      // Dark theme for Standard style — keeps 3D buildings
      try {
        map.current.setConfigProperty('basemap', 'lightPreset', 'dark');
      } catch {}

      // Add 3D terrain (skip on mobile — can cause GPU issues)
      const isMobileDevice = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
      if (!isMobileDevice) {
        try {
          map.current.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
          map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        } catch {}
      }

      // 3D buildings are built into Standard style — no manual layer needed

      // Vehicle trail
      try {
        map.current.addSource('vehicle-trail', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } });
        map.current.addLayer({ id: 'vehicle-trail-glow', type: 'line', source: 'vehicle-trail', paint: { 'line-color': '#00d4ff', 'line-width': 8, 'line-blur': 6, 'line-opacity': 0.5 } });
        map.current.addLayer({ id: 'vehicle-trail-line', type: 'line', source: 'vehicle-trail', paint: { 'line-color': '#00d4ff', 'line-width': 3, 'line-opacity': 0.9 } });
      } catch {}

      // 3D vehicle models — skip on mobile (model layer not supported on all devices)
      if (!isMobile) try {
        // Airplane model (hidden by default, shown during flights)
        map.current.addSource('airplane-model', {
          type: 'model',
          models: {
            plane: {
              uri: AIRPLANE_MODEL_URI,
              position: initialCenter,
              orientation: [0, 0, 0],
            },
          },
        });
        map.current.addLayer({
          id: 'airplane-3d',
          type: 'model',
          source: 'airplane-model',
          slot: 'top',
          layout: { visibility: 'none' },
          paint: {
            'model-scale': [
              'interpolate', ['exponential', 0.5], ['zoom'],
              2.0, ['literal', [2000.0, 2000.0, 2000.0]],
              6.0, ['literal', [200.0, 200.0, 200.0]],
              10.0, ['literal', [20.0, 20.0, 20.0]],
              14.0, ['literal', [3.0, 3.0, 3.0]],
            ],
            'model-type': 'location-indicator',
            'model-opacity': 1.0,
            'model-translation': [0, 0, ['feature-state', 'z-elevation']],
          },
        });

        // Truck model (hidden by default, shown during drives)
        map.current.addSource('truck-model', {
          type: 'model',
          models: {
            truck: {
              uri: TRUCK_MODEL_URI,
              position: initialCenter,
              orientation: [0, 0, 0],
            },
          },
        });
        map.current.addLayer({
          id: 'truck-3d',
          type: 'model',
          source: 'truck-model',
          slot: 'top',
          layout: { visibility: 'none' },
          paint: {
            'model-scale': [
              'interpolate', ['exponential', 0.5], ['zoom'],
              6.0, ['literal', [100.0, 100.0, 100.0]],
              10.0, ['literal', [15.0, 15.0, 15.0]],
              14.0, ['literal', [3.0, 3.0, 3.0]],
            ],
            'model-type': 'location-indicator',
            'model-opacity': 1.0,
          },
        });
      } catch (e) {
        console.warn('[TAYTRACK] 3D model layers not supported:', e);
      }

      // Draw route lines
      try {
        // Flight arcs
        const flightSegments = [
          { from: AIRPORTS.pdx.lngLat, to: AIRPORTS.sea.lngLat },
          { from: AIRPORTS.sea.lngLat, to: AIRPORTS.tul.lngLat },
          { from: AIRPORTS.oma.lngLat, to: AIRPORTS.sea.lngLat },
          { from: AIRPORTS.sea.lngLat, to: AIRPORTS.pdx.lngLat },
        ];
        flightSegments.forEach((seg, i) => {
          const arc = generateArc(seg.from, seg.to, 60);
          map.current!.addSource(`flight-${i}`, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: arc } } });
          map.current!.addLayer({ id: `flight-line-${i}`, type: 'line', source: `flight-${i}`, paint: { 'line-color': '#00d4ff', 'line-width': 3, 'line-opacity': 0.25 } });
        });
        // Drive routes
        ['tulsa-lincoln', 'lincoln-roca', 'roca-omaha'].forEach((key, i) => {
          const route = getDriveRoute(key.split('-')[0], key.split('-')[1]);
          if (!route) return;
          map.current!.addSource(`drive-${i}`, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route.coordinates } } });
          map.current!.addLayer({ id: `drive-line-${i}`, type: 'line', source: `drive-${i}`, paint: { 'line-color': '#ffd93d', 'line-width': 3, 'line-opacity': 0.25, 'line-dasharray': [2, 1] } });
        });
      } catch {}

      // City markers
      Object.entries(LOCATIONS).forEach(([id, loc]) => {
        if (id === 'vancouver-return') return;
        const el = document.createElement('div');
        el.className = 'city-marker';
        el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transform:translate(-50%,-100%);">
          <div style="font-size:36px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));transition:transform 0.2s;" class="marker-emoji">${loc.emoji}</div>
          <div style="background:${loc.color};color:white;padding:6px 14px;border-radius:20px;font-weight:bold;font-size:14px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);margin-top:-4px;">${loc.name}</div>
        </div>`;
        el.addEventListener('click', () => { soundManager.tap(); onCityTap(id); });
        el.addEventListener('mouseenter', () => { const e = el.querySelector('.marker-emoji') as HTMLElement; if(e)e.style.transform='scale(1.3)'; });
        el.addEventListener('mouseleave', () => { const e = el.querySelector('.marker-emoji') as HTMLElement; if(e)e.style.transform='scale(1)'; });
        markersRef.current[id] = new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat([loc.lng, loc.lat]).addTo(map.current!);
      });

      // Vehicle marker
      const vehicleEl = document.createElement('div');
      vehicleEl.innerHTML = `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div class="vehicle-pulse-ring"></div>
        <div class="vehicle-emoji">${isAtStart ? '🚗' : '✈️'}</div>
      </div>`;
      vehicleEl.style.cssText = 'transform:translate(-50%,-50%);';
      vehicleMarkerRef.current = new mapboxgl.Marker({ element: vehicleEl }).setLngLat(initialCenter).addTo(map.current);

      // CSS
      const style = document.createElement('style');
      style.textContent = `
        @keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-8px)}}
        @keyframes poiFadeIn{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
        @keyframes pulseRing{0%{transform:scale(0.8);opacity:0.6}50%{transform:scale(1.8);opacity:0}100%{transform:scale(0.8);opacity:0.6}}
        .vehicle-emoji{font-size:48px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.6));animation:bounce 0.5s ease-in-out infinite alternate;position:relative;z-index:2;}
        .vehicle-pulse-ring{position:absolute;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,255,0.5) 0%,rgba(0,212,255,0) 70%);animation:pulseRing 1.5s ease-in-out infinite;z-index:1;}
        .mapboxgl-popup-content{background:rgba(15,15,30,0.95)!important;border-radius:16px!important;padding:12px!important;border:1px solid rgba(255,255,255,0.15)!important;box-shadow:0 8px 32px rgba(0,0,0,0.5)!important;}
        .mapboxgl-popup-tip{border-top-color:rgba(15,15,30,0.95)!important;}
        .mapboxgl-popup-close-button{color:white!important;font-size:20px!important;right:8px!important;top:4px!important;}
      `;
      document.head.appendChild(style);

      // POIs handled by CityExplorer bar — no map pins needed

      // Expose controls
      onMapReady?.({
        flyToPOI: (poi: POI) => {
          if (!map.current) return;
          stopOrbit();
          map.current.flyTo({ center: poi.lngLat, zoom: poi.zoomLevel || 16.5, pitch: 65, bearing: Math.random()*40-20, duration: 1500 });
        },
        flyBackToCity: () => {
          try {
            const state = useGameStore.getState();
            const locKey = state.currentLocation === 'vancouver-return' ? 'vancouver' : state.currentLocation;
            const loc = LOCATIONS[locKey];
            if (loc && map.current) map.current.flyTo({ center: [loc.landmarkLng || loc.lng, loc.landmarkLat || loc.lat], zoom: ARRIVAL_ZOOM, pitch: ARRIVAL_PITCH, bearing: 0, duration: 1500 });
          } catch { map.current?.flyTo({ center: [-100, 40], zoom: 4, pitch: 30, duration: 1500 }); }
        },
        flyToCity: (cityId: string) => {
          const loc = LOCATIONS[cityId === 'vancouver-return' ? 'vancouver' : cityId];
          if (loc && map.current) {
            stopOrbit();
            map.current.flyTo({ center: [loc.landmarkLng || loc.lng, loc.landmarkLat || loc.lat], zoom: ARRIVAL_ZOOM, pitch: ARRIVAL_PITCH, bearing: Math.random() * 40 - 20, duration: 2000 });
          }
        },
      });
    };

    if (map.current.isStyleLoaded()) onMapLoad();
    else map.current.on('style.load', onMapLoad);

    map.current.on('error', (e: unknown) => console.error('[TAYTRACK] Map error:', e));

    // Resize observer — catches iPad layout changes
    const resizeObs = new ResizeObserver(() => { map.current?.resize(); });
    if (mapContainer.current) resizeObs.observe(mapContainer.current);
    } // end initMap

    return () => { stopOrbit(); if (map.current) { map.current.remove(); map.current = null; } mapInitialized.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update vehicle on location change
  useEffect(() => {
    if (!vehicleMarkerRef.current || !mapLoaded) return;
    const locKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
    const loc = LOCATIONS[locKey];
    if (loc) {
      vehicleMarkerRef.current.setLngLat([loc.lng, loc.lat]);
      // Show car at home (first leg is drive to airport, not flight)
      const nextLoc = getNextLocation(currentLocation);
      if (nextLoc && currentLocation !== 'vancouver') {
        const segType = getSegmentType(currentLocation, nextLoc);
        const emojiDiv = vehicleMarkerRef.current.getElement().querySelector('.vehicle-emoji');
        if (emojiDiv) emojiDiv.innerHTML = segType === 'flight' ? '✈️' : '🚗';
      }
    }
  }, [currentLocation, mapLoaded]);

  // Active animation ref (to cancel on unmount)
  const activeAnimRef = useRef<{ cancel: () => void } | null>(null);

  // ---- GO HANDLER (Cinematic) ----
  const handleGoNext = useCallback(() => {
    if (isAnimating || !map.current) return;
    const nextLocation = getNextLocation(currentLocation);
    if (!nextLocation) return;

    const segmentType = getSegmentType(currentLocation, nextLocation) || 'drive';

    // Update vehicle emoji and 3D model visibility
    const emojiDiv = vehicleMarkerRef.current?.getElement().querySelector('.vehicle-emoji');
    if (emojiDiv) emojiDiv.innerHTML = segmentType === 'flight' ? '✈️' : '🚗';

    // Show/hide 3D models — emoji marker always stays visible as fallback
    try {
      const hasAirplane = !!map.current.getLayer('airplane-3d');
      const hasTruck = !!map.current.getLayer('truck-3d');
      if (hasAirplane) map.current.setLayoutProperty('airplane-3d', 'visibility', segmentType === 'flight' ? 'visible' : 'none');
      if (hasTruck) map.current.setLayoutProperty('truck-3d', 'visibility', segmentType === 'drive' ? 'visible' : 'none');
    } catch {}
    // Always show emoji marker (3D models overlay on top when supported)
    const vehicleEl = vehicleMarkerRef.current?.getElement();
    if (vehicleEl) vehicleEl.style.display = '';

    setAnimating(true);
    setPhase('traveling');
    removeWaypointMarkers();
    stopElevenLabsSpeech();

    const fromKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
    const toKey = nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation;

    // Play in-flight/driving narration (skip for departure — drive-to-airport handles its own VO)
    const isDepartureFromHome = fromKey === 'vancouver' && segmentType === 'flight';
    if (!isDepartureFromHome) {
      playTravelAudio(fromKey, toKey);
    }
    const fromLoc = LOCATIONS[fromKey];
    const toLoc = LOCATIONS[toKey];
    if (!fromLoc || !toLoc) return;

    if (segmentType === 'flight') {
      soundManager.whoosh();

      // SPECIAL: Return flight goes OMA → SEA → PDX (two legs + layover)
      const isReturnFlight = fromKey === 'omaha';

      if (isReturnFlight && map.current) {
        const omaCoord = AIRPORTS.oma.lngLat;
        const seaCoord = AIRPORTS.sea.lngLat;
        const pdxCoord = AIRPORTS.pdx.lngLat;

        vehicleMarkerRef.current?.setLngLat(omaCoord);

        // Leg 1: OMA → SEA
        const arc1 = generateArc(omaCoord, seaCoord, 100);
        stopElevenLabsSpeech();
        playLocalAudio('flight-omaha-seattle');

        zoomInToRoute(map.current, arc1, 2500).then(() => {
          if (!map.current) return;
          activeAnimRef.current = animateRoute(map.current, arc1, {
            ...FLIGHT_CONFIG,
            duration: SEGMENT_DURATIONS['omaha-vancouver-return'] || 15000,
            startBearing: getBearing(omaCoord[1], omaCoord[0], seaCoord[1], seaCoord[0]),
          }, {
            onProgress: (phase, pos) => {
              vehicleMarkerRef.current?.setLngLat(pos);
              try {
                const src = map.current?.getSource('airplane-model') as any;
                if (src?.setModels) {
                  const alt = Math.sin(phase * Math.PI) * 10000;
                  const aIdx = Math.min(Math.floor(phase * arc1.length) + 3, arc1.length - 1);
                  const bearing = getBearing(pos[1], pos[0], arc1[aIdx][1], arc1[aIdx][0]);
                  src.setModels({ plane: { uri: AIRPLANE_MODEL_URI, position: pos, orientation: [0, phase < 0.15 ? 15 : phase > 0.85 ? -15 : 0, -bearing] } });
                  map.current?.setFeatureState({ source: 'airplane-model', sourceLayer: '', id: 'plane' }, { 'z-elevation': alt });
                }
              } catch {}
            },
            onComplete: () => {
              // Landed in Seattle — play layover VO
              stopElevenLabsSpeech();
              playLocalAudio('layover-seattle');
              vehicleMarkerRef.current?.setLngLat(seaCoord);

              // Brief pause at Seattle (show the airport)
              map.current?.flyTo({ center: seaCoord, zoom: 12, pitch: 45, duration: 2000 });

              setTimeout(() => {
                if (!map.current) return;
                // Leg 2: SEA → PDX
                stopElevenLabsSpeech();
                playLocalAudio('flight-seattle-pdx');
                soundManager.whoosh();

                const arc2 = generateArc(seaCoord, pdxCoord, 60);
                zoomInToRoute(map.current!, arc2, 1500).then(() => {
                  if (!map.current) return;
                  activeAnimRef.current = animateRoute(map.current, arc2, {
                    ...FLIGHT_CONFIG,
                    duration: SEGMENT_DURATIONS['seattle-return-pdx'] || 17000,
                    startBearing: getBearing(seaCoord[1], seaCoord[0], pdxCoord[1], pdxCoord[0]),
                  }, {
                    onProgress: (phase, pos) => {
                      vehicleMarkerRef.current?.setLngLat(pos);
                      try {
                        const src = map.current?.getSource('airplane-model') as any;
                        if (src?.setModels) {
                          const alt = Math.sin(phase * Math.PI) * 5000;
                          const aIdx = Math.min(Math.floor(phase * arc2.length) + 3, arc2.length - 1);
                          const bearing = getBearing(pos[1], pos[0], arc2[aIdx][1], arc2[aIdx][0]);
                          src.setModels({ plane: { uri: AIRPLANE_MODEL_URI, position: pos, orientation: [0, phase < 0.15 ? 15 : phase > 0.85 ? -15 : 0, -bearing] } });
                          map.current?.setFeatureState({ source: 'airplane-model', sourceLayer: '', id: 'plane' }, { 'z-elevation': alt });
                        }
                      } catch {}
                    },
                    onComplete: () => {
                      // Landed at PDX — drive home
                      try { map.current?.setLayoutProperty('airplane-3d', 'visibility', 'none'); } catch {}
                      const vEl = vehicleMarkerRef.current?.getElement();
                      if (vEl) vEl.style.display = '';
                      if (emojiDiv) emojiDiv.innerHTML = '🚗';

                      const homeRoute = getAirportToHotelRoute('vancouver');
                      if (homeRoute && homeRoute.length >= 2 && map.current) {
                        soundManager.vroom();
                        map.current.flyTo({
                          center: homeRoute[0], zoom: 14, pitch: 60,
                          bearing: getBearing(homeRoute[0][1], homeRoute[0][0], homeRoute[5][1], homeRoute[5][0]),
                          duration: 2000,
                        });
                        try { map.current?.setLayoutProperty('truck-3d', 'visibility', 'visible'); } catch {}
                        setTimeout(() => {
                          if (!map.current) return;
                          activeAnimRef.current = animateRoute(map.current, homeRoute, AIRPORT_TO_HOTEL_CONFIG, {
                            onProgress: (_p, pos) => {
                              vehicleMarkerRef.current?.setLngLat(pos);
                              try {
                                const truckSrc = map.current?.getSource('truck-model') as any;
                                if (truckSrc?.setModels) {
                                  const idx = Math.min(Math.floor(_p * homeRoute.length), homeRoute.length - 2);
                                  const bearing = getBearing(pos[1], pos[0], homeRoute[idx+1][1], homeRoute[idx+1][0]);
                                  truckSrc.setModels({ truck: { uri: TRUCK_MODEL_URI, position: pos, orientation: [0, 0, -bearing] } });
                                }
                              } catch {}
                            },
                            onComplete: () => {
                              try { map.current?.setLayoutProperty('truck-3d', 'visibility', 'none'); } catch {}
                              finishTravel(nextLocation, toLoc);
                            },
                          });
                        }, 2200);
                      } else {
                        finishTravel(nextLocation, toLoc);
                      }
                    },
                  });
                });
              }, 14000); // Wait for layover VO (~13s)
            },
          });
        });
        return;
      }

      // Normal flights (outbound)
      const flightKey = `${fromKey}-${toKey}`;
      const flightRoute = FLIGHT_ROUTES[flightKey];
      const fromCoord = flightRoute?.from || [fromLoc.lng, fromLoc.lat] as [number, number];
      const toCoord = flightRoute?.to || [toLoc.lng, toLoc.lat] as [number, number];
      const arcPath = generateArc(fromCoord, toCoord, 100);

      // If departing from home, drive to airport first
      const isDeparture = fromKey === 'vancouver';
      const startDriveToAirport = (): Promise<void> => {
        if (!isDeparture || !map.current) return Promise.resolve();
        return new Promise((resolve) => {
          const homeRoute = getHomeToPDXRoute();
          if (emojiDiv) emojiDiv.innerHTML = '🚗';
          const vEl = vehicleMarkerRef.current?.getElement();
          if (vEl) vEl.style.display = '';
          try { map.current?.setLayoutProperty('truck-3d', 'visibility', 'visible'); } catch {}

          stopElevenLabsSpeech();
          playLocalAudio('drive-home-to-airport');

          activeAnimRef.current = animateRoute(map.current!, homeRoute, {
            ...SHORT_DRIVE_CONFIG,
            duration: 13000, // Match 12.6s audio
          }, {
            onProgress: (_p, pos) => {
              vehicleMarkerRef.current?.setLngLat(pos);
              try {
                const truckSrc = map.current?.getSource('truck-model') as any;
                if (truckSrc?.setModels) {
                  const idx = Math.min(Math.floor(_p * homeRoute.length), homeRoute.length - 2);
                  const bearing = getBearing(pos[1], pos[0], homeRoute[idx+1][1], homeRoute[idx+1][0]);
                  truckSrc.setModels({ truck: { uri: TRUCK_MODEL_URI, position: pos, orientation: [0, 0, -bearing] } });
                }
              } catch {}
            },
            onComplete: () => {
              try { map.current?.setLayoutProperty('truck-3d', 'visibility', 'none'); } catch {}
              if (emojiDiv) emojiDiv.innerHTML = '✈️';
              resolve();
            },
          });
        });
      };

      startDriveToAirport().then(() => {
        if (!map.current) return;
        vehicleMarkerRef.current?.setLngLat(fromCoord);

        // Play the flight VO (only for departure — other flights already started VO at line 447)
        if (isDeparture) {
          stopElevenLabsSpeech();
          playTravelAudio(fromKey, toKey);
        }

        zoomInToRoute(map.current!, arcPath, 2500).then(() => {
        if (!map.current) return;

        const segKey = `${fromKey}-${toKey}`;
        activeAnimRef.current = animateRoute(map.current, arcPath, {
          ...FLIGHT_CONFIG,
          duration: SEGMENT_DURATIONS[segKey] || FLIGHT_CONFIG.duration,
          startBearing: getBearing(fromCoord[1], fromCoord[0], toCoord[1], toCoord[0]),
        }, {
          onProgress: (phase, pos) => {
            vehicleMarkerRef.current?.setLngLat(pos);
            // Update 3D airplane model position and orientation
            try {
              const modelSource = map.current?.getSource('airplane-model') as any;
              if (modelSource?.setModels) {
                const flightAltitude = Math.sin(phase * Math.PI) * 10000;
                // Compute instantaneous bearing from current pos to a point slightly ahead on the arc
                const aheadIdx = Math.min(Math.floor(phase * arcPath.length) + 3, arcPath.length - 1);
                const aheadPos = arcPath[aheadIdx];
                const instantBearing = getBearing(pos[1], pos[0], aheadPos[1], aheadPos[0]);
                // Compute pitch based on climb/descent
                const pitchAngle = phase < 0.15 ? 15 : phase > 0.85 ? -15 : 0;
                modelSource.setModels({
                  plane: {
                    uri: AIRPLANE_MODEL_URI,
                    position: pos,
                    orientation: [0, pitchAngle, -instantBearing],
                  },
                });
                map.current?.setFeatureState(
                  { source: 'airplane-model', sourceLayer: '', id: 'plane' },
                  { 'z-elevation': flightAltitude },
                );
              }
            } catch {}
          },
          onComplete: () => {
            // Hide 3D airplane on landing, show emoji marker again
            try { map.current?.setLayoutProperty('airplane-3d', 'visibility', 'none'); } catch {}
            const vEl = vehicleMarkerRef.current?.getElement();
            if (vEl) vEl.style.display = '';
            // After flight, check if there's an airport-to-hotel drive
            const hotelRoute = getAirportToHotelRoute(toKey);
            if (hotelRoute && hotelRoute.length >= 2 && map.current) {
              if (emojiDiv) emojiDiv.innerHTML = '🚗';
              soundManager.vroom();
              // Smoothly zoom into the airport area (no globe zoom-out!)
              map.current.flyTo({
                center: hotelRoute[0],
                zoom: 14,
                pitch: 60,
                bearing: getBearing(hotelRoute[0][1], hotelRoute[0][0], hotelRoute[Math.min(5, hotelRoute.length-1)][1], hotelRoute[Math.min(5, hotelRoute.length-1)][0]),
                duration: 2000,
              });
              // Show truck model for the drive
              try { map.current?.setLayoutProperty('truck-3d', 'visibility', 'visible'); } catch {}
              setTimeout(() => {
                if (!map.current) return;
                activeAnimRef.current = animateRoute(map.current, hotelRoute, AIRPORT_TO_HOTEL_CONFIG, {
                  onProgress: (_p, pos) => {
                    vehicleMarkerRef.current?.setLngLat(pos);
                    try {
                      const truckSrc = map.current?.getSource('truck-model') as any;
                      if (truckSrc?.setModels) {
                        const idx = Math.min(Math.floor(_p * hotelRoute.length), hotelRoute.length - 2);
                        const nextPt = hotelRoute[idx + 1];
                        const bearing = getBearing(pos[1], pos[0], nextPt[1], nextPt[0]);
                        truckSrc.setModels({ truck: { uri: TRUCK_MODEL_URI, position: pos, orientation: [0, 0, -bearing] } });
                      }
                    } catch {}
                  },
                  onComplete: () => {
                    try { map.current?.setLayoutProperty('truck-3d', 'visibility', 'none'); } catch {}
                    finishTravel(nextLocation, toLoc);
                  },
                });
              }, 2200);
            } else {
              finishTravel(nextLocation, toLoc);
            }
          },
        });
      });
      }); // end startDriveToAirport().then()

    } else {
      soundManager.vroom();

      // DRIVE — use road-following route
      const driveRoute = getDriveRoute(fromKey, toKey);
      const drivePath = driveRoute ? driveRoute.coordinates : [[fromLoc.lng, fromLoc.lat] as [number, number], [toLoc.lng, toLoc.lat] as [number, number]];
      const isLong = drivePath.length > 100;

      addDriveWaypointMarkers(fromKey, toKey);

      // Zoom in to the route, then animate
      if (!map.current) return;
      zoomInToRoute(map.current, drivePath, 2000).then(() => {
        if (!map.current) return;

        const driveSegKey = `${fromKey}-${toKey}`;
        const driveConfig = {
          ...(isLong ? DRIVE_CONFIG : SHORT_DRIVE_CONFIG),
          duration: SEGMENT_DURATIONS[driveSegKey] || (isLong ? DRIVE_CONFIG.duration : SHORT_DRIVE_CONFIG.duration),
        };
        activeAnimRef.current = animateRoute(map.current, drivePath, driveConfig, {
          onProgress: (_phase, pos) => {
            vehicleMarkerRef.current?.setLngLat(pos);
            // Update truck 3D model position and bearing
            try {
              const truckSource = map.current?.getSource('truck-model') as any;
              if (truckSource?.setModels) {
                const idx = Math.min(Math.floor(_phase * drivePath.length), drivePath.length - 2);
                const nextPt = drivePath[idx + 1];
                const bearing = getBearing(pos[1], pos[0], nextPt[1], nextPt[0]);
                truckSource.setModels({
                  truck: { uri: TRUCK_MODEL_URI, position: pos, orientation: [0, 0, -bearing] },
                });
              }
            } catch {}
          },
          onComplete: () => {
            try { map.current?.setLayoutProperty('truck-3d', 'visibility', 'none'); } catch {}
            removeWaypointMarkers();
            finishTravel(nextLocation, toLoc);
          },
        });
      });
    }
  }, [currentLocation, isAnimating, setAnimating, removeWaypointMarkers, addDriveWaypointMarkers]);

  const finishTravel = useCallback((nextLocation: GameLocation, toLoc: { lng: number; lat: number }) => {
    setAnimating(false);
    moveToLocation(nextLocation);
    stopElevenLabsSpeech(); // Stop travel narration so arrival narration can play
    soundManager.arrive();
    setPhase('arrived');

    // Show emoji marker again, hide all 3D models
    const vEl = vehicleMarkerRef.current?.getElement();
    if (vEl) vEl.style.display = '';
    try { map.current?.setLayoutProperty('airplane-3d', 'visibility', 'none'); } catch {}
    try { map.current?.setLayoutProperty('truck-3d', 'visibility', 'none'); } catch {}

    const cityName = LOCATIONS[nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation]?.name || '';
    setWelcomeCity(cityName);

    // Smart arrival camera — target main landmark if available
    const locData = LOCATIONS[nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation];
    const arrivalLng = locData?.landmarkLng || toLoc.lng;
    const arrivalLat = locData?.landmarkLat || toLoc.lat;
    const arrivalBearing = Math.random() * 60 - 30;
    map.current?.flyTo({ center: [arrivalLng, arrivalLat], zoom: ARRIVAL_ZOOM, pitch: ARRIVAL_PITCH, bearing: arrivalBearing, duration: 2500, curve: 1.5 });

    setTimeout(() => {
      setPhase('exploring');
      setWelcomeCity(null);
    }, 3000);

    setTimeout(() => setPhase('ready'), 6000);
    awardAchievements(nextLocation);
  }, [moveToLocation, setAnimating]);

  const awardAchievements = (location: GameLocation) => {
    if (location === 'seattle') { earnBadge('wheels-up'); earnBadge('coffee-break'); setTimeout(() => showAchievement('wheels-up'), 500); }
    else if (location === 'tulsa') { earnBadge('howdy-partner'); setTimeout(() => showAchievement('howdy-partner'), 500); }
    else if (location === 'lincoln') { earnBadge('conference-champ'); earnBadge('road-tripper'); earnBadge('cornhusker'); setTimeout(() => showAchievement('cornhusker'), 500); }
    else if (location === 'roca') { earnBadge('packing-pro'); setTimeout(() => showAchievement('packing-pro'), 500); }
    else if (location === 'omaha') { earnBadge('omaha-explorer'); setTimeout(() => showAchievement('omaha-explorer'), 500); }
    else if (location === 'vancouver-return') { earnBadge('home-sweet-home'); earnBadge('super-tracker'); setTimeout(() => showAchievement('home-sweet-home'), 500); }
  };

  const nextLocation = getNextLocation(currentLocation);
  const isJourneyComplete = currentLocation === 'vancouver-return';
  const showGoButton = !isJourneyComplete && nextLocation && mapLoaded && (phase === 'idle' || phase === 'ready') && !hideGoButton;
  const nextLocName = nextLocation ? LOCATIONS[nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation]?.name : '';

  // Distance from home
  const currentLocKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
  const currentLocData = LOCATIONS[currentLocKey];
  const distanceFromHome = currentLocData ? Math.round(getDistanceMiles(LOCATIONS.vancouver.lat, LOCATIONS.vancouver.lng, currentLocData.lat, currentLocData.lng)) : 0;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ minHeight: '100dvh', minWidth: '100vw' }}>
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100dvh', position: 'absolute', top: 0, left: 0 }} />

      {!mapLoaded && (
        <div className="absolute inset-0 bg-background flex flex-col items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-6xl">🌍</motion.div>
          <p className="text-muted-foreground mt-4 font-mono text-sm">Loading adventure map...</p>
        </div>
      )}

      <AnimatePresence>
        {welcomeCity && (
          <motion.div initial={{ opacity: 0, y: -30, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-sm text-white font-bold text-xl px-8 py-4 rounded-full shadow-2xl border border-white/20">🎉 Welcome to {welcomeCity}!</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distance counter removed — too complex for kids */}

      <SleepsCounter />

      <AnimatePresence>
        {showGoButton && currentLocation === 'vancouver' && (
          <motion.button
            key="blast-off-btn"
            initial={{ opacity: 0, y: 40, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.5 }}
            transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.5 }}
            onClick={handleGoNext}
            disabled={isAnimating}
            className="absolute bottom-[200px] left-1/2 -translate-x-1/2 z-20 touch-manipulation disabled:opacity-50"
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              className="px-16 py-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-2xl"
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 30px rgba(251,191,36,0.4), 0 0 60px rgba(249,115,22,0.2)',
                  '0 0 50px rgba(251,191,36,0.7), 0 0 100px rgba(249,115,22,0.4)',
                  '0 0 30px rgba(251,191,36,0.4), 0 0 60px rgba(249,115,22,0.2)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="flex items-center gap-3 text-black font-bold text-3xl">
                <motion.span
                  animate={{ rotate: [0, -15, 15, 0], y: [0, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                  className="text-4xl"
                >
                  ✈️
                </motion.span>
                BLAST OFF!
                <motion.span
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-4xl"
                >
                  🚀
                </motion.span>
              </span>
            </motion.div>
          </motion.button>
        )}
        {showGoButton && currentLocation !== 'vancouver' && (
          <motion.button key="go-btn" initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={handleGoNext} disabled={isAnimating}
            className="absolute bottom-[200px] left-1/2 -translate-x-1/2 px-10 py-5 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-2xl rounded-full shadow-2xl disabled:opacity-50 z-20 touch-manipulation"
            style={{ minWidth: 220, minHeight: 64 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <span className="flex items-center gap-3">
              GO to {nextLocName}!
              <span className="text-3xl">👆</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'traveling' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-[200px] left-1/2 -translate-x-1/2 px-8 py-4 bg-card/80 backdrop-blur-sm text-foreground font-bold text-xl rounded-full shadow-2xl z-20 border border-border">
            <span className="flex items-center gap-3">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                {(getSegmentType(currentLocation, nextLocation!) || 'drive') === 'flight' ? '✈️' : '🚗'}
              </motion.span>
              Traveling...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isJourneyComplete && mapLoaded && (
          <motion.div initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-[200px] left-1/2 -translate-x-1/2 px-10 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-bold text-2xl rounded-full shadow-2xl z-20 text-center">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>🎉 Dad is HOME! 🎉</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProgressCaterpillar onCityTap={(cityId) => {
        const loc = LOCATIONS[cityId === 'vancouver-return' ? 'vancouver' : cityId];
        if (loc && map.current) {
          stopOrbit();
          map.current.flyTo({ center: [loc.landmarkLng || loc.lng, loc.landmarkLat || loc.lat], zoom: ARRIVAL_ZOOM, pitch: ARRIVAL_PITCH, bearing: Math.random() * 40 - 20, duration: 2000 });
        }
      }} />

      {/* Route key removed — too cluttered for kids */}
    </div>
  );
}

function generateArc(start: [number, number], end: [number, number], numPoints: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    const distance = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
    const arcHeight = distance * 0.15;
    points.push([lng, lat + Math.sin(t * Math.PI) * arcHeight]);
  }
  return points;
}

function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1*Math.PI/180)*Math.sin(lat2*Math.PI/180) - Math.sin(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
