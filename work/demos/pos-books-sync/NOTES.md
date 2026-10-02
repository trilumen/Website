# Brightwell Mercantile — POS · Books Sync (TriLumen demo)

Interactive Before/After board: Square POS, QuickBooks Online, and Excel — manual re-key vs TriLumen nightly sync.
All data is synthetic. Invented merchant: **Brightwell Mercantile**.

## Path

```
/workspace/trilumen-interactive-demos/pos-books-sync/
```

## How to open

Double-click `index.html` or serve locally.

```bash
cd /workspace/trilumen-interactive-demos/pos-books-sync
python3 -m http.server 8766
```

## Embed mode

Add `?embed=1` to hide the TriLumen wordmark and footer (keeps KPIs and Before/After toggle). Use for homepage iframe embeds so the host page does not double-logo.

```html
<iframe src="/work/demos/pos-books-sync/?embed=1" title="Brightwell Mercantile POS · Books Sync" loading="lazy"></iframe>
```

## Board

1. **Header** — POS · Books sync; Brightwell Mercantile; Before | After toggle; Sample data badge; TriLumen wordmark (hidden in embed)
2. **KPI strip** — hours re-keyed, unmatched deposits, inventory variance, days to close, duplicate SKUs
3. **Detail board** — Before: last night’s mess / exceptions; After: nightly job log

## Sample language

Footer and hints say **All data is synthetic.** Invented SKUs use `SK-BW-####`, audit refs `AUD-BW-####`, payouts `po_BW#####`.
