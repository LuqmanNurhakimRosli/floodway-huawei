import sys, json, os
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
src = "file://" + os.path.join(HERE, "..", "..", "03_architecture", "FloodWay_System_Architecture.html")
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "03_architecture", "FloodWay_System_Architecture_1920x1080.png")
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    pg.goto(src)
    pg.wait_for_function("window.__done === true")
    pg.wait_for_timeout(200)
    report = pg.evaluate("""() => {
      const issues = [];
      const bk = document.getElementById('backend').getBoundingClientRect();
      const kids = [...document.querySelectorAll('#backend > *')];
      const last = kids[kids.length-1].getBoundingClientRect();
      issues.push({backend_bottom: bk.bottom, last_child_bottom: last.bottom, overflow_px: Math.round(last.bottom - bk.bottom + 0)});
      document.querySelectorAll('.card, .chip, .zh, .tag, .legend, .foot, .tt').forEach(el=>{
        if (el.scrollWidth > el.clientWidth + 1) issues.push({hscroll: el.id || el.className, sw: el.scrollWidth, cw: el.clientWidth});
      });
      const z = [...document.querySelectorAll('.zone')].map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.right),Math.round(r.bottom)]});
      const t = document.querySelector('h1').getBoundingClientRect();
      issues.push({zones: z, title_w: Math.round(t.width), title_bottom: Math.round(t.bottom)});
      const f = document.querySelector('.foot').getBoundingClientRect();
      issues.push({foot_top: Math.round(f.top), foot_bottom: Math.round(f.bottom)});
      return issues;
    }""")
    print(json.dumps(report, indent=1))
    pg.screenshot(path=out, clip={"x":0,"y":0,"width":1920,"height":1080})
    b.close()
print("saved", out)
