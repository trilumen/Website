# Fieldstone Markets — Sales Ops Dashboard (TriLumen demo)

Interactive multi-store retail sales operations dashboard for **TriLumen Systems**.
All data is synthetic. Invented retailer: **Fieldstone Markets**.

## Path

```
/workspace/trilumen-interactive-demos/sales-ops/
```

## How to open

Works offline via **`file://`** — double-click `index.html` (or open via File → Open).
Demo data is embedded in `js/data.js` (no `fetch()` of JSON). Chart.js and IBM Plex fonts are **vendored** under `assets/vendor/` and `assets/fonts/` (no CDN required).

Optional local server (handy for iframe/embed preview):

```bash
cd /workspace/trilumen-interactive-demos/sales-ops
python3 -m http.server 8765
# → http://127.0.0.1:8765/
```

## How to embed

### iframe

```html
<iframe
  src="https://YOUR_HOST/work/demos/sales-ops/"
  title="Fieldstone Markets Sales Ops"
  style="width:100%;height:700px;border:0;border-radius:12px;"
  loading="lazy"
></iframe>
```

### Gallery card

Link the card thumbnail/CTA to `sales-ops/index.html` (or the Work demos path when hosted). Keep TriLumen wordmark as shipped (`assets/trilumen-wordmark.png`).

### Self-contained zip

Zip the entire `sales-ops/` directory (HTML, CSS, JS including `js/data.js`, `data/`, `assets/` with vendor + fonts). Double-click `index.html` works fully offline.

## Features

| Area | Behavior |
|------|----------|
| Drill path | Company → Region → Store → Associate → Ticket (breadcrumb to go up) |
| Period | PTD (Oct 1–2, 2026) / YTD (Jan 1 – Oct 2, 2026) toggle |
| Scoreboard | Ranked revenue / vs LY / units / AOV / conversion / attach; click rows or chart bars to drill |
| Traffic funnel | Walk-ins → Engaged → Sold with engage / close / conversion rates |
| Category mix | Home, Outdoor, Electronics, Apparel, Essentials — doughnut + CY vs LY |
| Ticket explorer | Searchable table, category filter, detail drawer; ticket IDs `TK-FS-####` |
| Branding | TriLumen wordmark top-right; **Sample data** badge; invented associate full names |

## Data

Runtime loads **`js/data.js`** (`window.SALES_OPS_DATA`) so `file://` works. Source JSON under `data/` is kept for regeneration / inspection:

| File | Role |
|------|------|
| `js/data.js` | Embedded bundle used by the board |
| `data/meta.json` | Company (Fieldstone Markets), periods, categories, regions |
| `data/stores.json` | 23 stores across 6 regions |
| `data/associates.json` | ~239 associates with invented first + last names |
| `data/aggregates.json` | Pre-rolled KPIs for PTD/YTD at company/region/store/associate |
| `data/tickets-explorer.json` | ~9k CY ticket rows for the explorer (sample extract) |

KPIs on the scoreboard/funnel/category views come from **aggregates** (full synthetic volume). The ticket table is a performant sample filtered by the current drill scope.

## Tech

- Vanilla JS + Chart.js 4 (vendored: `assets/vendor/chart.umd.min.js`)
- IBM Plex Sans / Mono (self-hosted woff2 under `assets/fonts/`)
- No build step; no `fetch()` of local JSON; offline-friendly

## Regenerating data

Update JSON under `data/`, then rebuild `js/data.js` by bundling meta/stores/associates/aggregates/tickets into `window.SALES_OPS_DATA`.
