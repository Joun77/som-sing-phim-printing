import React, { useEffect, useRef, useState } from 'react';
import { Eye, Layers, Maximize2, ShieldCheck, Ruler, Disc, Scissors } from 'lucide-react';

export type GrommetMode = 'NONE' | 'FOUR_CORNERS' | 'EVERY_50CM';

export interface PrintArtworkVisualizerProps {
  widthCm: number;
  heightCm: number;
  artworkUrl?: string;
  grommetPositions?: GrommetMode;
  hasHemming?: boolean;
  className?: string;
}

export const PrintArtworkVisualizer: React.FC<PrintArtworkVisualizerProps> = ({
  widthCm = 100,
  heightCm = 200,
  artworkUrl,
  grommetPositions = 'NONE',
  hasHemming = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);

  // Load image when artworkUrl changes
  useEffect(() => {
    if (!artworkUrl) {
      setLoadedImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = artworkUrl;
    img.onload = () => setLoadedImage(img);
    img.onerror = () => setLoadedImage(null);
  }, [artworkUrl]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High-DPI Displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width > 0 ? rect.width : 540;
    const displayHeight = rect.height > 0 ? rect.height : 380;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // 1. Draw Canvas Blueprint Background Grid
    drawBlueprintGrid(ctx, displayWidth, displayHeight);

    // 2. Compute Proportional Fit Box for the Banner / Artwork
    const margin = 45; // Space for dimension arrows and labels
    const maxDrawWidth = displayWidth - margin * 2;
    const maxDrawHeight = displayHeight - margin * 2;

    const safeWidthCm = Math.max(widthCm, 10);
    const safeHeightCm = Math.max(heightCm, 10);
    const aspectRatio = safeWidthCm / safeHeightCm;

    let bannerW = maxDrawWidth;
    let bannerH = bannerW / aspectRatio;

    if (bannerH > maxDrawHeight) {
      bannerH = maxDrawHeight;
      bannerW = bannerH * aspectRatio;
    }

    const bannerX = (displayWidth - bannerW) / 2;
    const bannerY = (displayHeight - bannerH) / 2;

    // 3. Draw Shadow & Outer Canvas Sheet
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
    ctx.restore();

    // 4. Draw Artwork or Placeholder Pattern
    ctx.save();
    ctx.beginPath();
    ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.clip();

    if (loadedImage) {
      ctx.drawImage(loadedImage, bannerX, bannerY, bannerW, bannerH);
    } else {
      drawPlaceholderPattern(ctx, bannerX, bannerY, bannerW, bannerH, safeWidthCm, safeHeightCm);
    }
    ctx.restore();

    // 5. Draw Hemming (พับขอบ) & Stitching Lines
    if (hasHemming) {
      const hemInset = Math.max(6, Math.min(bannerW, bannerH) * 0.04);

      // Subtle Hem Shadow Overlay
      ctx.save();
      ctx.lineWidth = hemInset;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.strokeRect(
        bannerX + hemInset / 2,
        bannerY + hemInset / 2,
        bannerW - hemInset,
        bannerH - hemInset
      );

      // Stitch line (Dashed)
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#e11d48'; // Rose color stitch
      ctx.strokeRect(
        bannerX + hemInset,
        bannerY + hemInset,
        bannerW - hemInset * 2,
        bannerH - hemInset * 2
      );
      ctx.restore();
    }

    // 6. Draw Bleed & Safe Zone Guides
    if (showGuides) {
      const safeInset = Math.max(8, Math.min(bannerW, bannerH) * 0.06);

      // Safe Margin (Cyan Dashed)
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)'; // Cyan 500
      ctx.strokeRect(
        bannerX + safeInset,
        bannerY + safeInset,
        bannerW - safeInset * 2,
        bannerH - safeInset * 2
      );

      // Bleed Outer Line (Amber Solid)
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)'; // Amber 500
      ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
      ctx.restore();
    }

    // 7. Calculate and Draw Grommets (ตอกตาไก่ Metallic Rings)
    const grommetPoints = calculateGrommetPoints(
      bannerX,
      bannerY,
      bannerW,
      bannerH,
      safeWidthCm,
      safeHeightCm,
      grommetPositions
    );

    grommetPoints.forEach(([gx, gy]) => {
      drawMetallicGrommet(ctx, gx, gy);
    });

    // 8. Draw Dimension Annotations & Arrows
    if (showDimensions) {
      drawDimensions(ctx, bannerX, bannerY, bannerW, bannerH, safeWidthCm, safeHeightCm);
    }
  }, [widthCm, heightCm, loadedImage, grommetPositions, hasHemming, showGuides, showDimensions]);

  return (
    <div className={`flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-md shadow-2xl overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Interactive 2D Artwork Visualizer</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
            {widthCm} × {heightCm} cm
          </span>
        </div>

        {/* Toggle Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuides((prev) => !prev)}
            className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-all ${
              showGuides
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="ສະແດງເສັ້ນ Safe Zone / Bleed Line"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safe Zone</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDimensions((prev) => !prev)}
            className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-all ${
              showDimensions
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="ສະແດງຂະໜາດມິຕິ"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>ມິຕິສັດສ່ວນ</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div ref={containerRef} className="relative w-full h-[360px] flex items-center justify-center p-2">
        <canvas ref={canvasRef} className="w-full h-full block rounded-xl cursor-crosshair" />

        {/* Overlay Badges */}
        <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 pointer-events-none text-[11px]">
          {grommetPositions !== 'NONE' && (
            <span className="px-2 py-1 rounded-md bg-slate-900/90 text-amber-300 border border-amber-500/40 shadow-sm backdrop-blur-sm flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-amber-400" />
              <span>ຕອກຕາໄກ່: {grommetPositions === 'FOUR_CORNERS' ? '4 ມຸມ' : 'ທຸກໆ 50 cm'}</span>
            </span>
          )}
          {hasHemming && (
            <span className="px-2 py-1 rounded-md bg-slate-900/90 text-rose-300 border border-rose-500/40 shadow-sm backdrop-blur-sm flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-rose-400" />
              <span>ພັບຂອບຮອບດ້ານ</span>
            </span>
          )}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>Safe Margin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Cut / Bleed Line</span>
          </div>
          {hasHemming && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-500 border border-dashed border-rose-400"></span>
              <span>Stitch Hem</span>
            </div>
          )}
        </div>
        <div className="text-slate-500 italic">
          ອັດຕາສ່ວນຈຳລອງແບບ Real-time ຕາມສະເກວຈິງ
        </div>
      </div>
    </div>
  );
};

// Helper: Draw Blueprint Background Grid
function drawBlueprintGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0f172a'; // Slate 900
  ctx.fillRect(0, 0, w, h);

  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)'; // Slate 700 subtle grid

  const gridSize = 20;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

// Helper: Draw Placeholder Pattern when no image uploaded
function drawPlaceholderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  widthCm: number,
  heightCm: number
) {
  // Gradient Base
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Diagonal Blueprint Stripe Lines
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
  ctx.lineWidth = 1;
  const step = 24;
  for (let d = -h; d < w + h; d += step) {
    ctx.beginPath();
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h, y + h);
    ctx.stroke();
  }

  // Centered Artwork Placeholder Icon & Text
  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Artwork Preview Area', cx, cy - 10);

  ctx.fillStyle = '#64748b';
  ctx.font = '400 11px Inter, system-ui, sans-serif';
  ctx.fillText(`${widthCm} cm × ${heightCm} cm`, cx, cy + 12);
}

// Helper: Calculate Grommet Ring Coordinates
function calculateGrommetPoints(
  x: number,
  y: number,
  w: number,
  h: number,
  widthCm: number,
  heightCm: number,
  mode: GrommetMode
): [number, number][] {
  if (mode === 'NONE') return [];

  const padding = Math.max(10, Math.min(w, h) * 0.05);
  const x0 = x + padding;
  const x1 = x + w - padding;
  const y0 = y + padding;
  const y1 = y + h - padding;

  if (mode === 'FOUR_CORNERS') {
    return [
      [x0, y0],
      [x1, y0],
      [x0, y1],
      [x1, y1],
    ];
  }

  // EVERY_50CM Calculation
  const points: [number, number][] = [];
  const segmentsX = Math.max(1, Math.round(widthCm / 50));
  const segmentsY = Math.max(1, Math.round(heightCm / 50));

  // Top and Bottom edges
  for (let i = 0; i <= segmentsX; i++) {
    const px = x0 + (i / segmentsX) * (x1 - x0);
    points.push([px, y0]);
    points.push([px, y1]);
  }

  // Left and Right edges (excluding corners already added)
  for (let j = 1; j < segmentsY; j++) {
    const py = y0 + (j / segmentsY) * (y1 - y0);
    points.push([x0, py]);
    points.push([x1, py]);
  }

  return points;
}

// Helper: Draw Metallic Grommet Ring (ตาไก่)
function drawMetallicGrommet(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const outerR = 6;
  const innerR = 2.5;

  ctx.save();
  // Drop Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1.5;

  // Outer Metal Ring (Brass / Steel Gradient)
  const grad = ctx.createRadialGradient(cx - 1, cy - 1, innerR, cx, cy, outerR);
  grad.addColorStop(0, '#fde047'); // Gold brass highlight
  grad.addColorStop(0.5, '#ca8a04');
  grad.addColorStop(1, '#713f12');

  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Outer Edge Ring
  ctx.save();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Inner Eyelet Hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a'; // Background cutout
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();
}

// Helper: Draw Dimension Lines & Text
function drawDimensions(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  widthCm: number,
  heightCm: number
) {
  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 11px Inter, system-ui, sans-serif';
  ctx.lineWidth = 1;

  // 1. Top Width Dimension Line
  const topY = y - 16;
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x + w, topY);
  // End ticks
  ctx.moveTo(x, topY - 4);
  ctx.lineTo(x, topY + 4);
  ctx.moveTo(x + w, topY - 4);
  ctx.lineTo(x + w, topY + 4);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${widthCm} cm`, x + w / 2, topY - 2);

  // 2. Right Height Dimension Line
  const rightX = x + w + 16;
  ctx.beginPath();
  ctx.moveTo(rightX, y);
  ctx.lineTo(rightX, y + h);
  // End ticks
  ctx.moveTo(rightX - 4, y);
  ctx.lineTo(rightX + 4, y);
  ctx.moveTo(rightX - 4, y + h);
  ctx.lineTo(rightX + 4, y + h);
  ctx.stroke();

  ctx.save();
  ctx.translate(rightX + 12, y + h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${heightCm} cm`, 0, 0);
  ctx.restore();

  ctx.restore();
}
