// @ts-nocheck
import { planTrip } from './trip.mjs';
import { findEndpoint } from './endpoint.mjs';
import { accessFlag } from '../geo_defacto';
import { hv } from './chargers.mjs';
import OCM from '../ocm.json';
const api = base => {
  const post = async (p, b) => { let r, j; for (let k = 0; k < 3; k++) { r = await fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); j = await r.json().catch(() => ({})); if (r.status < 500 || k === 2) break; await new Promise(z => setTimeout(z, 900 * (k + 1))); } return { status: r.status, j }; };
  const chk = (status, j) => { if (status === 429) { const e = new Error(j.error || 'routing limit reached'); e.code = 'BUDGET'; throw e; } if (status >= 500 || status === 403) throw new Error('routing service unavailable (' + status + ')'); };
  return {
    route: async c => { const { status, j } = await post('/route', { coordinates: c }); chk(status, j); const f = j.features?.[0]; if (!f) return null; return { legs: f.properties.segments.map(g => ({ km: g.distance / 1000, min: g.duration / 60 })), km: f.properties.summary.distance / 1000, min: f.properties.summary.duration / 60, line: f.geometry.coordinates }; },
    snap: async (locs, radius) => { const { status, j } = await post('/snap', { locations: locs, radius }); chk(status, j); return (j.locations || []).map(l => (l ? l.location : null)); },
  };
};
export const probe = async base => { try { const r = await fetch(base + '/snap', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ locations: [[78.4867, 17.385]], radius: 50 }) }); return r.ok; } catch { return false; } };
const hh = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(Math.round(m % 60)).padStart(2, '0');
export async function runLive(base, city, o, pin) {
  const { route, snap } = api(base); const base0 = { live: true, origin: { name: city, lon: o[0], lat: o[1] }, pin, generated: new Date().toISOString().slice(0, 10), fetched: OCM.fetched };
  let calls = 0, end = pin, endNote = 'The pin has a road within 350 m, so the road ends at the pin.', straightKm = 0;
  try {
    const pr = await snap([pin], 350); calls++;
    if (!pr[0]) {
      const r = await findEndpoint(pin, snap, hv); calls++;
      if (!r.endpoint) return { ...base0, status: 'noroad', msg: r.note, orsCalls: calls };
      end = r.endpoint; straightKm = r.straightKm; endNote = `No road within 350 m of the pin. Searched sampled points on rings of 1 to 30 km around it and took the closest of those that snaps to a road (not proven nearest), ${r.straightKm} km away (${r.note}). The last ${r.straightKm} km is not routed.`;
    } else { end = pr[0]; const off = Math.round(hv(pin, end) * 1000); endNote = `A road point was found within 350 m of the pin: the road endpoint is the snapped point, ${off} m from the pin (the pin itself is not on the road).`; }
    const r0 = await route([o, end]); calls++;
    if (!r0) return { ...base0, status: 'noroute', end: { lon: end[0], lat: end[1] }, endNote, straightKm, msg: 'No road route from ' + city + ' to the road endpoint. The point is not counted as reachable by road.', orsCalls: calls };
    const af = accessFlag(r0.line, end);
    if (af) return { ...base0, status: 'noaccess', end: { lon: end[0], lat: end[1] }, endNote, straightKm, orsCalls: calls,
      msg: af.kind === 'endpoint'
        ? `The nearest road to the pin is about ${Math.round(af.km)} km outside the area covered by our road-access check, so we cannot verify a drivable route from ${city}. The point is not counted as reachable by road.`
        : `The only road route we found to this point leaves the area covered by our road-access check (about ${Math.round(af.km)} km outside it). We cannot verify whether the crossing on it is open, so this trip is not counted as drivable.` };
    let prefetched = true; const routeCached = async c => { if (prefetched && JSON.stringify(c) === JSON.stringify([o, end])) { prefetched = false; return r0; } return route(c); };
    const t = await planTrip({ origin: o, dest: end, pois: OCM.pois, ors: { route: routeCached } }); calls += t.orsCalls || 0;
    if (!t.route) return { ...base0, status: 'noroute', end: { lon: end[0], lat: end[1] }, endNote, straightKm, msg: 'No road route from ' + city + ' to the road endpoint. The point is not counted as reachable by road.', orsCalls: calls };
        const used = new Map((t.stops || []).map(s => [s.id, s]));
    const view = { ...base0, dest: { name: 'Road endpoint', lon: end[0], lat: end[1] }, end: { lon: end[0], lat: end[1] }, endNote, straightKm, directKm: +t.route.km.toFixed(1), orsCalls: calls, rejected: t.rejected || [],
      line: (() => { const st = Math.ceil(t.route.line.length / 700); return t.route.line.filter((_, i) => i % st === 0 || i === t.route.line.length - 1).map(c => [+c[0].toFixed(4), +c[1].toFixed(4)]); })(),
      chargers: (t.candidates || []).map(c => ({ id: c.id, lat: c.lat, lon: c.lon, kmAlong: c.kmAlong, used: used.has(c.id) })) };
    const chg = (s, e) => ({ kind: 'charge', id: s.id, src: s.src, name: s.name, operator: s.src === 'chargein' ? 'Charge_iN by Mahindra' : (OCM.operators[s.operator] || 'Unknown'), kw: s.kw, lat: s.lat, lon: s.lon, detourKm: s.roadDetourKm, ageDays: s.ageDays, caveats: s.caveats || [], ...e });
    if (t.ledger) {
      const L = t.ledger, Q = t.plan?.params || {}, cap = L.usableKwh, kmkwh = Q.kmPerKwh, rk = p => Math.round(p / 100 * cap * kmkwh);
      const ev = [{ kind: 'start', time: hh(Q.dayStartMin), pct: Q.startPct, rangeKm: rk(Q.startPct), day: 1 }]; let last = hh(Q.dayStartMin), day = 1;
      let ci = 0;
      for (const r of L.rows) {
        ev.push({ kind: 'drive', time: last, km: r.legKm, mins: r.legMin, kwh: +(r.legKm / kmkwh).toFixed(1), day });
        if (r.kind === 'charge') { const s = t.stops[ci++]; ev.push(chg(s, { day, time: r.arrClock, dep: r.depClock, arrPct: r.arrPct, arrKm: rk(r.arrPct), leavePct: r.leavePct, leaveKm: rk(r.leavePct), mins: r.mins, stay: r.stayMins, kwhAdded: r.kwhAdded, meal: r.meal, overnight: r.overnight })); if (r.overnight) { day++; last = hh(Q.dayStartMin); ev.push({ kind: 'day', day }); } else last = r.depClock; }
        else ev.push({ kind: 'end', day, time: r.arrClock, pct: r.arrPct, rangeKm: rk(r.arrPct) });
      }
      return { ...view, chargeTo90: !!t.chargeTo90, status: L.ok ? 'plan' : 'partial', problems: L.problems || [], events: ev, totals: L.totals, assumption: L.assumption, params: Q, usableKwh: cap, detourTotal: +(t.stops || []).reduce((a, s) => a + (s.roadDetourKm || 0), 0).toFixed(1) };
    }
    // no complete ledger: show the planner's own estimates and the gap, no cost totals
    const pe = t.plan?.events || [], Q = t.plan?.params || {}; const ev = [];
    for (const e of pe) {
      if (e.kind === 'start') ev.push(e.day > 1 ? { kind: 'day', day: e.day } : { kind: 'start', day: e.day, time: e.time, pct: e.soc, rangeKm: e.rangeKm });
      else if (e.kind === 'drive') ev.push({ ...e });
      else if (e.kind === 'charge' || e.kind === 'overnight') { const s = used.get(e.stationId); if (s) ev.push(chg(s, { day: e.day, time: e.time, arrPct: e.arrPct, arrKm: e.arrKm, leavePct: e.leavePct, leaveKm: e.leaveKm, mins: e.mins, kwhAdded: e.kwhAdded, overnight: e.kind === 'overnight', estimate: true })); }
      else if (e.kind === 'gap') { const g = (t.plan?.gaps || []).find(x => x.fromKm >= e.km - 1) || (t.plan?.gaps || [])[0]; ev.push({ ...e, title: g ? `Gap ahead: km ${g.fromKm} to ${g.toKm}` : undefined, note: g ? `Charging has to happen before about km ${g.toKm}, the limit of battery reach with the ${Q.minArrivePct ?? 15}% reserve. The charger data we retrieved has none usable in that stretch. Arrange charging there (for example AC at a hotel, or a charger we could not verify); no arrival time is promised.` : e.note }); }
      else if (e.kind === 'end') ev.push({ kind: 'end', day: e.day, time: e.time, pct: e.soc, rangeKm: e.rangeKm });
    }
    return { ...view, status: 'gap', events: ev, params: Q, gaps: (t.plan?.gaps || []).map(g => `No usable charger in the data we retrieved between km ${g.fromKm} and ${g.toKm}`) };
  } catch (e) { return { ...base0, status: 'error', msg: e.message + (e.code === 'BUDGET' ? ' (free routing budget reached; no paid fallback)' : ''), orsCalls: calls }; }
}
