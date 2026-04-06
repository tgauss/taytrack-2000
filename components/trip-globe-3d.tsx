'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Plane, Car } from 'lucide-react';

// Trip locations [lng, lat]
const LOCATIONS = [
  { id: 'van', name: 'Vancouver', emoji: '🏠', lng: -122.6587, lat: 45.6387, color: '#00ff88', type: 'home' },
  { id: 'sea', name: 'Seattle',  emoji: '✈️',  lng: -122.3321, lat: 47.6062, color: '#00d4ff', type: 'layover' },
  { id: 'tul', name: 'Tulsa',    emoji: '🏛️', lng: -95.9928,  lat: 36.1540, color: '#ff6b6b', type: 'conference' },
  { id: 'lnk', name: 'Lincoln',  emoji: '🌽',  lng: -96.6852,  lat: 40.8136, color: '#ffd93d', type: 'destination' },
  { id: 'roc', name: 'Roca',     emoji: '📦',  lng: -96.6653,  lat: 40.6481, color: '#ffa500', type: 'work' },
  { id: 'oma', name: 'Omaha',    emoji: '🛫',  lng: -95.9345,  lat: 41.2565, color: '#00d4ff', type: 'departure' },
];

const SEGMENTS = [
  { from: 'van', to: 'sea', type: 'flight', label: 'Flight: Vancouver → Seattle' },
  { from: 'sea', to: 'tul', type: 'flight', label: 'Flight: Seattle → Tulsa' },
  { from: 'tul', to: 'lnk', type: 'drive',  label: 'Road Trip: Tulsa → Lincoln' },
  { from: 'lnk', to: 'roc', type: 'drive',  label: 'Drive: Lincoln → Roca' },
  { from: 'roc', to: 'oma', type: 'drive',  label: 'Drive: Roca → Omaha' },
  { from: 'oma', to: 'sea', type: 'flight', label: 'Flight: Omaha → Seattle' },
  { from: 'sea', to: 'van', type: 'flight', label: 'Flight: Seattle → Home! 🎉' },
];

// Convert lat/lng to 3D point on sphere of given radius
function toXYZ(lat: number, lng: number, r: number): [number, number, number] {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -(r * Math.sin(phi) * Math.cos(theta)),
     (r * Math.cos(phi)),
     (r * Math.sin(phi) * Math.sin(theta)),
  ];
}

// Project 3D → 2D given a rotation matrix (3x3 flat array) and canvas size
function project(
  x: number, y: number, z: number,
  rot: number[],
  cx: number, cy: number, scale: number
): { sx: number; sy: number; depth: number } | null {
  // Apply rotation
  const rx = rot[0]*x + rot[1]*y + rot[2]*z;
  const ry = rot[3]*x + rot[4]*y + rot[5]*z;
  const rz = rot[6]*x + rot[7]*y + rot[8]*z;

  // Perspective: only draw if in front
  const fov = 5;
  const perspective = fov / (fov + rz);
  if (perspective <= 0) return null;

  return {
    sx: cx + rx * scale * perspective,
    sy: cy - ry * scale * perspective,
    depth: rz,
  };
}

// Arc: interpolate N points between two sphere points, with lift
function arcPoints(
  latA: number, lngA: number,
  latB: number, lngB: number,
  r: number, lift: number, n = 60
): Array<[number, number, number]> {
  const [ax, ay, az] = toXYZ(latA, lngA, r);
  const [bx, by, bz] = toXYZ(latB, lngB, r);
  const pts: Array<[number, number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let px = ax + (bx - ax) * t;
    let py = ay + (by - ay) * t;
    let pz = az + (bz - az) * t;
    const len = Math.sqrt(px*px + py*py + pz*pz);
    const liftR = r + lift * Math.sin(t * Math.PI);
    px = (px / len) * liftR;
    py = (py / len) * liftR;
    pz = (pz / len) * liftR;
    pts.push([px, py, pz]);
  }
  return pts;
}

// Rotation matrix around Y axis
function rotY(a: number): number[] {
  return [Math.cos(a),0,Math.sin(a), 0,1,0, -Math.sin(a),0,Math.cos(a)];
}
// Rotation matrix around X axis
function rotX(a: number): number[] {
  return [1,0,0, 0,Math.cos(a),-Math.sin(a), 0,Math.sin(a),Math.cos(a)];
}
// Multiply two 3x3 flat matrices
function mulMat(A: number[], B: number[]): number[] {
  const C = new Array(9).fill(0);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      for (let k = 0; k < 3; k++)
        C[r*3+c] += A[r*3+k] * B[k*3+c];
  return C;
}

// Build all route arc points concatenated
function buildFullRoute() {
  const all: Array<[number, number, number]> = [];
  SEGMENTS.forEach((seg, i) => {
    const a = LOCATIONS.find(l => l.id === seg.from)!;
    const b = LOCATIONS.find(l => l.id === seg.to)!;
    const lift = seg.type === 'flight' ? 0.45 : 0.12;
    const pts = arcPoints(a.lat, a.lng, b.lat, b.lng, 1, lift, 60);
    if (i === 0) all.push(...pts);
    else all.push(...pts.slice(1));
  });
  return all;
}

const FULL_ROUTE = buildFullRoute();

// Build per-segment arc arrays
const SEGMENT_ARCS = SEGMENTS.map(seg => {
  const a = LOCATIONS.find(l => l.id === seg.from)!;
  const b = LOCATIONS.find(l => l.id === seg.to)!;
  const lift = seg.type === 'flight' ? 0.45 : 0.12;
  return arcPoints(a.lat, a.lng, b.lat, b.lng, 1, lift, 60);
});

export function TripGlobe3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef    = useRef<number | null>(null);
  const stateRef   = useRef({
    rotY: 0.4,
    rotX: -0.2,
    dragging: false,
    lastX: 0,
    lastY: 0,
    autoSpin: true,
    progress: 0,
    playing: false,
    currentSegment: 0,
  });

  const [uiState, setUiState] = useState({
    playing: false,
    progress: 0,
    currentSegment: 0,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const scale = Math.min(W, H) * 0.38;
    const R = 1; // unit sphere

    const s = stateRef.current;
    const rot = mulMat(rotX(s.rotX), rotY(s.rotY));

    ctx.clearRect(0, 0, W, H);

    // — Background starfield
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    // Static stars (seeded-ish using fixed positions)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const starSeed = [
      [45,23],[120,67],[200,15],[300,89],[380,44],[50,150],[170,130],
      [260,170],[340,120],[410,200],[80,220],[190,250],[310,230],[450,60],
      [30,300],[160,310],[290,280],[420,310],[100,350],[250,370],[390,350],
    ];
    for (const [sx, sy] of starSeed) {
      const r = ((sx * 7 + sy * 13) % 3) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(sx % W, sy % H, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // — Globe base
    const grad = ctx.createRadialGradient(cx - scale*0.2, cy - scale*0.2, scale*0.1, cx, cy, scale);
    grad.addColorStop(0, '#1a3a5c');
    grad.addColorStop(0.5, '#0d2340');
    grad.addColorStop(1, '#061528');
    ctx.beginPath();
    ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Globe glow
    const glowGrad = ctx.createRadialGradient(cx, cy, scale * 0.9, cx, cy, scale * 1.15);
    glowGrad.addColorStop(0, 'rgba(0,212,255,0.15)');
    glowGrad.addColorStop(1, 'rgba(0,212,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, scale * 1.15, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Globe border
    ctx.beginPath();
    ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,212,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // — Lat/lng grid lines (subtle)
    ctx.strokeStyle = 'rgba(0,212,255,0.08)';
    ctx.lineWidth = 0.5;
    for (let lat = -75; lat <= 75; lat += 15) {
      ctx.beginPath();
      let first = true;
      for (let lng = -180; lng <= 180; lng += 4) {
        const [gx, gy, gz] = toXYZ(lat, lng, R);
        const p = project(gx, gy, gz, rot, cx, cy, scale);
        if (!p) { first = true; continue; }
        if (first) { ctx.moveTo(p.sx, p.sy); first = false; }
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();
    }
    for (let lng = -180; lng <= 180; lng += 20) {
      ctx.beginPath();
      let first = true;
      for (let lat = -85; lat <= 85; lat += 4) {
        const [gx, gy, gz] = toXYZ(lat, lng, R);
        const p = project(gx, gy, gz, rot, cx, cy, scale);
        if (!p) { first = true; continue; }
        if (first) { ctx.moveTo(p.sx, p.sy); first = false; }
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();
    }

    // — Route arcs
    SEGMENTS.forEach((seg, idx) => {
      const pts = SEGMENT_ARCS[idx];
      const isActive = idx === s.currentSegment;
      const baseColor = seg.type === 'flight' ? '0,212,255' : '255,217,61';
      
      ctx.beginPath();
      let started = false;
      for (const [px, py, pz] of pts) {
        const p = project(px, py, pz, rot, cx, cy, scale);
        if (!p) { started = false; continue; }
        if (!started) { ctx.moveTo(p.sx, p.sy); started = true; }
        else ctx.lineTo(p.sx, p.sy);
      }

      if (seg.type === 'drive') {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = isActive
        ? `rgba(${baseColor},1)`
        : `rgba(${baseColor},0.35)`;
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // — Traveler position
    const totalPts = FULL_ROUTE.length - 1;
    const exactIdx = Math.min(s.progress * totalPts, totalPts);
    const idx0 = Math.floor(exactIdx);
    const t = exactIdx - idx0;
    const p0 = FULL_ROUTE[Math.min(idx0, totalPts)];
    const p1 = FULL_ROUTE[Math.min(idx0 + 1, totalPts)];
    const tx = p0[0] + (p1[0] - p0[0]) * t;
    const ty = p0[1] + (p1[1] - p0[1]) * t;
    const tz = p0[2] + (p1[2] - p0[2]) * t;
    const tp = project(tx, ty, tz, rot, cx, cy, scale);
    const isFlying = SEGMENTS[s.currentSegment]?.type === 'flight';

    if (tp) {
      // Glow
      const tGlow = ctx.createRadialGradient(tp.sx, tp.sy, 0, tp.sx, tp.sy, 16);
      tGlow.addColorStop(0, isFlying ? 'rgba(0,212,255,0.6)' : 'rgba(255,217,61,0.6)');
      tGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(tp.sx, tp.sy, 16, 0, Math.PI * 2);
      ctx.fillStyle = tGlow;
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(tp.sx, tp.sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = isFlying ? '#00d4ff' : '#ffd93d';
      ctx.fill();

      // Icon
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText(isFlying ? '✈️' : '🚗', tp.sx, tp.sy - 12);
    }

    // — Location markers (front-facing only)
    LOCATIONS.forEach(loc => {
      const [lx, ly, lz] = toXYZ(loc.lat, loc.lng, R);
      const p = project(lx, ly, lz, rot, cx, cy, scale);
      if (!p) return; // behind the globe

      const isSegActive =
        SEGMENTS[s.currentSegment]?.from === loc.id ||
        SEGMENTS[s.currentSegment]?.to   === loc.id;

      // Pulse ring
      if (isSegActive) {
        const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.006);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 10 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = loc.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 1 - pulse * 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Dot
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, isSegActive ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = loc.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.font = `bold ${isSegActive ? 12 : 10}px "Space Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(loc.name, p.sx + 1, p.sy - 9 + 1);
      ctx.fillStyle = isSegActive ? loc.color : 'rgba(255,255,255,0.9)';
      ctx.fillText(loc.name, p.sx, p.sy - 10);

      // Emoji
      ctx.font = '11px serif';
      ctx.fillText(loc.emoji, p.sx, p.sy - 20);
    });

    // Auto-spin
    if (s.autoSpin && !s.dragging) {
      s.rotY += 0.003;
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  // Start render loop
  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => ro.disconnect();
  }, []);

  // Playback animation
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (!stateRef.current.playing) return;
      stateRef.current.progress = Math.min(stateRef.current.progress + 0.0008, 1);
      const segIdx = Math.min(
        Math.floor(stateRef.current.progress * SEGMENTS.length),
        SEGMENTS.length - 1
      );
      stateRef.current.currentSegment = segIdx;

      if (stateRef.current.progress >= 1) {
        stateRef.current.playing = false;
        setUiState({ playing: false, progress: 1, currentSegment: SEGMENTS.length - 1 });
        return;
      }
      setUiState({
        playing: true,
        progress: stateRef.current.progress,
        currentSegment: segIdx,
      });
      raf = requestAnimationFrame(tick);
    };
    if (stateRef.current.playing) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [uiState.playing]);

  // Pointer drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    stateRef.current.dragging = true;
    stateRef.current.autoSpin = false;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!stateRef.current.dragging) return;
    const dx = e.clientX - stateRef.current.lastX;
    const dy = e.clientY - stateRef.current.lastY;
    stateRef.current.rotY += dx * 0.008;
    stateRef.current.rotX += dy * 0.008;
    stateRef.current.rotX = Math.max(-1.2, Math.min(1.2, stateRef.current.rotX));
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;
  };
  const onPointerUp = () => {
    stateRef.current.dragging = false;
  };

  const handlePlay = () => {
    stateRef.current.playing = !uiState.playing;
    stateRef.current.autoSpin = uiState.playing; // resume spin on pause
    setUiState(prev => ({ ...prev, playing: !prev.playing }));
  };

  const handleReset = () => {
    stateRef.current.playing = false;
    stateRef.current.progress = 0;
    stateRef.current.currentSegment = 0;
    stateRef.current.autoSpin = true;
    setUiState({ playing: false, progress: 0, currentSegment: 0 });
  };

  const currentSeg = SEGMENTS[uiState.currentSegment];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-[#0a0a1a]" style={{ height: 520 }}>
      {/* Title */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="font-mono text-[10px] text-primary tracking-widest opacity-70">TAYTRACK 2000</div>
        <div className="font-mono text-base font-bold text-foreground">3D Mission Globe</div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
        <div className="text-[10px] font-mono text-muted-foreground mb-1.5 tracking-widest">LEGEND</div>
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-[#00d4ff]" />
            <span className="text-white/80">Flight</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0 border-t-2 border-dashed border-[#ffd93d]" />
            <span className="text-white/80">Drive</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2">
        {/* Segment info */}
        <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            {currentSeg?.type === 'flight'
              ? <Plane className="w-4 h-4 text-primary shrink-0" />
              : <Car   className="w-4 h-4 text-secondary shrink-0" />
            }
            <span className="font-mono text-xs text-white truncate">
              {currentSeg?.label ?? 'Ready for adventure!'}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${uiState.progress * 100}%`,
                background: 'linear-gradient(to right, #00d4ff, #ffd93d)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-mono text-white/50">Vancouver</span>
            <span className="text-[10px] font-mono text-white/70">{Math.round(uiState.progress * 100)}%</span>
            <span className="text-[10px] font-mono text-white/50">Home!</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePlay}
            className="flex-1 max-w-xs bg-black/60 border-white/20 text-white hover:bg-white/10"
          >
            {uiState.playing
              ? <><Pause className="w-4 h-4 mr-2" />Pause</>
              : <><Play  className="w-4 h-4 mr-2" />Start Adventure!</>
            }
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="bg-black/60 border-white/20 text-white hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
