// Road endpoint search for a pin with no road within the snap radius. Candidate points on rings around the pin, snapped in ONE batched ORS /snap call.
// Result is the nearest SNAPPED candidate found, not a proven global nearest road.
export function ringCandidates(pin, radiiKm = [1, 2, 4, 7, 10, 15, 20, 30], bearings = 12) {
  const out = [];
  for (const r of radiiKm) for (let b = 0; b < bearings; b++) { const th = (b / bearings) * 2 * Math.PI, dLat = r / 111.2 * Math.cos(th), dLon = r / (111.2 * Math.cos(pin[1] * Math.PI / 180)) * Math.sin(th); out.push([+(pin[0] + dLon).toFixed(5), +(pin[1] + dLat).toFixed(5), r]); }
  return out;
}
export async function findEndpoint(pin, snap /* async (locations[[lon,lat]],radius)=>[[lon,lat]|null] */, hv) {
  const cands = ringCandidates(pin), res = await snap(cands.map(c => [c[0], c[1]]), 350);
  const hits = res.map((s, i) => s && { snapped: s, ringKm: cands[i][2], d: hv(pin, s) }).filter(Boolean).sort((a, b) => a.d - b.d);
  return hits.length ? { endpoint: hits[0].snapped, straightKm: +hits[0].d.toFixed(1), note: 'Nearest of ' + cands.length + ' sampled points; not a proven nearest road' } : { endpoint: null, note: 'No road found within ' + Math.max(...cands.map(c => c[2])) + ' km of sampled points: unresolved gap' };
}
