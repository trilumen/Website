#!/usr/bin/env python3
"""Generate 6 TriLumen Work gallery boards (1600x1000) - synthetic data only."""
from __future__ import annotations

import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = Path("/workspace/Website/work/gallery/boards")
WM = Path("/workspace/Website/work/gallery/assets/trilumen-wordmark.png")
FONT = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
MONO = "/usr/share/fonts/truetype/sand-box/google/Geist Mono/GeistMono-VariableFont_wght.ttf"

# Brand palette
P1, P2, P3, P4 = "#4C4272", "#5B5088", "#6B5FA0", "#7C70B8"
AMBER = "#D97706"
AMBER_SOFT = "#FEF3C7"
BG = "#F4F2FA"
PANEL = "#FFFFFF"
INK = "#18181B"
MUTED = "#71717A"
SOFT = "#A1A1AA"
BORDER = "#E5E1F0"
ROW = "#FAFAFA"
OK = "#059669"
W, H = 1600, 1000

rng = random.Random(42)


def hex_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def font(size: int, mono=False):
    path = MONO if mono else FONT
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)


def text_w(draw, text, f):
    b = draw.textbbox((0, 0), text, font=f)
    return b[2] - b[0]


def text_h(draw, text, f):
    b = draw.textbbox((0, 0), text, font=f)
    return b[3] - b[1]


def rounded(draw, xy, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def shadow_panel(base, xy, r=12):
    """Soft drop shadow under a panel."""
    x0, y0, x1, y1 = xy
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x0 + 2, y0 + 3, x1 + 2, y1 + 4), radius=r, fill=(76, 66, 114, 28))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    base.alpha_composite(shadow)


def chrome(img, title_kicker, company, subtitle, badge="Sample data"):
    """Top bar with brand block + wordmark + sample badge."""
    draw = ImageDraw.Draw(img)
    # topbar bg
    draw.rectangle((0, 0, W, 78), fill=hex_rgb(PANEL))
    draw.line((0, 78, W, 78), fill=hex_rgb(BORDER), width=1)

    f_kick = font(12)
    f_co = font(26)
    f_sub = font(13)
    draw.text((28, 14), title_kicker.upper(), fill=hex_rgb(P1), font=f_kick)
    draw.text((28, 32), company, fill=hex_rgb(INK), font=f_co)
    draw.text((28, 62), subtitle, fill=hex_rgb(MUTED), font=f_sub)

    # badge
    bw = text_w(draw, badge, font(11)) + 20
    bx = W - 300 - bw
    rounded(draw, (bx, 28, bx + bw, 50), 999, fill=hex_rgb(BG), outline=hex_rgb(BORDER))
    draw.text((bx + 10, 32), badge, fill=hex_rgb(P1), font=font(11))

    # wordmark
    if WM.exists():
        wm = Image.open(WM).convert("RGBA")
        wm = wm.resize((180, 34), Image.Resampling.LANCZOS)
        img.paste(wm, (W - 28 - 180, 22), wm)

    return 90  # content top


def footer(draw, line="TriLumen Systems interactive demo · All data is synthetic. · Not a live client environment"):
    draw.rectangle((0, H - 36, W, H), fill=hex_rgb(PANEL))
    draw.line((0, H - 36, W, H - 36), fill=hex_rgb(BORDER))
    f = font(11)
    tw = text_w(draw, line, f)
    draw.text(((W - tw) // 2, H - 24), line, fill=hex_rgb(SOFT), font=f)


def new_canvas():
    img = Image.new("RGBA", (W, H), hex_rgb(BG) + (255,))
    return img


def save(img: Image.Image, name: str):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    img.convert("RGB").save(path, "PNG", optimize=True)
    print("wrote", path, path.stat().st_size)
    return path


# ---------- Board 1: TABLE-HEAVY - Which tech needs a second visit? ----------
def board_table():
    img = new_canvas()
    draw = ImageDraw.Draw(img)
    y0 = chrome(img, "Field service · Callback risk", "Ironvale Mechanical", "As of Oct 2, 2026 · Rolling 30 days")
    draw = ImageDraw.Draw(img)

    # KPI strip
    kpis = [
        ("First-time fix", "78%", "+4.2 pts", False),
        ("Second visits", "41", "↑ 6 vs prior", True),
        ("Avg travel / job", "22m", "−3m", False),
        ("Parts on truck", "91%", "Within band", False),
    ]
    x = 28
    for label, val, delta, alert in kpis:
        box = (x, y0, x + 280, y0 + 86)
        shadow_panel(img, box)
        draw = ImageDraw.Draw(img)
        rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
        draw.text((x + 16, y0 + 14), label.upper(), fill=hex_rgb(SOFT), font=font(11))
        draw.text((x + 16, y0 + 34), val, fill=hex_rgb(INK), font=font(28))
        draw.text((x + 16, y0 + 66), delta, fill=hex_rgb(AMBER if alert else OK), font=font(12))
        x += 296

    # Table panel
    ty = y0 + 104
    box = (28, ty, W - 28, H - 52)
    shadow_panel(img, box)
    draw = ImageDraw.Draw(img)
    rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
    draw.text((44, ty + 16), "Technicians by second-visit rate", fill=hex_rgb(INK), font=font(16))
    draw.text((44, ty + 40), "Sorted worst → best · Click a row in the live board to open job history", fill=hex_rgb(MUTED), font=font(12))

    headers = ["#", "Technician", "Jobs", "1st-time fix", "2nd visits", "Parts miss", "Travel", "Risk"]
    cols = [44, 90, 320, 420, 560, 720, 880, 1040]
    hy = ty + 72
    draw.rectangle((40, hy, W - 40, hy + 34), fill=hex_rgb(BG))
    for i, h in enumerate(headers):
        draw.text((cols[i], hy + 10), h.upper(), fill=hex_rgb(SOFT), font=font(11))

    rows = [
        ("1", "Casey Quill", "48", "61%", "19", "7", "31m", "High"),
        ("2", "Morgan Vale", "52", "67%", "17", "5", "28m", "High"),
        ("3", "Riley Ashford", "44", "72%", "12", "4", "24m", "Watch"),
        ("4", "Jamie Calder", "61", "76%", "11", "3", "22m", "Watch"),
        ("5", "Avery Wren", "39", "79%", "8", "2", "19m", "OK"),
        ("6", "Drew Pendleton", "55", "82%", "7", "2", "18m", "OK"),
        ("7", "Sam Ellison", "47", "85%", "6", "1", "17m", "OK"),
        ("8", "Jordan Hale", "50", "88%", "4", "1", "16m", "OK"),
        ("9", "Quinn Briar", "42", "90%", "3", "0", "15m", "OK"),
        ("10", "Taylor Marlowe", "38", "92%", "2", "0", "14m", "OK"),
    ]
    risk_color = {"High": AMBER, "Watch": P3, "OK": OK}
    yy = hy + 34
    for ri, row in enumerate(rows):
        if ri % 2 == 0:
            draw.rectangle((40, yy, W - 40, yy + 42), fill=hex_rgb(ROW))
        for i, cell in enumerate(row):
            col = hex_rgb(INK)
            if i == 7:
                # pill
                pw = text_w(draw, cell, font(11)) + 16
                cx = cols[i]
                rounded(draw, (cx, yy + 10, cx + pw, yy + 32), 999, fill=hex_rgb(AMBER_SOFT if cell == "High" else BG))
                draw.text((cx + 8, yy + 13), cell, fill=hex_rgb(risk_color[cell]), font=font(11))
            else:
                if i in (3, 4) and row[7] == "High":
                    col = hex_rgb(AMBER)
                draw.text((cols[i], yy + 12), cell, fill=col, font=font(13))
        yy += 42

    footer(draw)
    return save(img, "01-which-tech-second-visit.png")


# ---------- Board 2: HEATMAP - Where are chairs sitting empty? ----------
def board_heatmap():
    img = new_canvas()
    y0 = chrome(img, "Practice ops · Chair utilization", "Mosswood Dental", "Week of Sep 29, 2026 · 6 chairs")
    draw = ImageDraw.Draw(img)

    # left KPIs stacked
    kpis = [("Utilization", "64%", "Target 75%"), ("No-shows", "11", "↑ 3"), ("Open slots", "48", "Next 5 days")]
    y = y0
    for label, val, note in kpis:
        box = (28, y, 280, y + 100)
        shadow_panel(img, box)
        draw = ImageDraw.Draw(img)
        rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
        draw.text((44, y + 16), label.upper(), fill=hex_rgb(SOFT), font=font(11))
        draw.text((44, y + 38), val, fill=hex_rgb(INK), font=font(30))
        alert = "↑" in note or "Target" in note
        draw.text((44, y + 76), note, fill=hex_rgb(AMBER if alert else MUTED), font=font(12))
        y += 116

    # heatmap panel
    box = (304, y0, W - 28, H - 52)
    shadow_panel(img, box)
    draw = ImageDraw.Draw(img)
    rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
    draw.text((324, y0 + 16), "Chair × hour occupancy", fill=hex_rgb(INK), font=font(16))
    draw.text((324, y0 + 40), "Darker purple = fuller · Amber = overbooked / double-book risk", fill=hex_rgb(MUTED), font=font(12))

    hours = [f"{h}:00" for h in range(8, 18)]
    chairs = ["Chair A", "Chair B", "Chair C", "Chair D", "Chair E", "Chair F"]
    # synthetic occupancy 0-1
    grid = []
    for ci in range(len(chairs)):
        row = []
        for hi in range(len(hours)):
            base = 0.35 + 0.08 * math.sin(hi / 2 + ci) + (0.25 if 10 <= hi + 8 <= 14 else 0)
            v = min(1.0, max(0.05, base + rng.uniform(-0.12, 0.18)))
            # force a few amber overbooks
            if (ci, hi) in {(1, 3), (2, 4), (4, 5)}:
                v = 1.15
            row.append(v)
        grid.append(row)

    def cell_color(v):
        if v > 1.0:
            return hex_rgb(AMBER)
        # interpolate P4 -> P1
        t = v
        c0, c1 = hex_rgb("#EDE9F6"), hex_rgb(P1)
        return tuple(int(c0[i] + (c1[i] - c0[i]) * t) for i in range(3))

    ox, oy = 380, y0 + 80
    cw, ch = 96, 68
    # hour headers
    for hi, h in enumerate(hours):
        draw.text((ox + hi * cw + 28, oy - 22), h, fill=hex_rgb(SOFT), font=font(11))
    for ci, chair in enumerate(chairs):
        draw.text((324, oy + ci * ch + 24), chair, fill=hex_rgb(INK), font=font(12))
        for hi, v in enumerate(grid[ci]):
            x0 = ox + hi * cw
            y1 = oy + ci * ch
            rounded(draw, (x0 + 4, y1 + 4, x0 + cw - 4, y1 + ch - 4), 8, fill=cell_color(v))
            label = "!" if v > 1 else f"{int(min(v, 1) * 100)}%"
            col = hex_rgb("#FFFFFF") if v > 0.55 or v > 1 else hex_rgb(P1)
            tw = text_w(draw, label, font(11))
            draw.text((x0 + (cw - tw) / 2, y1 + 26), label, fill=col, font=font(11))

    # legend
    lx, ly = 380, H - 90
    draw.text((lx, ly), "Empty", fill=hex_rgb(MUTED), font=font(11))
    for i in range(6):
        c = cell_color(i / 5)
        rounded(draw, (lx + 50 + i * 28, ly - 2, lx + 74 + i * 28, ly + 18), 4, fill=c)
    draw.text((lx + 230, ly), "Full", fill=hex_rgb(MUTED), font=font(11))
    rounded(draw, (lx + 280, ly - 2, lx + 304, ly + 18), 4, fill=hex_rgb(AMBER))
    draw.text((lx + 312, ly), "Overbook", fill=hex_rgb(AMBER), font=font(11))

    footer(draw)
    return save(img, "02-where-chairs-empty.png")


# ---------- Board 3: FUNNEL - Where does the pipeline stall? ----------
def board_funnel():
    img = new_canvas()
    y0 = chrome(img, "Sales ops · Pipeline", "Northglass Solar", "Q3 2026 · Residential installs")
    draw = ImageDraw.Draw(img)

    stages = [
        ("Leads in", 420, P4),
        ("Site survey", 286, P3),
        ("Proposal sent", 198, P2),
        ("Contract signed", 112, P1),
        ("Installed", 79, "#3E3760"),
    ]
    # left funnel
    box = (28, y0, 820, H - 52)
    shadow_panel(img, box)
    draw = ImageDraw.Draw(img)
    rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
    draw.text((48, y0 + 16), "Conversion funnel", fill=hex_rgb(INK), font=font(16))
    draw.text((48, y0 + 40), "Where deals drop between survey and contract", fill=hex_rgb(MUTED), font=font(12))

    max_v = stages[0][1]
    fy = y0 + 90
    for i, (name, val, col) in enumerate(stages):
        width = int(680 * (val / max_v))
        x0 = 48 + (680 - width) // 2
        rounded(draw, (x0, fy, x0 + width, fy + 70), 10, fill=hex_rgb(col))
        label = f"{name}  ·  {val}"
        tw = text_w(draw, label, font(14))
        draw.text((x0 + (width - tw) / 2, fy + 26), label, fill=(255, 255, 255), font=font(14))
        if i < len(stages) - 1:
            nxt = stages[i + 1][1]
            rate = nxt / val * 100
            # drop callout - amber on biggest drop
            drop = val - nxt
            mid_y = fy + 78
            msg = f"↓ {drop} ({rate:.0f}% continue)"
            color = AMBER if i == 2 else MUTED  # stall at proposal→contract
            draw.text((400 - text_w(draw, msg, font(11)) / 2, mid_y), msg, fill=hex_rgb(color), font=font(11))
            fy += 100
        else:
            fy += 86

    # right: stall reasons
    box = (844, y0, W - 28, H - 52)
    shadow_panel(img, box)
    draw = ImageDraw.Draw(img)
    rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
    draw.text((864, y0 + 16), "Stall reasons · proposal → contract", fill=hex_rgb(INK), font=font(16))
    draw.text((864, y0 + 40), "Amber = biggest leak this quarter", fill=hex_rgb(MUTED), font=font(12))

    reasons = [
        ("Financing delay", 34, True),
        ("Price objection", 22, False),
        ("Permit hold", 14, False),
        ("Competitor won", 9, False),
        ("Ghosted", 7, False),
    ]
    ry = y0 + 80
    max_r = reasons[0][1]
    for name, n, hot in reasons:
        draw.text((864, ry), name, fill=hex_rgb(INK), font=font(13))
        draw.text((W - 70, ry), str(n), fill=hex_rgb(AMBER if hot else P1), font=font(13))
        bar_w = int(520 * (n / max_r))
        rounded(draw, (864, ry + 24, 864 + 520, ry + 40), 6, fill=hex_rgb(BG))
        rounded(draw, (864, ry + 24, 864 + bar_w, ry + 40), 6, fill=hex_rgb(AMBER if hot else P3))
        ry += 70

    # callout
    rounded(draw, (864, H - 160, W - 48, H - 72), 10, fill=hex_rgb(AMBER_SOFT), outline=hex_rgb(AMBER))
    draw.text((880, H - 140), "Biggest stall", fill=hex_rgb(AMBER), font=font(12))
    draw.text((880, H - 118), "Financing delay is eating 34 deals.", fill=hex_rgb(INK), font=font(14))
    draw.text((880, H - 96), "Average age in stage: 18 days.", fill=hex_rgb(MUTED), font=font(12))

    footer(draw)
    return save(img, "03-where-pipeline-stalls.png")


# ---------- Board 4: TIMELINE - What led up to the downtime? ----------
def board_timeline():
    img = new_canvas()
    y0 = chrome(img, "Maintenance · Incident timeline", "Pinetop Fabrication", "Ticket DT-2914 · CNC-AR-07 · Closed")
    draw = ImageDraw.Draw(img)

    # KPI row
    kpis = [("Downtime", "3.2h", "−1.1h vs avg"), ("Cost", "$4,860", "Incl. overtime"), ("MTTR trend", "↓ 28%", "Last 8 weeks")]
    x = 28
    for label, val, note in kpis:
        box = (x, y0, x + 400, y0 + 88)
        shadow_panel(img, box)
        draw = ImageDraw.Draw(img)
        rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
        draw.text((x + 18, y0 + 14), label.upper(), fill=hex_rgb(SOFT), font=font(11))
        draw.text((x + 18, y0 + 36), val, fill=hex_rgb(INK), font=font(26))
        draw.text((x + 18, y0 + 68), note, fill=hex_rgb(OK), font=font(12))
        x += 420

    # timeline panel
    box = (28, y0 + 108, W - 28, H - 52)
    shadow_panel(img, box)
    draw = ImageDraw.Draw(img)
    rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
    draw.text((48, y0 + 124), "Event timeline · operator form → close", fill=hex_rgb(INK), font=font(16))

    events = [
        ("07:42", "Operator form", "Bay 3 · photo attached · spindle vibration", "done", False),
        ("07:43", "Teams alert", "Maint + plant eng. paged", "done", False),
        ("07:44", "Schedule flag", "Machine DOWN · Line A capacity −1", "done", True),
        ("07:51", "Inventory check", "Spindle bearing kit short · draft PO", "done", False),
        ("08:05", "PO approval", "$2,140 · downtime $1,520/hr attached", "done", True),
        ("09:20", "Part received", "Vendor Crestline · dock 2", "done", False),
        ("10:05", "Repair start", "Tech Jordan Hale on machine", "done", False),
        ("11:02", "Returned to service", "First-pass check OK · ticket closed", "done", False),
    ]

    # vertical line
    lx = 120
    draw.line((lx, y0 + 170, lx, H - 80), fill=hex_rgb(BORDER), width=3)

    ey = y0 + 170
    for time, title, note, state, alert in events:
        # node
        r = 9
        col = hex_rgb(AMBER if alert else P1)
        draw.ellipse((lx - r, ey - r, lx + r, ey + r), fill=col)
        draw.text((48, ey - 8), time, fill=hex_rgb(MUTED), font=font(12, mono=True))
        draw.text((150, ey - 12), title, fill=hex_rgb(INK), font=font(14))
        draw.text((150, ey + 10), note, fill=hex_rgb(MUTED), font=font(12))
        if alert:
            rounded(draw, (W - 200, ey - 10, W - 60, ey + 18), 999, fill=hex_rgb(AMBER_SOFT))
            draw.text((W - 188, ey - 5), "Attention", fill=hex_rgb(AMBER), font=font(11))
        ey += 78

    footer(draw)
    return save(img, "04-what-led-to-downtime.png")


# ---------- Board 5: KPI + SPARKLINES - Are we ahead of last year? ----------
def board_sparklines():
    img = new_canvas()
    y0 = chrome(img, "Retail ops · Scoreboard", "Copperfinch Outfitters", "PTD Oct 1–2, 2026 · vs same days LY")
    draw = ImageDraw.Draw(img)

    def spark(draw, x, y, w, h, series, color):
        if not series:
            return
        mn, mx = min(series), max(series)
        span = (mx - mn) or 1
        pts = []
        for i, v in enumerate(series):
            px = x + i * (w / (len(series) - 1))
            py = y + h - ((v - mn) / span) * h
            pts.append((px, py))
        draw.line(pts, fill=hex_rgb(color), width=2)
        # end dot
        ex, ey = pts[-1]
        draw.ellipse((ex - 3, ey - 3, ex + 3, ey + 3), fill=hex_rgb(color))

    cards = [
        ("Revenue", "$128.4K", "+9.8% vs LY", [62, 70, 68, 75, 80, 78, 88, 92, 95, 110, 120, 128], P1, False),
        ("Units", "1,842", "+6.1% vs LY", [40, 42, 45, 44, 50, 52, 55, 58, 60, 62, 64, 66], P2, False),
        ("AOV", "$69.70", "+3.4% vs LY", [60, 61, 59, 62, 63, 64, 65, 66, 67, 68, 69, 70], P3, False),
        ("Conversion", "18.2%", "−0.6 pts", [20, 19.5, 19.8, 19.2, 18.9, 18.7, 18.5, 18.4, 18.3, 18.2, 18.1, 18.2], AMBER, True),
        ("Traffic", "10.1K", "+2.0% vs LY", [80, 82, 81, 85, 88, 90, 92, 91, 94, 96, 98, 100], P4, False),
        ("Attach rate", "41%", "+1.8 pts", [30, 32, 33, 34, 35, 36, 37, 38, 39, 40, 40.5, 41], P2, False),
    ]

    positions = [
        (28, y0), (548, y0), (1068, y0),
        (28, y0 + 220), (548, y0 + 220), (1068, y0 + 220),
    ]
    for (label, val, delta, series, col, alert), (x, y) in zip(cards, positions):
        box = (x, y, x + 504, y + 200)
        shadow_panel(img, box)
        draw = ImageDraw.Draw(img)
        rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
        draw.text((x + 20, y + 18), label.upper(), fill=hex_rgb(SOFT), font=font(12))
        draw.text((x + 20, y + 44), val, fill=hex_rgb(INK), font=font(36))
        draw.text((x + 20, y + 92), delta, fill=hex_rgb(AMBER if alert else OK), font=font(13))
        spark(draw, x + 20, y + 130, 460, 50, series, AMBER if alert else col)

    # bottom insight band
    box = (28, y0 + 450, W - 28, H - 52)
    shadow_panel(img, box)
    draw = ImageDraw.Draw(img)
    rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
    draw.text((48, y0 + 470), "Read of the board", fill=hex_rgb(INK), font=font(16))
    draw.text((48, y0 + 502), "Revenue and units are ahead of last year. Conversion is the amber flag: traffic is up, but close rate slipped 0.6 pts.", fill=hex_rgb(MUTED), font=font(13))
    draw.text((48, y0 + 528), "Attach rate is healthy. Coaching focus: engage-to-close on weekend traffic, not more footfall.", fill=hex_rgb(MUTED), font=font(13))

    # mini bar comparison
    draw.text((48, y0 + 570), "Revenue by daypart · CY vs LY", fill=hex_rgb(SOFT), font=font(11))
    dayparts = [("Morning", 28, 24), ("Midday", 42, 38), ("Evening", 58, 51)]
    bx = 48
    for name, cy, ly in dayparts:
        draw.text((bx, y0 + 592), name, fill=hex_rgb(INK), font=font(12))
        rounded(draw, (bx, y0 + 616, bx + int(cy * 4), y0 + 636), 4, fill=hex_rgb(P1))
        rounded(draw, (bx, y0 + 644, bx + int(ly * 4), y0 + 664), 4, fill=hex_rgb(P4))
        bx += 280
    draw.text((900, y0 + 620), "■ CY", fill=hex_rgb(P1), font=font(12))
    draw.text((960, y0 + 620), "■ LY", fill=hex_rgb(P4), font=font(12))

    footer(draw)
    return save(img, "05-are-we-ahead-of-ly.png")


# ---------- Board 6: EXCEPTION QUEUE - Which deposits didn't match? ----------
def board_exceptions():
    img = new_canvas()
    y0 = chrome(img, "POS · Books sync · Exceptions", "Riverbend Mercantile", "Nightly job · Oct 1, 2026 · After")
    draw = ImageDraw.Draw(img)

    # status chips
    chips = [("Matched", "184", P1), ("Exceptions", "3", AMBER), ("Job runtime", "4m 12s", P3)]
    x = 28
    for label, val, col in chips:
        box = (x, y0, x + 400, y0 + 80)
        shadow_panel(img, box)
        draw = ImageDraw.Draw(img)
        rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
        draw.text((x + 18, y0 + 14), label.upper(), fill=hex_rgb(SOFT), font=font(11))
        draw.text((x + 18, y0 + 36), val, fill=hex_rgb(col if label == "Exceptions" else INK), font=font(26))
        x += 420

    # two-column: exception cards + job log
    box = (28, y0 + 100, 900, H - 52)
    shadow_panel(img, box)
    draw = ImageDraw.Draw(img)
    rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
    draw.text((48, y0 + 116), "Open exceptions", fill=hex_rgb(INK), font=font(16))
    draw.text((48, y0 + 140), "Clear these before month-end close", fill=hex_rgb(MUTED), font=font(12))

    exceptions = [
        ("EX-2201", "Unmatched deposit", "$1,284.60 Square payout not in QBO", "High"),
        ("EX-2204", "SKU drift", "SK-RB-4412 listed twice (retail + wholesale)", "Med"),
        ("EX-2207", "Customer merge", "Mira Langford under two emails", "Low"),
    ]
    ey = y0 + 175
    for eid, kind, detail, sev in exceptions:
        rounded(draw, (48, ey, 880, ey + 100), 10, fill=hex_rgb(ROW), outline=hex_rgb(BORDER))
        rounded(draw, (60, ey + 16, 60 + text_w(draw, sev, font(11)) + 16, ey + 38), 999,
                fill=hex_rgb(AMBER_SOFT if sev == "High" else BG))
        draw.text((68, ey + 19), sev, fill=hex_rgb(AMBER if sev == "High" else P1), font=font(11))
        draw.text((140, ey + 18), eid, fill=hex_rgb(SOFT), font=font(12, mono=True))
        draw.text((260, ey + 18), kind, fill=hex_rgb(INK), font=font(14))
        draw.text((60, ey + 52), detail, fill=hex_rgb(MUTED), font=font(13))
        draw.text((60, ey + 74), "Open drawer →", fill=hex_rgb(P1), font=font(12))
        ey += 116

    # job log
    box = (924, y0 + 100, W - 28, H - 52)
    shadow_panel(img, box)
    draw = ImageDraw.Draw(img)
    rounded(draw, box, 12, fill=hex_rgb(PANEL), outline=hex_rgb(BORDER))
    draw.text((944, y0 + 116), "Nightly job log", fill=hex_rgb(INK), font=font(16))
    steps = [
        ("23:05:01", "Pull Square batch", "ok"),
        ("23:05:18", "Normalize tenders", "ok"),
        ("23:05:41", "Post QBO sales receipts", "ok"),
        ("23:06:12", "Match deposits", "warn"),
        ("23:06:40", "Inventory variance check", "ok"),
        ("23:07:02", "Write audit workbook", "ok"),
        ("23:07:15", "Notify exceptions channel", "ok"),
    ]
    ly = y0 + 160
    for ts, step, st in steps:
        draw.text((944, ly), ts, fill=hex_rgb(SOFT), font=font(11, mono=True))
        draw.text((1040, ly), step, fill=hex_rgb(INK), font=font(13))
        mark = "!" if st == "warn" else "✓"
        color = AMBER if st == "warn" else OK
        draw.text((W - 70, ly), mark, fill=hex_rgb(color), font=font(14))
        ly += 42
        draw.line((944, ly - 12, W - 48, ly - 12), fill=hex_rgb(BORDER))

    footer(draw)
    return save(img, "06-which-deposits-unmatched.png")


def main():
    board_table()
    board_heatmap()
    board_funnel()
    board_timeline()
    board_sparklines()
    board_exceptions()
    print("done")


if __name__ == "__main__":
    main()
