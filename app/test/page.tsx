'use client';

import { useState, useEffect, useRef } from 'react';

export default function TestPage() {
  const [info, setInfo] = useState<Record<string, string>>({});
  const mapRef1 = useRef<HTMLDivElement>(null);
  const mapRef2 = useRef<HTMLDivElement>(null);
  const [mapStatus1, setMapStatus1] = useState('Loading...');
  const [mapStatus2, setMapStatus2] = useState('Loading...');

  useEffect(() => {
    // Collect device info
    const data: Record<string, string> = {};
    data['User Agent'] = navigator.userAgent;
    data['Platform'] = navigator.platform;
    data['Max Touch Points'] = String(navigator.maxTouchPoints);
    data['Screen'] = `${screen.width}x${screen.height} @${devicePixelRatio}x`;
    data['Window Inner'] = `${window.innerWidth}x${window.innerHeight}`;
    data['Is iPad (Touch+Mac)'] = (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent)) ? 'Yes' : 'No';

    // Check WebGL with debug info
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        data['WebGL Renderer'] = String(renderer);
        data['WebGL Vendor'] = String(vendor);
        data['Max Texture Size'] = String(gl.getParameter(gl.MAX_TEXTURE_SIZE));
        data['Max Viewport'] = JSON.stringify(gl.getParameter(gl.MAX_VIEWPORT_DIMS));
      } else {
        data['WebGL'] = 'NOT SUPPORTED';
      }
    } catch (e) {
      data['WebGL'] = `Error: ${e}`;
    }

    setInfo(data);

    // Load two maps: one default, one with pixelRatio:1
    const loadMaps = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');
        mapboxgl.accessToken = 'pk.eyJ1IjoidGdhdXNzIiwiYSI6ImUxelFyZWsifQ.ewANL0BvfdZa9RRcOIQSVA';

        // Map 1: Default settings
        if (mapRef1.current) {
          setMapStatus1('Creating map (default)...');
          const map1 = new mapboxgl.Map({
            container: mapRef1.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-122.5334, 45.5976],
            zoom: 14,
          });
          map1.on('error', (e: unknown) => setMapStatus1(`Error: ${JSON.stringify(e)}`));
          map1.on('style.load', () => {
            const c = map1.getCanvas();
            setMapStatus1(`Style OK. Canvas: ${c.width}x${c.height}`);
          });
          map1.on('load', () => setMapStatus1(p => p + ' | TILES LOADED ✅'));
          map1.on('idle', () => setMapStatus1(p => p.includes('IDLE') ? p : p + ' | IDLE'));
          setTimeout(() => map1.resize(), 1000);
        }

        // Map 2: pixelRatio:1 + preserveDrawingBuffer
        if (mapRef2.current) {
          setMapStatus2('Creating map (pixelRatio:1)...');
          const map2 = new mapboxgl.Map({
            container: mapRef2.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-122.5334, 45.5976],
            zoom: 14,
            pixelRatio: 1,
            preserveDrawingBuffer: true,
            failIfMajorPerformanceCaveat: false,
          });
          map2.on('error', (e: unknown) => setMapStatus2(`Error: ${JSON.stringify(e)}`));
          map2.on('style.load', () => {
            const c = map2.getCanvas();
            setMapStatus2(`Style OK. Canvas: ${c.width}x${c.height}`);
          });
          map2.on('load', () => setMapStatus2(p => p + ' | TILES LOADED ✅'));
          map2.on('idle', () => setMapStatus2(p => p.includes('IDLE') ? p : p + ' | IDLE'));
          setTimeout(() => map2.resize(), 1000);
        }
      } catch (e) {
        setMapStatus1(`FAILED: ${e}`);
      }
    };

    loadMaps();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 11 }}>
      <h1 style={{ fontSize: 16 }}>iPad Map Debug v2</h1>

      <h2 style={{ fontSize: 13, marginTop: 12 }}>Device Info:</h2>
      {Object.entries(info).map(([k, v]) => (
        <div key={k}><strong>{k}:</strong> {v}</div>
      ))}

      <h2 style={{ fontSize: 13, marginTop: 12 }}>Map 1 (default): {mapStatus1}</h2>
      <div ref={mapRef1} style={{ width: '100%', height: 300, border: '2px solid red', background: '#eee' }} />

      <h2 style={{ fontSize: 13, marginTop: 12 }}>Map 2 (pixelRatio:1): {mapStatus2}</h2>
      <div ref={mapRef2} style={{ width: '100%', height: 300, border: '2px solid blue', background: '#eee' }} />
    </div>
  );
}
