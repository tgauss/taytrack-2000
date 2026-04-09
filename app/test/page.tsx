'use client';

import { useState, useEffect, useRef } from 'react';

export default function TestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const mapRef1 = useRef<HTMLDivElement>(null);
  const mapRef2 = useRef<HTMLDivElement>(null);
  const mapRef3 = useRef<HTMLDivElement>(null);

  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${ts}] ${msg}`]);
  };

  useEffect(() => {
    // ---- DEVICE INFO ----
    log(`UA: ${navigator.userAgent}`);
    log(`Platform: ${navigator.platform} | Touch: ${navigator.maxTouchPoints}`);
    log(`Screen: ${screen.width}x${screen.height} @${devicePixelRatio}x`);
    log(`Window: ${window.innerWidth}x${window.innerHeight}`);
    const isIPad = navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent);
    log(`iPad detected: ${isIPad}`);

    // ---- WEBGL INFO ----
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        log(`WebGL Renderer: ${renderer}`);
        log(`WebGL Vendor: ${vendor}`);
        log(`Max Texture: ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}`);
        log(`Max Viewport: ${JSON.stringify(gl.getParameter(gl.MAX_VIEWPORT_DIMS))}`);
      } else {
        log('WebGL: NOT SUPPORTED');
      }
    } catch (e) {
      log(`WebGL error: ${e}`);
    }

    // ---- MAPBOX SUPPORT CHECK ----
    const loadMaps = async () => {
      try {
        log('Importing mapbox-gl...');
        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');

        log(`Mapbox GL JS version: ${mapboxgl.version}`);
        log(`supported(): ${mapboxgl.supported()}`);
        log(`supported(strict): ${mapboxgl.supported({ failIfMajorPerformanceCaveat: true })}`);

        mapboxgl.accessToken = 'pk.eyJ1IjoidGdhdXNzIiwiYSI6ImUxelFyZWsifQ.ewANL0BvfdZa9RRcOIQSVA';

        // ---- MAP 1: Fixed 500px height (simplest possible) ----
        if (mapRef1.current) {
          const r1 = mapRef1.current.getBoundingClientRect();
          log(`Map1 container before init: ${r1.width}x${r1.height}`);

          const map1 = new mapboxgl.Map({
            container: mapRef1.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-122.5334, 45.5976],
            zoom: 14,
            antialias: false,
          });

          requestAnimationFrame(() => {
            const r = mapRef1.current?.getBoundingClientRect();
            log(`Map1 container after init (rAF): ${r?.width}x${r?.height}`);
            map1.resize();
          });

          map1.on('error', (e: unknown) => log(`Map1 ERROR: ${JSON.stringify(e)}`));
          map1.on('webglcontextlost', () => log('Map1 WEBGL CONTEXT LOST'));
          map1.on('webglcontextrestored', () => log('Map1 WEBGL CONTEXT RESTORED'));
          map1.on('style.load', () => {
            const c = map1.getCanvas();
            log(`Map1 style.load — Canvas: ${c.width}x${c.height}`);
          });
          map1.on('load', () => log('Map1 FULLY LOADED ✅'));
          map1.on('idle', () => log('Map1 IDLE ✅'));

          setTimeout(() => { map1.resize(); log('Map1 resize at 1s'); }, 1000);
          setTimeout(() => { map1.resize(); log('Map1 resize at 3s'); }, 3000);
        }

        // ---- MAP 2: pixelRatio:1 + preserveDrawingBuffer ----
        if (mapRef2.current) {
          const r2 = mapRef2.current.getBoundingClientRect();
          log(`Map2 container before init: ${r2.width}x${r2.height}`);

          const map2 = new mapboxgl.Map({
            container: mapRef2.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-122.5334, 45.5976],
            zoom: 14,
            pixelRatio: 1,
            preserveDrawingBuffer: true,
            failIfMajorPerformanceCaveat: false,
            antialias: false,
          });

          map2.on('error', (e: unknown) => log(`Map2 ERROR: ${JSON.stringify(e)}`));
          map2.on('webglcontextlost', () => log('Map2 WEBGL CONTEXT LOST'));
          map2.on('style.load', () => {
            const c = map2.getCanvas();
            log(`Map2 style.load — Canvas: ${c.width}x${c.height}`);
          });
          map2.on('load', () => log('Map2 FULLY LOADED ✅'));
          map2.on('idle', () => log('Map2 IDLE ✅'));

          setTimeout(() => map2.resize(), 1000);
        }

        // ---- MAP 3: Mimics game page (absolute positioned, 100dvh, antialias) ----
        if (mapRef3.current) {
          const r3 = mapRef3.current.getBoundingClientRect();
          log(`Map3 container before init: ${r3.width}x${r3.height}`);

          const map3 = new mapboxgl.Map({
            container: mapRef3.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-122.5334, 45.5976],
            zoom: 14,
            antialias: true,
          });

          map3.on('error', (e: unknown) => log(`Map3 ERROR: ${JSON.stringify(e)}`));
          map3.on('webglcontextlost', () => log('Map3 WEBGL CONTEXT LOST'));
          map3.on('style.load', () => {
            const c = map3.getCanvas();
            log(`Map3 style.load — Canvas: ${c.width}x${c.height}`);
          });
          map3.on('load', () => log('Map3 FULLY LOADED ✅'));
          map3.on('idle', () => log('Map3 IDLE ✅'));

          setTimeout(() => map3.resize(), 1000);
          setTimeout(() => map3.resize(), 3000);
        }

      } catch (e) {
        log(`IMPORT FAILED: ${e}`);
      }
    };

    loadMaps();
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 11, padding: 10 }}>
      <h1 style={{ fontSize: 15, margin: '0 0 8px' }}>iPad Map Debug v3</h1>

      {/* LOG OUTPUT */}
      <details open>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Debug Log ({logs.length})</summary>
        <div style={{ background: '#111', color: '#0f0', padding: 8, maxHeight: 200, overflow: 'auto', fontSize: 10, borderRadius: 4, marginTop: 4 }}>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </details>

      {/* MAP 1: Fixed height */}
      <h2 style={{ fontSize: 12, marginTop: 10 }}>Map 1 — Fixed 500px height (simplest)</h2>
      <div ref={mapRef1} style={{ width: '100%', height: 500, border: '2px solid red', background: '#ddd' }} />

      {/* MAP 2: pixelRatio:1 */}
      <h2 style={{ fontSize: 12, marginTop: 10 }}>Map 2 — pixelRatio:1 + preserveDrawingBuffer</h2>
      <div ref={mapRef2} style={{ width: '100%', height: 500, border: '2px solid blue', background: '#ddd' }} />

      {/* MAP 3: Mimics game page layout */}
      <h2 style={{ fontSize: 12, marginTop: 10 }}>Map 3 — Game page layout (position:relative + absolute child)</h2>
      <div style={{ position: 'relative', width: '100%', height: 500, border: '2px solid green', background: '#ddd' }}>
        <div ref={mapRef3} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
