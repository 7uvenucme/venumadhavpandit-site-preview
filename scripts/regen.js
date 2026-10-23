import { runLive, probe } from '../src/ev-planner/planner/live';
import { randomInIndia } from '../src/ev-planner/GeoMap';
window.__regen = (api, city, origin, pin) => runLive(api, city, origin, pin);
window.__probe = api => probe(api);
window.__pickPin = rs => { const old = Math.random; let i = 0; Math.random = () => rs[i++ % rs.length]; const p = randomInIndia(); Math.random = old; return p; };
window.__record = on => { if (!window.__of) { window.__of = window.fetch; window.__rec = []; } window.fetch = !on ? window.__of : async (u, o) => { const r = await window.__of(u, o); if (String(u).includes('ev-planner-proxy')) { try { const c = r.clone(); window.__rec.push({ u: String(u), body: o && o.body ? String(o.body) : null, status: r.status, json: await c.json() }); } catch (e) {} } return r; }; return 'rec ' + on; };
