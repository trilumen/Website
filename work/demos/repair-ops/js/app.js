/* TriLumen Systems — Maintenance · Repair ops board (synthetic data) */
(function () {
  "use strict";

  const THRESHOLD = 1500;

  const KPIS = [
    { key: "open", label: "Open downtime tickets", value: "6", delta: "2 critical · line A/C", tone: "down" },
    { key: "mttr", label: "Mean time to repair", value: "3.4h", delta: "↓ 41% vs prior month", tone: "up" },
    { key: "cost", label: "Monthly downtime cost", value: "$48.2k", delta: "↓ $19k vs Before", tone: "up" },
    { key: "parts", label: "Parts auto-ordered", value: "14", delta: "This month · under $1.5k", tone: "up" },
    { key: "await", label: "Awaiting approval", value: "3", delta: "Over $1,500 threshold", tone: "flat" },
  ];

  const MTTR_TREND = [
    { wk: "W1", hrs: 6.8 },
    { wk: "W2", hrs: 6.1 },
    { wk: "W3", hrs: 5.4 },
    { wk: "W4", hrs: 4.9 },
    { wk: "W5", hrs: 4.2 },
    { wk: "W6", hrs: 3.8 },
    { wk: "W7", hrs: 3.6 },
    { wk: "W8", hrs: 3.4 },
  ];

  const STATUS = {
    alerted: { label: "Alerted", cls: "alerted" },
    pick: { label: "Part pick", cls: "pick" },
    po: { label: "Awaiting PO approval", cls: "po" },
    repair: { label: "In repair", cls: "repair" },
    closed: { label: "Closed", cls: "closed" },
  };

  /**
   * Synthetic tickets — plant / company anonymized.
   * Flow: operator mobile form → parallel Teams alert + machine-down flag + inventory
   * → pick ticket (stock) or draft PO; under $1500 auto-approve, over escalate with $/hr.
   */
  const TICKETS = [
    {
      id: "DT-2841",
      machine: "CNC-██-07",
      machineLabel: "CNC cell · Bay 3",
      issue: "Spindle over-temp · E-stop",
      photo: true,
      status: "po",
      opened: "Oct 2 · 9:14 AM ET",
      downtimeHr: 420,
      partCost: 2840,
      part: "Spindle bearing kit · SK-████",
      vendor: "Vendor ███",
      operator: "Op. ████",
      line: "Line A",
      note: "Operator submitted mobile form with photo. Inventory short; draft PO over auto-approve threshold — escalated with downtime $/hr.",
      timeline: [
        { title: "Form submitted", time: "Oct 2 · 9:14 AM", note: "Mobile · spindle temp photo attached", state: "done" },
        { title: "Teams alert", time: "Oct 2 · 9:14 AM", note: "Maint. channel · @on-call", state: "done" },
        { title: "Schedule flagged", time: "Oct 2 · 9:15 AM", note: "Machine marked DOWN · Line A capacity −1", state: "done" },
        { title: "Inventory check", time: "Oct 2 · 9:16 AM", note: "Bearing kit · qty 0 · reorder point hit", state: "done" },
        { title: "Draft PO", time: "Oct 2 · 9:17 AM", note: "$2,840 · awaiting approval (>$1,500)", state: "warn" },
        { title: "Closed", time: "—", note: "Pending part receipt + repair", state: "pending" },
      ],
    },
    {
      id: "DT-2839",
      machine: "PMP-██-12",
      machineLabel: "Hydraulic press · Bay 1",
      issue: "Seal leak · hydraulic pressure drop",
      photo: true,
      status: "pick",
      opened: "Oct 2 · 7:42 AM ET",
      downtimeHr: 310,
      partCost: 186,
      part: "O-ring / seal kit · SK-████",
      vendor: "Stock · crib B",
      operator: "Op. ████",
      line: "Line C",
      note: "Part on hand. Auto pick ticket issued to crib B; tech notified in Teams.",
      timeline: [
        { title: "Form submitted", time: "Oct 2 · 7:42 AM", note: "Mobile · leak photo + gauge reading", state: "done" },
        { title: "Teams alert", time: "Oct 2 · 7:42 AM", note: "Maint. + Line C leads", state: "done" },
        { title: "Schedule flagged", time: "Oct 2 · 7:43 AM", note: "Machine DOWN · press bay 1", state: "done" },
        { title: "Inventory check", time: "Oct 2 · 7:43 AM", note: "Seal kit · qty 4 on hand", state: "done" },
        { title: "Pick ticket", time: "Oct 2 · 7:44 AM", note: "PICK-████ · crib B · auto (under $1,500)", state: "done" },
        { title: "Closed", time: "—", note: "Awaiting tech complete", state: "pending" },
      ],
    },
    {
      id: "DT-2837",
      machine: "CNV-██-03",
      machineLabel: "Conveyor · Pack-out",
      issue: "Drive belt slip · intermittent jam",
      photo: false,
      status: "repair",
      opened: "Oct 1 · 4:05 PM ET",
      downtimeHr: 185,
      partCost: 94,
      part: "Drive belt · SK-████",
      vendor: "Stock · crib A",
      operator: "Op. ████",
      line: "Pack",
      note: "Pick completed yesterday; tech on floor replacing belt. MTTR clock running.",
      timeline: [
        { title: "Form submitted", time: "Oct 1 · 4:05 PM", note: "Mobile · no photo", state: "done" },
        { title: "Teams alert", time: "Oct 1 · 4:05 PM", note: "Pack leads + maint.", state: "done" },
        { title: "Schedule flagged", time: "Oct 1 · 4:06 PM", note: "Conveyor DOWN · pack-out slowed", state: "done" },
        { title: "Inventory check", time: "Oct 1 · 4:06 PM", note: "Belt · qty 6 on hand", state: "done" },
        { title: "Pick ticket", time: "Oct 1 · 4:07 PM", note: "PICK-████ · crib A · auto", state: "done" },
        { title: "In repair", time: "Oct 2 · 8:10 AM", note: "Tech assigned · belt swap in progress", state: "done" },
        { title: "Closed", time: "—", note: "Pending QA restart", state: "pending" },
      ],
    },
    {
      id: "DT-2834",
      machine: "LAT-██-02",
      machineLabel: "Lathe · Tooling cell",
      issue: "Servo encoder fault",
      photo: true,
      status: "po",
      opened: "Oct 1 · 11:22 AM ET",
      downtimeHr: 520,
      partCost: 4125,
      part: "Servo encoder · OEM ███",
      vendor: "OEM distributor",
      operator: "Op. ████",
      line: "Line B",
      note: "High-cost OEM part. Escalated for PO approval; downtime $/hr shown next to part cost.",
      timeline: [
        { title: "Form submitted", time: "Oct 1 · 11:22 AM", note: "Mobile · fault code photo", state: "done" },
        { title: "Teams alert", time: "Oct 1 · 11:22 AM", note: "Maint. + plant eng.", state: "done" },
        { title: "Schedule flagged", time: "Oct 1 · 11:23 AM", note: "Lathe DOWN · Line B −1", state: "done" },
        { title: "Inventory check", time: "Oct 1 · 11:24 AM", note: "Encoder · qty 0 · no substitute", state: "done" },
        { title: "Draft PO", time: "Oct 1 · 11:26 AM", note: "$4,125 · awaiting approval (>$1,500)", state: "warn" },
        { title: "Closed", time: "—", note: "Pending PO + OEM ship", state: "pending" },
      ],
    },
    {
      id: "DT-2831",
      machine: "WLD-██-05",
      machineLabel: "Welder · Frame cell",
      issue: "Coolant pump failure",
      photo: true,
      status: "alerted",
      opened: "Oct 2 · 11:03 AM ET",
      downtimeHr: 275,
      partCost: null,
      part: "— inventory running —",
      vendor: "—",
      operator: "Op. ████",
      line: "Frame",
      note: "Just submitted. Parallel path: Teams alerted, schedule flagged, inventory check in flight.",
      timeline: [
        { title: "Form submitted", time: "Oct 2 · 11:03 AM", note: "Mobile · pump photo", state: "done" },
        { title: "Teams alert", time: "Oct 2 · 11:03 AM", note: "Maint. channel", state: "done" },
        { title: "Schedule flagged", time: "Oct 2 · 11:04 AM", note: "Welder DOWN · frame cell", state: "done" },
        { title: "Inventory check", time: "Oct 2 · 11:04 AM", note: "Pump SKU lookup…", state: "warn" },
        { title: "PO / pick", time: "—", note: "Pending inventory result", state: "pending" },
        { title: "Closed", time: "—", note: "—", state: "pending" },
      ],
    },
    {
      id: "DT-2828",
      machine: "RBT-██-01",
      machineLabel: "Robot · Palletize",
      issue: "Gripper pneumatic leak",
      photo: false,
      status: "po",
      opened: "Sep 30 · 2:18 PM ET",
      downtimeHr: 390,
      partCost: 1680,
      part: "Pneumatic gripper rebuild · SK-████",
      vendor: "Vendor ███",
      operator: "Op. ████",
      line: "Ship",
      note: "Just over threshold. Approval queue shows part cost vs ongoing downtime $/hr.",
      timeline: [
        { title: "Form submitted", time: "Sep 30 · 2:18 PM", note: "Mobile · no photo", state: "done" },
        { title: "Teams alert", time: "Sep 30 · 2:18 PM", note: "Ship + maint.", state: "done" },
        { title: "Schedule flagged", time: "Sep 30 · 2:19 PM", note: "Robot DOWN · palletize", state: "done" },
        { title: "Inventory check", time: "Sep 30 · 2:20 PM", note: "Rebuild kit · qty 0", state: "done" },
        { title: "Draft PO", time: "Sep 30 · 2:22 PM", note: "$1,680 · awaiting approval", state: "warn" },
        { title: "Closed", time: "—", note: "Pending approval", state: "pending" },
      ],
    },
    {
      id: "DT-2822",
      machine: "MIL-██-09",
      machineLabel: "Mill · Fixture bay",
      issue: "Tool changer jam",
      photo: true,
      status: "closed",
      opened: "Sep 29 · 8:50 AM ET",
      closed: "Sep 29 · 11:40 AM ET",
      downtimeHr: 210,
      partCost: 42,
      part: "ATC finger · SK-████",
      vendor: "Stock · crib A",
      operator: "Op. ████",
      line: "Line A",
      mttrHours: 2.8,
      note: "Full loop closed. Pick ticket auto; MTTR feed updated on dashboard.",
      timeline: [
        { title: "Form submitted", time: "Sep 29 · 8:50 AM", note: "Mobile · jam photo", state: "done" },
        { title: "Teams alert", time: "Sep 29 · 8:50 AM", note: "Maint. channel", state: "done" },
        { title: "Schedule flagged", time: "Sep 29 · 8:51 AM", note: "Mill DOWN · fixture bay", state: "done" },
        { title: "Inventory check", time: "Sep 29 · 8:51 AM", note: "ATC finger · qty 11", state: "done" },
        { title: "Pick ticket", time: "Sep 29 · 8:52 AM", note: "PICK-████ · crib A · auto", state: "done" },
        { title: "Closed", time: "Sep 29 · 11:40 AM", note: "MTTR 2.8h · ticket closed", state: "done" },
      ],
    },
    {
      id: "DT-2819",
      machine: "DRY-██-04",
      machineLabel: "Dryer · Finish",
      issue: "Heater element open circuit",
      photo: true,
      status: "closed",
      opened: "Sep 28 · 1:05 PM ET",
      closed: "Sep 28 · 6:20 PM ET",
      downtimeHr: 240,
      partCost: 890,
      part: "Heater element · SK-████",
      vendor: "Stock · crib C",
      operator: "Op. ████",
      line: "Finish",
      mttrHours: 5.2,
      note: "Auto-approved under $1,500. Closed same shift; contributes to MTTR trend.",
      timeline: [
        { title: "Form submitted", time: "Sep 28 · 1:05 PM", note: "Mobile · element photo", state: "done" },
        { title: "Teams alert", time: "Sep 28 · 1:05 PM", note: "Finish + maint.", state: "done" },
        { title: "Schedule flagged", time: "Sep 28 · 1:06 PM", note: "Dryer DOWN", state: "done" },
        { title: "Inventory check", time: "Sep 28 · 1:07 PM", note: "Element · qty 2", state: "done" },
        { title: "Pick ticket", time: "Sep 28 · 1:08 PM", note: "PICK-████ · crib C · auto", state: "done" },
        { title: "Closed", time: "Sep 28 · 6:20 PM", note: "MTTR 5.2h · ticket closed", state: "done" },
      ],
    },
  ];

  const el = {
    kpiGrid: document.getElementById("kpiGrid"),
    ticketTable: document.getElementById("ticketTable"),
    ticketMeta: document.getElementById("ticketMeta"),
    approvalQueue: document.getElementById("approvalQueue"),
    mttrChart: document.getElementById("mttrChart"),
    drawer: document.getElementById("drawer"),
    drawerBody: document.getElementById("drawerBody"),
    backdrop: document.getElementById("drawerBackdrop"),
  };

  let openId = null;

  function money(n) {
    if (n == null || Number.isNaN(n)) return "—";
    return "$" + n.toLocaleString("en-US");
  }

  function statusPill(key) {
    const s = STATUS[key] || STATUS.alerted;
    return `<span class="status ${s.cls}">${s.label}</span>`;
  }

  function renderKpis() {
    el.kpiGrid.innerHTML = KPIS.map(
      (k) => `
      <article class="kpi" data-key="${k.key}">
        <div class="label">${k.label}</div>
        <div class="value">${k.value}</div>
        <div class="delta">
          <span class="arrow-mark ${k.tone}">${k.tone === "up" ? "↓" : k.tone === "down" ? "↑" : "·"}</span>
          <span class="${k.tone}">${k.delta}</span>
        </div>
      </article>`
    ).join("");
  }

  function openTickets() {
    return TICKETS.filter((t) => t.status !== "closed");
  }

  function approvalTickets() {
    return TICKETS.filter((t) => t.status === "po" && t.partCost != null && t.partCost > THRESHOLD);
  }

  function renderTickets() {
    const rows = TICKETS.slice().sort((a, b) => {
      const order = { po: 0, alerted: 1, pick: 2, repair: 3, closed: 4 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });

    const openCount = openTickets().length;
    el.ticketMeta.textContent = `${openCount} open · ${rows.length} shown · click for timeline`;

    el.ticketTable.innerHTML = `
      <table class="data" aria-label="Downtime tickets">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Machine</th>
            <th>Issue</th>
            <th>Photo</th>
            <th>Opened</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (t) => `
            <tr class="clickable${openId === t.id ? " active" : ""}" data-id="${t.id}" tabindex="0">
              <td class="mono">${t.id}</td>
              <td>
                <span class="mono">${t.machine}</span>
                <span class="sub">${t.machineLabel}</span>
              </td>
              <td>${t.issue}</td>
              <td>
                <span class="photo-ind ${t.photo ? "has" : "none"}" title="${t.photo ? "Photo attached" : "No photo"}" aria-label="${t.photo ? "Photo attached" : "No photo"}">${t.photo ? "📷" : "—"}</span>
              </td>
              <td class="mono">${t.opened}</td>
              <td>${statusPill(t.status)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <p class="hint">Sample data — plant name and machine IDs partially redacted. Flowchart lives in the case study story, not on this board.</p>`;

    el.ticketTable.querySelectorAll("tr.clickable").forEach((tr) => {
      tr.addEventListener("click", () => openTicket(tr.dataset.id));
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTicket(tr.dataset.id);
        }
      });
    });
  }

  function renderApprovals() {
    const list = approvalTickets();
    if (!list.length) {
      el.approvalQueue.innerHTML = `<p class="hint">No POs over $${THRESHOLD.toLocaleString()} awaiting approval.</p>`;
      return;
    }

    el.approvalQueue.innerHTML = `
      <div class="approval-list">
        ${list
          .map(
            (t) => `
          <div class="approval-card${openId === t.id ? " active" : ""}" data-id="${t.id}" role="button" tabindex="0">
            <div class="ac-top">
              <span class="ac-id">${t.id}</span>
              <span class="ac-machine mono">${t.machine}</span>
            </div>
            <div class="ac-part">${t.part}</div>
            <div class="ac-metrics">
              <div class="metric-box">
                <div class="l">Part cost</div>
                <div class="v cost">${money(t.partCost)}</div>
              </div>
              <div class="metric-box">
                <div class="l">Downtime $/hr</div>
                <div class="v down">${money(t.downtimeHr)}/hr</div>
              </div>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <p class="hint">Under $${THRESHOLD.toLocaleString()} auto-approves. Over escalates with downtime cost context.</p>`;

    el.approvalQueue.querySelectorAll(".approval-card").forEach((card) => {
      card.addEventListener("click", () => openTicket(card.dataset.id));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTicket(card.dataset.id);
        }
      });
    });
  }

  function renderMttr() {
    const max = Math.max(...MTTR_TREND.map((d) => d.hrs));
    el.mttrChart.innerHTML = MTTR_TREND.map((d) => {
      const pct = Math.round((d.hrs / max) * 100);
      return `
        <div class="mttr-bar-col">
          <span class="hrs">${d.hrs}</span>
          <div class="mttr-bar" style="height:${pct}%" title="${d.wk}: ${d.hrs}h"></div>
          <span class="wk">${d.wk}</span>
        </div>`;
    }).join("");
  }

  function findTicket(id) {
    return TICKETS.find((t) => t.id === id);
  }

  function openTicket(id) {
    const t = findTicket(id);
    if (!t) return;
    openId = id;

    document.querySelectorAll("tr.clickable").forEach((tr) => {
      tr.classList.toggle("active", tr.dataset.id === id);
    });
    document.querySelectorAll(".approval-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.id === id);
    });

    const fields = [
      ["Ticket", t.id],
      ["Machine", `${t.machine} · ${t.machineLabel}`],
      ["Line", t.line],
      ["Operator", t.operator],
      ["Issue", t.issue],
      ["Photo", t.photo ? "Attached (mobile)" : "None"],
      ["Status", STATUS[t.status].label],
      ["Opened", t.opened],
    ];
    if (t.closed) fields.push(["Closed", t.closed]);
    if (t.mttrHours != null) fields.push(["MTTR", `${t.mttrHours}h`]);
    if (t.partCost != null) fields.push(["Part cost", money(t.partCost)]);
    fields.push(["Downtime $/hr", money(t.downtimeHr) + "/hr"]);
    fields.push(["Part", t.part]);
    fields.push(["Source", t.vendor]);

    el.drawerBody.innerHTML = `
      <div class="drawer-hd">
        <div>
          <h3>${t.issue}</h3>
          <div class="id">${t.id} · ${t.machine}</div>
        </div>
        <button type="button" class="drawer-close" id="drawerClose" aria-label="Close">×</button>
      </div>
      <div class="drawer-bd">
        <div class="kv">
          ${fields
            .map(
              ([k, v]) => `
            <div class="k">${k}</div>
            <div class="v">${v}</div>`
            )
            .join("")}
        </div>
        <div class="drawer-note">${t.note}</div>
        <h4 style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-mute)">Timeline</h4>
        <div class="timeline">
          ${t.timeline
            .map(
              (step) => `
            <div class="timeline-item">
              <div class="tl-dot ${step.state}"></div>
              <div class="tl-body">
                <div class="tl-title">${step.title}</div>
                <div class="tl-time">${step.time}</div>
                <div class="tl-note">${step.note}</div>
              </div>
            </div>`
            )
            .join("")}
        </div>
      </div>`;

    el.drawer.classList.add("open");
    el.backdrop.classList.add("open");
    el.backdrop.setAttribute("aria-hidden", "false");
    document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  }

  function closeDrawer() {
    openId = null;
    el.drawer.classList.remove("open");
    el.backdrop.classList.remove("open");
    el.backdrop.setAttribute("aria-hidden", "true");
    document.querySelectorAll("tr.clickable").forEach((tr) => tr.classList.remove("active"));
    document.querySelectorAll(".approval-card").forEach((card) => card.classList.remove("active"));
  }

  el.backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  renderKpis();
  renderTickets();
  renderApprovals();
  renderMttr();
})();
