// @ts-nocheck
// Suggestions only. Nothing here is routed, timed or checked: names come straight from OpenStreetMap / Wikipedia.
// Policies honoured: Nominatim (identifying Referer from the page, one request per second, results cached, once per trip),
// Wikipedia API (serial requests, Api-User-Agent header), Overpass public instance (one query per trip, well under 10,000 a day).
const gap = ms => new Promise(r => setTimeout(r, ms));
let last = 0;
const polite = async (url, opt = {}) => { const wait = Math.max(0, last + 1100 - Date.now()); if (wait) await gap(wait); last = Date.now(); const r = await fetch(url, opt); if (!r.ok) throw new Error('HTTP ' + r.status); return r; };
const ck = k => { try { const v = JSON.parse(localStorage.getItem('evp:' + k)); return v && Date.now() - v.t < 30 * 864e5 ? v.d : null; } catch { return null; } };
const cs = (k, d) => { try { localStorage.setItem('evp:' + k, JSON.stringify({ t: Date.now(), d })); } catch {} };
const hav = (a, b, c, d) => { const R = 6371, t = x => x * Math.PI / 180, dl = t(c - a), dn = t(d - b); const h = Math.sin(dl / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const BORING = /constituency|lok sabha|assembly|district of|taluk|tehsil|panchayat|municipal|state in|union territory|school|college|university|institute|company|business park|hospital|railway station|bus station|metro station|software|tech park|apartment|residential|hotel in|restaurant in/i;
export async function placeFacts(lat, lon) {
  const key = 'q' + lat.toFixed(2) + ',' + lon.toFixed(2), hit = ck(key); if (hit) return hit;
  const out = { name: null, nearby: [] };
  try {
    const n = await (await polite(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=en&lat=${lat}&lon=${lon}`)).json();
    out.name = n.display_name || null; const a = n.address || {}; out.tokens = [a.city, a.town, a.village, a.suburb, a.city_district, a.county, a.state_district].filter(Boolean).flatMap(x => [x, x.replace(/ (district|taluk|taluka|mandal|tehsil|city|division)$/i, '')]).filter(x => x.length > 3);
  } catch (e) { out.nameError = e.message; }
  try {
    const u = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=10000&ggslimit=15&prop=description|extracts|coordinates&exintro=1&explaintext=1&exsentences=4&exlimit=15&colimit=15&format=json&origin=*`;
    const j = await (await polite(u, { headers: { 'Api-User-Agent': 'EVSurprisePlanner/0.1 (https://www.venumadhavpandit.com/ev-planner/)' } })).json();
    const pages = Object.values(j.query?.pages || {}).map(p => ({ title: p.title, desc: p.description || '', extract: (p.extract || '').slice(0, 220), km: p.coordinates ? +hav(lat, lon, p.coordinates[0].lat, p.coordinates[0].lon).toFixed(1) : null, url: 'https://en.wikipedia.org/?curid=' + p.pageid }))
      .filter(p => p.km !== null && !BORING.test(p.desc + ' ' + p.title) && (p.desc || p.extract) && (out.tokens || []).some(t => (p.title + ' ' + p.desc + ' ' + p.extract).toLowerCase().includes(t.toLowerCase()))).sort((a, b) => a.km - b.km).slice(0, 4);
    out.nearby = pages;
  } catch (e) { out.nearbyError = e.message; }
  if (out.name || out.nearby.length) cs(key, out);
  return out;
}
export async function stopFood(stops) {
  const res = {}; const need = [];
  for (const s of stops) { const k = 'f' + s.id + (s.overnight ? 'n' : ''); const h = ck(k); if (h) res[s.id] = h; else need.push(s); }
  if (!need.length) return res;
  const q = '[out:json][timeout:25];(' + need.map(s => `nwr(around:700,${s.lat},${s.lon})[amenity~"^(restaurant|cafe|fast_food)$"][name];` + (s.overnight ? `nwr(around:1500,${s.lat},${s.lon})[tourism~"^(hotel|guest_house|hostel|motel)$"][name];` : '')).join('') + ');out center 120;';
  try {
    await gap(500);
    const j = await (await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })).json();
    for (const s of need) {
      const mine = (j.elements || []).map(e => ({ name: e.tags.name, kind: e.tags.amenity || e.tags.tourism, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon })).filter(e => e.lat != null).map(e => ({ ...e, km: +hav(s.lat, s.lon, e.lat, e.lon).toFixed(2) })).filter(e => e.km <= (/^(hotel|guest_house|hostel|motel)$/.test(e.kind) ? 1.5 : 0.7));
      const eat = mine.filter(e => /restaurant|cafe|fast_food/.test(e.kind)).sort((a, b) => a.km - b.km).slice(0, 3), stay = mine.filter(e => !/restaurant|cafe|fast_food/.test(e.kind)).sort((a, b) => a.km - b.km).slice(0, 3);
      res[s.id] = { eat, stay }; cs('f' + s.id + (s.overnight ? 'n' : ''), res[s.id]);
    }
  } catch (e) { for (const s of need) res[s.id] = { error: e.message }; }
  return res;
}

// Names the random pin itself. A town or village from Nominatim counts as "In" only within 3 km. Otherwise the nearest place in the bundled
// list of OpenStreetMap towns and larger villages is named as "Near X" with the real distance. State comes from Nominatim. One request, cached.
let PLACES = null;
const loadPlaces = async () => { if (PLACES) return PLACES; const base = (typeof window !== 'undefined' && window.EV_BASE) || ''; PLACES = await (await fetch(base + '/ev-planner/places.json')).json(); return PLACES; };
const SETTLE = /^(village|town|city|hamlet|suburb|city_district|neighbourhood|quarter|locality|isolated_dwelling)$/;
export async function pinName(lat, lon) {
  const key = 'n2' + lat.toFixed(3) + ',' + lon.toFixed(3), hit = ck(key); if (hit) return hit;
  let out = { title: null, state: null, rel: null };
  try {
    const n = await (await polite(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=en&lat=${lat}&lon=${lon}`)).json(); const a = n.address || {};
    out.state = a.state || null;
    const d0 = n.lat && n.lon ? hav(lat, lon, +n.lat, +n.lon) : null;
    const own = a.village || a.town || a.city || a.hamlet || a.suburb || a.city_district || null;
    if (own && n.addresstype && SETTLE.test(n.addresstype) && d0 != null && d0 <= 3) out = { title: own, state: out.state, rel: 'In', km: Math.round(d0 * 10) / 10 };
    else {
      const P = await loadPlaces(); let best = null, bd = 1e9;
      for (const p of P) { if (Math.abs(p[1] - lat) > 1.2 || Math.abs(p[2] - lon) > 1.4) continue; const d = hav(lat, lon, p[1], p[2]); if (d < bd) { bd = d; best = p; } }
      if (best) out = { title: best[0], state: out.state, rel: bd <= 3 ? 'In' : 'Near', km: Math.round(bd * 10) / 10 };
    }
    cs(key, out);
  } catch (e) { out.err = e.message; }
  return out;
}
export const pinLabel = p => !p || !(p.title || p.state) ? null : p.title ? `${p.rel === 'In' ? '' : 'Near '}${p.title}${p.state ? ', ' + p.state : ''}` : `Remote area in ${p.state}`;
