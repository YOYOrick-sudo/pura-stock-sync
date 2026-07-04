import type { CSSProperties, ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */
export const EUR0 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const EUR2 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const NUM  = new Intl.NumberFormat('nl-NL');

/** Compact euro axis label — €12k / €6,3k / €820 (matches reference axisEUR). */
export function axisEUR(v: number): string {
  if (v >= 1000) {
    const k = v / 1000;
    const s = (k >= 10 ? Math.round(k) : Number(k.toFixed(1))).toString().replace('.', ',');
    return '€' + s + 'k';
  }
  return '€' + Math.round(v);
}

/* ------------------------------------------------------------------ */
/* SVG geometry helpers                                                */
/* ------------------------------------------------------------------ */

/** Catmull–Rom to cubic-Bezier path — smooth line through points. */
export function smoothPath(pts: { x: number; y: number }[]): string {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Rounded-top rectangle path (bars). */
export function roundedTopBar(x: number, y: number, w: number, hh: number, r: number): string {
  const rr = Math.min(r, w / 2, Math.max(0.1, hh));
  return `M${x},${y + hh} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + hh} Z`;
}

/* Compute hover index from mouse position over an SVG element. */
export function svgHoverIndex(
  e: React.MouseEvent<SVGSVGElement>,
  n: number,
  padL: number,
  plotW: number,
  W: number,
): number {
  const r = e.currentTarget.getBoundingClientRect();
  const xVB = ((e.clientX - r.left) / r.width) * W;
  let idx = Math.round((xVB - padL) / (plotW / (n - 1)));
  if (idx < 0) idx = 0;
  if (idx > n - 1) idx = n - 1;
  return idx;
}

/* ------------------------------------------------------------------ */
/* Tooltip primitives                                                  */
/* ------------------------------------------------------------------ */

export function TipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: '0 0 auto' }} />
      <span style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

/** Floating tooltip card, positioned absolutely inside a relative wrapper by percentage. */
export function TipCard({
  children,
  leftPct,
  transform,
}: { children: ReactNode; leftPct: number; transform: string }) {
  const style: CSSProperties = {
    position: 'absolute',
    left: leftPct + '%',
    top: 4,
    transform,
    pointerEvents: 'none',
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 12,
    boxShadow: '0 14px 30px -10px rgba(0,0,0,0.22)',
    padding: '10px 12px',
    minWidth: 172,
    zIndex: 5,
    animation: 'cj-tipIn .12s ease',
    color: 'hsl(var(--foreground))',
  };
  return <div style={style}>{children}</div>;
}

/** Small ▲/▼ delta pill using the reference colors. */
export function DeltaPill({ pct, size = 'sm' }: { pct: number | null | undefined; size?: 'sm' | 'md' }) {
  const s = size === 'md' ? { fontSize: 11.5, padding: '2px 7px' } : { fontSize: 11, padding: '2px 6px' };
  if (pct == null) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', borderRadius: 6, fontWeight: 700,
        background: 'hsl(var(--chart-track))', color: 'hsl(var(--muted-foreground))', ...s,
      }}>—</span>
    );
  }
  if (Math.abs(pct) < 0.05) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', borderRadius: 6, fontWeight: 700,
        background: 'hsl(var(--chart-track))', color: 'hsl(var(--muted-foreground))', ...s,
      }}>0,0%</span>
    );
  }
  const up = pct >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 6, fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
      background: up ? 'rgb(209 250 229)' : 'rgb(255 225 229)',
      color:      up ? 'rgb(4 120 87)'    : 'rgb(190 18 60)',
      ...s,
    }}>
      {(up ? '▲ +' : '▼ ') + pct.toFixed(1) + '%'}
    </span>
  );
}

/** Horizontal transform helper for tooltip edge-clamping. */
export function tipTransform(leftPct: number): string {
  if (leftPct > 66) return 'translateX(-100%) translateX(-12px)';
  if (leftPct < 14) return 'translateX(12px)';
  return 'translateX(-50%)';
}
