// Charger eligibility from an Open Charge Map snapshot. Provenance only: nothing here is fresh verification by us.
const PUBLIC_OK = new Set([1, 5]);          // Public, Public pay at location
const PUBLIC_CAVEAT = { 4: 'Membership or app account required', 7: 'Notice required before use' };
const STATUS_OK = new Set([10, 20, 50, 75]); // available, in use, operational, partly operational
export const CCS2 = 33;
export const POLICY = { minKw: 50, corridorKm: 8, staleDays: 365 };
export const hv = (a, b) => { const R = 6371, t = x => x * Math.PI / 180, dl = t(b[1] - a[1]), dn = t(b[0] - a[0]); const h = Math.sin(dl / 2) ** 2 + Math.cos(t(a[1])) * Math.cos(t(b[1])) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

/** Returns {ok, reasons[], caveats[], kw} for one OCM POI. */
export function eligibility(p, now = Date.now(), pol = POLICY) {
  const reasons = [], caveats = [];
  if (!STATUS_OK.has(p.StatusTypeID)) reasons.push('status ' + (p.StatusTypeID ?? 'unknown') + ' not operational');
  const u = p.UsageTypeID;
  if (!PUBLIC_OK.has(u)) { if (PUBLIC_CAVEAT[u]) caveats.push(PUBLIC_CAVEAT[u]); else reasons.push('not marked public (usage ' + (u ?? 'unknown') + ')'); }
  const ccs = (p.Connections || []).filter(c => c.ConnectionTypeID === CCS2 && (c.PowerKW || 0) >= pol.minKw);
  if (!ccs.length) reasons.push('no CCS2 connector at ' + pol.minKw + ' kW or more');
  const kw = Math.max(0, ...ccs.map(c => c.PowerKW));
  const v = Date.parse(p.DateLastVerified || p.DateLastStatusUpdate || '');
  const ageDays = Number.isFinite(v) ? Math.round((now - v) / 864e5) : null;
  if (ageDays === null) caveats.push('no source verification date');
  else if (ageDays > pol.staleDays) caveats.push('source record is ' + ageDays + ' days old');
  return { ok: reasons.length === 0, reasons, caveats, kw, ageDays };
}

/** Candidates near a route polyline [[lon,lat]...] with cumulative km scaled to the routed distance. */
export function corridor(line, routeKm, pois, now = Date.now(), pol = POLICY) {
  const cum = [0]; for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + hv(line[i - 1], line[i]));
  const scale = routeKm / cum.at(-1), out = [];
  const lons = line.map(c => c[0]), lats = line.map(c => c[1]), m = pol.corridorKm / 100 + 0.02;
  const box = [Math.min(...lons) - m, Math.min(...lats) - m, Math.max(...lons) + m, Math.max(...lats) + m];
  for (const p of pois) {
    const a = p.AddressInfo; if (!a || a.Longitude < box[0] || a.Longitude > box[2] || a.Latitude < box[1] || a.Latitude > box[3]) continue;
    const e = eligibility(p, now, pol); if (!e.ok) continue;
    let best = 1e9, bi = 0;
    for (let i = 0; i < line.length; i++) { const d = hv([a.Longitude, a.Latitude], line[i]); if (d < best) { best = d; bi = i; } }
    if (best > pol.corridorKm) continue;
    out.push({ id: (p.src === 'chargein' ? '' : 'ocm-') + p.ID, ocmId: p.ID, src: p.src || 'ocm', name: a.Title, operator: p.OperatorID, lat: a.Latitude, lon: a.Longitude, kw: e.kw, kmAlong: +(cum[bi] * scale).toFixed(1), straightOffKm: +best.toFixed(2), caveats: e.caveats, ageDays: e.ageDays, network: p.OperatorID === 3972 ? 'charge_in' : 'other', verified: false /* set true only after road-detour check */ });
  }
  return out.sort((x, y) => x.kmAlong - y.kmAlong);
}
