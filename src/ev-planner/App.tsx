import React, { useState } from 'react';
import './style.css';
import { GeoMap, Legend, CITIES, randomInIndia, type Mk } from './GeoMap';
import { GEO } from './geo';
import { CI } from './ci';
import { EX as EX0 } from './ex';
import { probe, runLive } from './planner/live';
import { placeFacts, pinName, pinLabel } from './planner/extras';
import NEAR from './osm_near.json';
import VISIT from './visit.json';
import { savePng } from './snapshot';
const API: string = (typeof window !== 'undefined' && (window as any).EV_API) || '';
const VC = React.createContext<any>(EX0);
const useV = () => React.useContext(VC);
// drop markers that would sit on top of each other at this zoom (display only; the plan still sees every charger)
const thin = (cs: any[], bb: number[]) => { const d = Math.max(bb[2] - bb[0], bb[3] - bb[1]) * 0.04, out: any[] = []; for (const c of cs) if (!out.some(o => Math.hypot(o.lon - c.lon, o.lat - c.lat) < d)) out.push(c); return out; };
const marksOf = (EX: any): Mk[] => [
  { at: [EX.origin.lon, EX.origin.lat], kind: 'start', label: EX.origin.name },
  ...thin((EX.chargers || []).filter((c: any) => !c.used && c.kmAlong > 1 && c.kmAlong < (EX.directKm || 0) - 25), bboxOf(EX)).map((c: any) => ({ at: [c.lon, c.lat] as [number, number], kind: 'dc' as const })),
  ...(EX.chargers || []).filter((c: any) => c.used).map((c: any) => ({ at: [c.lon, c.lat] as [number, number], kind: 'ci' as const, label: Math.round(c.kmAlong) + ' km' })),
  { at: [EX.dest.lon, EX.dest.lat], kind: 'end', label: EX.live ? ('Road end') : EX.dest.name },
];
const bboxOf = (EX: any): [number, number, number, number] => {
  if (!EX.live) return [75.5, 11.8, 80.2, 18.2];
  const pts: number[][] = [[EX.origin.lon, EX.origin.lat], [EX.dest.lon, EX.dest.lat], ...(EX.line || [])]; if (EX.pin) pts.push(EX.pin);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const sp = Math.max(x1 - x0, y1 - y0, 0.8), pad = sp * 0.14; return [x0 - pad, y0 - pad, x1 + sp * 0.3, y1 + pad];
};
const hm = (m: number) => Math.floor(m / 60) + ' h ' + String(Math.round(m % 60)).padStart(2, '0') + ' min';

function Bar({ arr, dep }: { arr?: number; dep?: number }) {
  return <div className="bar" aria-hidden="true">
    {arr !== undefined && <i className="a" style={{ width: arr + '%' }} />}
    {dep !== undefined && arr !== undefined && dep > arr && <i className="d" style={{ left: arr + '%', width: dep - arr + '%' }} />}
    {arr === undefined && dep !== undefined && <i className="d" style={{ width: dep + '%' }} />}
  </div>;
}

const kmBetween = (a: number, b: number, c: number, d: number) => { const t = (x: number) => x * Math.PI / 180, h = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); };
const titleCase = (s: string) => s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));

// Named places from the bundled OSM/Wikidata visit list, near a point.
const nearVisits = (lat: number, lon: number, maxKm = 40, limit = 5) => (VISIT as any[])
  .filter(v => Math.abs(v[1] - lat) < 0.7 && Math.abs(v[2] - lon) < 0.8)
  .filter(v => !/terminus|station|junction|airport|bus stand/i.test(v[0]))
  .map(v => ({ n: v[0], en: v[4], k: v[3], d: kmBetween(lat, lon, v[1], v[2]) }))
  .filter(v => v.d <= maxKm)
  .sort((x, y) => x.d - y.d).slice(0, limit);

// Editorial ranking for Wikipedia pages: sights and stories first, bare administrative definitions last.
const DULL = /census town|village|town in|taluk|tehsil|mandal|revenue|panchayat|municipal|subdivision|block in|district|constituency|neighbourhood|locality|headquarters/i;
const SIGHT = /fort|palace|temple|church|mosque|dargah|monastery|beach|hill|peak|waterfall|falls|lake|dam|reservoir|wildlife|sanctuary|national park|museum|monument|memorial|tomb|caves?|ruins|castle|island|lighthouse|shrine|cathedral|basilica|gurudwara|gurdwara|stupa|zoo|viewpoint|harbour|port|backwater|mangrove|estate|water front/i;
const wikisOf = (facts: any): any[] => {
  const arr = ((facts && facts.nearby) || []);
  const scored = arr.map((p: any) => { const t = `${p.desc} ${p.title} ${p.extract}`; return { p, s: (SIGHT.test(t) ? 2 : 0) + ((p.extract || '').length > 120 ? 1 : 0) }; });
  const interesting = scored.filter(x => x.s > 0 && !DULL.test(`${x.p.desc} ${x.p.title}`)).sort((a, b) => b.s - a.s || a.p.km - b.p.km);
  return interesting.slice(0, 3).map(x => x.p);
};

// Named food and stays from the bundled OpenStreetMap extract, shown as part of the stop rather than buried in a technical note.
function StopLife({ id, overnight }: { id: string; overnight: boolean }) {
  const f = (NEAR as any)[String(id).replace('ocm-', '')];
  const fmt = (xs: any[]) => xs.slice(0, 3).map(x => `${titleCase(x.n)} (${Math.round(x.d * 1000)} m)`).join(', ');
  const eat = f && f.eat && f.eat.length ? fmt(f.eat) : null;
  const stay = f && f.stay && f.stay.length ? fmt(f.stay) : null;
  if (!eat && !overnight) return null;
  return <span className="life">
    {eat ? <>Food nearby: {eat}. </> : null}
    {overnight ? (stay
      ? <>Stay: {stay} — names from OpenStreetMap, not booked or confirmed.</>
      : <>No named stay near this stop in our data — arrange one before relying on it.</>) : null}
  </span>;
}

// What the destination area offers: Wikipedia facts for the road endpoint plus named places from the OSM extract.
function Around({ EX }: { EX: any }) {
  const pt = EX.end || EX.dest;
  if (!pt) return null;
  const facts = wikisOf(EX.place);
  const visits = nearVisits(pt.lat, pt.lon);
  if (!facts.length && !visits.length) return null;
  return <div className="card around"><span className="eyebrow">WHILE YOU'RE THERE</span>
    {facts.length > 0 && <ul className="facts">{facts.slice(0, 3).map((p: any) => <li key={p.title}><a href={p.url} target="_blank" rel="noreferrer">{p.title}</a><span className="clamp fx">{p.extract || p.desc}</span></li>)}</ul>}
    {visits.length > 0 && <ul className="vlist">{visits.map(v => <li key={v.n + v.d}><span>{v.en || v.n}{v.en && !v.n.toLowerCase().startsWith(v.en.toLowerCase().split(' ')[0]) ? <em> · {v.n}</em> : null}</span><i>{v.k.replace('_', ' ')} · {v.d < 10 ? v.d.toFixed(1) : Math.round(v.d)} km</i></li>)}</ul>}
    <small>From Wikipedia and the OpenStreetMap extract, straight-line from the {EX.live ? 'road endpoint' : 'example destination'} — not routed, hours and access not checked.</small>
  </div>;
}

const caveatsOf = (e: any) => (e.caveats || []).filter((x: string) => !x.startsWith('source record'));
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
function calc(EX: any, home: number, tariff: number, price: number, kmpl: number) {
  const T = EX.totals, P = EX.params, ev0 = EX.events;
  const ovBatt = Math.min(T.addedKwhBatt, ev0.filter((x: any) => x.kind === 'charge' && x.overnight).reduce((s: number, x: any) => s + x.kwhAdded, 0)), ovPaid = ovBatt / (1 - P.lossPct / 100), fastPaid = T.routeKwhBought - ovPaid;
  const c1 = T.homeKwhBought * home, c2 = fastPaid * tariff, cOv = ovPaid * tariff, c3 = T.leftoverKwh * home;
  const ev = c1 + c2 + cOv - c3, pet = (T.roadKm / kmpl) * price;
  return { ovBatt, ovPaid, fastPaid, c1, c2, cOv, c3, ev, pet, save: pet - ev };
}
const nOf = (EX: any) => { const e = EX.events || []; return { nChg: e.filter((x: any) => x.kind === 'charge').length, nOv: e.filter((x: any) => x.kind === 'charge' && x.overnight).length } };
const Mode = ({ live }: { live: boolean }) => live ? null : <span className="pill ex">Worked example</span>;

function Dice({ onGo, live, onPin }: { onGo: () => void; live: boolean; onPin: (city: string, pin: [number, number], name?: any) => void }) {
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [pname, setPname] = useState<any>(null);
  const [facts, setFacts] = useState<any>(null);
  const [factsBusy, setFactsBusy] = useState(false);
  const [city, setCity] = useState('Mumbai');
  const [busy, setBusy] = useState(false);
  const reveal = () => {
    setBusy(true); setFacts(null);
    setTimeout(() => {
      const p = randomInIndia(); setPin(p); setPname(null); onPin(city, p); setBusy(false);
      pinName(p[1], p[0]).then(n => { setPname(n); onPin(city, p, n); }).catch(() => {});
      setFactsBusy(true);
      placeFacts(p[1], p[0]).then(setFacts).catch(() => setFacts(null)).finally(() => setFactsBusy(false));
    }, 600);
  };
  const lab = pname && pinLabel(pname);
  const straight = pin ? Math.round(kmBetween(CITIES[city][1], CITIES[city][0], pin[1], pin[0])) : 0;
  const area = wikisOf(facts);
  const pv = pin ? nearVisits(pin[1], pin[0], 60, 4) : [];
  return <section className="grid2 reveal" aria-label="Destination reveal">
    <div className="card mapcard"><div className="map"><GeoMap cis={CI} label={pin ? 'Map of India with your start city and the destination pin' : 'Map of India with Charge_iN stations'} markers={pin ? [{ at: CITIES[city], kind: 'start', label: city }, { at: pin, kind: 'pin' }] : [{ at: CITIES[city], kind: 'start', label: city }]} straight={pin ? [CITIES[city], pin] : undefined} /></div>
      <p className="cap">Triangles: Charge_iN fast chargers from Mahindra's own station map.</p></div>
    <div className="card side">
      {!pin ? <>
        <span className="eyebrow">STEP 1</span>
        <h2 className="big">Pick where you start</h2>
        <p className="sub">The destination is a random point inside India. It stays hidden until you ask.</p>
        <label className="fld">Start city<select value={city} onChange={e => setCity(e.target.value)}>{Object.keys(CITIES).map(c => <option key={c}>{c}</option>)}</select></label>
        <div className="car">BE 6 SPORTEQ Launch Edition 79 kWh</div>
        <button className="btn" onClick={reveal} disabled={busy}>{busy ? 'Finding a place…' : 'Surprise me'}</button>
      </> : <>
        <span className="eyebrow">YOUR DESTINATION</span>
        <h2 className="big">{lab || (pname ? 'A remote spot in India' : 'Finding the place name…')}</h2>
        <p className="sub">{pname && pname.rel === 'Near' && pname.km != null ? `The pin is about ${pname.km} km from ${pname.title}, the nearest named town or larger village we have. ` : ''}About {straight.toLocaleString('en-IN')} km in a straight line from {city}. <span className="muted">Pin {pin[1].toFixed(3)}° N, {pin[0].toFixed(3)}° E</span></p>
        {factsBusy && <p className="muted sm">Learning about the area…</p>}
        {!factsBusy && (area.length > 0 || pv.length > 0) && <div className="factarea"><span className="eyebrow sm">WHAT'S AROUND THERE</span>
          {area.length > 0 && <ul className="facts">{area.map((p: any) => <li key={p.title}><a href={p.url} target="_blank" rel="noreferrer">{p.title}</a><span className="clamp fx">{p.extract || p.desc}</span></li>)}</ul>}
          {pv.length > 0 && <ul className="vlist">{pv.map(v => <li key={v.n + v.d}><span>{v.en || v.n}{v.en && !v.n.toLowerCase().startsWith(v.en.toLowerCase().split(' ')[0]) ? <em> · {v.n}</em> : null}</span><i>{v.k.replace('_', ' ')} · {v.d < 10 ? v.d.toFixed(1) : Math.round(v.d)} km</i></li>)}</ul>}
        </div>}
        <div className="car">BE 6 SPORTEQ Launch Edition 79 kWh</div>
        <button className="btn" onClick={onGo}>Let's take our EV there</button>
        <button className="linkbtn" onClick={reveal} disabled={busy}>{busy ? 'Finding…' : 'Somewhere else'}</button>
        <p className="fineprint">A random point inside India's outline; the dashed line is straight, not a road. Names: OpenStreetMap. Facts: Wikipedia. Places are straight-line leads, hours not checked.</p>
      </>}
    </div>
  </section>;
}

function Itinerary({ onNext, busy }: { onNext: () => void; busy: boolean }) {
  const EX = useV(); const ev0 = EX.events || []; const live = !!EX.live;
  const st = EX.status || 'plan';
  const hasMap = st !== 'noroad';
  const pl = pinLabel(EX.pinPlace);
  const epName = EX.place && EX.place.name ? EX.place.name.split(',').slice(0, 2).join(',') : null;
  const title = live ? (pl || 'Your destination') : EX.dest.name;
  const N = EX.totals ? nOf(EX) : null; const L = EX.totals ? calc(EX, EX.params.homeTariff, EX.params.routeTariff, EX.params.petrolPrice, EX.params.petrolKmpl) : null;
  const cap = EX.usableKwh || 75;
  if (busy) return <section className="card" aria-label="Itinerary"><span className="eyebrow">PLANNING</span><h2 className="big">{title}</h2><p className="sub">Checking for a road near the pin, routing from {EX.origin?.name}, then testing each charging stop by road.</p></section>;
  return <section aria-label="Itinerary">
    <div className="headline"><div><span className="eyebrow">{EX.origin.name.toUpperCase()} TO</span><h2 className="big">{title}</h2>
      {live && EX.pin && <p className="sub">{epName ? `The road ends near ${epName}.` : 'The road ends near the pin.'}{EX.straightKm ? ` The pin is ${EX.straightKm} km further on, not routed or counted.` : ''}</p>}
      {!live && <p className="sub">Worked example, a real route computed once. Your own pin is not routed in this preview.</p>}</div><Mode live={live} /></div>
    {(st === 'noroad' || st === 'noroute' || st === 'error') ? <div className="card"><h3>{st === 'noroad' ? 'No road endpoint found' : st === 'noroute' ? 'No road route' : 'Stopped'}</h3><p>{EX.msg}</p><p className="muted">No trip is planned and nothing is counted as reachable. Go back and pick somewhere else.</p></div> : <>
    <div className="grid2 trip">
      <div className="col">
        <div className="card tlc"><ol className="tl">
          <li className="ev daydiv"><span className="t" /><div className="b"><strong>Day 1</strong><span>Early start, 06:00</span></div></li>
          {ev0.map((e: any, i: number) => {
            if (e.kind === 'day') return <li key={i} className="ev daydiv"><span className="t" /><div className="b"><strong>Day {e.day}</strong><span>06:00 start, charged overnight</span></div></li>;
            if (e.kind === 'start') return <li key={i} className="ev start"><span className="t">{e.time}</span><div className="b"><strong>Home charge to {e.pct}%</strong><span>About {e.rangeKm} km of range</span><Bar dep={e.pct} /></div></li>;
            if (e.kind === 'drive') return <li key={i} className="ev drive"><span className="t">{e.time}</span><div className="b"><strong>Drive {Math.round(e.km)} km</strong><span>{hm(e.mins)} · about {Math.round(e.kwh / cap * 100)}% of the battery</span></div></li>;
            if (e.kind === 'gap') return <li key={i} className="ev gap"><span className="t">{e.time}</span><div className="b"><strong>{e.title || (e.km > 0 ? `Gap at about km ${e.km}` : 'Gap ahead')}</strong><span>{e.km > 0 ? `${e.soc}% left, about ${e.rangeKm} km range. ` : ''}{e.note}</span></div></li>;
            if (e.kind === 'charge') return <li key={i} className="ev charge"><span className="t">{e.time}</span><div className="b">
              <strong>{e.overnight ? 'Last charge of the day' : 'Fast charge'}: {e.name}{e.overnight && <em className="chip">Overnight stop</em>}{caveatsOf(e).some((x: string) => x.startsWith('Membership')) && <em className="pc">Account needed</em>}</strong>
              <span>{e.operator} · {e.kw} kW{e.detourKm ? ` · ${e.detourKm} km extra by road` : ''}</span>
              <Bar arr={e.arrPct} dep={e.leavePct} />
              <div className="nums"><span>Arrive {e.arrPct}%</span><span>Leave {e.leavePct}%</span><span>{e.mins} min charge{e.dep ? ` · on the road ${e.dep}` : ''}</span></div>
              {e.meal && <span>{e.meal}</span>}
              <StopLife id={e.id} overnight={!!e.overnight} />
              <details className="more"><summary>Charger record</summary>
                <small>{e.src === 'chargein' ? 'Charge_iN station map listing, read 23 Oct 2026, 180 kW DC. ' : `Open Charge Map record, ${e.ageDays} days old. `}{e.lat.toFixed(4)}, {e.lon.toFixed(4)}. {caveatsOf(e).filter((x: string) => e.src !== 'chargein' || !/verification date|days old/.test(x)).join('. ')}{caveatsOf(e).length ? '. ' : ''}Live status not checked.</small></details>
            </div></li>;
            return <li key={i} className="ev end"><span className="t">{e.time}</span><div className="b"><strong>The drive ends here</strong><span>{live ? 'Road endpoint' : `Road endpoint: ${EX.dest.name}, city centre`} · arrive {e.pct}% · about {e.rangeKm} km range left</span></div></li>;
          })}
        </ol></div>
        {st === 'gap' && <div className="card alert"><h3>This trip has a charging gap</h3><p>{(EX.gaps || []).join('; ') || 'A charging gap could not be filled'}. A gap means no usable charger in our data, not proof that none exists — arrange AC charging near it; no arrival time is promised for the gap.</p></div>}
        {st === 'partial' && <div className="card alert"><h3>Plan does not meet the reserve</h3><p>{(EX.problems || []).join('; ')}. Treat the stops as unresolved and arrange AC charging.</p></div>}
        <Around EX={EX} />
      </div>
      <aside className="col stick">
        {L && N && <div className="card result"><span className="eyebrow">COMPARED TO PETROL</span><h3 className="save">{L.save >= 0 ? `Saves ${inr(L.save)}` : `${inr(-L.save)} more`}</h3>
          <div className="stats"><div><b>{EX.totals.roadKm}</b><span>km</span></div><div><b>{EX.totals.days}</b><span>{EX.totals.days > 1 ? 'days' : 'day'}</span></div><div><b>{N.nChg}</b><span>charges</span></div></div>
          {EX.totals && <button className="btn" onClick={onNext}>See the trip summary</button>}</div>}
        {hasMap && <div className="card mapcard"><div className="map lite"><GeoMap label={`Road route from ${EX.origin.name} with charging stops`} bbox={bboxOf(EX)} route={EX.line} markers={[...(live && EX.straightKm ? [{ at: EX.pin, kind: 'pin' as const }] : []), ...marksOf(EX)]} straight={live && EX.straightKm ? [[EX.dest.lon, EX.dest.lat], EX.pin] : undefined} /></div>
          <Legend items={live && EX.straightKm ? ['start', 'ci', 'dc', 'end', 'pin'] : ['start', 'ci', 'dc', 'end']} /></div>}
      </aside>
    </div>
    <details className="more wide"><summary>Assumptions, sources and licences</summary>
      <p><b>Real:</b> the 79 kWh battery size, the road route (OpenRouteService on OpenStreetMap data), charger positions (Open Charge Map plus Charge_iN by Mahindra's own station map) and the planner arithmetic. <b>Assumed, not measured:</b> about 500 km of range at 100%, 65 km/h average speed, a 06:00 start, and at least 15% charge left on every arrival. Tariffs and the petrol price are editable in the summary.</p>
      {EX.endNote && <p>{EX.endNote}</p>}
      {EX.chargeTo90 && <p>The usual plan charges to 80% and left a gap, so this plan charges to 90% at the stops marked. That is a policy choice, not a measured need.</p>}
      <p>{live ? 'Route computed now' : `Route computed once on ${EX.generated}`} by OpenRouteService (HeiGIT). Chargers: Open Charge Map {EX.fetched ? `records fetched ${EX.fetched}` : 'records'} plus Charge_iN's station map, read 23 Oct 2026 (55 listed as available, 3 in progress and left out). Triangles are stops the plan uses; squares are other public CCS2 chargers of 50 kW or more within 8 km of the road, not marked broken. Records can be old and live status is not checked, so any stop can be down or busy. A gap means no usable charger in this data, not proof none exists.</p>
      {EX.totals && <p>Detours total {EX.detourTotal} km and are inside the leg figures.{live && EX.orsCalls ? ` Routing calls used: ${EX.orsCalls}.` : ''}</p>}
      {(EX.rejected || []).length > 0 && <p>Chargers tested and dropped: {EX.rejected.map((r: any) => `${r.name} (${r.why})`).join('; ')}.</p>}
      <p>Place names: OpenStreetMap (Nominatim). Area facts: Wikipedia. Food, stay and visit names: OpenStreetMap extract of 22 Oct 2026 (Geofabrik, ODbL), partial coverage, straight-line distances, hours and prices unknown. India outline: Survey of India, Outline of India (generalised, 1:16 million), simplified by us to about 2 km — a draft display, reuse terms not confirmed. No live map service is called from this page.</p>
    </details>
    </>}
  </section>;
}

function Summary() {
  const EX = useV(); const T = EX.totals, P = EX.params, ev0 = EX.events;
  const [home, setHome] = useState(P.homeTariff);
  const [tariff, setTariff] = useState(P.routeTariff);
  const [price, setPrice] = useState(P.petrolPrice);
  const [kmpl, setKmpl] = useState(P.petrolKmpl);
  const { ovBatt, ovPaid, fastPaid, c1, c2, cOv, c3, ev, pet, save } = calc(EX, home, tariff, price, kmpl);
  const num = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(+e.target.value || 0);
  const { nOv, nChg } = nOf(EX);
  const pl = pinLabel(EX.pinPlace);
  const cap = EX.usableKwh || 75;
  const endPct = Math.round(T.endKwhBatt / cap * 100);
  return <section className="grid2 sum" aria-label="Summary">
    <div className="card result big-r"><div className="row0"><span className="eyebrow">COMPARED TO PETROL</span><Mode live={!!EX.live} /></div>
      <h2 className="save" data-k="save">{save >= 0 ? `Saves ${inr(save)}` : `${inr(-save)} more than petrol`}</h2>
      <p className="sub">{EX.origin.name} to {EX.live ? (pl || 'your destination') : EX.dest.name}, one way, {T.roadKm} km.</p>
      <div className="grid stats4">
        <div><b>{T.roadKm}</b><span>km incl. detours</span></div><div><b>{T.days}</b><span>{T.days > 1 ? 'days' : 'day'}</span></div><div><b>{nChg}</b><span>charging stops{nOv > 0 ? `, ${nOv} overnight` : ''}</span></div><div><b>{T.finish}</b><span>{T.days > 1 ? `arrive Day ${T.days}` : 'arrive'}, 06:00 start</span></div>
      </div>
      <div className="map lite sm"><GeoMap label="Snapshot map of the route" bbox={bboxOf(EX)} route={EX.line} markers={marksOf(EX).map(m => ({ ...m, label: undefined }))} /></div>
      <button className="btn" onClick={() => savePng(EX, bboxOf(EX), { ev, pet, nChg, nOv, name: pl || undefined }, EX.live ? `Planned ${EX.generated} · one way` : 'WORKED EXAMPLE · precomputed, not a pin')}>Save snapshot image</button>
      <p className="cap">Savings use the editable assumptions on the right, not real prices.{EX.straightKm ? ` The last ${EX.straightKm} km from the road endpoint to the pin are not counted.` : ''} Return trip not included.</p>
    </div>
    <div className="card side">
      <h3>Adjust the assumptions</h3>
      <div className="ins">
        <label className="fld">Home tariff<span className="iu"><input type="number" value={home} min={0} onChange={num(setHome)} /><i>₹/kWh</i></span></label>
        <label className="fld">On-the-way tariff<span className="iu"><input type="number" value={tariff} min={0} onChange={num(setTariff)} /><i>₹/kWh</i></span></label>
        <label className="fld">Petrol price<span className="iu"><input type="number" value={price} min={0} onChange={num(setPrice)} /><i>₹/litre</i></span></label>
        <label className="fld">Petrol car<span className="iu"><input type="number" value={kmpl} min={1} onChange={e => setKmpl(+e.target.value || 1)} /><i>km/l</i></span></label>
      </div>
      <details className="more" open><summary>How the number is built</summary>
      <div className="sav">
        <div className="row" data-k="home"><span>Home charge before the start, to {P.startPct}%: {T.homeKwhBought.toFixed(1)} kWh from the wall</span><b>{inr(c1)}</b></div>
        <div className="row" data-k="route"><span>Daytime fast charging: {fastPaid.toFixed(1)} kWh from the wall</span><b>{inr(c2)}</b></div>
        {ovBatt > 0 && <div className="row" data-k="overnight"><span>Overnight charge at the last stop, to {P.chargeToPct}%: {ovPaid.toFixed(1)} kWh from the wall at the on-the-way tariff (lodging not arranged)</span><b>{inr(cOv)}</b></div>}
        <div className="row" data-k="left"><span>Left in the battery at the end: {endPct}%, counted as money back at the home tariff</span><b>−{inr(c3)}</b></div>
        <div className="row" data-k="ev"><span>EV total, {(T.homeKwhBought + T.routeKwhBought - T.leftoverKwh).toFixed(1)} kWh paid net</span><b>{inr(ev)}</b></div>
        <div className="row" data-k="petrol"><span>Petrol, same {T.roadKm} km</span><b>{inr(pet)}</b></div>
        <small data-k="battery">Battery check: {P.startPct}% at the start + {Math.round(T.addedKwhBatt / cap * 100)}% from charging − {Math.round(T.usedKwh / cap * 100)}% driven ≈ {endPct}% left (100% = {cap} kWh usable). Paid energy is from the wall: battery energy divided by {(1 - T.lossPct / 100).toFixed(2)} for the {T.lossPct}% charging loss.</small>
        <small>{EX.assumption} {P.avgKmh} km/h average speed is an assumption too.</small>
      </div></details>
    </div>
  </section>;
}

export function App() {
  const [s, setS] = useState(0);
  const [live, setLive] = useState(false);
  const [V, setV] = useState<any>(EX0);
  const [busy, setBusy] = useState(false);
  const sel = React.useRef<{ city: string; pin: [number, number]; nm?: any } | null>(null);
  React.useEffect(() => { (API ? probe(API) : Promise.resolve(false)).then(ok => { setLive(ok); }); }, []);
  const go = (n: number) => { setS(n); window.scrollTo?.({ top: 0 }); };
  const toTrip = async () => {
    if (!live || !sel.current) return go(1);
    setV({ live: true, status: 'pending', origin: { name: sel.current.city }, events: [], pinPlace: sel.current.nm }); setBusy(true); go(1);
    const r = await runLive(API, sel.current.city, CITIES[sel.current.city], sel.current.pin);
    const v = { ...r, pinPlace: sel.current.nm, dest: r.end ? { name: 'Road endpoint', ...r.end } : r.origin }; setV(v); setBusy(false);
    if (r.end && r.status !== 'error') {
      placeFacts(r.end.lat, r.end.lon).then(p => setV((x: any) => (x === v || x.pin === r.pin) ? { ...x, place: p } : x)).catch(() => {});
    }
  };
  return <VC.Provider value={V}>
    {!live && <p className="modenote">Live routing is unavailable right now, so a new pin cannot be routed. The itinerary and summary below show one labelled worked example.</p>}
    <nav className="steps" aria-label="Screens">{['Destination', live ? 'Trip' : 'Worked example', 'Summary'].map((l, i) => <button key={l} className={i === s ? 'on' : ''} onClick={() => go(i)} disabled={(i === 2 && !V.totals) || (live && i > 0 && !V.live)}>{l}</button>)}</nav>
    <div className="stage">{s === 0 ? <Dice onGo={toTrip} live={live} onPin={(city, pin, nm) => { sel.current = { city, pin, nm }; setV(live ? { live: true, status: 'pending', origin: { name: city }, events: [], pinPlace: nm } : EX0); }} /> : s === 1 ? <Itinerary onNext={() => go(2)} busy={busy} /> : <Summary />}</div>
  </VC.Provider>;
}
