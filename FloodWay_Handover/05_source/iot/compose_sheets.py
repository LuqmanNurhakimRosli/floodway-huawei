"""Compose 16:9 blueprint sheets (SVG in HTML) from the Freestyle line renders + exact world-to-sheet projection."""
import json, base64, os, math, html as H

HERE = os.path.dirname(os.path.abspath(__file__))
LINES = os.path.join(HERE, "lines")
SHEETS = os.path.join(HERE, "sheets"); os.makedirs(SHEETS, exist_ok=True)
META = json.load(open(os.path.join(LINES, "views.json")))
TOTAL = 8
DATE = "20.10.2026"

# palette
INK = "#EAF4FF"; DIM = "#A8DCFF"; MUTE = "rgba(234,244,255,0.62)"; FAINT = "rgba(234,244,255,0.28)"
WATER = "#5CC8FF"; NORM = "#7FE0C4"; ALERT = "#FFE066"; WARN = "#FFB347"; DANG = "#FF6B6B"; BG = "#0D3B7A"

LV = dict(bed=-2.6, normal=-1.5, alert=-1.0, warning=-0.7, danger=-0.45)
def reading(z): return z - LV["bed"]

def b64(p): return "data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode()
def esc(t): return H.escape(str(t))

class View:
    def __init__(s, name, x, y, h=None, w=None):
        s.m = META[name]; s.name = name; s.x = x; s.y = y
        s.k = (h / s.m["H"]) if h else (w / s.m["W"])
        s.w = s.m["W"] * s.k; s.h = s.m["H"] * s.k
        s.ppm = s.m["W"] / s.m["S"] * s.k
    def P(s, p):
        m = s.m; d = [p[i] - m["C"][i] for i in range(3)]
        u = sum(d[i] * m["R"][i] for i in range(3)); v = sum(d[i] * m["U"][i] for i in range(3))
        return (s.x + (m["W"] / 2 + u * m["W"] / m["S"]) * s.k, s.y + (m["H"] / 2 - v * m["W"] / m["S"]) * s.k)
    def X(s, p): return s.P(p)[0]
    def Y(s, p): return s.P(p)[1]
    def obj(s, n):
        c = s.m["centers"][n]; return (s.x + c[0] * s.k, s.y + c[1] * s.k)
    def svg(s):
        return f'<image href="{b64(os.path.join(LINES, s.name + ".png"))}" x="{s.x:.1f}" y="{s.y:.1f}" width="{s.w:.1f}" height="{s.h:.1f}"/>'

# ---------------- drawing primitives ----------------
def T(x, y, t, size=13, fill=INK, anchor="start", weight=400, mono=False, ls=0, rot=None, op=1):
    fam = "DejaVu Sans Mono" if mono else "Inter"
    tr = f' transform="rotate({rot} {x:.1f} {y:.1f})"' if rot is not None else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" '
            f'font-weight="{weight}" letter-spacing="{ls}" opacity="{op}"{tr}>{esc(t)}</text>')
def Lw(x1, y1, x2, y2, c=INK, w=1.2, dash=None, op=1, me=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""; m = f' marker-end="url(#{me})"' if me else ""
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}" opacity="{op}"{d}{m}/>'
def R(x, y, w, h, c=INK, fill="none", sw=1.2, rx=0, dash=None, op=1):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" stroke="{c}" fill="{fill}" stroke-width="{sw}" opacity="{op}"{d}/>'
def poly(pts, c=INK, w=1.2, fill="none", dash=None, me=None, op=1):
    d = f' stroke-dasharray="{dash}"' if dash else ""; m = f' marker-end="url(#{me})"' if me else ""
    p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return f'<polyline points="{p}" stroke="{c}" fill="{fill}" stroke-width="{w}" opacity="{op}"{d}{m}/>'
def C(x, y, r, c=INK, fill="none", w=1.2, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" stroke="{c}" fill="{fill}" stroke-width="{w}"{d}/>'

def label_box(x, y, t, size=12, c=DIM, anchor="middle", mono=True):
    w = len(t) * size * (0.62 if mono else 0.56) + 10
    x0 = x - w / 2 if anchor == "middle" else (x if anchor == "start" else x - w)
    return R(x0, y - size + 1, w, size + 6, c="none", fill=BG) + T(x0 + w / 2, y + 2, t, size, c, "middle", 500, mono)

def dim_h(x1, x2, yl, y1f, y2f, txt, c=DIM):
    s = ""
    for xf, yf in ((x1, y1f), (x2, y2f)):
        s += Lw(xf, yf + (4 if yl > yf else -4), xf, yl + (6 if yl > yf else -6), c, 0.8, op=0.85)
    s += f'<line x1="{x1:.1f}" y1="{yl:.1f}" x2="{x2:.1f}" y2="{yl:.1f}" stroke="{c}" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)"/>'
    return s + label_box((x1 + x2) / 2, yl + 4, txt, 12, c)
def dim_v(y1, y2, xl, x1f, x2f, txt, c=DIM):
    s = ""
    for yf, xf in ((y1, x1f), (y2, x2f)):
        s += Lw(xf + (4 if xl > xf else -4), yf, xl + (6 if xl > xf else -6), yf, c, 0.8, op=0.85)
    s += f'<line x1="{xl:.1f}" y1="{y1:.1f}" x2="{xl:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)"/>'
    my = (y1 + y2) / 2; w = len(txt) * 7.4 + 10
    return s + f'<g transform="rotate(-90 {xl:.1f} {my:.1f})">' + R(xl - w / 2, my - 11, w, 17, "none", BG) + T(xl, my + 2, txt, 12, c, "middle", 500, True) + "</g>"

def leader(px, py, lx, ly, txt, anchor="start", c=INK, size=12.5, sub=None):
    s = C(px, py, 2.4, c, c) + poly([(px, py), (lx, ly), (lx + (14 if anchor == "start" else -14), ly)], c, 0.9, op=0.9)
    tx = lx + (18 if anchor == "start" else -18)
    s += T(tx, ly + 4, txt, size, c, anchor, 500)
    if sub: s += T(tx, ly + 19, sub, 11, MUTE, anchor)
    return s

def badge(x, y, n, c=INK, r=12):
    return C(x, y, r, c, BG, 1.3) + T(x, y + 4.3, str(n), 12, c, "middle", 700)

def hatch_rect(x, y, w, h, pid="hatch"):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="url(#{pid})" stroke="{MUTE}" stroke-width="0.9"/>'

def scalebar(v, x, y, metres=1.0, label="1 m"):
    L = v.ppm * metres
    s = R(x, y, L / 2, 6, INK, INK, 0.8) + R(x + L / 2, y, L / 2, 6, INK, "none", 0.8)
    return s + T(x, y - 5, "0", 10, MUTE, "middle", mono=True) + T(x + L, y - 5, label, 10, MUTE, "middle", mono=True)

def view_title(x, y, n, title, sub=None):
    s = C(x + 14, y - 5, 14, INK, "none", 1.4) + T(x + 14, y, n, 13, INK, "middle", 700)
    s += T(x + 38, y, title, 15, INK, "start", 700, ls=1.2)
    if sub: s += T(x + 38, y + 18, sub, 11.5, MUTE)
    return s

def spread(items, ymin, ymax, gap):
    """items: list of [y_desired, ...]; returns ys spaced >= gap within bounds."""
    ys = [it[0] for it in items]; order = sorted(range(len(ys)), key=lambda i: ys[i]); out = ys[:]
    prev = ymin - gap
    for i in order:
        out[i] = max(out[i], prev + gap); prev = out[i]
    over = prev - ymax
    if over > 0:
        for i in order: out[i] -= over
        prev = ymax + gap
        for i in reversed(order):
            out[i] = min(out[i], prev - gap); prev = out[i]
    return out

# ---------------- sheet frame ----------------
DEFS = f'''<defs>
<pattern id="gmin" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,0.045)" stroke-width="1"/></pattern>
<pattern id="gmaj" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1"/></pattern>
<pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" stroke="rgba(234,244,255,0.32)" stroke-width="1"/></pattern>
<pattern id="hatch2" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="14" stroke="rgba(234,244,255,0.18)" stroke-width="1"/></pattern>
<marker id="arr" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,1.5 L10,5 L0,8.5" fill="none" stroke="{DIM}" stroke-width="1.4"/></marker>
<marker id="flow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="{INK}"/></marker>
<marker id="fw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="{WATER}"/></marker>
</defs>'''

def frame(no, title, sub, body, notes=""):
    tb_x, tb_y, tb_w, tb_h = 1380, 928, 510, 122
    tb = R(tb_x, tb_y, tb_w, tb_h, INK, BG, 1.4)
    tb += Lw(tb_x, tb_y + 34, tb_x + tb_w, tb_y + 34, INK, 0.9) + Lw(tb_x, tb_y + 70, tb_x + tb_w, tb_y + 70, INK, 0.9)
    tb += Lw(tb_x + 330, tb_y + 34, tb_x + 330, tb_y + tb_h, INK, 0.9) + Lw(tb_x + 420, tb_y + 70, tb_x + 420, tb_y + tb_h, INK, 0.9)
    tb += T(tb_x + 12, tb_y + 23, "FLOODWAY RIVERNODE v1  ·  FLOOD LEVEL SENSOR", 13, INK, weight=700, ls=1.2)
    tb += T(tb_x + 12, tb_y + 50, "SHEET TITLE", 9, MUTE, ls=1) + T(tb_x + 12, tb_y + 64, title.upper(), 12.5, INK, weight=600)
    tb += T(tb_x + 342, tb_y + 50, "SHEET", 9, MUTE, ls=1) + T(tb_x + 342, tb_y + 64, f"S{no} of {TOTAL}", 13, INK, weight=700)
    tb += T(tb_x + 12, tb_y + 86, "EVENT", 9, MUTE, ls=1) + T(tb_x + 12, tb_y + 101, "SDP University Hackathon 2026 · Township of Tomorrow", 11, INK)
    tb += T(tb_x + 12, tb_y + 115, "Drawn: FloodWay team, UiTM Shah Alam", 10, MUTE)
    tb += T(tb_x + 342, tb_y + 86, "UNITS", 9, MUTE, ls=1) + T(tb_x + 342, tb_y + 104, "mm", 13, INK, weight=600, mono=True)
    tb += T(tb_x + 432, tb_y + 86, "REV · DATE", 9, MUTE, ls=1) + T(tb_x + 432, tb_y + 101, "A  concept", 11, INK, weight=600) + T(tb_x + 432, tb_y + 115, DATE, 10, MUTE, mono=True)
    head = T(40, 60, title, 30, INK, weight=700) + T(40, 84, sub, 14, MUTE)
    head += T(1880, 46, "FLOODWAY · RIVERNODE v1", 12, MUTE, "end", 600, ls=2) + T(1880, 66, f"S{no} / {TOTAL}", 14, INK, "end", 700, mono=True)
    foot = notes or ""
    foot += T(40, 1046, "Concept design for pitching and a student build. Not for construction. Check every dimension on site before cutting or drilling.", 11, MUTE)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">{DEFS}
<rect width="1920" height="1080" fill="{BG}"/><rect width="1920" height="1080" fill="url(#gmin)"/><rect width="1920" height="1080" fill="url(#gmaj)"/>
<rect x="16" y="16" width="1888" height="1048" fill="none" stroke="{INK}" stroke-width="2"/>
<rect x="24" y="24" width="1872" height="1032" fill="none" stroke="{INK}" stroke-width="0.7" opacity="0.6"/>
{head}{body}{foot}{tb}</svg>'''

def notes_block(x, y, lines, w=None, size=12.5, gap=20, title=None, c=INK):
    s = ""
    if title: s += T(x, y, title, 13, INK, weight=700, ls=1.2); y += 24
    for ln in lines:
        if isinstance(ln, tuple):
            s += T(x, y, ln[0], size, ln[1] if len(ln) > 1 else c, weight=ln[2] if len(ln) > 2 else 400)
        else:
            s += T(x, y, ln, size, c)
        y += gap
    return s

sheets = []

# =====================================================================
# S1 GENERAL ARRANGEMENT
# =====================================================================
v = View("iso_deck", 330, 104, h=810)
body = v.svg()
calls = [("Beacon_Dome_RGB", "RGB beacon", "green, amber, red"), ("Solar_Panel_6V6W_Frame", "Solar panel 6 V 6 W", "15° tilt for rain run-off"),
         ("RainGauge_Body_rPETG", "Tipping-bucket rain gauge", "Ø120 funnel, 0.2 mm per tip"),
         ("Camera_ESP32CAM_Housing", "Camera (optional)", "aimed at the staff gauge"),
         ("Antenna_923MHz_3dBi", "LoRa antenna", "923 MHz, to the gateway"),
         ("Enclosure_IP65_200x150x100", "IP65 enclosure", "ESP32 LoRa, LiFePO4, MPPT"),
         ("Sign_Plate_Backing", "Sign plate", "Malay and English"),
         ("Arm_Al_40x40", "Aluminium arm 40 × 40", "1250 long, over the water"),
         ("SensorHead_Hood_rPETG", "Ultrasonic sensor head", "A02YYUW in a printed hood"),
         ("Brace_Al_25x25", "Brace 25 × 25", "stops the arm bouncing"),
         ("Clamp_Railing_1", "Railing clamps × 2", "no drilling into the bridge"),
         ("Mast_GI_Pipe_2in", "Mast, 2-inch GI pipe", "2500 long")]
LEFT1 = {"Antenna_923MHz_3dBi", "Enclosure_IP65_200x150x100", "Sign_Plate_Backing", "Clamp_Railing_1", "Mast_GI_Pipe_2in"}
left = [c for c in calls if c[0] in LEFT1]; right = [c for c in calls if c not in left]
for group, side in ((left, "L"), (right, "R")):
    pts = [(v.obj(c[0])[0], v.obj(c[0])[1] + (140 if c[0] == "Mast_GI_Pipe_2in" else 0)) for c in group]
    ys = spread([[p[1]] for p in pts], 130, 890, 52)
    for c, ly, (px, py) in zip(group, ys, pts):
        lx = (v.x - 8) if side == "L" else (v.x + v.w + 8)
        body += leader(px, py, lx, ly, c[1], "end" if side == "L" else "start", sub=c[2])
spec = [("Measures", "river level, rate of rise, rainfall, air temperature"),
        ("Level sensor", "A02YYUW ultrasonic, 3–450 cm, IP67, 60° beam"),
        ("Mount", "clamps to a bridge railing; arm 1.25 m over the water"),
        ("Controller", "ESP32 LoRa board (Heltec WiFi LoRa 32 V3)"),
        ("Radio", "LoRa 923 MHz (AS923) to a gateway at the guardhouse"),
        ("Power", "6 V 6 W solar panel, LiFePO4 3.2 V 6 Ah cell"),
        ("Local warning", "RGB beacon on top, visible to drivers"),
        ("Camera", "optional ESP32-CAM, reads the staff gauge"),
        ("Parts cost", "RM 560–950 per node (estimate, see S4)")]
sx, sy = 1300, 140
body += T(sx, sy, "What it is", 13, MUTE, weight=600, ls=2)
body += T(sx, sy + 34, "A solar river-level sensor", 26, INK, weight=700)
body += T(sx, sy + 64, "that bolts onto a township bridge", 26, INK, weight=700)
body += T(sx, sy + 92, "It measures the river every few minutes, warns drivers on the bridge with", 13, MUTE)
body += T(sx, sy + 110, "its own beacon, and feeds FloodWay's alerts and safe routes.", 13, MUTE)
yy = sy + 150
for k, val in spec:
    body += Lw(sx, yy - 17, 1880, yy - 17, FAINT, 0.8) + T(sx, yy, k.upper(), 10.5, DIM, weight=600, ls=1.2) + T(sx + 135, yy, val, 13, INK)
    yy += 36
body += Lw(sx, yy - 17, 1880, yy - 17, FAINT, 0.8)
body += notes_block(sx, yy + 18, ["Sheets: S2 elevations · S3 plan and install · S4 exploded view and parts",
                                   "S5 details · S6 wiring · S7 firmware and power · S8 how it joins FloodWay"], size=12, gap=19, c=MUTE)
body += view_title(40, 900, "1", "ISOMETRIC VIEW", "from the bridge deck; railing shown for context")
sheets.append(frame(1, "General arrangement", "FloodWay RiverNode v1 clamped to a bridge railing, arm over the river", body))

# =====================================================================
# S2 ELEVATIONS
# =====================================================================
v = View("side", 40, 104, h=800)
body = ""
x0w, x1w = 0.05, 5.15
# water body and bed
body += R(v.X((x0w, 0, 0)), v.Y((0, 0, LV["normal"])), v.X((x1w, 0, 0)) - v.X((x0w, 0, 0)), v.Y((0, 0, LV["bed"])) - v.Y((0, 0, LV["normal"])), "none", "rgba(92,200,255,0.10)", 0)
body += hatch_rect(v.X((x0w, 0, 0)), v.Y((0, 0, LV["bed"])), v.X((x1w, 0, 0)) - v.X((x0w, 0, 0)), v.ppm * 0.22)
body += hatch_rect(v.X((x0w, 0, 0)), v.Y((0, 0, 0.05)), v.X((2.0, 0, 0)) - v.X((x0w, 0, 0)), v.ppm * 0.45)
body += T(v.X((0.15, 0, 0)), v.Y((0, 0, -0.12)), "BRIDGE DECK (section)", 11, INK, weight=600, ls=1)
body += T(v.X((2.6, 0, 0)), v.Y((0, 0, -2.6)) - 8, "CHANNEL BED = GAUGE ZERO", 11, MUTE, "middle", 600, ls=1)
for key, col, dash, name in (("danger", DANG, "7 4", "DANGER · BAHAYA"), ("warning", WARN, "7 4", "WARNING · AMARAN"),
                             ("alert", ALERT, "7 4", "ALERT · WASPADA"), ("normal", WATER, None, "NORMAL")):
    y = v.Y((0, 0, LV[key])); body += Lw(v.X((x0w, 0, 0)), y, v.X((x1w, 0, 0)), y, col, 1.6 if key == "normal" else 1.2, dash)
    body += T(v.X((0.12, 0, 0)), y + 15, f"{name}  {reading(LV[key]):.2f} m", 11, col, weight=600, mono=True)
s0 = v.P((3.22, 0, 1.245)); d_n = 1.245 - LV["normal"]; tn = math.tan(math.radians(30))
for sgn in (-1, 1):
    body += Lw(s0[0], s0[1], v.X((3.22 + sgn * d_n * tn, 0, 0)), v.Y((0, 0, LV["normal"])), WATER, 1.1, "3 4")
body += T(v.X((3.22, 0, 0)), v.Y((0, 0, -0.95)), "60° beam", 11, WATER, "middle", 600)
body += dim_h(v.X((2.0, 0, 0)), v.X((3.22, 0, 0)), v.Y((0, 0, 0.42)), v.Y((0, 0, 0.05)), v.Y((0, 0, 1.245)), "1220")
body += dim_h(v.X((2.035, 0, 0)), v.X((3.22, 0, 0)), v.Y((0, 0, 1.66)), v.Y((0, 0, 1.43)), v.Y((0, 0, 1.38)), "1185")
body += dim_v(v.Y((0, 0, 1.245)), v.Y((0, 0, LV["bed"])), v.X((4.95, 0, 0)), v.X((3.26, 0, 0)), v.X((4.9, 0, 0)), "H = 3845")
body += dim_v(v.Y((0, 0, 1.245)), v.Y((0, 0, LV["normal"])), v.X((3.75, 0, 0)), v.X((3.26, 0, 0)), v.X((3.7, 0, 0)), "d = 2745")
body += dim_v(v.Y((0, 0, 0.05)), v.Y((0, 0, 1.40)), v.X((1.5, 0, 0)), v.X((1.9, 0, 0)), v.X((1.98, 0, 0)), "1350")
body += dim_v(v.Y((0, 0, 0.05)), v.Y((0, 0, 2.698)), v.X((1.05, 0, 0)), v.X((1.9, 0, 0)), v.X((2.0, 0, 0)), "2650")
gx = v.X((4.5, 0, 0)); body += leader(gx, v.Y((0, 0, -1.9)), v.X((4.15, 0, 0)), v.Y((0, 0, -2.25)), "Staff gauge", "end", size=11.5)
body += leader(s0[0], s0[1] + 2, v.X((3.9, 0, 0)), v.Y((0, 0, 0.95)), "Sensor face", "start", size=11.5)
body += v.svg()
body += view_title(40, 930, "A", "SIDE ELEVATION", "looking across the river; arm points downstream")
body += scalebar(v, 560, 922)
v2 = View("deck", 760, 104, h=800)
body += hatch_rect(v2.X((0, 1.44, 0)), v2.Y((0, 0, 0.05)), v2.X((0, -1.44, 0)) - v2.X((0, 1.44, 0)), v2.ppm * 0.45)
body += T(v2.X((0, 1.35, 0)), v2.Y((0, 0, -0.14)), "BRIDGE DECK", 11, INK, weight=600, ls=1)
body += v2.svg()
body += dim_h(v2.X((0, 0.10, 0)), v2.X((0, -0.10, 0)), v2.Y((0, 0, 1.585)), v2.Y((0, 0, 1.66)), v2.Y((0, 0, 1.66)), "200")
body += dim_v(v2.Y((0, 0, 1.825)), v2.Y((0, 0, 1.675)), v2.X((0, 0.27, 0)), v2.X((0, 0.12, 0)), v2.X((0, 0.12, 0)), "150")
body += dim_h(v2.X((0, 0.0, 0)), v2.X((0, -0.31, 0)), v2.Y((0, 0, 2.62)), v2.Y((0, 0, 2.58)), v2.Y((0, 0, 2.52)), "310")
body += dim_h(v2.X((0, 0.15, 0)), v2.X((0, -0.15, 0)), v2.Y((0, 0, 2.22)), v2.Y((0, 0, 2.38)), v2.Y((0, 0, 2.38)), "300")
body += dim_v(v2.Y((0, 0, 0.05)), v2.Y((0, 0, 1.05)), v2.X((0, -0.95, 0)), v2.X((0, -1.36, 0)), v2.X((0, -1.36, 0)), "1000")
body += dim_v(v2.Y((0, 0, 0.05)), v2.Y((0, 0, 1.675)), v2.X((0, 0.55, 0)), v2.X((0, 0.6, 0)), v2.X((0, 0.12, 0)), "1625")
body += dim_v(v2.Y((0, 0, 0.05)), v2.Y((0, 0, 2.698)), v2.X((0, 0.85, 0)), v2.X((0, 0.9, 0)), v2.X((0, 0.05, 0)), "2650")
body += leader(*v2.obj("Enclosure_Lid"), v2.X((0, -0.55, 0)), v2.Y((0, 0, 1.95)), "Lid faces the deck", "start", size=11.5, sub="open it standing on the bridge")
body += leader(*v2.obj("Sign_Plate_Face"), v2.X((0, -0.55, 0)), v2.Y((0, 0, 1.30)), "Sign at eye level", "start", size=11.5)
body += view_title(760, 930, "B", "FRONT ELEVATION", "seen from the bridge deck")
body += scalebar(v2, 1180, 922, 0.5, "0.5 m")
nx = 1470
body += notes_block(nx, 130, ["The sensor times an ultrasonic echo off", "the water surface and turns it into a level:"], size=12.5, gap=19, title="HOW IT MEASURES")
body += T(nx, 196, "d = c × t ÷ 2", 15, INK, weight=600, mono=True)
body += T(nx, 222, "c = 331.3 + 0.606 × T  (m/s, T in °C)", 12.5, INK, mono=True)
body += T(nx, 248, "h = H − d", 15, INK, weight=600, mono=True)
body += notes_block(nx, 278, ["H is surveyed at install: sensor face to", "gauge zero. Here H = 3845 mm, so", "d = 2745 mm reads h = 1.10 m (normal)."], size=12, gap=18, c=MUTE)
body += T(nx, 352, "EXAMPLE LEVELS (gauge reading)", 13, INK, weight=700, ls=1.2)
rows = [("Bahaya / Danger", reading(LV["danger"]), DANG), ("Amaran / Warning", reading(LV["warning"]), WARN),
        ("Waspada / Alert", reading(LV["alert"]), ALERT), ("Normal", reading(LV["normal"]), WATER)]
yy = 380
for nm, val, col in rows:
    body += R(nx, yy - 11, 14, 14, col, col, 0) + T(nx + 24, yy, nm, 12.5, INK) + T(1880, yy, f"{val:.2f} m", 12.5, col, "end", 600, True); yy += 26
body += notes_block(nx, yy + 6, ["Set the real marks with the council or JPS", "for the chosen river; these are examples."], size=11.5, gap=17, c=MUTE)
body += T(nx, yy + 66, "BEAM CHECK", 13, INK, weight=700, ls=1.2)
body += notes_block(nx, yy + 90, ["Nothing but water may sit inside the", "60° cone. The cone edge passes the deck", "soffit 270 mm clear (36.6° > 30°)."], size=12, gap=18, c=MUTE)
body += T(nx, yy + 164, "READABLE RANGE", 13, INK, weight=700, ls=1.2)
body += notes_block(nx, yy + 188, ["A02YYUW: 3–450 cm. Here d runs from", "3845 (empty channel) to 1245 (water at", "deck level), all inside the range."], size=12, gap=18, c=MUTE)
sheets.append(frame(2, "Elevations", "Side and front elevations with mounting heights, measuring geometry and alert levels", body))

# =====================================================================
# S3 PLAN AND INSTALLATION
# =====================================================================
v = View("plan", 40, 104, h=800)
body = ""
xa, xb = v.X((-0.4, 0, 0)), v.X((5.6, 0, 0)); ya, yb = v.Y((0, 3.9, 0)), v.Y((0, -2.1, 0))
body += R(v.X((2.0, 0, 0)), v.Y((0, 3.5, 0)), xb - v.X((2.0, 0, 0)), yb - v.Y((0, 3.5, 0)), "none", "rgba(92,200,255,0.09)", 0)
body += f'<rect x="{xa:.1f}" y="{ya:.1f}" width="{v.X((2.0,0,0))-xa:.1f}" height="{yb-ya:.1f}" fill="url(#hatch2)" stroke="none"/>'
body += hatch_rect(xa, v.Y((0, 3.8, 0)), xb - xa, v.Y((0, 3.5, 0)) - v.Y((0, 3.8, 0)))
body += Lw(v.X((2.0, 0, 0)), ya, v.X((2.0, 0, 0)), yb, INK, 1.4)
body += T(v.X((0.6, 0, 0)), v.Y((0, -1.6, 0)), "BRIDGE DECK", 12, INK, "middle", 700, ls=1.5)
body += T(v.X((3.6, 0, 0)), v.Y((0, 3.65, 0)) + 4, "CHANNEL WALL", 10.5, INK, "middle", 600, ls=1.2)
body += T(v.X((5.3, 0, 0)), v.Y((0, 3.85, 0)) - 6, "BANK", 10.5, MUTE, "middle", 600, ls=1.2)
body += Lw(v.X((3.9, 0, 0)), v.Y((0, 2.6, 0)), v.X((5.3, 0, 0)), v.Y((0, 2.6, 0)), WATER, 2, me="fw")
body += T(v.X((4.6, 0, 0)), v.Y((0, 2.6, 0)) - 8, "RIVER FLOW", 11, WATER, "middle", 700, ls=1.5)
cx, cy = v.P((3.22, 0, 0))
body += C(cx, cy, 1.585 * v.ppm, WATER, "rgba(92,200,255,0.06)", 1.2, "6 4") + C(cx, cy, 0.979 * v.ppm, DANG, "none", 1.1, "4 4")
body += leader(cx + 1.585 * v.ppm * 0.71, cy + 1.585 * v.ppm * 0.71, v.X((5.1, 0, 0)), v.Y((0, -1.75, 0)), "Beam footprint", "end", WATER, 11.5, "Ø3170 at normal level")
body += leader(cx + 0.979 * v.ppm * 0.71, cy - 0.979 * v.ppm * 0.71, v.X((4.9, 0, 0)), v.Y((0, 1.25, 0)), "At danger level", "start", DANG, 11.5, "Ø1960")
gp = v.P((4.5, 3.49, 0)); cp = v.P((2.08, 0.07, 0))
for a in (-7, 7):
    ang = math.atan2(gp[1] - cp[1], gp[0] - cp[0]) + math.radians(a); L = math.hypot(gp[0] - cp[0], gp[1] - cp[1])
    body += Lw(cp[0], cp[1], cp[0] + L * math.cos(ang), cp[1] + L * math.sin(ang), ALERT, 1, "2 4")
body += leader(gp[0], gp[1], v.X((5.45, 0, 0)), v.Y((0, 3.05, 0)), "Staff gauge 0–3 m", "end", INK, 11.5, "outside the beam, in camera view")
body += v.svg()
body += dim_h(v.X((2.0, 0, 0)), v.X((3.22, 0, 0)), v.Y((0, -1.9, 0)), v.Y((0, -1.9, 0)), v.Y((0, -0.05, 0)), "1220")
body += dim_v(v.Y((0, 1.585, 0)), v.Y((0, 3.5, 0)), v.X((3.22, 0, 0)), v.X((3.22, 0, 0)), v.X((3.3, 0, 0)), "1915 clear")
body += dim_h(v.X((2.0, 0, 0)), v.X((4.5, 0, 0)), v.Y((0, 3.36, 0)), v.Y((0, 3.36, 0)), v.Y((0, 3.45, 0)), "2500")
body += view_title(40, 930, "C", "PLAN", "looking down; deck on the left, river flows left to right")
body += scalebar(v, 640, 922)
vi = View("iso_water", 900, 104, h=440)
body += vi.svg() + view_title(900, 572, "D", "ISOMETRIC", "from the river side")
# variant B schematic
bx, by = 900, 610
body += R(bx, by, 360, 290, FAINT, "none", 1, 4)
body += T(bx + 14, by + 24, "VARIANT B · RIVERBANK POST", 12, INK, weight=700, ls=1.2)
g0 = (bx + 30, by + 120); top = (bx + 110, by + 120); toe = (bx + 170, by + 230); far = (bx + 345, by + 230)
body += poly([(bx + 14, by + 120), top, toe, far], INK, 1.3)
wy = by + 190; wx = top[0] + (toe[0] - top[0]) * (wy - top[1]) / (toe[1] - top[1])
body += Lw(wx, wy, far[0], wy, WATER, 1.6)
body += Lw(bx + 80, by + 120, bx + 80, by + 60, INK, 2.2) + Lw(bx + 80, by + 64, bx + 270, by + 64, INK, 2.2)
sxp, syp = bx + 270, by + 70
body += T(bx + 175, by + 56, "arm", 10.5, MUTE, "middle") + T(sxp + 8, by + 100, "60°", 10.5, WATER)
body += Lw(sxp, syp, sxp - (wy - syp) * tn, wy, WATER, 1, "3 3") + Lw(sxp, syp, sxp + (wy - syp) * tn, wy, WATER, 1, "3 3")
body += T(bx + 14, by + 258, "Arm must reach d × tan 30° past the waterline:", 11, MUTE)
body += T(bx + 14, by + 276, "about 1.7 m at d = 2.9 m. Use the bridge mount if possible.", 11, MUTE)
nx = 1300
rules = ["Pick a bridge on the township's flood route; fix to the", "downstream railing, mid-span, so debris hits the bridge first.",
         "", "Keep the 60° cone clear: only water inside it at the lowest", "level. Here the arm reaches 1220 past the deck edge.",
         "", "Fix the staff gauge to the channel wall, outside the beam", "and in view of the camera or township CCTV.",
         "", "Survey the gauge zero and the sensor face at install;", "enter H (sensor face to gauge zero) in the firmware.",
         "", "Get written permission from the bridge owner (local", "council or JKR) before clamping anything.",
         "", "Earth the mast. Keep the box above the highest", "recorded flood level at the site.",
         "", "Test LoRa range to the gateway before final fixing."]
body += T(nx, 130, "INSTALLATION RULES", 13, INK, weight=700, ls=1.2)
yy, n = 160, 1
for ln in rules:
    if ln == "": yy += 8; continue
    if rules.index(ln) == 0 or rules[rules.index(ln) - 1] == "":
        body += badge(nx + 12, yy - 4, n, DIM, 11); n += 1
    body += T(nx + 34, yy, ln, 12.5, INK); yy += 21
sheets.append(frame(3, "Plan and installation", "Where the node sits on the bridge, what the beam sees, and the site rules", body))

# =====================================================================
# S4 EXPLODED VIEW AND PARTS
# =====================================================================
BOM = [
    (1, "Mast", "2-inch GI pipe, 60.3 mm OD, 2500 long", 1, 60, 90),
    (2, "Railing clamps", "aluminium or stainless U-bolt clamp", 2, 30, 50),
    (3, "Arm", "aluminium square tube 40×40×2, 1250; clamp; end cap", 1, 40, 70),
    (4, "Brace", "aluminium square tube 25×25×2, 900; clamp", 1, 20, 35),
    (5, "Sensor hood", "3D-printed rPETG hood and drip skirt", 1, 10, 20),
    (6, "Ultrasonic sensor", "DFRobot A02YYUW, IP67, 3–450 cm, UART", 1, 80, 120),
    (7, "Air temperature probe", "DS18B20 waterproof probe", 1, 8, 15),
    (8, "Enclosure", "IP65 ABS 200×150×100, backplate, 3 glands, vent", 1, 35, 60),
    (9, "Enclosure hood", "3D-printed or aluminium sheet rain hood", 1, 10, 20),
    (10, "Controller", "Heltec WiFi LoRa 32 V3 (ESP32-S3, AS923)", 1, 70, 110),
    (11, "Battery", "LiFePO4 32700 3.2 V 6 Ah, holder, 1S protection", 1, 35, 55),
    (12, "Solar charger", "CN3791 MPPT module set for LiFePO4", 1, 10, 20),
    (13, "Power modules", "3.3 V buck-boost and 5 V boost", 1, 10, 20),
    (14, "Terminals and fuse", "terminal blocks, 1 A fuse, silica gel", 1, 10, 20),
    (15, "LoRa antenna", "923 MHz 3 dBi, pigtail, bracket", 1, 15, 30),
    (16, "Solar panel", "6 V 6 W panel and bracket", 1, 30, 60),
    (17, "Beacon", "WS2812 12-LED ring, printed base, diffuser dome", 1, 15, 30),
    (18, "Rain gauge", "printed tipping bucket, Ø120 funnel, reed switch", 1, 15, 25),
    (19, "Camera (optional)", "ESP32-CAM, housing, bracket", 1, 30, 50),
    (20, "Sign plate", "printed vinyl on aluminium, bilingual", 1, 15, 25),
    (21, "Staff gauge", "0–3 m printed board and wall fixings (not shown)", 1, 40, 70),
    (22, "Gateway", "second ESP32 LoRa board at the guardhouse (not shown)", 1, 80, 120),
]
REP = {1: "Mast_GI_Pipe_2in", 2: "Clamp_Railing_1", 3: "Arm_Al_40x40", 4: "Brace_Al_25x25", 5: "SensorHead_Hood_rPETG",
       6: "Sensor_A02YYUW_Ultrasonic", 7: "Probe_DS18B20_AirTemp", 8: "Enclosure_IP65_200x150x100", 9: "Enclosure_Hood",
       10: "Board_ESP32_LoRa_Heltec_V3", 11: "Battery_LiFePO4_32700", 12: "Charger_MPPT_CN3791", 13: "BuckBoost_3V3_and_Boost_5V",
       14: "Terminal_Blocks_Fuse", 15: "Antenna_923MHz_3dBi", 16: "Solar_Panel_6V6W_Frame", 17: "Beacon_Dome_RGB",
       18: "RainGauge_Body_rPETG", 19: "Camera_ESP32CAM_Housing", 20: "Sign_Plate_Backing"}
v = View("exploded", 120, 100, h=820)
body = v.svg()
mid = v.x + v.w / 2
items = [(n, v.obj(o)) for n, o in REP.items() if o in v.m["centers"]]
L_ = [(n, p) for n, p in items if p[0] < mid]; R_ = [(n, p) for n, p in items if p[0] >= mid]
for grp, colx in ((L_, 78), (R_, v.x + v.w + 30)):
    ys = spread([[p[1]] for _, p in grp], 120, 900, 34)
    for (n, p), y in zip(grp, ys):
        body += C(p[0], p[1], 2.6, INK, INK) + poly([p, (colx + (14 if colx < mid else -14), y)], INK, 0.8, op=0.75) + badge(colx, y, n)
body += view_title(40, 945, "E", "EXPLODED ISOMETRIC", "parts pulled apart along their fixing direction; numbers match the parts list")
tx, ty = 1010, 116
cols = [(0, "NO", 34), (34, "PART", 170), (204, "SPECIFICATION", 470), (674, "QTY", 40), (714, "EST. RM", 150)]
body += R(tx, ty, 864, 30, INK, "rgba(255,255,255,0.06)", 1)
for off, nm, w in cols:
    body += T(tx + 856 if nm == "EST. RM" else tx + off + 8, ty + 20, nm, 10.5, DIM, "end" if nm == "EST. RM" else "start", weight=700, ls=1.2)
yy = ty + 30; lo = hi = 0
for n, part, specx, q, a, b in BOM:
    opt = n in (19, 22)
    col = MUTE if opt else INK
    body += Lw(tx, yy + 30, tx + 864, yy + 30, FAINT, 0.8)
    body += T(tx + 12, yy + 20, str(n), 12, col, weight=700, mono=True) + T(tx + 42, yy + 20, part, 12.5, col, weight=600)
    body += T(tx + 212, yy + 20, specx, 12, col) + T(tx + 690, yy + 20, str(q), 12, col, mono=True)
    body += T(tx + 856, yy + 20, f"{a}–{b}", 12, col, "end", mono=True)
    if not opt: lo += a; hi += b
    yy += 30
body += R(tx, ty, 864, yy - ty, INK, "none", 1)
body += T(tx + 42, yy + 26, "Node total (items 1–18, 20, 21)", 13, INK, weight=700) + T(tx + 856, yy + 26, f"RM {lo}–{hi}", 14, ALERT, "end", 700, True)
body += T(tx + 42, yy + 50, "Optional camera (19) and the shared gateway (22) are extra. Prices are estimates for Malaysia,", 11.5, MUTE)
body += T(tx + 42, yy + 66, "October 2026, not quotes: check Cytron, Shopee or Lazada. Excludes tools, printer time and labour.", 11.5, MUTE)
TOTAL_LO, TOTAL_HI = lo, hi
sheets.append(frame(4, "Exploded view and parts list", "Every part a student team buys, prints or cuts, with an estimated cost", body))

# =====================================================================
# S5 DETAILS
# =====================================================================
body = ""
v = View("detail_head", 40, 150, w=580)
body += v.svg() + view_title(40, 112, "F", "SENSOR HEAD", "side view, about 1:5")
body += dim_h(v.X((3.165, 0, 0)), v.X((3.275, 0, 0)), v.Y((0, 0, 1.205)), v.Y((0, 0, 1.27)), v.Y((0, 0, 1.27)), "Ø110")
body += dim_v(v.Y((0, 0, 1.38)), v.Y((0, 0, 1.245)), v.X((3.36, 0, 0)), v.X((3.3, 0, 0)), v.X((3.25, 0, 0)), "135")
body += leader(*v.obj("SensorHead_Hood_rPETG"), v.X((2.9, 0, 0)), v.Y((0, 0, 1.24)), "Printed hood", "end", sub="keeps sun and rain off")
body += leader(*v.obj("Sensor_A02YYUW_Ultrasonic"), v.X((2.95, 0, 0)), v.Y((0, 0, 1.13)), "A02YYUW face", "end", sub="Ø45, aims straight down")
body += leader(*v.obj("Probe_DS18B20_AirTemp"), v.X((3.3, 0, 0)), v.Y((0, 0, 1.09)), "Air temp probe", "end", sub="corrects sound speed")
body += leader(v.X((2.75, 0, 0)), v.Y((0, 0, 1.40)), v.X((2.75, 0, 0)), v.Y((0, 0, 1.55)), "Arm 40×40, cable inside the run", "start")
v = View("detail_encl", 680, 150, w=580)
body += v.svg() + view_title(680, 112, "G", "ENCLOSURE, LID OFF", "seen from the deck, about 1:3")
body += dim_h(v.X((0, 0.10, 0)), v.X((0, -0.10, 0)), v.Y((0, 0, 1.635)), v.Y((0, 0, 1.66)), v.Y((0, 0, 1.66)), "200")
body += dim_v(v.Y((0, 0, 1.825)), v.Y((0, 0, 1.675)), v.X((0, 0.19, 0)), v.X((0, 0.105, 0)), v.X((0, 0.105, 0)), "150")
parts5 = [("Board_ESP32_LoRa_Heltec_V3", "ESP32 LoRa board", "s"), ("Battery_LiFePO4_32700", "LiFePO4 cell", "e"),
          ("Charger_MPPT_CN3791", "MPPT charger", "e"), ("BuckBoost_3V3_and_Boost_5V", "3.3 V / 5 V modules", "s"),
          ("Terminal_Blocks_Fuse", "Terminals + 1 A fuse", "s"), ("Silica_Gel_Pack", "Silica gel", "e"),
          ("Cable_Gland_M16_2", "M16 cable glands", "s"), ("Antenna_923MHz_3dBi", "Antenna", "s")]
for nm, lab, sd in parts5:
    p = v.obj(nm)
    lx = v.x + 16 if sd == "s" else v.x + v.w - 16
    body += leader(p[0], p[1], lx if sd == "e" else lx, p[1] + (0 if nm != "Cable_Gland_M16_2" else 18), lab, "end" if sd == "s" else "start", size=11.5) if False else ""
ann = [("Board_ESP32_LoRa_Heltec_V3", "ESP32 LoRa board", -1, -70), ("BuckBoost_3V3_and_Boost_5V", "3.3 V and 5 V modules", -1, 20),
       ("Terminal_Blocks_Fuse", "Terminals and 1 A fuse", -1, 75), ("Battery_LiFePO4_32700", "LiFePO4 cell", 1, -70),
       ("Charger_MPPT_CN3791", "MPPT charger", 1, 20), ("Silica_Gel_Pack", "Silica gel", 1, 75)]
for nm, lab, sd, dy in ann:
    p = v.obj(nm); sd = -1 if p[0] < v.x + v.w / 2 else 1; lx = v.x + 40 if sd < 0 else v.x + v.w - 40
    body += leader(p[0], p[1], lx, p[1] + dy * 0.35, lab, "end" if sd < 0 else "start", size=11.5)
v = View("detail_rain", 1380, 150, w=380)
body += v.svg() + view_title(1380, 112, "H", "RAIN GAUGE", "front view with the inside drawn, about 1:4")
bcx, bcy = v.P((0, -0.31, 2.37)); rpx = 0.052 * v.ppm
ang = math.radians(14); dxp, dyp = math.cos(ang) * rpx * 0.85, math.sin(ang) * rpx * 0.85
body += Lw(bcx - dxp, bcy + dyp, bcx + dxp, bcy - dyp, ALERT, 2)
for sg in (-1, 1):
    ex_, ey_ = bcx + sg * dxp, bcy - sg * dyp
    body += poly([(ex_, ey_), (ex_ - sg * 14, ey_ - 18), (ex_ - sg * 2, ey_ - 18)], ALERT, 1.5)
body += C(bcx, bcy, 4, ALERT, BG, 1.5)
body += R(bcx + 6, bcy + 10, 10, 7, ALERT, ALERT, 0) + R(bcx + rpx - 6, bcy + 4, 7, 20, DIM, "none", 1.2)
RX_ = v.x + v.w + 6
body += leader(*v.P((0, -0.31, 2.49)), RX_, v.Y((0, 0, 2.6)), "Funnel Ø120", "start", size=11.5, sub="11 310 mm² catch")
body += leader(bcx + dxp, bcy - dyp - 12, RX_, v.Y((0, 0, 2.43)), "Tipping bucket", "start", ALERT, 11.5, "2.26 mL = 0.2 mm")
body += leader(bcx + rpx - 2, bcy + 14, RX_, v.Y((0, 0, 2.27)), "Reed switch", "start", DIM, 11.5, "wakes the ESP32")
# notes under details
body += notes_block(40, 640, ["The A02YYUW blind zone is 3 cm, so the water may rise", "to 30 mm below the face and still read.",
                              "The probe sits beside the beam, not in it.", "Seal the cable gland under the arm; drill a 3 mm",
                              "drain hole at the low end of the hood."], size=12.5, gap=21, title="SENSOR HEAD NOTES")
body += notes_block(680, 640, ["Heaviest part (battery) mounts low on the plate.", "LiFePO4 is chosen because it tolerates heat in a",
                               "sun-baked box better than Li-ion cells.", "The breather vent stops the box pumping in moist air",
                               "as it heats and cools; replace the silica gel yearly."], size=12.5, gap=21, title="ENCLOSURE NOTES")
body += notes_block(1380, 640, ["0.2 mm a tip: bucket volume = 11 310 mm² × 0.2 mm", "= 2262 mm³ = 2.26 mL.", "",
                                "Calibrate: pour 113 mL (10 mm of rain) slowly", "through the funnel; count 50 tips. Adjust the",
                                "end-stop screws until it does."], size=12.5, gap=21, title="RAIN GAUGE NOTES")
sheets.append(frame(5, "Details", "Sensor head, enclosure interior and rain gauge", body))

# =====================================================================
# S6 WIRING
# =====================================================================
PW, SW3, SIG = "#FF8A8A", ALERT, WATER
def blk(x, y, w, h, t1, t2=None, t3=None, c=INK, dash=None):
    s = R(x, y, w, h, c, "rgba(255,255,255,0.04)", 1.4, 6, dash)
    s += T(x + 14, y + 26, t1, 14, c, weight=700)
    if t2: s += T(x + 14, y + 46, t2, 12, MUTE)
    if t3: s += T(x + 14, y + 64, t3, 12, MUTE)
    return s
def wire(pts, c, lab=None, lp=None, w=2):
    s = poly(pts, c, w)
    if lab: s += label_box(lp[0], lp[1], lab, 11, c, mono=True)
    return s
body = ""
body += blk(60, 140, 230, 90, "Solar panel", "6 V, 6 W, 15° tilt")
body += blk(360, 140, 250, 90, "MPPT charger", "CN3791, LiFePO4 3.6 V setting")
body += blk(680, 140, 270, 90, "LiFePO4 cell", "32700, 3.2 V, 6 Ah", "with 1S protection board")
body += blk(1010, 160, 90, 50, "Fuse", "1 A")
body += blk(1160, 140, 250, 90, "Buck-boost 3.3 V", "TPS63020-type module")
body += R(1160, 300, 380, 500, INK, "rgba(255,255,255,0.05)", 1.8, 8)
body += T(1180, 330, "ESP32 LoRa controller", 15, INK, weight=700) + T(1180, 350, "Heltec WiFi LoRa 32 V3 (ESP32-S3 + SX1262)", 12, MUTE)
pins = [("VEXT 3.3 V switched", 400, SW3), ("GPIO47  UART1 RX", 460, SIG), ("GPIO4   1-Wire", 520, SIG),
        ("GPIO6   rain wake (RTC)", 600, SIG), ("GPIO3   battery ADC", 660, SIG), ("GPIO5   LED data", 720, SIG), ("GPIO7   5 V boost EN", 770, SIG)]
for nm, y, c in pins:
    body += C(1160, y, 4, c, c) + T(1176, y + 4, nm, 12, INK, mono=True)
body += C(1480, 300, 4, PW, PW) + T(1490, 318, "3V3 in", 11.5, INK, mono=True)
body += C(1540, 420, 4, SIG, SIG) + T(1530, 440, "u.FL", 11.5, INK, "end", mono=True)
body += blk(1620, 380, 230, 80, "LoRa antenna", "923 MHz (AS923), 3 dBi")
body += blk(360, 360, 270, 110, "Ultrasonic sensor", "DFRobot A02YYUW", "VCC · GND · TX · RX")
body += blk(360, 490, 270, 80, "Air temp probe", "DS18B20, 4.7 kΩ pull-up")
body += blk(360, 590, 270, 80, "Rain gauge reed switch", "100 kΩ pull-up, 100 nF")
body += blk(700, 630, 200, 60, "Divider", "100 k / 100 k")
body += blk(700, 720, 200, 70, "5 V boost", "MT3608, EN pin")
body += blk(360, 710, 270, 80, "RGB beacon", "WS2812, 12 LEDs, 330 Ω on DIN")
body += blk(1620, 560, 250, 120, "Camera (optional)", "ESP32-CAM, own 5 V supply", "needs WiFi or 4G at the site", MUTE, "6 4")
body += wire([(290, 185), (360, 185)], PW, "6 V", (325, 175))
body += wire([(610, 185), (680, 185)], PW, "3.6 V", (645, 175))
body += wire([(950, 185), (1010, 185)], PW) + wire([(1100, 185), (1160, 185)], PW)
body += wire([(1285, 230), (1285, 270), (1480, 270), (1480, 296)], PW, "3.3 V", (1380, 262))
body += wire([(1156, 400), (690, 400), (690, 395), (630, 395)], SW3, "VEXT", (900, 390))
body += wire([(690, 400), (690, 515), (630, 515)], SW3)
body += wire([(630, 430), (760, 430), (760, 460), (1156, 460)], SIG, "TX → RX", (960, 452))
body += wire([(630, 545), (760, 545), (760, 520), (1156, 520)], SIG, "DQ", (960, 512))
body += wire([(630, 630), (1156, 600)], SIG) if False else wire([(630, 630), (1000, 630), (1000, 600), (1156, 600)], SIG, "tip pulse", (1060, 592))
body += wire([(815, 230), (815, 630)], PW)
body += wire([(900, 660), (1156, 660)], SIG, "Vbat ÷ 2", (1040, 652))
body += wire([(930, 230), (930, 705), (800, 705), (800, 720)], PW)
body += wire([(1156, 770), (900, 770)], SIG, "EN", (1020, 762))
body += wire([(700, 755), (630, 755)], PW, "5 V", (665, 745))
body += wire([(1156, 720), (1120, 720), (1120, 820), (660, 820), (660, 775), (630, 775)], SIG, "DIN", (900, 812))
body += wire([(1544, 420), (1620, 420)], SIG)
lx, ly = 60, 860
body += T(lx, ly, "LEGEND", 12, INK, weight=700, ls=1.5)
for i, (c, nm) in enumerate(((PW, "Battery and supply"), (SW3, "Switched 3.3 V, off while asleep"), (SIG, "Signal"))):
    body += Lw(lx + i * 300, ly + 22, lx + i * 300 + 40, ly + 22, c, 2.5) + T(lx + i * 300 + 50, ly + 26, nm, 12, INK)
body += T(lx, ly + 54, "All GND pins join at the terminal block (not drawn). Pin numbers are suggestions for the Heltec V3: check its pinout before wiring.", 11.5, MUTE)
body += T(lx, ly + 72, "Leave the A02YYUW RX pin as its datasheet says for the output mode you want. Feed the board at 3V3, not through its own battery socket.", 11.5, MUTE)
sheets.append(frame(6, "Electronics and wiring", "How the parts connect inside and outside the IP65 box", body))

# =====================================================================
# S7 FIRMWARE AND POWER
# =====================================================================
body = ""
def sbox(x, y, w, h, t, lines, c=INK):
    s = R(x, y, w, h, c, "rgba(255,255,255,0.05)", 1.5, 10) + T(x + 16, y + 28, t, 15, c, weight=700)
    for i, ln in enumerate(lines): s += T(x + 16, y + 52 + i * 19, ln, 12, MUTE)
    return s
body += T(40, 130, "FIRMWARE LOOP", 13, INK, weight=700, ls=1.5)
body += sbox(60, 160, 360, 130, "1  Sleep", ["Deep sleep, a few tens of µA (board", "dependent). Sensors powered off.", "Wakes on the timer or a rain tip."])
body += sbox(520, 160, 380, 130, "2  Measure", ["Power sensors (VEXT on). Read air temp.", "9 pings, take the median, correct for", "sound speed, h = H − d. Read battery."])
body += sbox(520, 360, 380, 170, "3  Decide (on the node)", ["h ≥ danger mark → beacon red, flashing", "h ≥ warning mark → beacon amber", "otherwise beacon off", "Event mode if rise ≥ 30 mm in 15 min,", "rain ≥ 5 mm in 15 min, or a downlink flag"])
body += sbox(60, 360, 360, 170, "4  Send", ["LoRa uplink of the reading (payload below).", "Listen for a downlink: new thresholds,", "MetMalaysia warning flag, beacon test.", "", "Back to sleep: 5 min normal, 30 s event."])
body += Lw(420, 225, 516, 225, INK, 1.6, me="flow") + Lw(710, 290, 710, 356, INK, 1.6, me="flow")
body += Lw(520, 445, 424, 445, INK, 1.6, me="flow") + Lw(240, 360, 240, 294, INK, 1.6, me="flow")
body += T(40, 590, "PAYLOAD (one reading)", 13, INK, weight=700, ls=1.5)
payload = ['{"id":"BBR-01","ts":1792502400,', ' "level_m":1.10,"rise15_mm":4,', ' "rain15_mm":0.0,"air_c":29.5,', ' "batt_v":3.28,"mode":"NORMAL","beacon":"OFF"}']
body += R(60, 610, 840, 112, FAINT, "rgba(0,0,0,0.12)", 1, 6)
for i, ln in enumerate(payload): body += T(80, 640 + i * 22, ln, 14, INK, mono=True)
body += notes_block(60, 760, ["The node decides the beacon itself, so it still warns drivers if the radio or the internet is down.",
                              "The backend combines the reading with the other three inputs (S8) for the app and the dashboard."], size=12.5, gap=21, c=MUTE)
body += T(980, 130, "POWER BUDGET (design estimate, measure on the bench)", 13, INK, weight=700, ls=1.5)
tx, ty = 980, 150
hdr = [("MODE", 0), ("WAKE EVERY", 210), ("AVG CURRENT", 360), ("ENERGY / DAY", 520), ("DAYS WITHOUT SUN", 690)]
body += R(tx, ty, 900, 32, INK, "rgba(255,255,255,0.06)", 1)
for nm, off in hdr: body += T(tx + off + 12, ty + 21, nm, 10.5, DIM, weight=700, ls=1.2)
rows = [("Normal", "5 min", "≈1 mA", "≈0.1 Wh", "≈190 (theory)"), ("Event", "30 s", "≈10 mA", "≈0.9 Wh", "≈20"),
        ("Danger + beacon", "30 s", "+ ≈36 mA at 5 V", "≈5.2 Wh", "≈4")]
yy = ty + 32
for r_ in rows:
    body += Lw(tx, yy + 34, tx + 900, yy + 34, FAINT, 0.8)
    for (nm, off), val in zip(hdr, r_): body += T(tx + off + 12, yy + 22, val, 13, INK, mono=(off > 0), weight=600 if off == 0 else 400)
    yy += 34
body += R(tx, ty, 900, yy - ty, INK, "none", 1)
body += notes_block(tx, yy + 30, ["Assumes 3 s awake at about 100 mA per wake-up, 3.3 V rail at 85% efficiency,",
                                  "and a 19.2 Wh cell (3.2 V × 6 Ah). Beacon at 30% brightness, 50% duty.",
                                  "Solar: 6 W × about 4 peak sun hours × 0.6 losses ≈ 14 Wh on a clear day;",
                                  "monsoon overcast days give much less, so the battery carries the gap."], size=12, gap=19, c=MUTE)
body += T(980, yy + 130, "WHY THESE CHOICES", 13, INK, weight=700, ls=1.5)
why = ["Solar + LiFePO4: no mains cable on the bridge; LiFePO4 handles heat better.",
       "LoRa, not WiFi: a few milliamps per message and no SIM fee; one gateway can",
       "serve several nodes within range (range to be measured on site).",
       "Ultrasonic, not a submerged sensor: nothing touches the water, so debris",
       "and silt do not foul it, and the whole node can be serviced from the deck.",
       "3D-printed parts in recycled PETG: cheap to replace and easy to repair."]
body += notes_block(980, yy + 156, why, size=12.5, gap=21)
sheets.append(frame(7, "Firmware and power", "What the node does every wake-up, and how long it runs on its battery", body))

# =====================================================================
# S8 HOW IT JOINS FLOODWAY (FOUR INPUTS)
# =====================================================================
body = ""
gx0, gy0, gy1 = 110, 150, 890; pxm = (gy1 - gy0) / 3.0
def gy(m): return gy1 - m * pxm
bands = [(0, reading(LV["alert"]), NORM, "NORMAL"), (reading(LV["alert"]), reading(LV["warning"]), ALERT, "WASPADA / ALERT"),
         (reading(LV["warning"]), reading(LV["danger"]), WARN, "AMARAN / WARNING"), (reading(LV["danger"]), 3.0, DANG, "BAHAYA / DANGER")]
for lo_, hi_, col, nm in bands:
    body += R(gx0, gy(hi_), 46, gy(lo_) - gy(hi_), "none", col, 0, op=0.85)
body += R(gx0, gy0, 46, gy1 - gy0, INK, "none", 1.4)
for i in range(0, 31):
    m = i / 10; w_ = 18 if i % 5 == 0 else 9
    body += Lw(gx0 + 46, gy(m), gx0 + 46 + w_, gy(m), INK, 1)
    if i % 5 == 0: body += T(gx0 - 8, gy(m) + 4, f"{m:.1f}", 11, MUTE, "end", mono=True)
acts = {"NORMAL": "App green; reading every 5 min", "WASPADA / ALERT": "Notice: check route and nearest PPS",
        "AMARAN / WARNING": "Push alert, route pre-loaded, beacon amber", "BAHAYA / DANGER": "Evacuate prompt, open PPS, beacon red"}
for lo_, hi_, col, nm in bands:
    ym = gy((lo_ + hi_) / 2)
    body += T(gx0 + 80, ym - 4, nm, 12.5, col, weight=700) + T(gx0 + 80, ym + 13, acts[nm], 11, MUTE)
body += Lw(gx0 - 20, gy(reading(LV["normal"])), gx0 + 70, gy(reading(LV["normal"])), WATER, 2)
body += T(gx0 + 80, gy(reading(LV["normal"])) + 30, "water today: 1.10 m", 11, WATER, mono=True)
body += T(40, 130, "STAFF GAUGE AND ALERT LEVELS (m)", 13, INK, weight=700, ls=1.5)

def ibox(x, y, w, h, n, t, l1, l2=None, c=INK, fill="rgba(255,255,255,0.05)", sw=1.4):
    s = R(x, y, w, h, c, fill, sw, 8)
    if n: s += badge(x + 22, y + 24, n, c, 12)
    s += T(x + (44 if n else 16), y + 29, t, 14, c, weight=700) + T(x + 16, y + 54, l1, 12, MUTE)
    if l2: s += T(x + 16, y + 72, l2, 12, MUTE)
    return s
X0 = 560
body += T(X0, 130, "HOW THE NODE JOINS THE FLOODWAY PREDICTION", 13, INK, weight=700, ls=1.5)
body += ibox(X0, 160, 300, 90, None, "RiverNode (this device)", "level, rise, rain, air temp", c=WATER)
body += ibox(X0 + 400, 160, 300, 90, None, "Gateway at the guardhouse", "ESP32 LoRa + township WiFi")
body += ibox(X0 + 800, 160, 500, 90, None, "FloodWay backend", "FastAPI + Firebase; stores every reading")
body += Lw(X0 + 300, 205, X0 + 396, 205, WATER, 2, me="fw") + T(X0 + 348, 196, "LoRa 923 MHz", 10.5, WATER, "middle", 600)
body += Lw(X0 + 700, 205, X0 + 796, 205, INK, 2, me="flow") + T(X0 + 748, 196, "internet", 10.5, INK, "middle", 600)
iw, gap_ = 305, 26; iy = 330
inputs = [("Trained models", "where floods are likely", "GINKGO map + rainfall RF"), ("MetMalaysia API", "when heavy rain is coming", "forecasts and warnings"),
          ("RiverNode", "what the river is doing now", "this device, every 30 s–5 min"), ("CCTV", "what people would see", "water over a marked line")]
for i, (t, a, b) in enumerate(inputs):
    x = X0 + i * (iw + gap_)
    body += ibox(x, iy, iw, 96, i + 1, t, a, b, WATER if t == "RiverNode" else INK, "rgba(92,200,255,0.10)" if t == "RiverNode" else "rgba(255,255,255,0.05)", 2 if t == "RiverNode" else 1.4)
    body += Lw(x + iw / 2, iy + 96, x + iw / 2, 506, INK, 1.4, me="flow")
xin3 = X0 + 2 * (iw + gap_) + iw / 2
body += Lw(xin3, 250, xin3, iy - 6, INK, 1.2, "4 4") + T(xin3 + 12, 290, "stored readings = input 3", 10.5, MUTE)
fx, fw_ = X0, 4 * iw + 3 * gap_
body += R(fx, 510, fw_, 120, ALERT, "rgba(255,224,102,0.08)", 2, 10)
body += T(fx + 20, 545, "Fusion engine (rules, not another model)", 17, ALERT, weight=700)
body += T(fx + 20, 572, "Any input raises the level one step. Danger needs two inputs to agree, or the RiverNode above its surveyed danger mark.", 12.5, INK)
body += T(fx + 20, 594, "If the node is offline, the other three inputs carry on. Thresholds live in one config file, tuned during the pilot.", 12.5, MUTE)
outs = [("Resident app", "alert and safe route to an open PPS"), ("Beacon on the node", "downlink: amber or red at the bridge"),
        ("Township dashboard", "SDP township team and the council")]
ow = (fw_ - 2 * 30) / 3
for i, (t, a) in enumerate(outs):
    x = fx + i * (ow + 30)
    body += Lw(x + ow / 2, 630, x + ow / 2, 676, INK, 1.4, me="flow") + ibox(x, 680, ow, 76, None, t, a)
body += R(fx, 790, fw_, 104, FAINT, "rgba(0,0,0,0.10)", 1, 8)
body += T(fx + 20, 820, "THE DATA LOOP", 12.5, INK, weight=700, ls=1.5)
body += T(fx + 20, 844, "When a camera can see the staff gauge, every RiverNode reading labels that frame automatically, which trains and tests the CCTV check.", 12.5, MUTE)
body += T(fx + 20, 866, "Each flood the node records becomes local ground truth for re-testing the trained models on Malaysian sites.", 12.5, MUTE)
sheets.append(frame(8, "How it joins FloodWay", "The RiverNode is input 3 of the four that FloodWay combines into one alert level", body))

# ---------------- write ----------------
for i, s in enumerate(sheets, 1):
    open(os.path.join(SHEETS, f"S{i}.svg"), "w").write(s)
allhtml = "<html><head><style>@page{size:1920px 1080px;margin:0}body{margin:0}.p{width:1920px;height:1080px;page-break-after:always;overflow:hidden}</style></head><body>"
allhtml += "".join(f'<div class="p">{s}</div>' for s in sheets) + "</body></html>"
open(os.path.join(SHEETS, "all.html"), "w").write(allhtml)
json.dump(dict(lo=TOTAL_LO, hi=TOTAL_HI), open(os.path.join(SHEETS, "totals.json"), "w"))
print("SHEETS OK", len(sheets), "total RM", TOTAL_LO, TOTAL_HI)
