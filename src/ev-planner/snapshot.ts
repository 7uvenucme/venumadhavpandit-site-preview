import { GEO } from './geo';
import { proj } from './GeoMap';
// Draws the itinerary snapshot to a canvas and downloads it as a PNG. Same data as the Summary screen, nothing new.
export function savePng(EX: any, bbox: [number, number, number, number], N: { ev: number; pet: number; nChg: number; nOv: number; name?: string }, labelOf: string) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, W, H);
  const [a, b] = proj(bbox[0], bbox[3]), [cc, d] = proj(bbox[2], bbox[1]);
  const mx = 40, my = 150, mw = W - 80, mh = 720, sc = Math.min(mw / (cc - a), mh / (d - b));
  const ox = mx + (mw - (cc - a) * sc) / 2, oy = my + (mh - (d - b) * sc) / 2;
  const P = (lon: number, lat: number) => { const [x, y] = proj(lon, lat); return [ox + (x - a) * sc, oy + (y - b) * sc]; };
  g.save(); g.beginPath(); g.rect(mx, my, mw, mh); g.clip(); g.fillStyle = '#fbf8f1'; g.fillRect(mx, my, mw, mh);
  g.fillStyle = '#e6e3d8'; g.strokeStyle = '#b9b4a3'; g.lineWidth = 1.5;
  for (const r of GEO.rings) { g.beginPath(); r.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.fill(); g.stroke(); }
  if (EX.line) { g.strokeStyle = '#2563eb'; g.lineWidth = 6; g.lineJoin = 'round'; g.beginPath(); EX.line.forEach(([x, y]: number[], i: number) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); }
  const dot = (lon: number, lat: number, col: string, r: number, label?: string) => { const [x, y] = P(lon, lat); g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); if (label) { g.font = '600 28px sans-serif'; g.lineWidth = 6; g.strokeStyle = '#fff'; g.strokeText(label, x + r + 8, y + 10); g.fillStyle = '#111'; g.fillText(label, x + r + 8, y + 10); } };
  for (const ch of (EX.chargers || []).filter((x: any) => x.used)) dot(ch.lon, ch.lat, '#e11d2e', 14, Math.abs(ch.kmAlong - EX.totals.roadKm) < 15 ? undefined : Math.round(ch.kmAlong) + ' km');
  dot(EX.origin.lon, EX.origin.lat, '#111', 14, EX.origin.name);
  dot(EX.dest.lon, EX.dest.lat, '#16a34a', 14, 'Road end');
  g.restore();
  g.fillStyle = '#111'; g.font = '600 52px serif'; g.fillText(EX.origin.name + ' to ' + (N.name || (EX.live ? 'a surprise place' : EX.dest.name)), 40, 80);
  g.fillStyle = EX.live ? '#555' : '#b45309'; g.font = '600 26px sans-serif'; g.fillText(labelOf, 40, 120);
  const T = EX.totals, ev = (EX.events || []), n = N.nChg, last = ev[ev.length - 1] || {};
  g.fillStyle = '#111'; g.font = '600 44px sans-serif'; g.fillText(`${T.roadKm} km · ${T.days} ${T.days > 1 ? 'days' : 'day'} · ${n} charging stops${N.nOv ? ', ' + N.nOv + ' overnight' : ''}`, 40, 960);
  g.font = '34px sans-serif'; g.fillStyle = '#333';
  g.fillText(`Arrive ${T.days > 1 ? 'Day ' + T.days + ' ' : ''}${T.finish} (06:00 start on Day 1) with about ${last.pct}% left`, 40, 1020);
  g.font = '28px sans-serif'; g.fillText('BE 6 SPORTEQ Launch Edition 79 kWh', 40, 1058); g.font = '34px sans-serif';
  { const sv = N.pet - N.ev; g.font = '600 56px sans-serif'; g.fillStyle = sv >= 0 ? '#15803d' : '#b45309'; g.fillText(sv >= 0 ? `Saves Rs ${Math.round(sv).toLocaleString('en-IN')} vs petrol` : `Rs ${Math.round(-sv).toLocaleString('en-IN')} more than petrol`, 40, 1115); g.font = '34px sans-serif'; g.fillStyle = '#333'; }
  g.font = '24px sans-serif'; g.fillStyle = '#666';
  let yy = 1160; const wrap = (t: string) => { let line = ''; for (const w of t.split(' ')) { const x = line ? line + ' ' + w : w; if (g.measureText(x).width > W - 80 && line) { g.fillText(line, 40, yy); yy += 32; line = w; } else line = x; } if (line) { g.fillText(line, 40, yy); yy += 38; } };
  ['Assumed tariffs and petrol price. ' + (EX.assumption || ''), 'Charger records: Open Charge Map (CC BY 4.0), not checked live. Routes: OpenRouteService, OpenStreetMap contributors.', 'India outline: Survey of India, simplified.'].forEach(wrap);
  c.toBlob(blob => { if (!blob) return; const u = URL.createObjectURL(blob), el = document.createElement('a'); el.href = u; el.download = 'ev-trip-snapshot.png'; document.body.appendChild(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }, 'image/png');
}
