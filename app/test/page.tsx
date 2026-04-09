'use client';

import { useState, useEffect, useRef } from 'react';

export default function TestPage() {
  const [info, setInfo] = useState<Record<string, string>>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapStatus, setMapStatus] = useState('Loading...');

  useEffect(() => {
    // Collect device info
    const data: Record<string, string> = {};
    data['User Agent'] = navigator.userAgent;
    data['Platform'] = navigator.platform;
    data['Max Touch Points'] = String(navigator.maxTouchPoints);
    data['Screen'] = `${screen.width}x${screen.height} @${devicePixelRatio}x`;
    data['Window Inner'] = `${window.innerWidth}x${window.innerHeight}`;
    data['Is iPad (UA)'] = /iPad/i.test(navigator.userAgent) ? 'Yes' : 'No';
    data['Is iPad (Touch+Mac)'] = (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent)) ? 'Yes' : 'No';

    // Check WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      data['WebGL'] = gl ? `Supported (${gl.getParameter(gl.RENDERER)})` : 'NOT SUPPORTED';
    } catch (e) {
      data['WebGL'] = `Error: ${e}`;
    }

    setInfo(data);

    // Try loading Mapbox
    const loadMap = async () => {
      try {
        setMapStatus('Importing mapbox-gl...');
        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');

        setMapStatus('Setting token...');
        mapboxgl.accessToken = 'pk.eyJ1IjoidGdhdXNzIiwiYSI6ImUxelFyZWsifQ.ewANL0BvfdZa9RRcOIQSVA';

        if (!mapRef.current) { setMapStatus('No container ref'); return; }

        const rect = mapRef.current.getBoundingClientRect();
        setMapStatus(`Container: ${rect.width}x${rect.height} — Creating map...`);

        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-122.5334, 45.5976],
          zoom: 14,
        });

        map.on('error', (e: unknown) => {
          setMapStatus(`Map error: ${JSON.stringify(e)}`);
        });

        map.on('style.load', () => {
          setMapStatus(`Style loaded! Canvas: ${map.getCanvas().width}x${map.getCanvas().height}`);
          map.resize();
        });

        map.on('load', () => {
          setMapStatus(`Fully loaded! Tiles: ${map.areTilesLoaded()}`);
        });

        // Force resize
        setTimeout(() => {
          map.resize();
          const c = map.getCanvas();
          setMapStatus(prev => prev + ` | After resize: ${c.width}x${c.height}`);
        }, 2000);

      } catch (e) {
        setMapStatus(`FAILED: ${e}`);
      }
    };

    loadMap();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 12 }}>
      <h1 style={{ fontSize: 18 }}>iPad Map Test</h1>

      <h2 style={{ fontSize: 14, marginTop: 16 }}>Device Info:</h2>
      {Object.entries(info).map(([k, v]) => (
        <div key={k}><strong>{k}:</strong> {v}</div>
      ))}

      <h2 style={{ fontSize: 14, marginTop: 16 }}>Map Status: {mapStatus}</h2>

      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: 400,
          border: '2px solid red',
          marginTop: 10,
          background: '#eee',
        }}
      />
    </div>
  );
}
