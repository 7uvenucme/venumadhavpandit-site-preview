// Pure planning engine. No network, no invented data: caller supplies a route (km along road) and
// charger candidates with kmAlong + verified flag. Unverified chargers are never used as stops.
export const CAR = { name: 'BE 6 SPORTEQ Launch Edition 79 kWh', batteryKwh: 79, rangeAt100Km: 500 }; // rangeAt100Km is the owner's planning assumption, not a measured figure
const USABLE_FRAC = 0.95;
export const DEFAULTS = {
  startPct: 90, kmPerKwh: CAR.rangeAt100Km / (CAR.batteryKwh * USABLE_FRAC), avgKmh: 65, minArrivePct: 15, chargeToPct: 80, avgChargeKw: 100,
  lossPct: 10, usableFrac: USABLE_FRAC, dayStartMin: 6 * 60, latestDriveEndMin: 19 * 60, minUsefulLegMin: 90,
  mealMin: 40, homeTariff: 10, routeTariff: 18, petrolPrice: 100, petrolKmpl: 15,
};
const pctToKm = (p, P) => (p / 100) * CAR.batteryKwh * P.usableFrac * P.kmPerKwh;
const kmToPct = (k, P) => (k / (CAR.batteryKwh * P.usableFrac * P.kmPerKwh)) * 100;
const hhmm = m => { m = Math.round(m); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

/** routeKm: road distance to the road endpoint. chargers: [{id,name,network,kmAlong,kw,verified}] */
export function plan({ routeKm, chargers = [], params = {} }) {
  const P = { ...DEFAULTS, ...params };
  const usable = chargers.filter(c => c.verified && c.kmAlong > 0 && c.kmAlong < routeKm).sort((a, b) => a.kmAlong - b.kmAlong);
  const events = [], gaps = [];
  let km = 0, soc = P.startPct, t = P.dayStartMin, day = 1, driven = 0, usedPct = 0, boughtKwhDelivered = 0, stops = 0;
  events.push({ day, kind: 'start', time: hhmm(t), km, soc, rangeKm: Math.round(pctToKm(soc, P)) });
  let guard = 0;
  while (km < routeKm - 1e-6 && guard++ < 200) {
    // 1. destination reachable?
    const destDrive = routeKm - km, destDriveMin = destDrive / P.avgKmh * 60;
    const destOk = km + pctToKm(soc - 0, P) >= routeKm && soc - kmToPct(destDrive, P) >= P.minArrivePct;
    const dayLeft = P.latestDriveEndMin - t;
    if (destOk && destDriveMin <= dayLeft) {
      const arr = soc - kmToPct(destDrive, P);
      events.push({ day, kind: 'drive', time: hhmm(t), km: destDrive, mins: Math.round(destDriveMin), kwh: +(destDrive / P.kmPerKwh).toFixed(1) });
      t += destDriveMin; usedPct += soc - arr; soc = arr; driven += destDrive; km = routeKm;
      events.push({ day, kind: 'end', time: hhmm(t), km, soc: +arr.toFixed(0), rangeKm: Math.round(pctToKm(arr, P)) });
      break;
    }
    // 2. candidates within battery reach and within today's driving window
    const maxByBattery = km + pctToKm(soc - P.minArrivePct, P);
    const maxByDay = km + Math.max(0, dayLeft) / 60 * P.avgKmh;
    const cands = usable.filter(c => c.kmAlong > km + 1 && c.kmAlong <= maxByBattery);
    const inDay = cands.filter(c => c.kmAlong <= maxByDay);
    let pick;
    if (inDay.length) {
      const far = inDay[inDay.length - 1].kmAlong;
      // prefer Charge_IN within 15 km of the farthest option
      pick = [...inDay].reverse().find(c => c.network === 'charge_in' && far - c.kmAlong <= 15) || inDay[inDay.length - 1];
    } else if (cands.length) {
      // reachable by battery but not today: overnight at the farthest-reachable charger (ends the day)
      pick = cands[cands.length - 1];
    }
    if (pick && P.chargeToPct - (soc - kmToPct(pick.kmAlong - km, P)) < 3) pick = null; // a stop that adds under 3 points moves the gap, it does not fix it
    if (!pick) {
      gaps.push({ fromKm: Math.round(km), toKm: Math.round(Math.min(maxByBattery, routeKm)), reason: 'No verified charger within battery reach. Needs an AC arrangement or a charger we can verify.', atDay: day });
      events.push({ day, kind: 'gap', time: hhmm(t), km: Math.round(km), soc: +soc.toFixed(0), rangeKm: Math.round(pctToKm(soc, P)), note: 'Unresolved charging gap. Arrange suitable AC charging near here; no arrival time is promised.' });
      break;
    }
    const d = pick.kmAlong - km, dm = d / P.avgKmh * 60, arr = soc - kmToPct(d, P);
    events.push({ day, kind: 'drive', time: hhmm(t), km: +d.toFixed(0), mins: Math.round(dm), kwh: +(d / P.kmPerKwh).toFixed(1) });
    t += dm; usedPct += soc - arr; driven += d; km = pick.kmAlong; soc = arr;
    const overnight = t + P.minUsefulLegMin > P.latestDriveEndMin;
    const kw = Math.min(pick.kw || P.avgChargeKw, P.avgChargeKw);
    const to = P.chargeToPct;
    const addPct = Math.max(0, to - soc), kwhAdd = addPct / 100 * CAR.batteryKwh * P.usableFrac, mins = Math.max(kwhAdd / kw * 60, 0);
    stops++; boughtKwhDelivered += kwhAdd;
    events.push({ day, kind: overnight ? 'overnight' : 'charge', time: hhmm(t), stationId: pick.id, name: pick.name, network: pick.network, arrPct: +soc.toFixed(0), arrKm: Math.round(pctToKm(soc, P)), leavePct: to, leaveKm: Math.round(pctToKm(to, P)), mins: Math.round(mins), kwhAdded: +kwhAdd.toFixed(1) });
    t += mins; soc = to;
    if (overnight) { day++; t = P.dayStartMin; events.push({ day, kind: 'start', time: hhmm(t), km, soc, rangeKm: Math.round(pctToKm(soc, P)) }); }
    else if (t < 14 * 60 && t > 11 * 60 && mins < P.mealMin) { events[events.length - 1].mealNote = `Lunch fits the ${Math.round(mins)} min charge; stay ${P.mealMin} min if eating.`; }
  }
  const complete = km >= routeKm - 1e-6;
  // energy accounting (battery energy used; purchases include charging loss)
  const usedKwh = usedPct / 100 * CAR.batteryKwh * P.usableFrac;
  const startKwh = P.startPct / 100 * CAR.batteryKwh * P.usableFrac;
  const endKwh = soc / 100 * CAR.batteryKwh * P.usableFrac;
  const loss = 1 - P.lossPct / 100;
  const homeBought = startKwh / loss, routeBought = boughtKwhDelivered / loss, leftover = endKwh / loss;
  const evCost = homeBought * P.homeTariff + routeBought * P.routeTariff - leftover * P.homeTariff;
  const petrolCost = driven / P.petrolKmpl * P.petrolPrice;
  return {
    car: CAR.name, complete, params: P, events, gaps,
    totals: { roadKm: +driven.toFixed(0), days: events[events.length - 1].day, chargeStops: stops, usedKwh: +usedKwh.toFixed(1), homeKwhBought: +homeBought.toFixed(1), routeKwhBought: +routeBought.toFixed(1), leftoverKwh: +leftover.toFixed(1), evCost: Math.round(evCost), petrolCost: Math.round(petrolCost), saved: Math.round(petrolCost - evCost) },
    notes: ['Costs use editable demo tariffs, not real prices.', complete ? 'Plan reaches the road endpoint.' : 'Plan is incomplete: see gaps.'],
  };
}
