// Re-simulates a trip over ACTUAL routed legs (origin -> stops -> destination) so detours count in km, time and energy.
// Reserve (minArrivePct) is separate and must still hold on every arrival. Percentages are of USABLE energy (usableFrac of nominal, an assumption).
import { CAR, DEFAULTS } from './engine.mjs';
export function ledger({ legs, stops, params = {} }) {
  const P = { ...DEFAULTS, ...params }, cap = CAR.batteryKwh * P.usableFrac;
  const rows = []; let day = 1, soc = P.startPct, t = P.dayStartMin, km = 0, usedKwh = 0, boughtKwh = 0, ok = true; const problems = [];
  for (let i = 0; i < legs.length; i++) {
    const kwh = legs[i].km / P.kmPerKwh, pct = kwh / cap * 100, arr = soc - pct;
    km += legs[i].km; usedKwh += kwh; t += legs[i].min;
    const last = i === legs.length - 1;
    if (arr < P.minArrivePct) { ok = false; problems.push(`Leg ${i + 1} arrives at ${arr.toFixed(0)}%, under the ${P.minArrivePct}% reserve`); }
    if (arr < 0) { problems.push(`Leg ${i + 1} runs out of energy`); }
    if (t > P.latestDriveEndMin) { ok = false; problems.push(`Day ${day}: arrives at ${hhmm(t)}, after the ${hhmm(P.latestDriveEndMin)} cutoff`); }
    soc = arr;
    if (last) { rows.push({ kind: "end", day, arrClock: hhmm(t), legKm: +legs[i].km.toFixed(1), legMin: Math.round(legs[i].min), arrPct: +arr.toFixed(0) }); break; }
    const s = stops[i], kw = Math.min(s.kw || P.avgChargeKw, P.avgChargeKw), full = Math.max(0, P.chargeToPct - soc) / 100 * cap, overnight = t + full / kw * 60 + legs[i + 1].min > P.latestDriveEndMin; // overnight when the next routed leg could not finish before the cutoff
    // top up only what the next routed leg needs plus the reserve and a 5 point margin (overnight stops charge to the usual target)
    const nextPct = legs[i + 1].km / P.kmPerKwh / cap * 100, target = overnight ? P.chargeToPct : Math.min(P.chargeToPct, Math.max(soc, Math.ceil(nextPct + P.minArrivePct + 5)));
    const add = Math.max(0, target - soc), addKwh = add / 100 * cap, mins = addKwh / kw * 60;
    boughtKwh += addKwh;
    const lunch = !overnight && t >= 11 * 60 && t <= 14.5 * 60, stay = lunch ? Math.max(mins, P.mealMin) : mins, meal = lunch ? `Lunch while charging: the charge takes ${Math.round(mins)} min, the stop is planned as ${Math.round(stay)} min.` : null;
    rows.push({ kind: 'charge', day, overnight, stopId: s.id, legKm: +legs[i].km.toFixed(1), legMin: Math.round(legs[i].min), arrPct: +arr.toFixed(0), leavePct: target, mins: Math.round(mins), kwhAdded: +addKwh.toFixed(1), detourKm: s.roadDetourKm, arrClock: hhmm(t), stayMins: Math.round(stay), depClock: hhmm(t + stay), meal, reserveHeld: arr >= P.minArrivePct });
    t += stay; soc = target;
    if (overnight) { day++; t = P.dayStartMin; }
  }
  const loss = 1 - P.lossPct / 100, startKwh = P.startPct / 100 * cap, endKwh = soc / 100 * cap;
  const home = startKwh / loss, route = boughtKwh / loss, left = endKwh / loss;
  return { ok, problems, rows, usableKwh: +cap.toFixed(1), assumption: `Usable energy assumed ${Math.round(P.usableFrac * 100)}% of ${CAR.batteryKwh} kWh nominal (assumption, not a measured figure)`, totals: { startKwhBatt: +startKwh.toFixed(1), addedKwhBatt: +boughtKwh.toFixed(1), endKwhBatt: +endKwh.toFixed(1), lossPct: P.lossPct, days: day, roadKm: +km.toFixed(0), finish: hhmm(t), usedKwh: +usedKwh.toFixed(1), homeKwhBought: +home.toFixed(1), routeKwhBought: +route.toFixed(1), leftoverKwh: +left.toFixed(1), evCost: Math.round(home * P.homeTariff + route * P.routeTariff - left * P.homeTariff), petrolCost: Math.round(km / P.petrolKmpl * P.petrolPrice) } };
}
const hhmm = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(Math.round(m % 60)).padStart(2, '0');
