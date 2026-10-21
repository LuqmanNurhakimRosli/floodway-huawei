"""Blueprint line-art renders (Cycles + Freestyle, surfaces held out) and camera metadata for overlays.
Usage: python3 render_lines.py [view ...]   (no args = all views)"""
import bpy, os, sys, json, math
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
LINES = os.path.join(HERE, "lines"); os.makedirs(LINES, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "out", "floodway_rivernode_scene.blend"))
scn = bpy.context.scene; vl = scn.view_layers[0]
scn.frame_set(1)

# holdout override: surfaces become transparent, Freestyle draws the edges
hold = bpy.data.materials.new("LA_Holdout"); hold.use_nodes = True
nt = hold.node_tree; nt.nodes.clear()
o = nt.nodes.new("ShaderNodeOutputMaterial"); h = nt.nodes.new("ShaderNodeHoldout")
nt.links.new(h.outputs[0], o.inputs[0])
vl.material_override = hold
scn.render.engine = 'CYCLES'; scn.cycles.samples = 1; scn.cycles.use_denoising = False
scn.render.film_transparent = True
scn.render.use_freestyle = True; vl.use_freestyle = True
scn.render.line_thickness_mode = 'ABSOLUTE'
scn.view_settings.view_transform = 'Standard'
try:
    scn.view_settings.look = 'None'
except Exception:
    pass
fs = vl.freestyle_settings; fs.crease_angle = math.radians(140)
for L in list(fs.linesets): fs.linesets.remove(L)
L = fs.linesets.new("visible"); L.select_by_visibility = True; L.visibility = 'VISIBLE'
L.select_silhouette = L.select_border = L.select_crease = True
L.linestyle.color = (1, 1, 1); L.linestyle.thickness = 2.2

EXPLODE = dict(clamps=(-0.18, 0, 0), arm=(0.30, 0, 0), brace=(0.15, 0, -0.22), head=(0.30, 0, -0.30),
               enclosure=(-0.30, 0, 0), internals=(-0.46, 0, 0), lid=(-0.62, 0, 0), backplate=(-0.12, 0, 0),
               hood=(-0.30, 0, 0.20), glands=(-0.30, 0, -0.10), antenna=(-0.30, 0.12, 0), panel=(0.20, 0, 0.25),
               beacon=(0, 0, 0.30), raingauge=(0, -0.25, 0), funnel=(0, -0.25, 0.14), camera=(0.05, 0.25, 0),
               sign=(-0.20, 0, 0), mast=(0, 0, 0))

def norm(v): v = Vector(v); return v.normalized()

VIEWS = dict(
    side=dict(f=(0, 1, 0), up=(0, 0, 1), C=(2.6, 0, 0.0), S=5.1, W=1400, H=1700, gauge=True),
    deck=dict(f=(1, 0, 0), up=(0, 0, 1), C=(2.0, -0.05, 1.15), S=2.88, W=1400, H=1700),
    plan=dict(f=(0, 0, -1), up=(0, 1, 0), C=(2.6, 0.9, 0.0), S=6.0, W=1700, H=1700, gauge=True),
    iso_deck=dict(f=norm((1.0, 0.8, -0.85)), up=(0, 0, 1), W=1700, H=2000, fit=True, railing=True),
    iso_water=dict(f=norm((-1.0, 0.75, -0.6)), up=(0, 0, 1), W=1700, H=2000, fit=True, railing=True),
    exploded=dict(f=norm((1.0, 0.8, -0.85)), up=(0, 0, 1), W=2000, H=2000, fit=True, explode=True),
    detail_head=dict(f=(0, 1, 0), up=(0, 0, 1), C=(3.0, 0, 1.33), S=0.75, W=1500, H=1000),
    detail_encl=dict(f=(1, 0, 0), up=(0, 0, 1), C=(1.95, 0, 1.76), S=0.42, W=1400, H=1000, nolid=True),
    detail_rain=dict(f=(1, 0, 0), up=(0, 0, 1), C=(2.035, -0.25, 2.42), S=0.5, W=1000, H=1000),
)
want = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
want = [w for w in want if w in VIEWS] or list(VIEWS)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
base_loc = {o.name: o.location.copy() for o in meshes}

def set_visible(v):
    for ob in meshes:
        g = ob.get("grp", ""); show = bool(ob.get("lineart", False))
        if g == "railing": show = show and v.get("railing", True) and not v.get("explode")
        if g == "gauge": show = v.get("gauge", False) and not v.get("explode")
        if g == "lid" and v.get("nolid"): show = False
        if ob.name.startswith("Viz_"): show = False
        ob.hide_render = not show

def explode(on):
    for ob in meshes:
        ob.location = base_loc[ob.name] + (Vector(EXPLODE.get(ob.get("grp", ""), (0, 0, 0))) if on else Vector())
    bpy.context.view_layer.update()

def axes(v):
    f = Vector(v["f"]).normalized(); up = Vector(v["up"])
    R = f.cross(up).normalized(); U = R.cross(f).normalized()
    return f, R, U

def world_verts(ob):
    dg = bpy.context.evaluated_depsgraph_get(); e = ob.evaluated_get(dg)
    return [e.matrix_world @ vv.co for vv in e.to_mesh().vertices]

meta = json.load(open(os.path.join(LINES, "views.json"))) if os.path.exists(os.path.join(LINES, "views.json")) else {}
for name in want:
    v = VIEWS[name]
    explode(v.get("explode", False)); set_visible(v)
    f, R, U = axes(v)
    vis = [ob for ob in meshes if not ob.hide_render]
    if v.get("fit"):
        pts = [p for ob in vis for p in world_verts(ob)]
        us = [p.dot(R) for p in pts]; vs = [p.dot(U) for p in pts]
        uc, vc = (min(us) + max(us)) / 2, (min(vs) + max(vs)) / 2
        span_u, span_v = (max(us) - min(us)) * 1.10, (max(vs) - min(vs)) * 1.10
        S = max(span_u, span_v * v["W"] / v["H"])
        fc = sum((p.dot(f) for p in pts)) / len(pts)
        C = R * uc + U * vc + f * fc
    else:
        C = Vector(v["C"]); S = v["S"]
    cam = bpy.data.objects.new("LA_" + name, bpy.data.cameras.new("LA_" + name)); scn.collection.objects.link(cam)
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = S; cam.data.sensor_fit = 'HORIZONTAL'
    cam.data.clip_start = 0.1; cam.data.clip_end = 200
    cam.matrix_world = Matrix.Translation(C - f * 40) @ Matrix((R, U, -f)).transposed().to_4x4()
    scn.camera = cam
    scn.render.resolution_x, scn.render.resolution_y, scn.render.resolution_percentage = v["W"], v["H"], 100
    scn.render.filepath = os.path.join(LINES, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    k = v["W"] / S
    def proj(p):
        d = Vector(p) - C
        return [v["W"] / 2 + d.dot(R) * k, v["H"] / 2 - d.dot(U) * k]
    centers = {ob.name: proj(sum((p for p in world_verts(ob)), Vector()) / max(1, len(world_verts(ob))))
               for ob in vis}
    meta[name] = dict(W=v["W"], H=v["H"], S=S, C=list(C), R=list(R), U=list(U), f=list(f), centers=centers,
                      boms={ob.name: ob.get("bom", 0) for ob in vis})
    print("VIEW", name, "S=%.3f" % S, len(vis), "objects")
explode(False)
json.dump(meta, open(os.path.join(LINES, "views.json"), "w"), indent=1)
print("LINES OK")
