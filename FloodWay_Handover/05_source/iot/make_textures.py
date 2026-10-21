"""Textures for the FloodWay RiverNode scene: staff gauge, sign plate, solar cells."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "tex")
os.makedirs(OUT, exist_ok=True)
F_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
F_REG = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
if not os.path.exists(F_BOLD):
    import glob
    cands = glob.glob("/usr/share/fonts/**/Inter*Bold*.otf", recursive=True) + glob.glob("/usr/share/fonts/**/Inter*Bold*.ttf", recursive=True)
    F_BOLD = cands[0]
    F_REG = (glob.glob("/usr/share/fonts/**/Inter-Regular*", recursive=True) or cands)[0]

# Levels on the gauge (metres above gauge zero = channel bed)
NORMAL, ALERT, WARNING, DANGER, TOP = 1.1, 1.6, 1.9, 2.15, 3.0

# ---------- staff gauge: 150 mm wide x 3000 mm tall, 2 px per mm ----------
PX = 2
W, H = 150 * PX, 3000 * PX
g = Image.new("RGB", (W, H), (250, 250, 247))
d = ImageDraw.Draw(g)

def y_of(m):  # metres above zero -> pixel row (0 at top)
    return int(H - m * 1000 * PX)

band_x = 26 * PX
bands = [(0.0, ALERT, (46, 160, 67)), (ALERT, WARNING, (245, 197, 24)),
         (WARNING, DANGER, (240, 128, 30)), (DANGER, TOP, (214, 40, 40))]
for lo, hi, col in bands:
    d.rectangle([0, y_of(hi), band_x, y_of(lo)], fill=col)
# E-pattern: 1 cm marks, 5 cm half-E, 10 cm number
font = ImageFont.truetype(F_BOLD, 34 * PX // 2)
for cm in range(0, 300):
    y = y_of(cm / 100)
    x0 = band_x + 6 * PX
    if cm % 10 == 0:
        d.rectangle([x0, y - 3 * PX, x0 + 60 * PX, y], fill=(20, 20, 20))
        if cm % 20 == 0 and 0 < cm < 300:
            txt = f"{cm/100:.1f}"
            d.text((x0 + 68 * PX, y - 22 * PX), txt, fill=(20, 20, 20), font=font)
    elif cm % 5 == 0:
        d.rectangle([x0, y - 2 * PX, x0 + 36 * PX, y], fill=(20, 20, 20))
    elif cm % 2 == 0:
        d.rectangle([x0, y - 2 * PX, x0 + 18 * PX, y], fill=(20, 20, 20))
# level labels on the band
small = ImageFont.truetype(F_BOLD, 22 * PX // 2)
for m, lab in [(ALERT, "WASPADA"), (WARNING, "AMARAN"), (DANGER, "BAHAYA")]:
    d.rectangle([0, y_of(m) - 2 * PX, W, y_of(m)], fill=(20, 20, 20))
g = g.rotate(0)
g.save(os.path.join(OUT, "staff_gauge.png"))

# ---------- sign plate 220 x 130 mm ----------
SW, SH = 880, 520
s = Image.new("RGB", (SW, SH), (255, 255, 255))
d = ImageDraw.Draw(s)
d.rectangle([0, 0, SW, 120], fill=(30, 127, 208))
d.text((28, 26), "FloodWay RiverNode", fill=(255, 255, 255), font=ImageFont.truetype(F_BOLD, 56))
d.text((28, 150), "BBR-01", fill=(29, 43, 83), font=ImageFont.truetype(F_BOLD, 64))
d.text((28, 240), "Flood level sensor - please do not tamper", fill=(29, 43, 83), font=ImageFont.truetype(F_REG, 34))
d.text((28, 290), "Sensor paras air banjir - jangan usik", fill=(29, 43, 83), font=ImageFont.truetype(F_REG, 34))
d.rectangle([28, 360, SW - 28, 364], fill=(200, 205, 215))
d.text((28, 390), "Green normal  |  Amber warning  |  Red danger", fill=(29, 43, 83), font=ImageFont.truetype(F_BOLD, 30))
d.text((28, 446), "floodways.netlify.app", fill=(30, 127, 208), font=ImageFont.truetype(F_BOLD, 34))
s.save(os.path.join(OUT, "sign_plate.png"))

# ---------- solar cells 6 x 4 grid ----------
CW, CH = 600, 440
c = Image.new("RGB", (CW, CH), (205, 210, 215))
d = ImageDraw.Draw(c)
cols, rows, m = 6, 4, 14
cw = (CW - 2 * m) / cols
ch = (CH - 2 * m) / rows
for i in range(cols):
    for j in range(rows):
        x0, y0 = m + i * cw + 3, m + j * ch + 3
        d.rectangle([x0, y0, x0 + cw - 6, y0 + ch - 6], fill=(18, 32, 72))
        for k in range(1, 3):
            xx = x0 + k * (cw - 6) / 3
            d.line([xx, y0, xx, y0 + ch - 6], fill=(120, 130, 150), width=1)
c.save(os.path.join(OUT, "solar_cells.png"))
print("textures ok", os.listdir(OUT))
