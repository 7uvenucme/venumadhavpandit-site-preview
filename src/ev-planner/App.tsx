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
  { at: [EX.dest.lon, EX.dest.lat], kind: 'end', label: EX.live ? (EX.straightKm ? 'Road end' : 'Road end = pin') : EX.dest.name },
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

function Demo({ text = "PREVIEW · not a routed trip" }: { text?: string }) { return <div className="demo">{text}</div>; }

const kmBetween = (a: number, b: number, c: number, d: number) => { const t = (x: number) => x * Math.PI / 180, h = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); };
function Visits({ pt, example }: { pt: { lat: number; lon: number }; example: boolean }) {
  const near = (VISIT as any[]).filter(v => Math.abs(v[1] - pt.lat) < 0.4 && Math.abs(v[2] - pt.lon) < 0.45).filter(v => !/terminus|station|junction|airport|bus stand/i.test(v[0])).map(v => ({ n: v[0], en: v[4], k: v[3], d: kmBetween(pt.lat, pt.lon, v[1], v[2]) })).filter(v => v.d <= 40).sort((x, y) => x.d - y.d).slice(0, 5);
  return <div className="sugg-box"><h3>Possible visits nearby</h3>
    {near.length ? <ul>{near.map(v => <li key={v.n + v.d}><span>{v.en || v.n}{v.en ? <em> {v.n}</em> : null}</span><i>{v.k.replace('_', ' ')} · {v.d < 10 ? v.d.toFixed(1) : Math.round(v.d)} km</i></li>)}</ul> : <p>No notable named place within 40 km in the bundled extract. That is a data gap, not proof there is nothing to see.</p>}
    <small>Suggestions only: straight-line from the {example ? 'example destination' : 'road endpoint'}, not routed or counted in time or cost. Hours and access unknown. Partial: only single-point places with a Wikipedia or Wikidata link. © OpenStreetMap contributors, ODbL.</small></div>;
}

function Food({ id, overnight }: { id: string; overnight: boolean }) {
  const f = (NEAR as any)[String(id).replace('ocm-', '')];
  const L = (xs: any[]) => xs.map(x => `${x.n} (${x.k.replace('_', ' ')}, ${Math.round(x.d * 1000)} m)`).join('; ');
  return <div className="sugg-box"><b>Nearby, not part of the plan</b>
    <p>{f && f.eat.length ? `Food within 700 m: ${L(f.eat)}.` : 'No named food place within 700 m in the bundled extract.'}{overnight ? (f && f.stay.length ? ` Lodging within 1.5 km: ${L(f.stay)}.` : ' No named lodging within 1.5 km in the extract. Find somewhere to stay before relying on this stop.') : ''}</p>
    <small>Straight-line distances, no detour counted. Hours, prices and availability unknown. Partial coverage. © OpenStreetMap contributors, ODbL, extract of 22 Oct 2026.</small></div>;
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
const nOf = (EX: any) => { const e = EX.events || []; return { nChg: e.filter((x: any) => x.kind === 'charge').length, nOv: e.filter((x: any) => x.kind === 'charge' && x.overnight).length }; };
const Mode = ({ live }: { live: boolean }) => live ? null : <span className={'pill ' + (live ? 'live' : 'ex')}>{live ? 'Live test backend' : 'Worked example'}</span>;
const Warn = () => <p className="warn"><b>Before you rely on this:</b> numbers are planner estimates. Charger status is not checked live, so any stop can be down or busy. Where a gap is shown, arrange AC charging yourself. No arrival time is promised for a gap.</p>;

function Dice({ onGo, live, onPin }: { onGo: () => void; live: boolean; onPin: (city: string, pin: [number, number], name?: any) => void }) {
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [pname, setPname] = useState<any>(null);
  const [city, setCity] = useState('Mumbai');
  const [busy, setBusy] = useState(false);
  const reveal = () => {
    setBusy(true);
    setTimeout(() => { const p = randomInIndia(); setPin(p); setPname(null); onPin(city, p); setBusy(false); pinName(p[1], p[0]).then(n => { setPname(n); onPin(city, p, n); }).catch(() => {}); }, 600);
  };
  const lab = pname && pinLabel(pname);
  return <section className="grid2 reveal" aria-label="Destination reveal">
    <div className="card mapcard"><div className="map"><GeoMap cis={CI} label={pin ? 'Map of India with your start city and the destination pin' : 'Map of India with Charge_iN stations'} markers={pin ? [{ at: CITIES[city], kind: 'start', label: city }, { at: pin, kind: 'pin' }] : [{ at: CITIES[city], kind: 'start', label: city }]} straight={pin ? [CITIES[city], pin] : undefined} /></div>
      <p className="cap">Red triangles: Charge_iN stations at the coordinates on Mahindra's own station map.</p></div>
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
        <p className="sub">{pname && pname.rel === 'Near' && pname.km != null ? `The pin is about ${pname.km} km from ${pname.title}, the nearest named town or larger village we have. ` : ''}From {city}. <span className="muted">Pin {pin[1].toFixed(3)}° N, {pin[0].toFixed(3)}° E</span></p>
        <div className="car">BE 6 SPORTEQ Launch Edition 79 kWh</div>
        <button className="btn" onClick={onGo}>Let's take our EV there</button>
        <button className="linkbtn" onClick={reveal} disabled={busy}>{busy ? 'Finding…' : 'Somewhere else'}</button>
        <details className="more"><summary>About this map</summary><p>{live ? 'A random point inside the India outline at its real coordinates. The dashed line is straight, not a road. A road check and the plan come next.' : 'Demo: the pin is real but this preview does not route it. The worked example next is a different, precomputed trip.'} Place name from OpenStreetMap (Nominatim).</p></details>
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
  if (busy) return <section className="card" aria-label="Itinerary"><span className="eyebrow">PLANNING</span><h2 className="big">{title}</h2><p className="sub">Checking for a road near the pin, routing from {EX.origin?.name}, then testing each charging stop by road.</p></section>;
  return <section aria-label="Itinerary">
    <div className="headline"><div><span className="eyebrow">{EX.origin.name.toUpperCase()} TO</span><h2 className="big">{title}</h2>
      {live && EX.pin && <p className="sub">{epName ? `The road ends near ${epName}. ` : 'The road ends near the pin. '}{EX.straightKm ? `The pin is ${EX.straightKm} km further on, not routed or counted.` : ''}</p>}
      {!live && <p className="sub">Worked example, a real route computed once. Your own pin is not routed in this preview.</p>}</div><Mode live={live} /></div>
    {(st === 'noroad' || st === 'noroute' || st === 'error') ? <div className="card"><h3>{st === 'noroad' ? 'No road endpoint found' : st === 'noroute' ? 'No road route' : 'Stopped'}</h3><p>{EX.msg}</p><p className="muted">No trip is planned and nothing is counted as reachable. Go back and pick somewhere else.</p></div> : <>
    <Warn />
    <div className="grid2 trip">
      <div className="col">
        <div className="card tlc"><ol className="tl">
          {ev0.map((e: any, i: number) => {
            if (e.kind === 'day') return <React.Fragment key={i}><li className="ev day"><span className="t" /><div className="b"><strong>Overnight pause</strong><span>Lodging is not arranged or suggested here. The charger is not assumed to have rooms.</span></div></li><li className="ev day"><span className="t" /><div className="b"><strong>Day {e.day}</strong></div></li></React.Fragment>;
            if (e.kind === 'start') return <li key={i} className="ev start"><span className="t">{e.time}</span><div className="b"><strong>Early start</strong><span>Home charge to {e.pct}% · about {e.rangeKm} km range</span><Bar dep={e.pct} /></div></li>;
            if (e.kind === 'drive') return <li key={i} className="ev drive"><span className="t">{e.time}</span><div className="b"><strong>Drive {Math.round(e.km)} km</strong><span>{hm(e.mins)} · about {Math.round(e.kwh)} kWh</span></div></li>;
            if (e.kind === 'gap') return <li key={i} className="ev gap"><span className="t">{e.time}</span><div className="b"><strong>{e.title || (e.km > 0 ? `Gap at about km ${e.km}` : 'Gap ahead')}</strong><span>{e.km > 0 ? `${e.soc}% left, about ${e.rangeKm} km range. ` : ''}{e.note}</span></div></li>;
            if (e.kind === 'charge') return <li key={i} className="ev charge"><span className="t">{e.time}</span><div className="b">
              <strong>{e.overnight ? 'Last charge of the day' : 'Fast charge'}: {e.name}{caveatsOf(e).some((x: string) => x.startsWith('Membership')) && <em className="pc">Account needed</em>}</strong>
              <span>{e.operator} · {e.kw} kW · {e.detourKm} km extra by road</span>
              <Bar arr={e.arrPct} dep={e.leavePct} />
              <div className="nums"><span>Arrive {e.arrPct}%</span><span>Leave {e.leavePct}%</span><span>{e.mins} min · +{e.kwhAdded} kWh{e.dep ? ` · leave ${e.dep}` : ''}</span></div>
              {e.meal && <span>{e.meal}</span>}
              <details className="more"><summary>Food, stay and source</summary><Food id={e.id} overnight={!!e.overnight} />
                <small>{e.src === 'chargein' ? 'Charge_iN station map listing, read 23 Oct 2026, 180 kW DC. ' : `Open Charge Map record, ${e.ageDays} days old. `}{e.lat.toFixed(4)}, {e.lon.toFixed(4)}. {caveatsOf(e).filter((x: string) => e.src !== 'chargein' || !/verification date|days old/.test(x)).join('. ')}{caveatsOf(e).length ? '. ' : ''}Live availability unknown.</small></details>
            </div></li>;
            return <li key={i} className="ev end"><span className="t">{e.time}</span><div className="b"><strong>The drive ends here</strong><span>{live ? 'Road endpoint' : `Road endpoint: ${EX.dest.name}, city centre`} · arrive {e.pct}% · about {e.rangeKm} km range left</span></div></li>;
          })}
        </ol></div>
        {st === 'gap' && <div className="card alert"><h3>No complete plan</h3><p>{(EX.gaps || []).join('; ') || 'A charging gap could not be filled'}. These are gaps in the data we retrieved, not proof that no charger exists. Arrange AC charging near the gap.</p></div>}
        {st === 'partial' && <div className="card alert"><h3>Plan does not meet the reserve</h3><p>{(EX.problems || []).join('; ')}. Treat the stops as unresolved and arrange AC charging.</p></div>}
      </div>
      <aside className="col stick">
        {L && N && <div className="card result"><span className="eyebrow">COMPARED TO PETROL</span><h3 className="save">{L.save >= 0 ? `Saves ${inr(L.save)}` : `${inr(-L.save)} more`}</h3>
          <div className="stats"><div><b>{EX.totals.roadKm}</b><span>km</span></div><div><b>{EX.totals.days}</b><span>{EX.totals.days > 1 ? 'days' : 'day'}</span></div><div><b>{N.nChg}</b><span>charges</span></div></div>
          {EX.totals && <button className="btn" onClick={onNext}>See the trip summary</button>}</div>}
        {hasMap && <div className="card mapcard"><div className="map lite"><GeoMap label={`Road route from ${EX.origin.name} with charging stops`} bbox={bboxOf(EX)} route={EX.line} markers={[...(live && EX.straightKm ? [{ at: EX.pin, kind: 'pin' as const }] : []), ...marksOf(EX)]} straight={live && EX.straightKm ? [[EX.dest.lon, EX.dest.lat], EX.pin] : undefined} /></div>
          <Legend items={live && EX.straightKm ? ['start', 'ci', 'dc', 'end', 'pin'] : ['start', 'ci', 'dc', 'end']} /></div>}
      </aside>
    </div>
    <details className="more wide"><summary>Sources, assumptions and nearby suggestions</summary>
      <p>{live ? 'Road route computed now by OpenRouteService (OpenStreetMap data).' : `Road route computed once on ${EX.generated} by OpenRouteService (OpenStreetMap data).`} Chargers: Open Charge Map records fetched {EX.fetched} plus Charge_iN by Mahindra's own station map, read 23 Oct 2026. Triangles are stops the plan uses. Squares are other 50 kW+ chargers within 8 km of the road that are public (or public with an account), have CCS2, and are not marked broken.</p>
      {EX.chargeTo90 && <p>The usual plan charges to 80% and left a gap, so this plan charges to 90% at the stops marked. That is a policy choice, not a measured need.</p>}
      {EX.totals && <p>Every arrival stays at or above 15% of usable energy. {EX.assumption}. Detours total {EX.detourTotal} km and are inside the leg figures. {live && `Routing calls used: ${EX.orsCalls}.`}</p>}
      {(EX.rejected || []).length > 0 && <p>Chargers tested and dropped: {EX.rejected.map((r: any) => `${r.name} (${r.why})`).join('; ')}.</p>}
      {live && EX.place && ((EX.place.nearby || []).length > 0) && <div className="sugg-box"><h3>Area information</h3><p>{EX.place.nearby.map((p: any) => `${p.title} (${p.km} km, ${p.desc || p.extract})`).join('; ')}.</p><small>Wikipedia articles within 10 km that name the same local area. Not places to visit, not routed, not checked open.</small></div>}
      {(EX.end || EX.dest) && (st === 'plan' || st === 'gap' || st === 'partial' || !live) && <Visits pt={EX.end || EX.dest} example={!live} />}
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
  return <section className="grid2 sum" aria-label="Summary">
    <div className="card result big-r"><div className="row0"><span className="eyebrow">COMPARED TO PETROL</span><Mode live={!!EX.live} /></div>
      <h2 className="save" data-k="save">{save >= 0 ? `Saves ${inr(save)}` : `${inr(-save)} more than petrol`}</h2>
      <p className="sub">{EX.origin.name} to {EX.live ? (pl || 'your destination') : EX.dest.name}, one way, {T.roadKm} km.</p>
      <div className="grid stats4">
        <div><b>{T.roadKm}</b><span>km incl. detours</span></div><div><b>{T.days}</b><span>{T.days > 1 ? 'days' : 'day'}</span></div><div><b>{nChg}</b><span>charging stops{nOv > 0 ? `, ${nOv} overnight` : ''}</span></div><div><b>{T.finish}</b><span>{T.days > 1 ? `arrive Day ${T.days}` : 'arrive'}, 06:00 start</span></div>
      </div>
      <div className="map lite sm"><GeoMap label="Snapshot map of the route" bbox={bboxOf(EX)} route={EX.line} markers={marksOf(EX).map(m => ({ ...m, label: undefined }))} /></div>
      <button className="btn" onClick={() => savePng(EX, bboxOf(EX), { ev, pet, nChg, nOv, name: pl || undefined }, EX.live ? 'LIVE · local test backend' : 'WORKED EXAMPLE · precomputed, not a pin')}>Save snapshot image</button>
      <p className="cap">Savings use editable tariff and petrol assumptions, not real prices.{EX.straightKm ? ` The last ${EX.straightKm} km from the road endpoint to the pin are not counted.` : ''} Return trip not included.</p>
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
        <div className="row" data-k="home"><span>Home charge before the start: {T.homeKwhBought.toFixed(1)} kWh paid, {T.startKwhBatt.toFixed(1)} kWh into the battery ({P.startPct}%)</span><b>{inr(c1)}</b></div>
        <div className="row" data-k="route"><span>Daytime fast charging: {fastPaid.toFixed(1)} kWh paid, {(T.addedKwhBatt - ovBatt).toFixed(1)} kWh into the battery</span><b>{inr(c2)}</b></div>
        {ovBatt > 0 && <div className="row" data-k="overnight"><span>Overnight charge at the last stop (lodging not arranged, to {P.chargeToPct}%): {ovPaid.toFixed(1)} kWh paid, {ovBatt.toFixed(1)} kWh into the battery, at the on-the-way tariff</span><b>{inr(cOv)}</b></div>}
        <div className="row" data-k="left"><span>Left in the battery at the end: {T.endKwhBatt.toFixed(1)} kWh, credited as {T.leftoverKwh.toFixed(1)} kWh paid at the home tariff</span><b>−{inr(c3)}</b></div>
        <div className="row" data-k="ev"><span>EV total, {(T.homeKwhBought + T.routeKwhBought - T.leftoverKwh).toFixed(1)} kWh paid net</span><b>{inr(ev)}</b></div>
        <div className="row" data-k="petrol"><span>Petrol, same {T.roadKm} km</span><b>{inr(pet)}</b></div>
        <small data-k="battery">Battery check: {T.startKwhBatt.toFixed(1)} start + {T.addedKwhBatt.toFixed(1)} charged − {T.usedKwh.toFixed(1)} driven ≈ {(T.startKwhBatt + T.addedKwhBatt - T.usedKwh).toFixed(1)} kWh, matching the {T.endKwhBatt.toFixed(1)} kWh left (about {Math.round(T.endKwhBatt / EX.usableKwh * 100)}% of {EX.usableKwh} kWh usable). Paid kWh are from the wall: battery kWh divided by {(1 - T.lossPct / 100).toFixed(2)} for the {T.lossPct}% charging loss.</small>
        <small>{EX.assumption}. Efficiency {P.kmPerKwh} km/kWh and {P.avgKmh} km/h average are planner assumptions, not measured for this car.</small>
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
    {!live && <p className="modenote">Live routing is not switched on yet, so a new pin is not routed. This draft shows one labelled worked example.</p>}
    <nav className="steps" aria-label="Screens">{['Destination', live ? 'Trip' : 'Worked example', 'Summary'].map((l, i) => <button key={l} className={i === s ? 'on' : ''} onClick={() => go(i)} disabled={(i === 2 && !V.totals) || (live && i > 0 && !V.live)}>{l}</button>)}</nav>
    <div className="stage">{s === 0 ? <Dice onGo={toTrip} live={live} onPin={(city, pin, nm) => { sel.current = { city, pin, nm }; setV(live ? { live: true, status: 'pending', origin: { name: city }, events: [], pinPlace: nm } : EX0); }} /> : s === 1 ? <Itinerary onNext={() => go(2)} busy={busy} /> : <Summary />}</div>
    <details className="more wide"><summary>What is real and what is not</summary>
      <p>Real: the BE 6 SPORTEQ Launch Edition 79 kWh battery size, the road route (OpenRouteService), charger positions (Open Charge Map and Charge_iN's own station map), and the planner arithmetic. Not real: speed, efficiency and tariffs are assumptions you can edit. {live ? 'The pin is plotted at its true coordinates. Where no road is near it, the road endpoint is the closest sampled point that snaps to a road, not a proven nearest.' : 'No routing runs for a new pin in this preview, so the pin does not change the itinerary shown.'}</p>
      <p>Charger coverage: the data we retrieved and filtered (public or public with account, CCS2, 50 kW or more, not broken, within 8 km of the road) can be thin in places. A gap means no usable charger in our data, not proof that none exists. Charge_iN stations are read from the coordinates in Mahindra's station map (55 listed as available, 3 listed as in progress and left out). Status is not live.</p>
      <p>Sources: routes by OpenRouteService (HeiGIT), © OpenStreetMap contributors (ODbL). Chargers: Open Charge Map (CC BY 4.0) and Charge_iN by Mahindra's station map. India outline: Survey of India, Outline of India (generalised, 1:16 million), reprojected and simplified by us to about 2 km. A draft display: reuse terms are not confirmed. No live map service is called from this page.</p>
    </details>
  </VC.Provider>;
}
