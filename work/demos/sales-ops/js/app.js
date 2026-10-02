/* TriLumen Systems — Sales Ops Demo */
(function () {
  "use strict";

  const CAT_COLORS = {
    HOME: "#5b8def",
    OUT: "#3db8a8",
    ELC: "#f0a14a",
    APP: "#c084fc",
    ESS: "#3ecf8e",
  };

  const state = {
    period: "ptd", // ptd | ytd
    tab: "scoreboard",
    level: "company", // company | region | store | associate
    regionId: null,
    storeId: null,
    associateId: null,
    meta: null,
    stores: [],
    associates: [],
    aggregates: null,
    tickets: [],
    charts: {},
    ticketPage: 0,
    ticketPageSize: 25,
    ticketQuery: "",
    ticketCat: "",
    selectedTicket: null,
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function fmtMoney(n, compact = false) {
    if (n == null || Number.isNaN(n)) return "—";
    if (compact) {
      const abs = Math.abs(n);
      if (abs >= 1e6) return (n < 0 ? "-" : "") + "$" + (abs / 1e6).toFixed(2) + "M";
      if (abs >= 1e3) return (n < 0 ? "-" : "") + "$" + (abs / 1e3).toFixed(1) + "K";
    }
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }
  function fmtMoneyExact(n) {
    if (n == null) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  }
  function fmtNum(n) {
    if (n == null) return "—";
    return n.toLocaleString("en-US");
  }
  function fmtPct(n, digits = 1) {
    if (n == null) return "—";
    return n.toFixed(digits) + "%";
  }
  function deltaClass(v) {
    if (v > 0.05) return "up";
    if (v < -0.05) return "down";
    return "flat";
  }
  function deltaLabel(v, suffix = "% vs LY") {
    const cls = deltaClass(v);
    const sign = v > 0 ? "+" : "";
    return `<span class="delta-pill ${cls}">${sign}${v.toFixed(1)}${suffix.replace("% vs LY", "%")}</span>`;
  }
  function deltaText(v) {
    const cls = deltaClass(v);
    const sign = v > 0 ? "+" : "";
    return `<span class="${cls}">${sign}${v.toFixed(1)}% vs LY</span>`;
  }

  function storeName(id) {
    const s = state.stores.find((x) => x.id === id);
    return s ? s.name : id;
  }
  function regionName(id) {
    const r = state.meta.regions.find((x) => x.id === id);
    return r ? r.name : id;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }
  function associateFullName(id) {
    const a = state.associates.find((x) => x.id === id);
    if (!a) return id;
    if (a.name) return a.name;
    if (a.firstName && a.lastName) return `${a.firstName} ${a.lastName}`;
    return a.firstName || id;
  }
  function assocSearchName(id) {
    return associateFullName(id);
  }
  function companyLabel() {
    return escapeHtml((state.meta && state.meta.company) || "Fieldstone Markets");
  }
  function assocLabel(id) {
    return `<span class="associate-label">${escapeHtml(associateFullName(id))}</span>`;
  }
  function rowLabel(row) {
    return row.level === "associate" ? assocLabel(row.id) : escapeHtml(row.name);
  }
  function chartLabel(row, maxLength) {
    const text = row.level === "associate" ? associateFullName(row.id) : row.name;
    return text.length > maxLength ? text.slice(0, maxLength - 1) + "…" : text;
  }
  function catName(id) {
    const c = state.meta.categories.find((x) => x.id === id);
    return c ? c.name : id;
  }

  function aggKey() {
    if (state.level === "associate" && state.associateId) return `assoc:${state.associateId}`;
    if (state.level === "store" && state.storeId) return `store:${state.storeId}`;
    if (state.level === "region" && state.regionId) return `region:${state.regionId}`;
    return "company";
  }

  function currentAgg() {
    const block = state.aggregates[state.period] || {};
    return block[aggKey()] || emptyAgg();
  }

  function emptyAgg() {
    return {
      revenue: 0, units: 0, tickets: 0, aov: 0, attachRate: 0, returnRate: 0,
      laborPerTicket: 0, walkins: 0, engaged: 0, sold: 0, engageRate: 0,
      closeRate: 0, conversion: 0, categoryMix: [], revenueLy: 0, revenueVsLy: 0,
      unitsLy: 0, aovLy: 0, conversionLy: 0, attachRateLy: 0, returnRateLy: 0,
      laborPerTicketLy: 0, walkinsLy: 0, engagedLy: 0, soldLy: 0, categoryMixLy: [],
    };
  }

  function childRankRows() {
    const block = state.aggregates[state.period];
    if (state.level === "company") {
      return state.meta.regions.map((r) => {
        const a = block[`region:${r.id}`] || emptyAgg();
        return { id: r.id, name: r.name, sub: "Region", level: "region", agg: a };
      }).sort((a, b) => b.agg.revenue - a.agg.revenue);
    }
    if (state.level === "region") {
      return state.stores
        .filter((s) => s.regionId === state.regionId)
        .map((s) => {
          const a = block[`store:${s.id}`] || emptyAgg();
          return { id: s.id, name: s.name, sub: `${s.size} · ${s.sqft.toLocaleString()} sqft`, level: "store", agg: a };
        })
        .sort((a, b) => b.agg.revenue - a.agg.revenue);
    }
    if (state.level === "store") {
      return state.associates
        .filter((x) => x.storeId === state.storeId)
        .map((x) => {
          const a = block[`assoc:${x.id}`] || emptyAgg();
          return { id: x.id, name: associateFirstName(x.id), sub: x.role, level: "associate", agg: a };
        })
        .sort((a, b) => b.agg.revenue - a.agg.revenue);
    }
    // associate level — show self only / ticket link
    const a = currentAgg();
    return [{
      id: state.associateId,
      name: associateFirstName(state.associateId),
      sub: "Associate detail — open Ticket Explorer",
      level: "associate",
      agg: a,
      leaf: true,
    }];
  }

  function drillTo(level, id) {
    if (level === "company") {
      state.level = "company";
      state.regionId = state.storeId = state.associateId = null;
    } else if (level === "region") {
      state.level = "region";
      state.regionId = id;
      state.storeId = state.associateId = null;
    } else if (level === "store") {
      state.level = "store";
      state.storeId = id;
      const st = state.stores.find((s) => s.id === id);
      if (st) state.regionId = st.regionId;
      state.associateId = null;
    } else if (level === "associate") {
      state.level = "associate";
      state.associateId = id;
      const a = state.associates.find((x) => x.id === id);
      if (a) {
        state.storeId = a.storeId;
        const st = state.stores.find((s) => s.id === a.storeId);
        if (st) state.regionId = st.regionId;
      }
    }
    state.ticketPage = 0;
    render();
  }

  function setPeriod(p) {
    state.period = p;
    state.ticketPage = 0;
    render();
  }

  function setTab(t) {
    state.tab = t;
    render();
  }

  function filteredTickets() {
    let list = state.tickets;
    if (state.regionId) list = list.filter((t) => t.r === state.regionId);
    if (state.storeId) list = list.filter((t) => t.s === state.storeId);
    if (state.associateId) list = list.filter((t) => t.a === state.associateId);
    // period filter on ticket dates
    const p = state.meta[state.period];
    list = list.filter((t) => t.d >= p.start && t.d <= p.end);
    if (state.ticketCat) {
      list = list.filter((t) => t.ln.some((l) => l.c === state.ticketCat));
    }
    const q = state.ticketQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        return (
          t.id.toLowerCase().includes(q) ||
          String(t.rid).includes(q) ||
          storeName(t.s).toLowerCase().includes(q) ||
          assocSearchName(t.a).toLowerCase().includes(q) ||
          regionName(t.r).toLowerCase().includes(q)
        );
      });
    }
    return list;
  }

  function destroyCharts() {
    Object.values(state.charts).forEach((c) => {
      try { c.destroy(); } catch (_) {}
    });
    state.charts = {};
  }

  function renderKpis(a) {
    const cards = [
      { label: "Revenue", value: fmtMoney(a.revenue, true), delta: a.revenueVsLy },
      { label: "Units", value: fmtNum(a.units), delta: a.unitsLy ? ((a.units - a.unitsLy) / a.unitsLy * 100) : 0 },
      { label: "AOV", value: fmtMoneyExact(a.aov).replace(/\.00$/, ""), delta: a.aovLy ? ((a.aov - a.aovLy) / a.aovLy * 100) : 0 },
      { label: "Conversion", value: fmtPct(a.conversion), delta: a.conversion - a.conversionLy },
      { label: "Traffic", value: fmtNum(a.walkins), delta: a.walkinsLy ? ((a.walkins - a.walkinsLy) / a.walkinsLy * 100) : 0 },
      { label: "Attach Rate", value: fmtPct(a.attachRate), delta: a.attachRate - a.attachRateLy },
      { label: "Return Rate", value: fmtPct(a.returnRate), delta: a.returnRateLy - a.returnRate }, // lower is better → invert
      { label: "Labor $/Ticket", value: fmtMoneyExact(a.laborPerTicket), delta: a.laborPerTicketLy ? ((a.laborPerTicketLy - a.laborPerTicket) / a.laborPerTicketLy * 100) : 0 },
    ];
    return cards.map((c) => `
      <div class="kpi">
        <div class="label">${c.label}</div>
        <div class="value">${c.value}</div>
        <div class="delta">${deltaText(c.delta)}</div>
      </div>
    `).join("");
  }

  function renderBreadcrumb() {
    const parts = [];
    parts.push(`<button type="button" data-nav="company" class="${state.level === "company" ? "current" : ""}">Fieldstone Markets</button>`);
    if (state.regionId) {
      parts.push(`<span class="sep">›</span>`);
      parts.push(`<button type="button" data-nav="region" data-id="${state.regionId}" class="${state.level === "region" ? "current" : ""}">${regionName(state.regionId)}</button>`);
    }
    if (state.storeId) {
      parts.push(`<span class="sep">›</span>`);
      parts.push(`<button type="button" data-nav="store" data-id="${state.storeId}" class="${state.level === "store" ? "current" : ""}">${storeName(state.storeId)}</button>`);
    }
    if (state.associateId) {
      parts.push(`<span class="sep">›</span>`);
      parts.push(`<button type="button" data-nav="associate" data-id="${state.associateId}" class="current">${assocLabel(state.associateId)}</button>`);
    }
    return parts.join("");
  }

  function renderRankTable(rows, title) {
    const nextHint =
      state.level === "company" ? "Click a region to drill" :
      state.level === "region" ? "Click a store to drill" :
      state.level === "store" ? "Click an associate to drill" :
      "Open Ticket Explorer for tickets";

    const body = rows.map((row, i) => {
      const a = row.agg;
      return `<tr data-drill="${row.level}" data-id="${row.id}" class="${row.leaf ? "" : ""}">
        <td class="rank">${i + 1}</td>
        <td><span class="entity">${rowLabel(row)}</span><span class="sub">${escapeHtml(row.sub)}</span></td>
        <td class="num">${fmtMoney(a.revenue, true)}</td>
        <td class="num">${deltaLabel(a.revenueVsLy)}</td>
        <td class="num">${fmtNum(a.units)}</td>
        <td class="num">${fmtMoneyExact(a.aov).replace(/\.00$/, "")}</td>
        <td class="num">${fmtPct(a.conversion)}</td>
        <td class="num">${fmtPct(a.attachRate)}</td>
      </tr>`;
    }).join("");

    return `
      <div class="panel">
        <div class="panel-hd">
          <h2>${title}</h2>
          <span class="meta">${nextHint}</span>
        </div>
        <div class="panel-bd scroll-table" style="padding-top:0">
          <table class="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Entity</th>
                <th class="num">Revenue</th>
                <th class="num">vs LY</th>
                <th class="num">Units</th>
                <th class="num">AOV</th>
                <th class="num">Conv %</th>
                <th class="num">Attach %</th>
              </tr>
            </thead>
            <tbody>${body || `<tr><td colspan="8" class="empty">No rows</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;
  }

  function renderScoreboard(a) {
    const rows = childRankRows();
    const title =
      state.level === "company" ? "Region scoreboard" :
      state.level === "region" ? `Store scoreboard — ${regionName(state.regionId)}` :
      state.level === "store" ? `Associate scoreboard — ${storeName(state.storeId)}` :
      `Associate — ${assocLabel(state.associateId)}`;

    // Secondary: top / bottom performers strip using children revenue vs LY
    // Dedupe by display name so synthetic name collisions (e.g. two "Rowan Chen") show once
    const uniqueByName = (arr) => {
      const seen = new Set();
      return arr.filter((r) => {
        if (seen.has(r.name)) return false;
        seen.add(r.name);
        return true;
      });
    };
    const byGrowth = [...rows].filter((r) => !r.leaf).sort((x, y) => y.agg.revenueVsLy - x.agg.revenueVsLy);
    const leaders = uniqueByName(byGrowth).slice(0, 3);
    const laggards = uniqueByName([...byGrowth].reverse()).slice(0, 3);

    return `
      <div class="panel-row two">
        ${renderRankTable(rows, title)}
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="panel">
            <div class="panel-hd"><h2>Revenue vs LY</h2><span class="meta">${state.meta[state.period].label}</span></div>
            <div class="panel-bd"><div class="chart-box"><canvas id="chartRevLy"></canvas></div></div>
          </div>
          <div class="panel-row split-rank" style="display:grid">
            <div class="panel">
              <div class="panel-hd"><h2>Growth leaders</h2></div>
              <div class="panel-bd" style="padding-top:4px">
                ${leaders.map((r, i) => `
                  <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-soft);cursor:pointer"
                       data-drill="${r.level}" data-id="${r.id}">
                    <span>${i + 1}. ${rowLabel(r)}</span>${deltaLabel(r.agg.revenueVsLy)}
                  </div>`).join("") || `<div class="empty">—</div>`}
              </div>
            </div>
            <div class="panel">
              <div class="panel-hd"><h2>Needs attention</h2></div>
              <div class="panel-bd" style="padding-top:4px">
                ${laggards.map((r, i) => `
                  <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-soft);cursor:pointer"
                       data-drill="${r.level}" data-id="${r.id}">
                    <span>${i + 1}. ${rowLabel(r)}</span>${deltaLabel(r.agg.revenueVsLy)}
                  </div>`).join("") || `<div class="empty">—</div>`}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p class="hint">Scope: ${scopeLabel()} · Tickets in period (agg): ${fmtNum(a.tickets)} · Sold traffic: ${fmtNum(a.sold)}</p>
    `;
  }

  function scopeLabel() {
    if (state.level === "associate") return assocLabel(state.associateId);
    if (state.level === "store") return storeName(state.storeId);
    if (state.level === "region") return regionName(state.regionId);
    return companyLabel();
  }

  function renderFunnel(a) {
    const max = Math.max(a.walkins, 1);
    const steps = [
      { name: "Walk-ins", val: a.walkins, ly: a.walkinsLy },
      { name: "Engaged", val: a.engaged, ly: a.engagedLy },
      { name: "Sold", val: a.sold, ly: a.soldLy },
    ];
    const rows = childRankRows().filter((r) => !r.leaf);

    return `
      <div class="panel-row two">
        <div class="panel">
          <div class="panel-hd">
            <h2>Traffic funnel</h2>
            <span class="meta">${scopeLabel()} · ${state.meta[state.period].label}</span>
          </div>
          <div class="panel-bd">
            <div class="funnel-list">
              ${steps.map((s) => `
                <div class="funnel-step">
                  <div class="name">${s.name}</div>
                  <div class="funnel-bar-track">
                    <div class="funnel-bar-fill" style="width:${Math.max(8, (s.val / max) * 100)}%">${fmtNum(s.val)}</div>
                  </div>
                  <div class="val">${deltaLabel(s.ly ? ((s.val - s.ly) / s.ly * 100) : 0)}</div>
                </div>
              `).join("")}
            </div>
            <div class="funnel-rates">
              <div class="metric"><div class="l">Engage rate</div><div class="v">${fmtPct(a.engageRate)}</div></div>
              <div class="metric"><div class="l">Close rate</div><div class="v">${fmtPct(a.closeRate)}</div></div>
              <div class="metric"><div class="l">Conversion</div><div class="v">${fmtPct(a.conversion)}</div></div>
              <div class="metric"><div class="l">LY conversion</div><div class="v">${fmtPct(a.conversionLy)}</div></div>
            </div>
            <div class="chart-box funnel" style="margin-top:16px"><canvas id="chartFunnelCompare"></canvas></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-hd">
            <h2>Conversion by ${state.level === "company" ? "region" : state.level === "region" ? "store" : state.level === "store" ? "associate" : "entity"}</h2>
            <span class="meta">Click to filter</span>
          </div>
          <div class="panel-bd scroll-table" style="padding-top:0">
            <table class="data">
              <thead>
                <tr>
                  <th>#</th><th>Entity</th>
                  <th class="num">Walk-ins</th>
                  <th class="num">Engaged</th>
                  <th class="num">Sold</th>
                  <th class="num">Conv %</th>
                  <th class="num">Close %</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((r, i) => `
                  <tr data-drill="${r.level}" data-id="${r.id}">
                    <td class="rank">${i + 1}</td>
                    <td><span class="entity">${rowLabel(r)}</span></td>
                    <td class="num">${fmtNum(r.agg.walkins)}</td>
                    <td class="num">${fmtNum(r.agg.engaged)}</td>
                    <td class="num">${fmtNum(r.agg.sold)}</td>
                    <td class="num">${fmtPct(r.agg.conversion)}</td>
                    <td class="num">${fmtPct(r.agg.closeRate)}</td>
                  </tr>`).join("") || `<tr><td colspan="7" class="empty">At associate level — switch to Ticket Explorer</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  function renderCategory(a) {
    const mix = a.categoryMix || [];
    const total = mix.reduce((s, c) => s + c.revenue, 0) || 1;
    const rows = childRankRows().filter((r) => !r.leaf);

    return `
      <div class="panel-row two">
        <div class="panel">
          <div class="panel-hd"><h2>Category mix</h2><span class="meta">${scopeLabel()}</span></div>
          <div class="panel-bd">
            <div class="chart-box tall"><canvas id="chartCatMix"></canvas></div>
            <div class="cat-legend">
              ${mix.map((c) => `
                <span><i style="background:${CAT_COLORS[c.id] || "#888"}"></i>
                ${catName(c.id)} · ${fmtPct((c.revenue / total) * 100)} · ${fmtMoney(c.revenue, true)}
                </span>`).join("")}
            </div>
            <div class="chart-box" style="margin-top:18px"><canvas id="chartCatLy"></canvas></div>
            <p class="hint">Bars: CY vs LY category revenue</p>
          </div>
        </div>
        <div class="panel">
          <div class="panel-hd"><h2>Attach & mix by child entity</h2><span class="meta">Click to drill</span></div>
          <div class="panel-bd scroll-table" style="padding-top:0">
            <table class="data">
              <thead>
                <tr>
                  <th>#</th><th>Entity</th>
                  <th class="num">Attach %</th>
                  <th class="num">Top category</th>
                  <th class="num">Revenue</th>
                  <th class="num">Return %</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((r, i) => {
                  const top = (r.agg.categoryMix && r.agg.categoryMix[0]) ? catName(r.agg.categoryMix[0].id) : "—";
                  return `<tr data-drill="${r.level}" data-id="${r.id}">
                    <td class="rank">${i + 1}</td>
                    <td><span class="entity">${rowLabel(r)}</span></td>
                    <td class="num">${fmtPct(r.agg.attachRate)}</td>
                    <td class="num">${top}</td>
                    <td class="num">${fmtMoney(r.agg.revenue, true)}</td>
                    <td class="num">${fmtPct(r.agg.returnRate)}</td>
                  </tr>`;
                }).join("") || `<tr><td colspan="6" class="empty">Leaf level</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  function renderTickets() {
    const all = filteredTickets();
    const pages = Math.max(1, Math.ceil(all.length / state.ticketPageSize));
    if (state.ticketPage >= pages) state.ticketPage = pages - 1;
    const start = state.ticketPage * state.ticketPageSize;
    const slice = all.slice(start, start + state.ticketPageSize);

    const catOpts = state.meta.categories.map((c) =>
      `<option value="${c.id}" ${state.ticketCat === c.id ? "selected" : ""}>${c.name}</option>`
    ).join("");

    return `
      <div class="panel">
        <div class="panel-hd">
          <h2>Ticket explorer</h2>
          <span class="meta">${fmtNum(all.length)} tickets in scope · sample extract</span>
        </div>
        <div class="panel-bd">
          <div class="toolbar">
            <input type="search" id="ticketSearch" placeholder="Search ticket, store, associate…" value="${state.ticketQuery.replace(/"/g, "&quot;")}" />
            <select id="ticketCat">
              <option value="">All categories</option>
              ${catOpts}
            </select>
            <button type="button" class="btn" id="ticketClear">Clear filters</button>
            <div class="pager" style="margin-left:auto">
              <button type="button" class="btn" id="pagePrev" ${state.ticketPage <= 0 ? "disabled" : ""}>Prev</button>
              <span>Page ${state.ticketPage + 1} / ${pages}</span>
              <button type="button" class="btn" id="pageNext" ${state.ticketPage >= pages - 1 ? "disabled" : ""}>Next</button>
            </div>
          </div>
          <div class="scroll-table">
            <table class="data" id="ticketTable">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Date / time</th>
                  <th>Region</th>
                  <th>Store</th>
                  <th>Associate</th>
                  <th class="num">Units</th>
                  <th class="num">Revenue</th>
                  <th>Attach</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${slice.map((t) => `
                  <tr data-ticket="${t.rid}">
                    <td><span class="entity" style="font-family:var(--mono)">${t.id}</span></td>
                    <td>${formatTs(t.ts)}</td>
                    <td>${regionName(t.r)}</td>
                    <td>${storeName(t.s)}</td>
                    <td>${assocLabel(t.a)}</td>
                    <td class="num">${t.u}</td>
                    <td class="num">${fmtMoneyExact(t.rev)}</td>
                    <td>${t.att ? "Yes" : "No"}</td>
                    <td>${t.ret ? `<span class="status ret">Returned</span>` : `<span class="status ok">Complete</span>`}</td>
                  </tr>`).join("") || `<tr><td colspan="9" class="empty">No tickets match</td></tr>`}
              </tbody>
            </table>
          </div>
          <p class="hint">Click a row for ticket detail. Ticket IDs use the TK-FS pattern. Drill scope filters this list.</p>
        </div>
      </div>`;
  }

  function formatTs(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
        timeZone: "America/New_York",
      }) + " ET";
    } catch {
      return iso;
    }
  }

  function openTicket(rid) {
    const t = state.tickets.find((x) => x.rid === rid);
    if (!t) return;
    state.selectedTicket = t;
    renderDrawer();
  }

  function closeDrawer() {
    state.selectedTicket = null;
    renderDrawer();
  }

  function renderDrawer() {
    const backdrop = $("#drawerBackdrop");
    const drawer = $("#drawer");
    const t = state.selectedTicket;
    if (!t) {
      backdrop.classList.remove("open");
      drawer.classList.remove("open");
      return;
    }
    backdrop.classList.add("open");
    drawer.classList.add("open");
    $("#drawerBody").innerHTML = `
      <div class="drawer-hd">
        <div>
          <h3>Ticket detail</h3>
          <div class="id">${t.id}</div>
        </div>
        <button type="button" class="drawer-close" id="drawerCloseBtn" aria-label="Close">×</button>
      </div>
      <div class="drawer-bd">
        <div class="kv">
          <div class="k">When</div><div class="v">${formatTs(t.ts)}</div>
          <div class="k">Region</div><div class="v"><button type="button" class="btn" data-drill="region" data-id="${t.r}">${regionName(t.r)}</button></div>
          <div class="k">Store</div><div class="v"><button type="button" class="btn" data-drill="store" data-id="${t.s}">${storeName(t.s)}</button></div>
          <div class="k">Associate</div><div class="v"><button type="button" class="btn" data-drill="associate" data-id="${t.a}">${assocLabel(t.a)}</button></div>
          <div class="k">Revenue</div><div class="v">${fmtMoneyExact(t.rev)}</div>
          <div class="k">Units</div><div class="v">${t.u}</div>
          <div class="k">Attach</div><div class="v">${t.att ? "Multi-category / multi-unit" : "Single-line"}</div>
          <div class="k">Labor alloc.</div><div class="v">${fmtMoneyExact(t.lab)}</div>
          <div class="k">Status</div><div class="v">${t.ret ? `<span class="status ret">Returned</span>` : `<span class="status ok">Complete</span>`}</div>
        </div>
        <h4 style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-mute)">Line items</h4>
        <table class="line-items">
          <thead><tr><th>Category</th><th class="num">Units</th><th class="num">Amount</th></tr></thead>
          <tbody>
            ${t.ln.map((l) => `
              <tr>
                <td><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${CAT_COLORS[l.c] || "#888"};margin-right:6px"></span>${catName(l.c)}</td>
                <td class="num">${l.u}</td>
                <td class="num">${fmtMoneyExact(l.amt)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;
    $("#drawerCloseBtn").onclick = closeDrawer;
    $$("[data-drill]", drawer).forEach((btn) => {
      btn.addEventListener("click", () => {
        drillTo(btn.dataset.drill, btn.dataset.id);
        closeDrawer();
        setTab("scoreboard");
      });
    });
  }

  function mountCharts(a) {
    destroyCharts();
    const Chart = window.Chart;
    if (!Chart) return;

    Chart.defaults.color = "#5a6a80";
    Chart.defaults.borderColor = "#e4e9f0";
    Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";

    if (state.tab === "scoreboard") {
      const rows = childRankRows().filter((r) => !r.leaf).slice(0, 12);
      const ctx = $("#chartRevLy");
      if (ctx) {
        state.charts.revLy = new Chart(ctx, {
          type: "bar",
          data: {
            labels: rows.map((r) => chartLabel(r, 16)),
            datasets: [
              {
                label: "CY Revenue",
                data: rows.map((r) => r.agg.revenue),
                backgroundColor: "rgba(61,184,168,0.75)",
                borderRadius: 4,
              },
              {
                label: "LY Revenue",
                data: rows.map((r) => r.agg.revenueLy),
                backgroundColor: "rgba(91,141,239,0.45)",
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } },
              tooltip: {
                callbacks: {
                  label: (c) => `${c.dataset.label}: ${fmtMoney(c.raw, true)}`,
                },
              },
            },
            scales: {
              x: { ticks: { maxRotation: 45, font: { size: 10 } } },
              y: {
                ticks: {
                  callback: (v) => fmtMoney(v, true),
                  font: { size: 10 },
                },
              },
            },
            onClick: (_e, els) => {
              if (!els.length) return;
              const row = rows[els[0].index];
              if (row) drillTo(row.level, row.id);
            },
          },
        });
      }
    }

    if (state.tab === "funnel") {
      const rows = childRankRows().filter((r) => !r.leaf).slice(0, 10);
      const ctx = $("#chartFunnelCompare");
      if (ctx) {
        state.charts.funnel = new Chart(ctx, {
          type: "bar",
          data: {
            labels: rows.map((r) => chartLabel(r, 14)),
            datasets: [
              { label: "Walk-ins", data: rows.map((r) => r.agg.walkins), backgroundColor: "rgba(91,141,239,0.7)" },
              { label: "Engaged", data: rows.map((r) => r.agg.engaged), backgroundColor: "rgba(61,184,168,0.7)" },
              { label: "Sold", data: rows.map((r) => r.agg.sold), backgroundColor: "rgba(62,207,142,0.7)" },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } } },
            scales: {
              x: { ticks: { font: { size: 10 } } },
              y: { ticks: { font: { size: 10 } } },
            },
            onClick: (_e, els) => {
              if (!els.length) return;
              const row = rows[els[0].index];
              if (row) drillTo(row.level, row.id);
            },
          },
        });
      }
    }

    if (state.tab === "category") {
      const mix = a.categoryMix || [];
      const lyMap = Object.fromEntries((a.categoryMixLy || []).map((c) => [c.id, c.revenue]));
      const ctx1 = $("#chartCatMix");
      if (ctx1) {
        state.charts.catMix = new Chart(ctx1, {
          type: "doughnut",
          data: {
            labels: mix.map((c) => catName(c.id)),
            datasets: [{
              data: mix.map((c) => c.revenue),
              backgroundColor: mix.map((c) => CAT_COLORS[c.id] || "#888"),
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "58%",
            plugins: {
              legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 } } },
              tooltip: {
                callbacks: {
                  label: (c) => {
                    const total = c.dataset.data.reduce((s, v) => s + v, 0) || 1;
                    return ` ${c.label}: ${fmtMoney(c.raw, true)} (${((c.raw / total) * 100).toFixed(1)}%)`;
                  },
                },
              },
            },
          },
        });
      }
      const ctx2 = $("#chartCatLy");
      if (ctx2) {
        state.charts.catLy = new Chart(ctx2, {
          type: "bar",
          data: {
            labels: mix.map((c) => catName(c.id)),
            datasets: [
              { label: "CY", data: mix.map((c) => c.revenue), backgroundColor: mix.map((c) => CAT_COLORS[c.id] || "#888") },
              { label: "LY", data: mix.map((c) => lyMap[c.id] || 0), backgroundColor: "rgba(90,106,128,0.28)" },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } } },
            scales: {
              y: { ticks: { callback: (v) => fmtMoney(v, true), font: { size: 10 } } },
            },
          },
        });
      }
    }
  }

  function bindUI() {
    $$(".tabs button").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === state.tab);
      b.onclick = () => setTab(b.dataset.tab);
    });
    $$(".seg-period button").forEach((b) => {
      b.classList.toggle("active", b.dataset.period === state.period);
      b.onclick = () => setPeriod(b.dataset.period);
    });
    $$(".breadcrumb button[data-nav]").forEach((b) => {
      if (b.classList.contains("current") && b.dataset.nav !== "company") return;
      b.onclick = () => {
        const nav = b.dataset.nav;
        if (nav === "company") drillTo("company");
        else drillTo(nav, b.dataset.id);
      };
    });
    $$("[data-drill]").forEach((el) => {
      el.addEventListener("click", (e) => {
        // avoid double with ticket rows
        if (el.dataset.ticket) return;
        const level = el.dataset.drill;
        const id = el.dataset.id;
        if (level && id) drillTo(level, id);
      });
    });

    if (state.tab === "tickets") {
      const search = $("#ticketSearch");
      const cat = $("#ticketCat");
      let tmr;
      if (search) {
        search.addEventListener("input", () => {
          clearTimeout(tmr);
          tmr = setTimeout(() => {
            state.ticketQuery = search.value;
            state.ticketPage = 0;
            render();
            const again = $("#ticketSearch");
            if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
          }, 200);
        });
      }
      if (cat) {
        cat.onchange = () => {
          state.ticketCat = cat.value;
          state.ticketPage = 0;
          render();
        };
      }
      const clear = $("#ticketClear");
      if (clear) clear.onclick = () => {
        state.ticketQuery = "";
        state.ticketCat = "";
        state.ticketPage = 0;
        render();
      };
      const prev = $("#pagePrev");
      const next = $("#pageNext");
      if (prev) prev.onclick = () => { state.ticketPage--; render(); };
      if (next) next.onclick = () => { state.ticketPage++; render(); };
      $$("#ticketTable tbody tr[data-ticket]").forEach((tr) => {
        tr.onclick = () => openTicket(Number(tr.dataset.ticket));
      });
    }
  }

  function render() {
    const a = currentAgg();
    $("#breadcrumb").innerHTML = renderBreadcrumb();
    $("#kpiGrid").innerHTML = renderKpis(a);
    $("#asOfLabel").textContent = `As of ${state.meta.asOfLabel}`;

    let html = "";
    if (state.tab === "scoreboard") html = renderScoreboard(a);
    else if (state.tab === "funnel") html = renderFunnel(a);
    else if (state.tab === "category") html = renderCategory(a);
    else html = renderTickets();

    $("#tabContent").innerHTML = html;
    bindUI();
    requestAnimationFrame(() => mountCharts(a));
    renderDrawer();
  }

  function load() {
    $("#boot").style.display = "flex";
    try {
      const data = window.SALES_OPS_DATA;
      if (!data || !data.meta || !data.aggregates || !data.tickets) {
        throw new Error("SALES_OPS_DATA missing — ensure js/data.js loads before app.js");
      }
      state.meta = data.meta;
      state.stores = data.stores;
      state.associates = data.associates;
      state.aggregates = data.aggregates;
      state.tickets = data.tickets;
      $("#boot").style.display = "none";
      $("#app").style.display = "flex";
      $("#companyName").textContent = (state.meta && state.meta.company) || "Fieldstone Markets";
      render();
    } catch (err) {
      $("#boot").innerHTML = `<div class="empty">Failed to load demo data.<br/><code>${err.message}</code></div>`;
    }
  }

  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  load();
})();
