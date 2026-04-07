'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, getNextLocation, getSegmentType, type GameLocation } from '@/lib/game-state';
import { soundManager } from '@/lib/sounds';
import { getPOIsForCity, getDriveRoute, AIRPORTS, getAirportToHotelRoute, type POI } from '@/lib/poi-data';
import { animateRoute, zoomInToRoute, FLIGHT_CONFIG, DRIVE_CONFIG, SHORT_DRIVE_CONFIG, AIRPORT_TO_HOTEL_CONFIG } from '@/lib/cinematic';
import { ProgressCaterpillar } from './ProgressCaterpillar';
import { SleepsCounter } from './SleepsCounter';

mapboxgl.accessToken = 'pk.eyJ1IjoidGdhdXNzIiwiYSI6ImUxelFyZWsifQ.ewANL0BvfdZa9RRcOIQSVA';

const AIRPLANE_MODEL_URI = 'https://docs.mapbox.com/mapbox-gl-js/assets/airplane.glb';

// City centers for ground exploration
const LOCATIONS: Record<string, { name: string; lng: number; lat: number; emoji: string; color: string }> = {
  vancouver: { name: 'Vancouver', lng: -122.6587, lat: 45.6387, emoji: '🏠', color: '#4ade80' },
  seattle: { name: 'Seattle', lng: -122.3321, lat: 47.6062, emoji: '☕', color: '#60a5fa' },
  tulsa: { name: 'Tulsa', lng: -95.9928, lat: 36.1540, emoji: '🤠', color: '#f97316' },
  lincoln: { name: 'Lincoln', lng: -96.6852, lat: 40.8136, emoji: '🌽', color: '#eab308' },
  roca: { name: 'Roca', lng: -96.6653, lat: 40.6481, emoji: '📦', color: '#a855f7' },
  omaha: { name: 'Omaha', lng: -95.9345, lat: 41.2565, emoji: '✈️', color: '#ec4899' },
  'vancouver-return': { name: 'Home!', lng: -122.6587, lat: 45.6387, emoji: '🎉', color: '#4ade80' },
};

// Flight segments use airport coordinates
const FLIGHT_ROUTES: Record<string, { from: [number, number]; to: [number, number] }> = {
  'vancouver-seattle': { from: AIRPORTS.pdx.lngLat, to: AIRPORTS.sea.lngLat },
  'seattle-tulsa': { from: AIRPORTS.sea.lngLat, to: AIRPORTS.tul.lngLat },
  'omaha-vancouver-return': { from: AIRPORTS.oma.lngLat, to: AIRPORTS.pdx.lngLat },
};

// Camera presets
const ARRIVAL_ZOOM = 15.5;
const ARRIVAL_PITCH = 62;
const DRIVE_FOLLOW_ZOOM = 10;

type ExplorationPhase = 'idle' | 'traveling' | 'arrived' | 'exploring' | 'ready';

interface AdventureMapProps {
  onCityTap: (cityId: string) => void;
  onPOITap?: (poi: POI) => void;
  onMapReady?: (controls: { flyBackToCity: () => void; flyToPOI: (poi: POI) => void }) => void;
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

  // ---- POI MARKERS ----
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
      el.style.cssText = `cursor:pointer;opacity:0;animation:poiFadeIn 0.3s ease forwards;animation-delay:${i*0.15}s;`;
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div class="poi-icon" style="width:48px;height:48px;background:rgba(0,0,0,0.8);border:3px solid ${poi.color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 0 12px ${poi.color}66,0 2px 8px rgba(0,0,0,0.5);transition:transform 0.2s,box-shadow 0.2s;">${poi.emoji}</div>
          <div style="background:rgba(0,0,0,0.85);color:${poi.color};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:bold;white-space:nowrap;border:1px solid ${poi.color}44;">${poi.name}</div>
        </div>`;
      el.addEventListener('click', () => {
        soundManager.tap();
        stopOrbit();
        map.current?.flyTo({ center: poi.lngLat, zoom: poi.zoomLevel || 16.5, pitch: 65, bearing: Math.random()*40-20, duration: 1500 });
        onPOITap?.(poi);
      });
      el.addEventListener('mouseenter', () => { const ic = el.querySelector('.poi-icon') as HTMLElement; if(ic){ic.style.transform='scale(1.25)';ic.style.boxShadow=`0 0 20px ${poi.color}aa`;} });
      el.addEventListener('mouseleave', () => { const ic = el.querySelector('.poi-icon') as HTMLElement; if(ic){ic.style.transform='scale(1)';ic.style.boxShadow=`0 0 12px ${poi.color}66`;} });
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(poi.lngLat).addTo(map.current!);
      poiMarkersRef.current.push(marker);
    });
  }, [removePOIMarkers, onPOITap, stopOrbit]);

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
    mapInitialized.current = true;

    const startLocKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
    const startLoc = LOCATIONS[startLocKey] || LOCATIONS.vancouver;

    // If starting fresh (at vancouver), begin at PDX airport for the departure experience
    const isAtStart = currentLocation === 'vancouver';
    const initialCenter: [number, number] = isAtStart
      ? AIRPORTS.pdx.lngLat
      : [startLoc.lng, startLoc.lat];

    // Use Mapbox Standard style with dusk lighting for cinematic feel
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: initialCenter,
      zoom: isAtStart ? 14 : ARRIVAL_ZOOM,
      pitch: isAtStart ? 70 : ARRIVAL_PITCH,
      bearing: isAtStart ? 150 : 0, // Look down the runway at PDX
      antialias: true,
    });

    // Set Standard style config for dusk lighting
    map.current.on('style.load', () => {
      if (!map.current) return;
      try {
        map.current.setConfigProperty('basemap', 'lightPreset', 'dusk');
        map.current.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
        map.current.setConfigProperty('basemap', 'showPlaceLabels', true);
      } catch { /* config may not be available */ }
    });

    const onMapLoad = () => {
      if (!map.current) return;
      setMapLoaded(true);

      // Add 3D terrain
      try {
        map.current.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
        map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      } catch {}

      // Add sky
      try {
        map.current.addLayer({ id: 'sky', type: 'sky', paint: { 'sky-type': 'atmosphere', 'sky-atmosphere-sun': [0.0, 90.0], 'sky-atmosphere-sun-intensity': 15 } });
      } catch {}

      // Vehicle trail
      try {
        map.current.addSource('vehicle-trail', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } });
        map.current.addLayer({ id: 'vehicle-trail-glow', type: 'line', source: 'vehicle-trail', paint: { 'line-color': '#00d4ff', 'line-width': 8, 'line-blur': 6, 'line-opacity': 0.5 } });
        map.current.addLayer({ id: 'vehicle-trail-line', type: 'line', source: 'vehicle-trail', paint: { 'line-color': '#00d4ff', 'line-width': 3, 'line-opacity': 0.9 } });
      } catch {}

      // 3D airplane model
      try {
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
          paint: {
            'model-scale': [
              'interpolate', ['exponential', 0.5], ['zoom'],
              2.0, ['literal', [4000.0, 4000.0, 4000.0]],
              8.0, ['literal', [400.0, 400.0, 400.0]],
              14.0, ['literal', [5.0, 5.0, 5.0]],
            ],
            'model-type': 'location-indicator',
            'model-opacity': 1.0,
            'model-translation': [0, 0, ['feature-state', 'z-elevation']],
          },
        });
      } catch (e) {
        console.warn('[TAYTRACK] 3D model layer not supported:', e);
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
        <div class="vehicle-emoji">✈️</div>
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

      // Show POIs
      const startCityId = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
      addPOIMarkers(startCityId);

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
            if (loc && map.current) map.current.flyTo({ center: [loc.lng, loc.lat], zoom: ARRIVAL_ZOOM, pitch: ARRIVAL_PITCH, bearing: 0, duration: 1500 });
          } catch { map.current?.flyTo({ center: [-100, 40], zoom: 4, pitch: 30, duration: 1500 }); }
        },
      });
    };

    if (map.current.isStyleLoaded()) onMapLoad();
    else map.current.on('style.load', onMapLoad);

    map.current.on('error', (e: unknown) => console.error('[TAYTRACK] Map error:', e));

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
      const nextLoc = getNextLocation(currentLocation);
      if (nextLoc) {
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

    // Show/hide 3D airplane model + emoji marker
    try {
      if (map.current.getLayer('airplane-3d')) {
        map.current.setLayoutProperty('airplane-3d', 'visibility', segmentType === 'flight' ? 'visible' : 'none');
      }
      // Hide emoji marker during flights (3D model takes over), show during drives
      const vehicleEl = vehicleMarkerRef.current?.getElement();
      if (vehicleEl) vehicleEl.style.display = segmentType === 'flight' ? 'none' : '';
    } catch {}

    setAnimating(true);
    setPhase('traveling');
    removePOIMarkers();
    removeWaypointMarkers();

    const fromKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
    const toKey = nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation;
    const fromLoc = LOCATIONS[fromKey];
    const toLoc = LOCATIONS[toKey];
    if (!fromLoc || !toLoc) return;

    if (segmentType === 'flight') {
      soundManager.whoosh();

      // Use airport coordinates for flights
      const flightKey = `${fromKey}-${toKey}`;
      const flightRoute = FLIGHT_ROUTES[flightKey];
      const fromCoord = flightRoute?.from || [fromLoc.lng, fromLoc.lat] as [number, number];
      const toCoord = flightRoute?.to || [toLoc.lng, toLoc.lat] as [number, number];
      const arcPath = generateArc(fromCoord, toCoord, 100);

      // Move vehicle to departure airport
      vehicleMarkerRef.current?.setLngLat(fromCoord);

      // Zoom in to route area, then run cinematic animation
      zoomInToRoute(map.current, arcPath, 2500).then(() => {
        if (!map.current) return;

        activeAnimRef.current = animateRoute(map.current, arcPath, {
          ...FLIGHT_CONFIG,
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
                    orientation: [0, pitchAngle, instantBearing + 90],
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
              setTimeout(() => {
                if (!map.current) return;
                activeAnimRef.current = animateRoute(map.current, hotelRoute, AIRPORT_TO_HOTEL_CONFIG, {
                  onProgress: (_p, pos) => vehicleMarkerRef.current?.setLngLat(pos),
                  onComplete: () => finishTravel(nextLocation, toLoc),
                });
              }, 2200);
            } else {
              finishTravel(nextLocation, toLoc);
            }
          },
        });
      });

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

        activeAnimRef.current = animateRoute(map.current, drivePath, isLong ? DRIVE_CONFIG : SHORT_DRIVE_CONFIG, {
          onProgress: (_phase, pos) => {
            vehicleMarkerRef.current?.setLngLat(pos);
          },
          onComplete: () => {
            removeWaypointMarkers();
            finishTravel(nextLocation, toLoc);
          },
        });
      });
    }
  }, [currentLocation, isAnimating, setAnimating, removePOIMarkers, removeWaypointMarkers, addDriveWaypointMarkers]);

  const finishTravel = useCallback((nextLocation: GameLocation, toLoc: { lng: number; lat: number }) => {
    setAnimating(false);
    moveToLocation(nextLocation);
    soundManager.arrive();
    setPhase('arrived');

    const cityName = LOCATIONS[nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation]?.name || '';
    setWelcomeCity(cityName);

    const arrivalBearing = Math.random() * 60 - 30;
    map.current?.flyTo({ center: [toLoc.lng, toLoc.lat], zoom: ARRIVAL_ZOOM, pitch: ARRIVAL_PITCH, bearing: arrivalBearing, duration: 2500, curve: 1.5 });

    setTimeout(() => {
      setPhase('exploring');
      setWelcomeCity(null);
      const cityId = nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation;
      addPOIMarkers(cityId);
    }, 3000);

    setTimeout(() => setPhase('ready'), 6000);
    awardAchievements(nextLocation);
  }, [moveToLocation, setAnimating, addPOIMarkers]);

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
  const showGoButton = !isJourneyComplete && nextLocation && mapLoaded && (phase === 'idle' || phase === 'ready');
  const nextLocName = nextLocation ? LOCATIONS[nextLocation === 'vancouver-return' ? 'vancouver' : nextLocation]?.name : '';

  // Distance from home
  const currentLocKey = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
  const currentLocData = LOCATIONS[currentLocKey];
  const distanceFromHome = currentLocData ? Math.round(getDistanceMiles(LOCATIONS.vancouver.lat, LOCATIONS.vancouver.lng, currentLocData.lat, currentLocData.lng)) : 0;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

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

      {mapLoaded && distanceFromHome > 0 && !isJourneyComplete && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="absolute top-20 left-4 z-20 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
          <div className="text-xs font-bold text-white/80 mb-1">FROM HOME</div>
          <div className="text-xl font-bold text-cyan-400 font-mono">{distanceFromHome.toLocaleString()} mi</div>
        </motion.div>
      )}

      <SleepsCounter />

      <AnimatePresence>
        {showGoButton && (
          <motion.button key="go-btn" initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={handleGoNext} disabled={isAnimating}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 px-10 py-5 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-2xl rounded-full shadow-2xl disabled:opacity-50 z-20 touch-manipulation"
            style={{ minWidth: 220, minHeight: 64 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <span className="flex items-center gap-3">
              {currentLocation === 'vancouver' ? '✈️ BLAST OFF!' : `GO to ${nextLocName}!`}
              <span className="text-3xl">👆</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'traveling' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 px-8 py-4 bg-card/80 backdrop-blur-sm text-foreground font-bold text-xl rounded-full shadow-2xl z-20 border border-border">
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
            className="absolute bottom-28 left-1/2 -translate-x-1/2 px-10 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-bold text-2xl rounded-full shadow-2xl z-20 text-center">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>🎉 Dad is HOME! 🎉</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProgressCaterpillar />

      <div className="absolute top-20 right-4 z-20 bg-black/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="text-xs font-bold text-white/80 mb-2">ROUTE KEY</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2"><div className="w-6 h-1 bg-[#00d4ff] rounded" /><span className="text-white text-sm">✈️ Flying</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-0 border-t-2 border-dashed border-[#ffd93d]" /><span className="text-white text-sm">🚗 Driving</span></div>
        </div>
      </div>
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
