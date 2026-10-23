# EV planner: local integration notes (draft, not pushed)
- Page: src/pages/ev-planner.astro (route /ev-planner/). App source: src/ev-planner/. Build bundle: `npm run build:ev` writes public/ev-planner/app.js and app.css (committed output).
- Live routing is off unless PUBLIC_EV_API is set at build time to a deployed backend. Without it the page shows a labelled worked example. No backend is deployed.
- Backend draft (Cloudflare Worker, ORS proxy, per-visitor and per-minute limits, origin lock): docs/ev-worker.mjs.txt. Not deployed. Needs ORS key as a secret.
- Data: src/ev-planner/ocm.json (Open Charge Map, CC BY 4.0), osm_near.json (derived from OSM India extract, Geofabrik india-261022, ODbL; also published at public/ev-planner/osm_near.json), geo.ts and geo_full.ts (Survey of India outline, simplified; licence review pending).
- Launch questions: SoI reuse terms (Geospatial Guidelines clause xiii vs 2005 National Map Policy vs FAQ); ODbL derived dataset publication; backend deployment and ORS free-tier limits; Nominatim single reverse lookup per trip at low user scale; Wikipedia area facts.
