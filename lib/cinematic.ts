/**
 * Cinematic route animation engine
 *
 * Based on Mapbox's route-tracking approach:
 * - Line-gradient reveal (route draws itself)
 * - Free Camera API for precise cinematic control
 * - LERP smoothing for buttery camera movement
 * - Slow bearing rotation for cinematic feel
 * - turf.js for precise distance-along-route calculations
 */

import * as turf from '@turf/turf';
import type mapboxgl from 'mapbox-gl';

// ---- MATH HELPERS ----

function lerp(start: number, end: number, amt: number): number {
  return (1 - amt) * start + amt * end;
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(v, max));
}

/**
 * Compute the camera position given a target point on the ground,
 * a pitch angle, bearing, and altitude.
 *
 * The camera is placed behind and above the target point based on
 * the bearing and pitch, at the given altitude.
 */
function computeCameraPosition(
  pitch: number,
  bearing: number,
  targetLng: number,
  targetLat: number,
  altitude: number,
): { lng: number; lat: number } {
  const bearingRad = bearing / 57.29;
  const pitchRad = (90 - pitch) / 57.29;

  const lngDiff = ((altitude / Math.tan(pitchRad)) * Math.sin(-bearingRad)) / 70000;
  const latDiff = ((altitude / Math.tan(pitchRad)) * Math.cos(-bearingRad)) / 110000;

  return {
    lng: targetLng + lngDiff,
    lat: targetLat - latDiff,
  };
}

// ---- ANIMATION CONFIG ----

export interface CinematicConfig {
  /** Duration in ms */
  duration: number;
  /** Camera altitude in meters */
  altitude: number;
  /** Camera pitch in degrees */
  pitch: number;
  /** Starting bearing */
  startBearing: number;
  /** Total bearing rotation over the animation */
  bearingRotation: number;
  /** LERP smoothing factor (0-1, lower = smoother) */
  lerpFactor: number;
  /** Whether to use line-gradient reveal */
  revealLine: boolean;
  /** Line source ID in the map */
  lineSourceId?: string;
  /** Line layer ID */
  lineLayerId?: string;
  /** Line color */
  lineColor: string;
  /** Line width */
  lineWidth: number;
}

export const FLIGHT_CONFIG: CinematicConfig = {
  duration: 15000, // Default, overridden per segment to match audio
  altitude: 2000000,
  pitch: 45,
  startBearing: 0,
  bearingRotation: 60,
  lerpFactor: 0.015,
  revealLine: true,
  lineColor: '#00d4ff',
  lineWidth: 5,
};

// Animation durations matched to pre-generated audio narrations
export const SEGMENT_DURATIONS: Record<string, number> = {
  'vancouver-seattle': 15000,  // audio: 14.1s
  'seattle-tulsa': 23000,      // audio: 22.3s
  'tulsa-lincoln': 27000,      // audio: 26.3s
  'lincoln-roca': 7000,        // audio: 6.7s
  'roca-omaha': 6500,          // audio: 5.9s
  'omaha-vancouver-return': 33000, // audio: 31.9s (longer — describes full OMA→SEA→PDX journey)
};

export const DRIVE_CONFIG: CinematicConfig = {
  duration: 10000,
  altitude: 1200,
  pitch: 60,
  startBearing: 0,
  bearingRotation: 0, // bearing follows the road
  lerpFactor: 0.012, // Very smooth position tracking
  revealLine: true,
  lineColor: '#ffd93d',
  lineWidth: 5,
};

export const SHORT_DRIVE_CONFIG: CinematicConfig = {
  ...DRIVE_CONFIG,
  duration: 5000,
  altitude: 800,
  pitch: 55,
};

export const AIRPORT_TO_HOTEL_CONFIG: CinematicConfig = {
  ...DRIVE_CONFIG,
  duration: 6000,
  altitude: 1000,
  pitch: 55,
  lerpFactor: 0.015,
  lineColor: '#4ade80',
  lineWidth: 6,
};

// ---- MAIN ANIMATION FUNCTION ----

export interface AnimationCallbacks {
  onProgress?: (phase: number, position: [number, number]) => void;
  onComplete: () => void;
}

/**
 * Run a cinematic route animation on the map.
 *
 * 1. Adds a line source/layer for the route
 * 2. Uses line-gradient to reveal the route progressively
 * 3. Moves the camera along the route using Free Camera API
 * 4. Applies LERP smoothing for buttery movement
 * 5. Slowly rotates the bearing for cinematic feel
 */
export function animateRoute(
  map: mapboxgl.Map,
  routeCoords: [number, number][],
  config: CinematicConfig,
  callbacks: AnimationCallbacks,
): { cancel: () => void } {
  if (routeCoords.length < 2) {
    callbacks.onComplete();
    return { cancel: () => {} };
  }

  const sourceId = config.lineSourceId || `cinematic-route-${Date.now()}`;
  const layerId = config.lineLayerId || `${sourceId}-layer`;

  // Create a GeoJSON LineString from the route
  const routeLine = turf.lineString(routeCoords);
  const pathDistance = turf.length(routeLine, { units: 'kilometers' });

  // Calculate starting bearing from first segment
  const startPt = routeCoords[0];
  const midIdx = Math.min(5, routeCoords.length - 1);
  const midPt = routeCoords[midIdx];
  const routeBearing = turf.bearing(turf.point(startPt), turf.point(midPt));
  const startBearing = config.bearingRotation === 0 ? routeBearing : config.startBearing || routeBearing;

  // Add route source and layer
  try {
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(routeLine);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        lineMetrics: true, // Required for line-gradient
        data: routeLine,
      });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': config.lineColor,
          'line-width': config.lineWidth,
          'line-opacity': 0.9,
          'line-emissive-strength': 1,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });
    }
  } catch (e) {
    console.warn('[TAYTRACK] Could not add route layer:', e);
  }

  // Animation state
  let cancelled = false;
  let startTime: number | null = null;
  let smoothLng = startPt[0];
  let smoothLat = startPt[1];
  let smoothBearing = startBearing;

  const frame = (currentTime: number) => {
    if (cancelled) return;
    if (!startTime) startTime = currentTime;

    const elapsed = currentTime - startTime;
    const phase = clamp(elapsed / config.duration);

    // Get the point along the route at this phase
    const alongPoint = turf.along(routeLine, pathDistance * phase, { units: 'kilometers' });
    const [lng, lat] = alongPoint.geometry.coordinates;

    // LERP smooth the target position
    smoothLng = lerp(smoothLng, lng, config.lerpFactor * 60); // normalize for ~60fps
    smoothLat = lerp(smoothLat, lat, config.lerpFactor * 60);

    // Reveal the line using line-gradient
    if (config.revealLine) {
      try {
        map.setPaintProperty(layerId, 'line-gradient', [
          'step',
          ['line-progress'],
          config.lineColor,
          phase,
          'rgba(0, 0, 0, 0)',
        ]);
      } catch {}
    }

    // Calculate bearing
    let targetBearing: number;
    if (config.bearingRotation === 0) {
      // Follow-the-road mode: look far ahead to get a stable bearing
      const lookAheadPhase = Math.min(phase + 0.08, 1); // Look 8% ahead (was 2%)
      const lookAheadPt = turf.along(routeLine, pathDistance * lookAheadPhase, { units: 'kilometers' });
      const [laLng, laLat] = lookAheadPt.geometry.coordinates;
      targetBearing = turf.bearing(turf.point([lng, lat]), turf.point([laLng, laLat]));
    } else {
      // Cinematic rotation mode (flights)
      targetBearing = startBearing - phase * config.bearingRotation;
    }

    // Heavily smooth the bearing to prevent jitter on curvy roads
    const bearingLerp = config.bearingRotation === 0 ? 0.015 : 0.05;
    // Handle bearing wrap-around (e.g., 350° → 10°)
    let bearingDiff = targetBearing - smoothBearing;
    if (bearingDiff > 180) bearingDiff -= 360;
    if (bearingDiff < -180) bearingDiff += 360;
    smoothBearing = smoothBearing + bearingDiff * bearingLerp;

    // For drives: use easeTo with long duration for buttery smooth camera
    // For flights: use Free Camera for precise control
    if (config.bearingRotation === 0) {
      // DRIVE MODE: gentle easeTo, no Free Camera jitter
      map.easeTo({
        center: [smoothLng, smoothLat],
        bearing: smoothBearing,
        pitch: config.pitch,
        zoom: map.getZoom(), // Keep current zoom
        duration: 300, // Smooth 300ms transitions
        easing: (t) => t, // Linear
      });
    } else {
      // FLIGHT MODE: Free Camera for cinematic control
      const cameraPos = computeCameraPosition(
        config.pitch,
        smoothBearing,
        smoothLng,
        smoothLat,
        config.altitude,
      );
      try {
        const camera = map.getFreeCameraOptions();
        camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
          { lng: cameraPos.lng, lat: cameraPos.lat },
          config.altitude,
        );
        camera.lookAtPoint({ lng: smoothLng, lat: smoothLat });
        map.setFreeCameraOptions(camera);
      } catch {
        map.easeTo({ center: [smoothLng, smoothLat], bearing: smoothBearing, pitch: config.pitch, duration: 100 });
      }
    }

    // Notify progress
    callbacks.onProgress?.(phase, [lng, lat]);

    if (phase < 1) {
      requestAnimationFrame(frame);
    } else {
      // Clean up the animated route layer after a brief pause
      setTimeout(() => {
        try {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch {}
      }, 500);
      callbacks.onComplete();
    }
  };

  requestAnimationFrame(frame);

  return {
    cancel: () => {
      cancelled = true;
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
    },
  };
}

/**
 * Zoom in from globe/high altitude to a specific route area.
 * Returns a promise that resolves when the zoom-in is complete.
 */
/**
 * Wait for the map to finish loading all visible tiles.
 * Resolves immediately if already idle, otherwise waits up to maxWait ms.
 */
function waitForMapIdle(map: mapboxgl.Map, maxWait = 5000): Promise<void> {
  return new Promise((resolve) => {
    if (!map.isMoving() && map.areTilesLoaded()) {
      resolve();
      return;
    }
    const timeout = setTimeout(resolve, maxWait); // Don't wait forever
    map.once('idle', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

export function zoomInToRoute(
  map: mapboxgl.Map,
  routeCoords: [number, number][],
  duration = 3000,
): Promise<void> {
  return new Promise((resolve) => {
    const line = turf.lineString(routeCoords);
    const bbox = turf.bbox(line);
    const center = turf.center(line).geometry.coordinates;

    // First zoom out to show the globe
    map.flyTo({
      center: [center[0], center[1]],
      zoom: 3,
      pitch: 0,
      bearing: 0,
      duration: duration * 0.3,
    });

    // Then zoom into the route area
    setTimeout(() => {
      map.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        {
          padding: 100,
          pitch: 60,
          bearing: turf.bearing(
            turf.point(routeCoords[0]),
            turf.point(routeCoords[Math.min(5, routeCoords.length - 1)]),
          ),
          duration: duration * 0.7,
        },
      );
      // Wait for camera to arrive, THEN wait for tiles to load
      setTimeout(async () => {
        await waitForMapIdle(map, 5000);
        resolve();
      }, duration * 0.7 + 200);
    }, duration * 0.3 + 200);
  });
}
