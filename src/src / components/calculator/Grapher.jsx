import React, { useRef, useEffect, useState, useCallback } from 'react';
import { evaluateExpression } from '@/lib/mathEngine';
import { ZoomIn, ZoomOut, RotateCcw, LineChart } from 'lucide-react';

function niceStep(rough) {
  if (rough <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  let s;
  if (norm < 1.5) s = 1;
  else if (norm < 3) s = 2;
  else if (norm < 7) s = 5;
  else s = 10;
  return s * pow;
}

function formatTick(v) {
  if (Math.abs(v) < 1e-9) return '0';
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(1);
  return parseFloat(v.toPrecision(6)).toString();
}

export default function Grapher() {
  const [expr, setExpr] = useState('sin(x)');
  const [view, setView] = useState({ cx: 0, cy: 0, scale: 50 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const exprRef = useRef(expr);
  exprRef.current = expr;
  const dragRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const { cx, cy, scale } = viewRef.current;
    const toPx = (x, y) => [w / 2 + (x - cx) * scale, h / 2 - (y - cy) * scale];
    const xMin = cx - w / (2 * scale);
    const xMax = cx + w / (2 * scale);
    const yMin = cy - h / (2 * scale);
    const yMax = cy + h / (2 * scale);

    // grid
    const step = niceStep(80 / scale);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148,163,184,0.22)';
    ctx.beginPath();
    for (let gx = Math.ceil(xMin / step) * step; gx <= xMax; gx += step) {
      const [px] = toPx(gx, 0);
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
    }
    for (let gy = Math.ceil(yMin / step) * step; gy <= yMax; gy += step) {
      const [, py] = toPx(0, gy);
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
    }
    ctx.stroke();

    // axes
    const [axisX, axisY] = toPx(0, 0);
    ctx.strokeStyle = 'rgba(148,163,184,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (axisY >= 0 && axisY <= h) {
      ctx.moveTo(0, axisY);
      ctx.lineTo(w, axisY);
    }
    if (axisX >= 0 && axisX <= w) {
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, h);
    }
    ctx.stroke();

    // tick labels
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (let gx = Math.ceil(xMin / step) * step; gx <= xMax; gx += step) {
      if (Math.abs(gx) < 1e-9) continue;
      const [px] = toPx(gx, 0);
      const ly = Math.min(Math.max(axisY + 14, 14), h - 4);
      ctx.fillText(formatTick(gx), px, ly);
    }
    ctx.textAlign = 'right';
    for (let gy = Math.ceil(yMin / step) * step; gy <= yMax; gy += step) {
      if (Math.abs(gy) < 1e-9) continue;
      const [, py] = toPx(0, gy);
      const lx = Math.min(Math.max(axisX - 6, 30), w - 4);
      ctx.fillText(formatTick(gy), lx, py + 4);
    }

    // curve
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    let prevY = null;
    const samples = w;
    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      let y;
      try {
        y = evaluateExpression(exprRef.current, { x });
      } catch {
        started = false;
        prevY = null;
        continue;
      }
      if (!isFinite(y)) {
        started = false;
        prevY = null;
        continue;
      }
      const [, py] = toPx(x, y);
      if (!started || (prevY !== null && Math.abs(y - prevY) > (yMax - yMin) * 2)) {
        ctx.moveTo(i, py);
        started = true;
      } else {
        ctx.lineTo(i, py);
      }
      prevY = y;
    }
    ctx.stroke();
  }, []);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(() => draw());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [view, expr, draw]);

  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setView((v) => ({ ...v, scale: Math.max(3, Math.min(5000, v.scale * factor)) }));
  };
  const onDown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    dragRef.current = { x: p.clientX, y: p.clientY, cx: view.cx, cy: view.cy };
  };
  const onMove = (e) => {
    if (!dragRef.current) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - dragRef.current.x;
    const dy = p.clientY - dragRef.current.y;
    setView((v) => ({
      ...v,
      cx: dragRef.current.cx - dx / v.scale,
      cy: dragRef.current.cy + dy / v.scale,
    }));
    if (e.touches) e.preventDefault();
  };
  const onUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium mb-2">
          <LineChart className="w-4 h-4" /> Function Grapher
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-mono text-sm">f(x) =</span>
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="e.g. sin(x), x^2, 1/x"
            className="flex-1 bg-slate-800 text-white rounded-xl px-3 py-2.5 text-base font-mono outline-none focus:ring-2 ring-indigo-500"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {['sin(x)', 'cos(x)', 'x^2', 'x^3 - 3*x', '1/x', 'sqrt(x)', 'exp(-x^2)'].map((ex) => (
            <button
              key={ex}
              onClick={() => setExpr(ex)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/50"
        style={{ height: 360 }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
          onWheel={onWheel}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => setView((v) => ({ ...v, scale: Math.min(5000, v.scale * 1.25) }))}
            className="p-2 rounded-lg bg-slate-800/80 text-white hover:bg-slate-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView((v) => ({ ...v, scale: Math.max(3, v.scale / 1.25) }))}
            className="p-2 rounded-lg bg-slate-800/80 text-white hover:bg-slate-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView({ cx: 0, cy: 0, scale: 50 })}
            className="p-2 rounded-lg bg-slate-800/80 text-white hover:bg-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center">
        Scroll to zoom • Drag to pan • All rendering is local
      </p>
    </div>
  );
}
