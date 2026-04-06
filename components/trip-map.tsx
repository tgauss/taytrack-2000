'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { tripLocations, tripEvents } from '@/lib/trip-data';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoidGdhdXNzIiwiYSI6ImUxelFyZWsifQ.ewANL0BvfdZa9RRcOIQSVA';

mapboxgl.accessToken = MAPBOX_TOKEN;

// Route coordinates for the animated path
const routeSegments = [
  { from: 'van', to: 'sea', type: 'flight' },
  { from: 'sea', to: 'tul', type: 'flight' },
  { from: 'tul', to: 'lnk', type: 'drive' },
  { from: 'lnk', to: 'roca', type: 'drive' },
  { from: 'roca', to: 'oma', type: 'drive' },
  { from: 'oma', to: 'sea', type: 'flight' },
  { from: 'sea', to: 'van', type: 'flight' },
];

export function TripMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current) return;

    // If map already exists, remove it first
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-100, 40],
      zoom: 3.5,
      pitch: 0,
      bearing: 0,
    });

    map.current.on('load', () => {
      if (!map.current) return;
      
      // Build route coordinates
      const coordinates: [number, number][] = [];
      routeSegments.forEach(segment => {
        const fromLoc = tripLocations.find(l => l.id === segment.from);
        if (fromLoc) {
          coordinates.push(fromLoc.coordinates);
        }
      });
      // Add final destination
      const lastSegment = routeSegments[routeSegments.length - 1];
      const finalLoc = tripLocations.find(l => l.id === lastSegment.to);
      if (finalLoc) coordinates.push(finalLoc.coordinates);

      // Add route source
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      // Add glow layer
      map.current.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00d4aa',
          'line-width': 8,
          'line-blur': 6,
          'line-opacity': 0.4
        }
      });

      // Add main route line
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00d4aa',
          'line-width': 3,
          'line-dasharray': [2, 2]
        }
      });

      // Add markers for each location
      tripLocations.forEach(location => {
        const el = document.createElement('div');
        el.className = 'trip-marker';
        el.innerHTML = `
          <div class="marker-inner" data-id="${location.id}">
            <span class="marker-emoji">${location.emoji}</span>
            <span class="marker-label">${location.shortName}</span>
          </div>
        `;
        el.style.cssText = `
          cursor: pointer;
          transition: transform 0.2s ease;
        `;

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });
        el.addEventListener('click', () => {
          setSelectedLocation(location.id);
          map.current?.flyTo({
            center: location.coordinates,
            zoom: 8,
            duration: 1500
          });
        });

        new mapboxgl.Marker(el)
          .setLngLat(location.coordinates)
          .addTo(map.current!);
      });

      setMapLoaded(true);
    });
  }, []);

  useEffect(() => {
    // Small delay to ensure container is ready
    const timeoutId = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap]);

  const handleFlyToAll = () => {
    setSelectedLocation(null);
    map.current?.flyTo({
      center: [-100, 40],
      zoom: 3.5,
      duration: 1500
    });
  };

  const selectedLoc = tripLocations.find(l => l.id === selectedLocation);
  const locationEvents = selectedLocation 
    ? tripEvents.filter(e => {
        const loc = tripLocations.find(l => l.id === selectedLocation);
        if (!loc) return false;
        // Match by coordinates proximity
        const dist = Math.sqrt(
          Math.pow(e.coordinates[0] - loc.coordinates[0], 2) +
          Math.pow(e.coordinates[1] - loc.coordinates[1], 2)
        );
        return dist < 2;
      })
    : [];

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden border-2 border-primary/30">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-card flex items-center justify-center z-20">
          <div className="text-center">
            <div className="text-4xl animate-bounce mb-2">🛰️</div>
            <p className="text-muted-foreground font-mono text-sm">Initializing TayTrack 2000...</p>
          </div>
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <button
          onClick={handleFlyToAll}
          className="px-3 py-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-xs font-mono hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Full Map
        </button>
        {tripLocations.slice(0, 4).map(loc => (
          <button
            key={loc.id}
            onClick={() => {
              setSelectedLocation(loc.id);
              map.current?.flyTo({
                center: loc.coordinates,
                zoom: 8,
                duration: 1500
              });
            }}
            className={`px-3 py-1.5 backdrop-blur-sm border rounded-full text-xs font-mono transition-colors ${
              selectedLocation === loc.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card/90 border-border hover:bg-muted'
            }`}
          >
            {loc.emoji} {loc.shortName}
          </button>
        ))}
      </div>

      {/* Location info panel */}
      {selectedLoc && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{selectedLoc.emoji}</span>
            <div>
              <h3 className="font-bold text-foreground">{selectedLoc.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{selectedLoc.shortName}</p>
            </div>
          </div>
          {locationEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Events at this location:</p>
              {locationEvents.slice(0, 3).map(event => (
                <div key={event.id} className="flex items-center gap-2 text-sm">
                  <span>{event.icon}</span>
                  <span className="text-foreground">{event.title}</span>
                </div>
              ))}
              {locationEvents.length > 3 && (
                <p className="text-xs text-primary">+{locationEvents.length - 3} more events</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom marker styles */}
      <style jsx global>{`
        .marker-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .marker-emoji {
          font-size: 28px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }
        .marker-label {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: bold;
          color: white;
          background: rgba(0,212,170,0.9);
          padding: 2px 6px;
          border-radius: 4px;
          text-shadow: none;
        }
      `}</style>
    </div>
  );
}
