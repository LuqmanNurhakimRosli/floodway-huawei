import asyncio, os, sys
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(HERE, "sheets")
only = sys.argv[1:]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=2)
        pg = await ctx.new_page()
        n = len([f for f in os.listdir(S) if f.startswith("S") and f.endswith(".svg")])
        for i in range(1, n + 1):
            if only and str(i) not in only: continue
            svg = open(os.path.join(S, f"S{i}.svg")).read()
            await pg.set_content(f"<html><body style='margin:0;background:#0D3B7A'>{svg}</body></html>")
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(S, f"FloodWay_RiverNode_S{i}.png"), clip={"x": 0, "y": 0, "width": 1920, "height": 1080})
        if not only:
            await pg.set_content(open(os.path.join(S, "all.html")).read()); await pg.wait_for_timeout(500)
            await pg.pdf(path=os.path.join(S, "FloodWay_RiverNode_v1_Blueprints.pdf"), width="1920px", height="1080px", print_background=True)
        await b.close()
asyncio.run(main()); print("EXPORT OK")
