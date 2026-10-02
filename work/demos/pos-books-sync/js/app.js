/* TriLumen Systems — POS · Books Sync Before/After demo (synthetic data) */
(function () {
  "use strict";

  const KPIS = {
    before: [
      { key: "hours", label: "Hours re-keyed / week", value: "11.5", delta: "↑ vs target 2h", tone: "down", className: "worse" },
      { key: "unmatched", label: "Unmatched deposits", value: "7", delta: "$4,812 at risk", tone: "down", className: "worse" },
      { key: "variance", label: "Inventory variance", value: "3.8%", delta: "↑ from 1.2% LY", tone: "down", className: "worse" },
      { key: "close", label: "Days to close books", value: "9", delta: "Month-end slip", tone: "down", className: "worse" },
      { key: "dupes", label: "Duplicate SKUs / customers", value: "42", delta: "Sheet drift", tone: "down", className: "worse" },
    ],
    after: [
      { key: "hours", label: "Hours re-keyed / week", value: "0.4", delta: "↓ 96% vs Before", tone: "up", className: "better" },
      { key: "unmatched", label: "Unmatched deposits", value: "0", delta: "All matched nightly", tone: "up", className: "better" },
      { key: "variance", label: "Inventory variance", value: "0.6%", delta: "Within tolerance", tone: "up", className: "better" },
      { key: "close", label: "Days to close books", value: "2", delta: "↓ 7 days", tone: "up", className: "better" },
      { key: "dupes", label: "Duplicate SKUs / customers", value: "3", delta: "Queued for merge", tone: "up", className: "better" },
    ],
  };

  const EXCEPTIONS = [
    {
      id: "EX-1042",
      time: "Sep 30 · 11:42 PM ET",
      source: "Square → clipboard",
      issue: "Deposit $1,284.60 not in QBO",
      severity: "err",
      severityLabel: "Unmatched",
      detail: {
        title: "Unmatched deposit",
        fields: [
          ["Exception", "EX-1042"],
          ["Square payout", "po_BW88214 · $1,284.60"],
          ["Expected QBO", "Deposit · Sep 30"],
          ["Found in QBO", "— none —"],
          ["Excel row", "Deposits!B184 (stale)"],
          ["Owner", "Bookkeeper · manual"],
        ],
        note: "CSV exported from Square at 10:15 PM, pasted into QBO Bank Deposit at 11:40 PM. Amount mismatch vs Square dashboard ($1,280.10 after tip adjustment). Excel still shows prior-night total.",
      },
    },
    {
      id: "EX-1041",
      time: "Sep 30 · 9:18 PM ET",
      source: "Excel master",
      issue: "SKU SK-BW-4412 listed twice (retail + wholesale)",
      severity: "warn",
      severityLabel: "Duplicate",
      detail: {
        title: "Duplicate SKU / customer",
        fields: [
          ["Exception", "EX-1041"],
          ["SKU", "SK-BW-4412 · Ceramic pour-over"],
          ["Square catalog", "1 active item"],
          ["Excel rows", "Items!A92 and Items!A217"],
          ["QBO product", "2 Product/Service records"],
          ["Impact", "COGS + inventory count skew"],
        ],
        note: "Wholesale row was hand-added last Thursday when Square CSV lacked the channel tag. QBO now has two products; inventory variance climbed after weekend sales.",
      },
    },
    {
      id: "EX-1039",
      time: "Sep 30 · 6:05 PM ET",
      source: "QBO re-key",
      issue: "Sales receipt total ≠ Square batch",
      severity: "err",
      severityLabel: "Re-key error",
      detail: {
        title: "Sales receipt mismatch",
        fields: [
          ["Exception", "EX-1039"],
          ["Square batch", "batch_BW9104 · $3,902.15"],
          ["QBO receipt", "SR-BW-3310 · $3,872.15"],
          ["Delta", "−$30.00 (missing tip line)"],
          ["Entered by", "AP clerk · 6:02 PM"],
          ["Excel P&L", "Still shows $3,902.15"],
        ],
        note: "Tip line omitted during re-key from Square Daily Summary PDF. Excel workbook was refreshed from an older export, so ops still trusts the wrong number.",
      },
    },
    {
      id: "EX-1037",
      time: "Sep 29 · 8:40 PM ET",
      source: "CSV drop",
      issue: "Customer Mira Langford appears under two emails",
      severity: "warn",
      severityLabel: "Duplicate",
      detail: {
        title: "Duplicate customer",
        fields: [
          ["Exception", "EX-1037"],
          ["Square buyer", "Mira Langford · loyalty"],
          ["QBO customer", "Two Customer records"],
          ["Emails", "a@… / a+pos@…"],
          ["Open invoices", "1 orphaned"],
          ["Excel CRM tab", "Both rows active"],
        ],
        note: "Guest checkout created a second Square profile; CSV import into QBO did not fuzzy-match. AR aging and Excel CRM tab disagree on open balance.",
      },
    },
    {
      id: "EX-1035",
      time: "Sep 29 · 5:12 PM ET",
      source: "Square export",
      issue: "Inventory count −14 vs Excel on hand",
      severity: "err",
      severityLabel: "Variance",
      detail: {
        title: "Inventory variance",
        fields: [
          ["Exception", "EX-1035"],
          ["Item", "SK-BW-5520 · Candle set"],
          ["Square on hand", "61"],
          ["Excel on hand", "75"],
          ["QBO qty", "Not updated since Sep 22"],
          ["Likely cause", "Weekend transfers never re-keyed"],
        ],
        note: "Transfer out of front-of-house was logged in Square; Excel and QBO still reflect pre-weekend counts. Month-end close blocked on this SKU family.",
      },
    },
  ];

  const SYNC_JOBS = [
    {
      id: "JOB-2201",
      time: "Oct 1 · 2:04 AM ET",
      step: "Square → QBO sales receipts",
      result: "148 receipts posted",
      status: "ok",
      statusLabel: "Complete",
      detail: {
        title: "Sales receipts sync",
        fields: [
          ["Job", "JOB-2201"],
          ["Window", "Sep 30 00:00 – 23:59 ET"],
          ["Square orders", "148"],
          ["QBO sales receipts", "148 created"],
          ["Skipped", "0 (voids handled)"],
          ["Duration", "1m 12s"],
        ],
        note: "TriLumen mapped Square line items to QBO Product/Service IDs, including tip and tax lines. Idempotent keys prevent duplicate posts on re-run.",
      },
    },
    {
      id: "JOB-2202",
      time: "Oct 1 · 2:06 AM ET",
      step: "Deposit match · Square payouts ↔ QBO",
      result: "3 payouts matched · $9,441.20",
      status: "ok",
      statusLabel: "Matched",
      detail: {
        title: "Deposit match",
        fields: [
          ["Job", "JOB-2202"],
          ["Square payouts", "3"],
          ["QBO bank deposits", "3 linked"],
          ["Unmatched", "0"],
          ["Tolerance", "±$0.01"],
          ["Audit ref", "AUD-BW-2202"],
        ],
        note: "Each Square payout was matched to the corresponding QBO deposit by amount + settlement date. Fees landed on the clearing account with a full audit trail.",
      },
    },
    {
      id: "JOB-2203",
      time: "Oct 1 · 2:08 AM ET",
      step: "Excel refresh · ops workbook",
      result: "Sales, deposits, inventory tabs",
      status: "ok",
      statusLabel: "Refreshed",
      detail: {
        title: "Excel workbook refresh",
        fields: [
          ["Job", "JOB-2203"],
          ["Workbook", "Ops_Daily_BW.xlsx"],
          ["Tabs", "Sales · Deposits · Inventory · Exceptions"],
          ["Rows written", "1,204"],
          ["Prior snapshot", "Retained (versioned)"],
          ["Source of truth", "TriLumen hub (not the sheet)"],
        ],
        note: "Excel is a downstream view. Nightly job overwrites calculated tabs from Square + QBO truth; exception tab lists the 3 residual duplicate candidates queued for merge.",
      },
    },
    {
      id: "JOB-2204",
      time: "Oct 1 · 2:09 AM ET",
      step: "Catalog dedupe pass",
      result: "2 SKU merges proposed",
      status: "ok",
      statusLabel: "Queued",
      detail: {
        title: "Catalog dedupe",
        fields: [
          ["Job", "JOB-2204"],
          ["Candidates", "3 duplicate clusters"],
          ["Auto-merged", "0 (policy: review)"],
          ["Queued for review", "2 SKUs · 1 customer"],
          ["QBO impact", "No destructive writes"],
          ["Audit ref", "AUD-BW-2204"],
        ],
        note: "Fuzzy match on name + barcode flagged clusters. TriLumen stages merges for human approval instead of silently collapsing records.",
      },
    },
  ];

  const COPY = {
    before: {
      subtitle: "Manual export & re-key · tools not speaking · As of Oct 1, 2026",
      boardTitle: "Last night’s mess",
      boardMeta: "CSV drop · paste into QBO · Excel as source of truth",
    },
    after: {
      subtitle: "Nightly TriLumen sync · Square → QBO + Excel · As of Oct 1, 2026",
      boardTitle: "Last sync",
      boardMeta: "Square → QBO sales receipts + deposit match → Excel refresh",
    },
  };

  let mode = "before";
  let openRowId = null;

  const el = {
    app: document.getElementById("app"),
    modeSubtitle: document.getElementById("modeSubtitle"),
    kpiGrid: document.getElementById("kpiGrid"),
    boardTitle: document.getElementById("boardTitle"),
    boardMeta: document.getElementById("boardMeta"),
    boardBody: document.getElementById("boardBody"),
    drawer: document.getElementById("drawer"),
    drawerBody: document.getElementById("drawerBody"),
    backdrop: document.getElementById("drawerBackdrop"),
    btnBefore: document.getElementById("btnBefore"),
    btnAfter: document.getElementById("btnAfter"),
  };

  function setMode(next) {
    mode = next;
    el.app.dataset.mode = mode;
    el.btnBefore.classList.toggle("active", mode === "before");
    el.btnAfter.classList.toggle("active", mode === "after");

    const c = COPY[mode];
    el.modeSubtitle.textContent = c.subtitle;
    el.boardTitle.textContent = c.boardTitle;
    el.boardMeta.textContent = c.boardMeta;

    closeDrawer();
    renderKpis();
    renderBoard();
  }

  function renderKpis() {
    const rows = KPIS[mode];
    el.kpiGrid.innerHTML = rows
      .map(
        (k) => `
      <article class="kpi ${k.className}" data-key="${k.key}">
        <div class="label">${k.label}</div>
        <div class="value flip">${k.value}</div>
        <div class="delta">
          <span class="arrow-mark ${k.tone}">${k.tone === "up" ? "↓" : k.tone === "down" ? "↑" : "·"}</span>
          <span class="${k.tone}">${k.delta}</span>
        </div>
      </article>`
      )
      .join("");
  }

  function renderBoard() {
    if (mode === "before") {
      el.boardBody.innerHTML = `
        <div class="source-chips" aria-label="Manual sources">
          <span class="chip bad"><span class="chip-icon">⬇</span> CSV drop from Square</span>
          <span class="chip bad"><span class="chip-icon">⌨</span> Paste / re-key into QBO</span>
          <span class="chip bad"><span class="chip-icon">⧉</span> Excel as source of truth</span>
        </div>
        <table class="data" aria-label="Exception list">
          <thead>
            <tr>
              <th>When</th>
              <th>ID</th>
              <th>Source</th>
              <th>Issue</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${EXCEPTIONS.map(
              (r) => `
              <tr class="clickable" data-id="${r.id}" tabindex="0">
                <td class="mono">${r.time}</td>
                <td class="mono">${r.id}</td>
                <td>${r.source}</td>
                <td>${r.issue}</td>
                <td><span class="status ${r.severity}">${r.severityLabel}</span></td>
              </tr>`
            ).join("")}
          </tbody>
        </table>
        <p class="hint">Click a row for exception detail. Sample data — Brightwell Mercantile. All data is synthetic.</p>`;
    } else {
      el.boardBody.innerHTML = `
        <div class="source-chips" aria-label="Sync pipeline">
          <span class="chip good"><span class="chip-icon">✓</span> Square → QBO sales receipts</span>
          <span class="chip good"><span class="chip-icon">✓</span> Deposit match</span>
          <span class="chip good"><span class="chip-icon">✓</span> Excel refresh</span>
        </div>
        <table class="data" aria-label="Sync job log">
          <thead>
            <tr>
              <th>When</th>
              <th>Job</th>
              <th>Step</th>
              <th>Result</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${SYNC_JOBS.map(
              (r) => `
              <tr class="clickable" data-id="${r.id}" tabindex="0">
                <td class="mono">${r.time}</td>
                <td class="mono">${r.id}</td>
                <td>${r.step}</td>
                <td>${r.result}</td>
                <td><span class="status ok"><span class="check">✓</span> ${r.statusLabel}</span></td>
              </tr>`
            ).join("")}
          </tbody>
        </table>
        <p class="hint">Click a row for sync detail. Sample data — Brightwell Mercantile. All data is synthetic.</p>`;
    }

    el.boardBody.querySelectorAll("tr.clickable").forEach((tr) => {
      tr.addEventListener("click", () => openRow(tr.dataset.id));
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openRow(tr.dataset.id);
        }
      });
    });
  }

  function findRow(id) {
    const list = mode === "before" ? EXCEPTIONS : SYNC_JOBS;
    return list.find((r) => r.id === id);
  }

  function openRow(id) {
    const row = findRow(id);
    if (!row) return;
    openRowId = id;

    el.boardBody.querySelectorAll("tr.clickable").forEach((tr) => {
      tr.classList.toggle("active", tr.dataset.id === id);
    });

    const d = row.detail;
    el.drawerBody.innerHTML = `
      <div class="drawer-hd">
        <div>
          <h3>${d.title}</h3>
          <div class="id">${row.id}</div>
        </div>
        <button type="button" class="drawer-close" id="drawerClose" aria-label="Close">×</button>
      </div>
      <div class="drawer-bd">
        <div class="kv">
          ${d.fields
            .map(
              ([k, v]) => `
            <div class="k">${k}</div>
            <div class="v">${v}</div>`
            )
            .join("")}
        </div>
        <div class="drawer-note">${d.note}</div>
      </div>`;

    el.drawer.classList.add("open");
    el.backdrop.classList.add("open");
    el.backdrop.setAttribute("aria-hidden", "false");
    document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  }

  function closeDrawer() {
    openRowId = null;
    el.drawer.classList.remove("open");
    el.backdrop.classList.remove("open");
    el.backdrop.setAttribute("aria-hidden", "true");
    el.boardBody.querySelectorAll("tr.clickable").forEach((tr) => tr.classList.remove("active"));
  }

  el.btnBefore.addEventListener("click", () => setMode("before"));
  el.btnAfter.addEventListener("click", () => setMode("after"));
  el.backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  function isEmbed() {
    try {
      return new URLSearchParams(location.search).get("embed") === "1"
        || document.documentElement.classList.contains("embed")
        || document.body.classList.contains("embed");
    } catch (e) {
      return false;
    }
  }

  function embedAutoFlip() {
    if (!isEmbed()) {
      setMode("before");
      return;
    }
    setMode("before");
    let flipped = false;
    const flip = () => {
      if (flipped) return;
      flipped = true;
      setMode("after");
    };
    const root = document.getElementById("app") || document.body;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.35)) {
          window.setTimeout(flip, 2800);
          io.disconnect();
        }
      }, { threshold: [0.35, 0.5] });
      io.observe(root);
      // Fallback if already visible (some iframe cases)
      window.setTimeout(() => {
        const rect = root.getBoundingClientRect();
        const vh = window.innerHeight || 600;
        if (rect.top < vh * 0.85 && rect.bottom > vh * 0.15) {
          window.setTimeout(flip, 2800);
          io.disconnect();
        }
      }, 400);
    } else {
      window.setTimeout(flip, 3200);
    }
    window.addEventListener("message", (ev) => {
      if (!ev || !ev.data) return;
      if (ev.data === "trilumen:pos-flip-after" || ev.data.type === "trilumen:pos-flip-after") flip();
      if (ev.data === "trilumen:pos-show-before" || ev.data.type === "trilumen:pos-show-before") {
        flipped = false;
        setMode("before");
      }
    });
  }

  embedAutoFlip();
})();
