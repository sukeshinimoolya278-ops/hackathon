import React, { useRef, useEffect } from 'react';
import { OfflineTraceableRoute, Camp } from '../../types';
import { Compass, Footprints, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TacticalRadarCanvasProps {
  route: OfflineTraceableRoute | null;
  camps: Camp[];
  epicenter: { latitude: number; longitude: number; name: string } | null;
  userCoords: { latitude: number; longitude: number } | null;
  breadcrumbs: { latitude: number; longitude: number }[];
}

export const TacticalRadarCanvas: React.FC<TacticalRadarCanvasProps> = ({
  route,
  camps,
  epicenter,
  userCoords,
  breadcrumbs,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background: Tactical dark radar grid
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid concentric circles
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (let r = 50; r <= Math.min(width, height) / 2; r += 50) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Determine bounding box of points
    const points: [number, number][] = [];
    if (route) route.coordinates.forEach((c) => points.push(c));
    if (epicenter) points.push([epicenter.latitude, epicenter.longitude]);
    if (userCoords) points.push([userCoords.latitude, userCoords.longitude]);
    camps.forEach((c) => points.push([c.latitude, c.longitude]));

    if (points.length === 0) return;

    let minLat = points[0][0];
    let maxLat = points[0][0];
    let minLng = points[0][1];
    let maxLng = points[0][1];

    points.forEach(([lat, lng]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    const padding = 0.015;
    minLat -= padding;
    maxLat += padding;
    minLng -= padding;
    maxLng += padding;

    const toCanvasX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * (width - 80) + 40;
    const toCanvasY = (lat: number) => height - (((lat - minLat) / (maxLat - minLat)) * (height - 80) + 40);

    // 1. Draw Epicenter Hazard Zone
    if (epicenter) {
      const eX = toCanvasX(epicenter.longitude);
      const eY = toCanvasY(epicenter.latitude);

      const grad = ctx.createRadialGradient(eX, eY, 10, eX, eY, 70);
      grad.addColorStop(0, 'rgba(225, 29, 72, 0.5)');
      grad.addColorStop(1, 'rgba(225, 29, 72, 0.03)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(eX, eY, 70, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e11d48';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center dot
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(eX, eY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`🚨 EPICENTER`, eX + 10, eY - 5);
    }

    // 2. Draw Breadcrumbs trail
    if (breadcrumbs.length > 1) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      breadcrumbs.forEach((crumb, idx) => {
        const x = toCanvasX(crumb.longitude);
        const y = toCanvasY(crumb.latitude);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Traceable Evacuation Route Line
    if (route && route.coordinates.length > 1) {
      // Glow underlay
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.3)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      route.coordinates.forEach(([lat, lng], idx) => {
        const x = toCanvasX(lng);
        const y = toCanvasY(lat);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Sharp dashed traceable line
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      route.coordinates.forEach(([lat, lng], idx) => {
        const x = toCanvasX(lng);
        const y = toCanvasY(lat);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Waypoints on route
      route.waypoints.forEach((wp, idx) => {
        const x = toCanvasX(wp.longitude);
        const y = toCanvasY(wp.latitude);

        ctx.fillStyle = wp.isHazardAvoidance ? '#d97706' : idx === route.waypoints.length - 1 ? '#059669' : '#0d9488';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`${idx + 1}`, x - 2.5, y + 3);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.fillText(wp.title, x + 10, y + 3);
      });
    }

    // 4. Draw Camps
    camps.forEach((c) => {
      const cX = toCanvasX(c.longitude);
      const cY = toCanvasY(c.latitude);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cX, cY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`⛺ ${c.name}`, cX + 8, cY + 4);
    });

    // 5. Draw User Departure Position
    const origLat = route ? route.origin.latitude : userCoords ? userCoords.latitude : null;
    const origLng = route ? route.origin.longitude : userCoords ? userCoords.longitude : null;

    if (origLat !== null && origLng !== null) {
      const uX = toCanvasX(origLng);
      const uY = toCanvasY(origLat);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(uX, uY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`📍 YOU (ORIGIN)`, uX + 12, uY + 4);
    }
  }, [route, camps, epicenter, userCoords, breadcrumbs]);

  return (
    <div className="relative w-full h-[480px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col">
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <strong className="text-teal-400 font-bold uppercase tracking-wider">
            Offline Tactical Vector Radar (No Remote Net Required)
          </strong>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Rendered locally via In-Browser Geometry Canvas
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={700}
        height={430}
        className="w-full h-full block"
      />

      {route && (
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-teal-500/40 text-xs flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-400" />
            <span>
              Heading: <strong className="font-mono text-emerald-400">{route.waypoints[0]?.bearingDegrees}° {route.waypoints[0]?.bearingCardinal}</strong>
            </span>
            <span className="text-slate-500">&bull;</span>
            <span>
              Distance: <strong className="text-teal-300">{route.totalDistanceKm} km</strong>
            </span>
            <span className="text-slate-500">&bull;</span>
            <span>
              ETA: <strong className="text-sky-300">~{route.estimatedMinutes} mins</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-300">
            {route.hazardAvoidanceNotice}
          </div>
        </div>
      )}
    </div>
  );
};
