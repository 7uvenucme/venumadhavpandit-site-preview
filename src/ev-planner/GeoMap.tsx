import React from 'react';
import { GEO } from './geo';
import { FULL } from './geo_full';

const S = 10, C = Math.cos((22 * Math.PI) / 180), X0 = 66.5, Y1 = 37.5;
export const proj = (lon: number, lat: number): [number, number] => [(lon - X0) * S * C, (Y1 - lat) * S];
const ringPath = (r: readonly (readonly number[])[]) => 'M' + r.map(([a, b]) => proj(a, b).map(n => n.toFixed(1)).join(' ')).join('L') + 'Z';
const INDIA = GEO.rings.map(ringPath).join('');
export const CITIES: Record<string, [number, number]> = {
  Mumbai: [72.8777, 19.076], Pune: [73.8567, 18.5204], Delhi: [77.209, 28.6139],
  Bengaluru: [77.5946, 12.9716], Hyderabad: [78.4867, 17.385], Chennai: [80.2707, 13.0827],
};
const FB = FULL.map(r => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of r) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; });
const inRing = (r: number[][], lon: number, lat: number) => { let inside = false; for (let a = 0, b = r.length - 1; a < r.length; b = a++) { const [xi, yi] = r[a], [xj, yj] = r[b]; if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside; } return inside; };
// uniform by area over every source ring, so remote islands keep their true (small) share
export const randomInIndia = (): [number, number] => {
  for (let i = 0; i < 5000; i++) {
    const lon = 68.1 + Math.random() * 29.4, lat = 6.7 + Math.random() * 30.5;
    for (let k = 0; k < FULL.length; k++) { const b = FB[k]; if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue; if (inRing(FULL[k], lon, lat)) return [lon, lat]; }
  }
  return [78.9, 22.5];
};

export type Mk = { at: [number, number]; kind: 'start' | 'ci' | 'dc' | 'unc' | 'end' | 'pin'; label?: string };
type Props = { cis?: readonly (readonly [number, number, number])[]; bbox?: [number, number, number, number]; markers: Mk[]; route?: readonly (readonly number[])[]; straight?: [number, number][]; label: string };

export function GeoMap({ cis, bbox = [67.5, 6, 98.5, 37.5], markers, route, straight, label }: Props) {
  const [a, b] = proj(bbox[0], bbox[3]), [c, d] = proj(bbox[2], bbox[1]);
  const w = c - a, h = d - b, u = Math.max(w, h * 1.17) / 62;
  const pts = (l: readonly (readonly number[])[]) => l.map(([x, y]) => proj(x, y).map(n => n.toFixed(1)).join(',')).join(' ');
  return <svg className="geo" viewBox={`${a} ${b} ${w} ${h}`} role="img" aria-label={label}>
    <path d={INDIA} className="land" />
    {route && <polyline points={pts(route)} className="rt" strokeWidth={u * 0.45} />}
    {straight && <polyline points={pts(straight)} className="sl" strokeWidth={u * 0.3} strokeDasharray={`${u} ${u * 0.8}`} />}
    {cis && cis.map(([n, la, lo]) => { const [x, y] = proj(lo, la); return <path key={n} d={`M${x} ${y - u * 1.1}L${x + u}  ${y + u * 0.7}L${x - u} ${y + u * 0.7}Z`} className="cidot" />; })}
    {(() => {
      const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
      const fs = u * 2.4, right = a + w - u * 1.5, left = a + u * 1.5;
      const rank: Record<string, number> = { dc: 0, unc: 1, ci: 2, pin: 3, start: 4, end: 5 };
      const order = [...markers.keys()].sort((p, q) => rank[markers[p].kind] - rank[markers[q].kind]);
      const labels: Record<number, { x: number; y: number; anchor: string } | undefined> = {};
      markers.forEach((m, i) => {
        if (!m.label) return;
        const [x, y] = proj(m.at[0], m.at[1]); const tw = m.label.length * fs * 0.62;
        const flip = x + u * 2.4 + tw > right; let ly = y + u * 0.9;
        const box = (ly: number) => flip ? { x0: x - u * 2.4 - tw, x1: x - u * 2.4, y0: ly - fs, y1: ly + fs * 0.3 } : { x0: x + u * 2.4, x1: x + u * 2.4 + tw, y0: ly - fs, y1: ly + fs * 0.3 };
        for (let k = 0; k < 8; k++) { const bx = box(ly); if (!placed.some(p => bx.x0 < p.x1 && bx.x1 > p.x0 && bx.y0 < p.y1 && bx.y1 > p.y0)) break; ly += (k % 2 ? -1 : 1) * fs * 1.1 * (Math.floor(k / 2) + 1); }
        ly = Math.min(Math.max(ly, b + u * 0.6 + fs), b + h - u * 0.6 - fs * 0.3); // keep the label inside the viewBox (bottom edge clipped 'Road end')
        placed.push(box(ly)); labels[i] = { x: flip ? x - u * 2.4 : x + u * 2.4, y: ly, anchor: flip ? 'end' : 'start' };
      });
      return order.map(i => {
      const m = markers[i];
      const [x, y] = proj(m.at[0], m.at[1]);
      const k = m.kind; const L = labels[i];
      return <g key={i}>
        {k === 'pin' && <circle cx={x} cy={y} r={u * 2.6} className="halo" />}
        {k === 'ci' ? <path d={`M${x} ${y - u * 1.9}L${x + u * 1.7} ${y + u * 1.2}L${x - u * 1.7} ${y + u * 1.2}Z`} className="mk k-ci" strokeWidth={u * 0.35} />
          : k === 'dc' ? <rect x={x - u * 1.2} y={y - u * 1.2} width={u * 2.4} height={u * 2.4} className="mk k-dc" strokeWidth={u * 0.35} />
          : <circle cx={x} cy={y} r={u * (k === 'pin' ? 1.5 : 1.3)} className={'mk k-' + k} strokeWidth={u * 0.35} />}
        {m.label && L && <text transform={`translate(${L.x} ${L.y}) scale(${fs / 100})`} x={0} y={0} fontSize={100} textAnchor={L.anchor as any} className="mlab" style={{ strokeWidth: 20 }}>{m.label}</text>}
      </g>;
      });
    })()}
  </svg>;
}

export function Legend({ items }: { items: ('start' | 'ci' | 'dc' | 'unc' | 'end' | 'pin')[] }) {
  const T: Record<string, string> = { start: 'Start', ci: 'Stop used', dc: 'Other 50 kW+ charger', unc: 'Overnight, unconfirmed', end: 'Road endpoint (not always the pin)', pin: 'Your pin' };
  return <div className="leg">{items.map(k => <span key={k}><i className={'lg k-' + k} />{T[k]}</span>)}</div>;
}
