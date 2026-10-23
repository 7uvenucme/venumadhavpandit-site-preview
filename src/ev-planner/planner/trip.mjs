import { plan } from './engine.mjs';
import { corridor, hv } from './chargers.mjs';
import { ledger } from './ledger.mjs';
import { LIMITS, BudgetError } from './budget.mjs';
/** ors: { route(coords)->{km,min,line}, } (budgeted by caller). Returns plan + provenance. Road detour verified per chosen stop. */
async function planTripOnce({ origin, dest, pois, ors, params = {}, maxDetourKm = 12, maxCalls = LIMITS.perTripCalls, now = Date.now(), ledgerParams = params, _calls = 0, _extra = 0, _cache = { base: null, checked: new Map(), rejected: [] } }) {
  let calls = _calls; const call = async c => { if (++calls > maxCalls) throw new BudgetError('trip call budget'); return ors.route(c); };
  const base = _cache.base || (_cache.base = await call([origin, dest]));
  if (!base) return { ledger: null, complete: false, plan: null, route: null, stops: [], rejected: [], candidates: [], orsCalls: calls, provenance: 'No road route between origin and endpoint' };
  let cands = corridor(base.line, base.km, pois, now);
  cands = cands.filter(c => !(_cache.checked.get(c.id) && !_cache.checked.get(c.id).ok));
  const checked = _cache.checked, rejected = _cache.rejected;
  for (let iter = 0; iter < 4; iter++) {
    const res = plan({ routeKm: base.km, chargers: cands.map(c => ({ ...c, verified: true })), params });
    const stops = res.events.filter(e => e.stationId);
    let bad = false;
    for (const s of stops) {
      if (checked.has(s.stationId)) { if (!checked.get(s.stationId).ok) bad = true; continue; }
      const c = cands.find(x => x.id === s.stationId);
      let r;
      try { r = await call([origin, [c.lon, c.lat], dest]); } catch (e) { if (e.code === 'BUDGET') throw e; r = null; }
      const detour = r ? r.km - base.km : null;
      const ok = detour !== null && detour <= maxDetourKm;
      checked.set(c.id, { ok, detourKm: detour === null ? null : +detour.toFixed(1) });
      if (!ok) { bad = true; rejected.push({ id: c.id, name: c.name, detourKm: detour, why: detour === null ? 'no road route to the charger' : 'detour over ' + maxDetourKm + ' km' }); cands = cands.filter(x => x.id !== c.id); }
    }
    if (!bad) {
      const roadChecked = new Set([...checked].filter(([, v]) => v.ok).map(([k]) => k));
      // only road-checked stops count as verified-for-routing; others remain candidates
      if (!res.complete) return { ledger: null, complete: false, plan: res, route: { km: base.km, min: base.min, line: base.line }, stops: stops.map(s => ({ ...cands.find(c => c.id === s.stationId), roadDetourKm: checked.get(s.stationId).detourKm })), rejected, candidates: cands, orsCalls: calls, provenance: 'Incomplete: unresolved charging gap' };
      const sel = stops.map(s => cands.find(c => c.id === s.stationId));
      let led = null;
      if (sel.length) { const w = await call([origin, ...sel.map(c => [c.lon, c.lat]), dest]); led = w?.legs ? ledger({ legs: w.legs, stops: sel.map(c => ({ ...c, roadDetourKm: checked.get(c.id).detourKm })), params: ledgerParams }) : null; }
      else led = ledger({ legs: [{ km: base.km, min: base.min }], stops: [], params: ledgerParams });
      if (led && !led.ok && _extra < 9 && led.problems.every(p => /reserve/.test(p))) {
        // planner's own buffer was too thin once real detours were added: re-plan with a bigger buffer, ledger keeps the true reserve
        return planTripOnce({ origin, dest, pois, ors, params: { ...params, minArrivePct: (params.minArrivePct ?? 15) + 3 }, maxDetourKm, maxCalls, now, ledgerParams, _calls: calls, _extra: _extra + 3, _cache });
      }
      return { ledger: led, complete: res.complete && !!led && led.ok, plan: res, route: { km: base.km, min: base.min, line: base.line }, stops: stops.map(s => ({ ...cands.find(c => c.id === s.stationId), roadDetourKm: checked.get(s.stationId).detourKm })), rejected, candidates: cands, orsCalls: calls, provenance: 'Positions and ratings are Open Charge Map records, not verified by us. No live availability. Detour checked by road routing (ORS).' };
    }
  }
  return { complete: false, plan: null, rejected, orsCalls: calls, note: 'could not settle on road-checked stops' };
}

// Usual policy charges to 80%. If that leaves a gap, retry once allowing a higher charge target (90%) before reporting the gap.
export async function planTrip(args) {
  const cache = { base: null, checked: new Map(), rejected: [] };
  const first = await planTripOnce({ ...args, _cache: cache });
  if (first.complete || args.params?.chargeToPct || !first.route) return first;
  try {
    const second = await planTripOnce({ ...args, _cache: cache, params: { ...(args.params || {}), chargeToPct: 90 }, ledgerParams: { ...(args.ledgerParams || args.params || {}), chargeToPct: 90 }, _calls: first.orsCalls });
    if (second.complete) return { ...second, chargeTo90: true };
  } catch (e) { /* budget or routing error: keep the first result */ }
  return first;
}
