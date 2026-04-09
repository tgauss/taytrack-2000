'use client';

import { useState, useEffect, useRef } from 'react';

export default function TestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${ts}] ${msg}`]);
  };

  useEffect(() => {
    // ---- DEVICE INFO ----
    log(`UA: ${navigator.userAgent}`);
    log(`Screen: ${screen.width}x${screen.height} @${devicePixelRatio}x`);
    log(`Window: ${window.innerWidth}x${window.innerHeight}`);
    const isIPad = navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent);
    log(`iPad: ${isIPad}`);

    // ---- WEBGL INFO ----
    try {
      const canvas = document.createElement('canvas');
      // Try webgl (not webgl2) to see if that's more stable
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'no debug ext';
        log(`WebGL1 Renderer: ${renderer}`);
        log(`Max Texture: ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}`);
        log(`Context lost? ${gl.isContextLost()}`);
      }
      const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
      log(`WebGL2 available: ${!!gl2}`);
    } catch (e) {
      log(`WebGL error: ${e}`);
    }

    // ---- SINGLE MAP TEST ----
    const loadMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');

        log(`Mapbox v${mapboxgl.version}`);
        log(`supported(): ${mapboxgl.supported()}`);
        log(`supported(strict): ${mapboxgl.supported({ failIfMajorPerformanceCaveat: true })}`);

        mapboxgl.accessToken = 'pk.eyJ1IjoidGdhdXNzIiwiYSI6ImUxelFyZWsifQ.ewANL0BvfdZa9RRcOIQSVA';

        if (!mapRef.current) { log('No container'); return; }

        const rect = mapRef.current.getBoundingClientRect();
        log(`Container: ${rect.width}x${rect.height}`);

        // Single map, minimal settings, low pixel ratio
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-122.5334, 45.5976],
          zoom: 13,
          pixelRatio: 1,
          antialias: false,
          fadeDuration: 0,
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: true,
        });

        map.on('error', (e: unknown) => log(`MAP ERROR: ${JSON.stringify(e)}`));

        map.on('webglcontextlost', (e: unknown) => {
          log('⚠️ WEBGL CONTEXT LOST');
          // Try to prevent default to allow restoration
          if (e && typeof e === 'object' && 'originalEvent' in e) {
            (e as { originalEvent: Event }).originalEvent.preventDefault();
            log('Called preventDefault on context lost');
          }
        });

        map.on('webglcontextrestored', () => {
          log('✅ WEBGL CONTEXT RESTORED');
        });

        map.on('style.load', () => {
          const c = map.getCanvas();
          log(`style.load — Canvas: ${c.width}x${c.height}`);
          log(`Canvas context lost? ${c.getContext('webgl2')?.isContextLost() ?? 'n/a'}`);
        });

        map.on('load', () => log('FULLY LOADED ✅'));
        map.on('idle', () => log('IDLE ✅'));

        // Check canvas state after delays
        setTimeout(() => {
          map.resize();
          const c = map.getCanvas();
          const gl = c.getContext('webgl2') || c.getContext('webgl');
          log(`1s: canvas ${c.width}x${c.height}, context lost: ${gl?.isContextLost()}`);
        }, 1000);

        setTimeout(() => {
          map.resize();
          const c = map.getCanvas();
          const gl = c.getContext('webgl2') || c.getContext('webgl');
          log(`5s: canvas ${c.width}x${c.height}, context lost: ${gl?.isContextLost()}`);
          log(`Tiles loaded: ${map.areTilesLoaded()}, moving: ${map.isMoving()}`);
        }, 5000);

      } catch (e) {
        log(`FAILED: ${e}`);
      }
    };

    loadMap();
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 11, padding: 10 }}>
      <h1 style={{ fontSize: 15, margin: '0 0 8px' }}>iPad Map Debug v4 — Single Map</h1>

      <details open>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Debug Log ({logs.length})</summary>
        <div style={{ background: '#111', color: '#0f0', padding: 8, maxHeight: 250, overflow: 'auto', fontSize: 10, borderRadius: 4, marginTop: 4 }}>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </details>

      <h2 style={{ fontSize: 12, marginTop: 10 }}>Single Map — pixelRatio:1, no antialias, failIfMajorPerformanceCaveat:false</h2>
      <div ref={mapRef} style={{ width: '100%', height: 500, border: '2px solid red', background: '#ddd' }} />

      <div style={{ marginTop: 10, padding: 8, background: '#222', color: '#ff0', borderRadius: 4, fontSize: 11 }}>
        <strong>If map is blank:</strong> Try opening Safari Settings → Advanced → check &quot;WebGL 2.0&quot; is enabled.
        Also try closing all other browser tabs to free GPU memory.
      </div>
    </div>
  );
}
