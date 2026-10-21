"""FloodWay RiverNode v1 - parametric Blender scene (bridge-railing mount over a concrete river channel).

Units: metres. Axes: X = river flow (downstream +X), Y = across the river, Z = up.
Datum: bank top / road level z = 0. Gauge zero = channel bed z = -2.6.
Run:  python3 build_scene.py
Outputs: out/floodway_rivernode_scene.blend, out/floodway_rivernode_device.glb, out/floodway_rivernode_scene.glb
"""
import bpy, bmesh, math, os, json
from mathutils import Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
TEX = os.path.join(HERE, "tex")

# ---------------- design parameters (edit here) ----------------
P = dict(
    bed_z=-2.6, bank_z=0.0, channel_half=3.5, wall_t=0.30,
    deck_x=(-2.0, 2.0), deck_y=(-4.4, 4.4), deck_top=0.05, deck_soffit=-0.40,
    rail_x=1.95, rail_h=1.0, post_spacing=1.4,
    mast_x=2.035, mast_r=0.0302, mast_z=(0.10, 2.60),
    arm_z=1.40, arm_len=1.25, arm_sec=0.04,
    head_x=3.22, sensor_face_z=1.245,
    encl_c=(1.943, 0.0, 1.75), encl_size=(0.10, 0.20, 0.15),
    levels=dict(normal=-1.5, alert=-1.0, warning=-0.7, danger=-0.45),
    gauge_x=4.5,
)
LV = P["levels"]

# ---------------- reset ----------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.unit_settings.system = 'METRIC'
scn.render.fps = 30
scn.frame_start, scn.frame_end = 1, 300

def coll(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or scn.collection).children.link(c)
    return c

C_SITE = coll("Site"); C_BRIDGE = coll("Bridge")
C_NODE = coll("RiverNode")
C_STRUCT = coll("Node_Structure", C_NODE); C_SENS = coll("Node_Sensor", C_NODE)
C_ENCL = coll("Node_Enclosure", C_NODE); C_POWER = coll("Node_Power", C_NODE)
C_BEACON = coll("Node_Beacon", C_NODE); C_RAIN = coll("Node_RainGauge", C_NODE)
C_CAMNODE = coll("Node_Camera_Optional", C_NODE)
C_GAUGE = coll("StaffGauge"); C_CCTV = coll("Township_CCTV"); C_VIZ = coll("Viz"); C_CAMS = coll("Cameras")

# ---------------- materials ----------------
def lin(h):
    h = h.lstrip('#'); out = []
    for i in (0, 2, 4):
        c = int(h[i:i+2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)

def pbr(name, hexcol, rough=0.5, metal=0.0, noise=0.0, emit=None, estr=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = lin(hexcol)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = lin(emit)
        b.inputs["Emission Strength"].default_value = estr
    if noise > 0:
        tex = nt.nodes.new("ShaderNodeTexNoise"); tex.inputs["Scale"].default_value = 18.0
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = tuple(max(0, x * (1 - noise)) for x in lin(hexcol)[:3]) + (1,)
        ramp.color_ramp.elements[1].color = tuple(min(1, x * (1 + noise)) for x in lin(hexcol)[:3]) + (1,)
        nt.links.new(tex.outputs["Fac"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.15
        nt.links.new(tex.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m

def img_mat(name, path, rough=0.6):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(path)
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = rough
    return m

M = dict(
    gi=pbr("GI_Steel", "#9DA2A3", 0.38, 1.0),
    alu=pbr("Aluminium", "#D3D6DA", 0.28, 1.0),
    abs=pbr("ABS_Enclosure", "#D9DCDA", 0.45),
    printed=pbr("rPETG_Printed_Blue", "#1E7FD0", 0.42),
    ink=pbr("rPETG_Printed_Ink", "#1D2B53", 0.45),
    black=pbr("Black_Rubber", "#111214", 0.55),
    pcb=pbr("PCB_Green", "#0E5A2E", 0.4), pcb2=pbr("PCB_Blue", "#163A7A", 0.4),
    batt=pbr("LiFePO4_Wrap", "#2B9C8E", 0.35),
    term=pbr("Terminal_Green", "#2E8B3D", 0.5), silica=pbr("Silica_Bag", "#EDE7D9", 0.8),
    concrete=pbr("Concrete", "#8C8C86", 0.88, 0.0, 0.12),
    asphalt=pbr("Asphalt", "#202124", 0.82, 0.0, 0.10),
    grass=pbr("Grass", "#4E7A2A", 0.92, 0.0, 0.22),
    paint=pbr("Railing_Paint", "#C9CFD6", 0.5, 0.2),
    wall=pbr("House_Wall", "#E9E2D2", 0.8), roof=pbr("House_Roof", "#9B3B22", 0.7),
    trunk=pbr("Tree_Trunk", "#5A4632", 0.9), leaf=pbr("Tree_Leaf", "#2F6B22", 0.85, 0.0, 0.18),
    cctv=pbr("CCTV_White", "#F2F2F0", 0.4),
    gauge=img_mat("StaffGauge_Face", os.path.join(TEX, "staff_gauge.png"), 0.5),
    sign=img_mat("Sign_Plate", os.path.join(TEX, "sign_plate.png"), 0.4),
    cells=img_mat("Solar_Cells", os.path.join(TEX, "solar_cells.png"), 0.15),
)
# water
w = bpy.data.materials.new("River_Water"); w.use_nodes = True
nt = w.node_tree; b = nt.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = lin("#4A4630"); b.inputs["Roughness"].default_value = 0.06
n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 6.0; n.inputs["Detail"].default_value = 8
bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.25
nt.links.new(n.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
M["water"] = w
# beacon light (emission colour is keyframed: green / amber / red)
bm_ = bpy.data.materials.new("Beacon_Light"); bm_.use_nodes = True
nt = bm_.node_tree; nt.nodes.clear()
o = nt.nodes.new("ShaderNodeOutputMaterial")
em = nt.nodes.new("ShaderNodeEmission"); em.name = "BeaconEmission"
em.inputs["Color"].default_value = lin("#2EA043"); em.inputs["Strength"].default_value = 6.0
gl = nt.nodes.new("ShaderNodeBsdfPrincipled"); gl.inputs["Base Color"].default_value = (0.9, 0.95, 0.9, 1)
gl.inputs["Roughness"].default_value = 0.15; gl.inputs["Transmission Weight"].default_value = 0.6
mix = nt.nodes.new("ShaderNodeAddShader")
nt.links.new(em.outputs[0], mix.inputs[0]); nt.links.new(gl.outputs[0], mix.inputs[1]); nt.links.new(mix.outputs[0], o.inputs[0])
M["beacon"] = bm_
# sonar beam visual
sv = bpy.data.materials.new("Viz_Sonar"); sv.use_nodes = True
nt = sv.node_tree; nt.nodes.clear()
o = nt.nodes.new("ShaderNodeOutputMaterial"); tr = nt.nodes.new("ShaderNodeBsdfTransparent")
em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Color"].default_value = lin("#3CB5F1"); em.inputs["Strength"].default_value = 1.2
mx = nt.nodes.new("ShaderNodeMixShader"); mx.inputs["Fac"].default_value = 0.12
nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(em.outputs[0], mx.inputs[2]); nt.links.new(mx.outputs[0], o.inputs[0])
M["sonar"] = sv

# ---------------- object helpers ----------------
def _finish(o, name, mat, c, grp=None, bom=None, lineart=True, apply_scale=True):
    o.name = name; o.data.name = name
    if mat: o.data.materials.append(mat)
    for cc in o.users_collection: cc.objects.unlink(o)
    c.objects.link(o)
    o["grp"] = grp or ""; o["bom"] = bom or 0; o["lineart"] = lineart
    return o

def box(name, size, loc, mat, c, rot=(0, 0, 0), **kw):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_euler = rot
    return _finish(o, name, mat, c, **kw)

def cyl(name, r, depth, loc, mat, c, rot=(0, 0, 0), verts=32, **kw):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, vertices=verts)
    o = bpy.context.active_object; o.rotation_euler = rot
    return _finish(o, name, mat, c, **kw)

def cone(name, r1, r2, depth, loc, mat, c, rot=(0, 0, 0), fill='NGON', verts=32, **kw):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, location=loc, vertices=verts, end_fill_type=fill)
    o = bpy.context.active_object; o.rotation_euler = rot
    return _finish(o, name, mat, c, **kw)

def plane(name, size_xy, loc, mat, c, rot=(0, 0, 0), **kw):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc)
    o = bpy.context.active_object; o.scale = (size_xy[0], size_xy[1], 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_euler = rot
    return _finish(o, name, mat, c, **kw)

def strut(name, a, b, sec, mat, c, **kw):
    a, b = Vector(a), Vector(b); d = b - a; L = d.length
    o = box(name, (L, sec, sec), (a + b) / 2, mat, c, **kw)
    o.rotation_euler = (0, -math.atan2(d.z, math.hypot(d.x, d.y)), math.atan2(d.y, d.x))
    return o

R90 = math.pi / 2

# ---------------- site: channel, banks, road ----------------
bed, ch, wt = P["bed_z"], P["channel_half"], P["wall_t"]
box("Channel_Bed", (400, 2 * ch, 0.2), (0, 0, bed - 0.1), M["concrete"], C_SITE, lineart=False)
for s in (1, -1):
    box(f"Channel_Wall_{'N' if s > 0 else 'S'}", (400, wt, -bed + 0.05), (0, s * (ch + wt / 2), (bed + 0.05) / 2), M["concrete"], C_SITE, lineart=False)
    box(f"Bank_Ground_{'N' if s > 0 else 'S'}", (400, 200, 2.8), (0, s * (ch + wt + 100), -1.4), M["grass"], C_SITE, lineart=False)
    box(f"Road_Approach_{'N' if s > 0 else 'S'}", (4.0, 11.6, 0.04), (0, s * (P["deck_y"][1] + 5.8), 0.02), M["asphalt"], C_SITE, lineart=False)
water = plane("River_Water", (400, 2 * ch), (0, 0, 0), M["water"], C_SITE, lineart=False)
wl = bpy.data.objects.new("WaterLevel", None); wl.empty_display_type = 'SINGLE_ARROW'; wl.empty_display_size = 1.0
C_SITE.objects.link(wl); wl.location = (0, 0, LV["normal"])
water.parent = wl
for k, v in LV.items(): wl[f"{k}_z"] = v
wl["gauge_zero_z"] = bed; wl["bank_z"] = 0.0
wl["note"] = "Animate this empty's Z to raise or lower the river. Gauge reading = Z - gauge_zero_z."

# township context: trees and terrace houses
import random
random.seed(7)
for i, (x, y) in enumerate([(-9, 6.5), (-5.5, 7.2), (6, 6.8), (10, 7.4), (-10, -6.6), (-6.5, -7.4), (5.5, -7.0), (11, -6.4), (13, 7.0), (-13, -7.2)]):
    h = random.uniform(3.5, 5.0)
    cyl(f"Tree_Trunk_{i}", 0.12, h, (x, y, h / 2), M["trunk"], C_SITE, verts=12, lineart=False)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=random.uniform(1.4, 2.0), location=(x, y, h + 0.6))
    _finish(bpy.context.active_object, f"Tree_Crown_{i}", M["leaf"], C_SITE, lineart=False)
for i in range(40):
    x = -90 + i * 4.6 + random.uniform(-1, 1); yy = random.choice((1, -1)) * random.uniform(24, 34); hh = random.uniform(5, 9)
    cyl(f"Far_Tree_Trunk_{i}", 0.2, hh, (x, yy, hh / 2), M["trunk"], C_SITE, verts=8, lineart=False)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=random.uniform(2.5, 3.8), location=(x, yy, hh + 1.2))
    _finish(bpy.context.active_object, f"Far_Tree_Crown_{i}", M["leaf"], C_SITE, lineart=False)
for i, x in enumerate([-12, -6, 0, 6, 12]):
    for s in (1, -1):
        box(f"Terrace_House_{i}_{'N' if s > 0 else 'S'}", (5.6, 6.0, 3.2), (x, s * 17.5, 1.6), M["wall"], C_SITE, lineart=False)
        cone(f"Terrace_Roof_{i}_{'N' if s > 0 else 'S'}", 4.6, 0.0, 1.5, (x, s * 17.5, 3.95), M["roof"], C_SITE, rot=(0, 0, math.pi / 4), verts=4, lineart=False)
        bpy.context.active_object.scale = (1.0, 1.08, 1.0)

# ---------------- bridge: deck, asphalt, railings ----------------
(dx0, dx1), (dy0, dy1) = P["deck_x"], P["deck_y"]
box("Bridge_Deck", (dx1 - dx0, dy1 - dy0, P["deck_top"] - P["deck_soffit"]), (0, 0, (P["deck_top"] + P["deck_soffit"]) / 2), M["concrete"], C_BRIDGE, lineart=False)
box("Bridge_Asphalt", (dx1 - dx0 - 0.3, dy1 - dy0, 0.01), (0, 0, P["deck_top"] + 0.005), M["asphalt"], C_BRIDGE, lineart=False)
posts = [round(-4.2 + i * P["post_spacing"], 3) for i in range(7)]
for side, xs in (("DS", P["rail_x"]), ("US", -P["rail_x"])):
    for j, y in enumerate(posts):
        local = side == "DS" and abs(y) < 1.5
        box(f"Railing_{side}_Post_{j}", (0.08, 0.08, P["rail_h"]), (xs, y, P["deck_top"] + P["rail_h"] / 2), M["paint"], C_BRIDGE, grp="railing", lineart=local)
    for j in range(6):
        y0, y1 = posts[j], posts[j + 1]
        local = side == "DS" and abs((y0 + y1) / 2) < 1.5
        box(f"Railing_{side}_Top_{j}", (0.06, y1 - y0 - 0.08, 0.06), (xs, (y0 + y1) / 2, P["deck_top"] + P["rail_h"] - 0.03), M["paint"], C_BRIDGE, grp="railing", lineart=local)
        box(f"Railing_{side}_Mid_{j}", (0.04, y1 - y0 - 0.08, 0.04), (xs, (y0 + y1) / 2, P["deck_top"] + 0.5), M["paint"], C_BRIDGE, grp="railing", lineart=local)

# ---------------- RiverNode: structure ----------------
mx, mr = P["mast_x"], P["mast_r"]; mz0, mz1 = P["mast_z"]
cyl("Mast_GI_Pipe_2in", mr, mz1 - mz0, (mx, 0, (mz0 + mz1) / 2), M["gi"], C_STRUCT, grp="mast", bom=1)
for k, z in enumerate((0.45, 0.95)):
    box(f"Clamp_Railing_{k+1}", (0.12, 0.10, 0.07), (2.005, 0, z), M["alu"], C_STRUCT, grp="clamps", bom=2)
az, al, sec = P["arm_z"], P["arm_len"], P["arm_sec"]
box("Arm_Al_40x40", (al, sec, sec), (mx + al / 2, 0, az), M["alu"], C_STRUCT, grp="arm", bom=3)
box("Clamp_Arm", (0.09, 0.09, 0.12), (mx, 0, az), M["alu"], C_STRUCT, grp="arm", bom=3)
box("Arm_EndCap", (0.012, 0.042, 0.042), (mx + al + 0.006, 0, az), M["black"], C_STRUCT, grp="arm", bom=3)
strut("Brace_Al_25x25", (mx + 0.03, 0, 0.85), (2.80, 0, az - 0.02), 0.025, M["alu"], C_STRUCT, grp="brace", bom=4)
box("Clamp_Brace", (0.08, 0.08, 0.08), (mx, 0, 0.85), M["alu"], C_STRUCT, grp="brace", bom=4)

# ---------------- sensor head ----------------
hx = P["head_x"]
cyl("SensorHead_Hood_rPETG", 0.055, 0.11, (hx, 0, 1.325), M["printed"], C_SENS, grp="head", bom=5)
cyl("SensorHead_DripSkirt", 0.068, 0.012, (hx, 0, 1.276), M["printed"], C_SENS, grp="head", bom=5)
cyl("Sensor_A02YYUW_Ultrasonic", 0.0225, 0.035, (hx, 0, P["sensor_face_z"] + 0.0175), M["black"], C_SENS, grp="head", bom=6)
cyl("Probe_DS18B20_AirTemp", 0.003, 0.05, (hx + 0.045, 0, 1.25), M["black"], C_SENS, grp="head", bom=7, verts=12)
cyl("Cable_Sensor_Run", 0.004, al - 0.12, (mx + 0.06 + (al - 0.12) / 2, 0.012, az - 0.024), M["black"], C_SENS, rot=(0, R90, 0), grp="arm", bom=6, verts=8)

# ---------------- enclosure + electronics ----------------
ex, ey, ez = P["encl_c"]; sx, sy, sz = P["encl_size"]
bpy.ops.mesh.primitive_cube_add(size=1, location=(ex, ey, ez))
body = bpy.context.active_object; body.scale = (sx, sy, sz)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bmsh = bmesh.new(); bmsh.from_mesh(body.data)
for f in list(bmsh.faces):
    if f.normal.x < -0.9: bmsh.faces.remove(f)
bmsh.to_mesh(body.data); bmsh.free()
sol = body.modifiers.new("Wall", 'SOLIDIFY'); sol.thickness = 0.003; sol.offset = -1
_finish(body, "Enclosure_IP65_200x150x100", M["abs"], C_ENCL, grp="enclosure", bom=8)
box("Enclosure_Lid", (0.012, sy, sz), (ex - sx / 2 - 0.006, ey, ez), M["abs"], C_ENCL, grp="lid", bom=8)
box("Enclosure_Backplate", (0.012, 0.24, 0.22), (ex + sx / 2 + 0.006, ey, ez), M["alu"], C_ENCL, grp="backplate", bom=8)
box("Enclosure_Hood", (0.16, 0.26, 0.004), (ex - 0.01, ey, ez + sz / 2 + 0.04), M["ink"], C_ENCL, rot=(0, math.radians(-10), 0), grp="hood", bom=9)
for k, y in enumerate((-0.11, 0.11)):
    box(f"Hood_Support_{k+1}", (0.012, 0.012, 0.05), (ex + 0.035, y, ez + sz / 2 + 0.018), M["alu"], C_ENCL, grp="hood", bom=9)
for k, y in enumerate((-0.05, 0.0, 0.05)):
    cyl(f"Cable_Gland_M16_{k+1}", 0.009, 0.018, (ex, y, ez - sz / 2 - 0.009), M["black"], C_ENCL, grp="glands", bom=8, verts=16)
cyl("Breather_Vent", 0.007, 0.012, (ex, 0.08, ez - sz / 2 - 0.006), M["black"], C_ENCL, grp="glands", bom=8, verts=16)
ix = ex + sx / 2 - 0.007  # inner back wall
box("Mount_Plate_Internal", (0.004, 0.18, 0.13), (ix - 0.002, 0, ez), M["alu"], C_ENCL, grp="internals", bom=8)
box("Board_ESP32_LoRa_Heltec_V3", (0.008, 0.051, 0.025), (ix - 0.008, -0.045, ez + 0.04), M["pcb2"], C_ENCL, grp="internals", bom=10)
cyl("Battery_LiFePO4_32700", 0.016, 0.07, (ix - 0.022, 0.04, ez + 0.04), M["batt"], C_POWER, rot=(R90, 0, 0), grp="internals", bom=11)
box("Charger_MPPT_CN3791", (0.008, 0.045, 0.03), (ix - 0.008, 0.045, ez - 0.025), M["pcb"], C_POWER, grp="internals", bom=12)
box("BuckBoost_3V3_and_Boost_5V", (0.008, 0.03, 0.02), (ix - 0.008, -0.055, ez - 0.025), M["pcb"], C_POWER, grp="internals", bom=13)
box("Terminal_Blocks_Fuse", (0.015, 0.08, 0.016), (ix - 0.01, -0.005, ez - 0.06), M["term"], C_ENCL, grp="internals", bom=14)
box("Silica_Gel_Pack", (0.01, 0.035, 0.03), (ix - 0.01, 0.07, ez - 0.058), M["silica"], C_ENCL, grp="internals", bom=14)
box("Antenna_Bracket", (0.02, 0.05, 0.012), (ex, sy / 2 + 0.025, ez + 0.05), M["alu"], C_ENCL, grp="antenna", bom=15)
cyl("Antenna_923MHz_3dBi", 0.006, 0.22, (ex, sy / 2 + 0.045, ez + 0.05 + 0.11), M["black"], C_ENCL, grp="antenna", bom=15, verts=12)

# ---------------- solar ----------------
box("Bracket_Solar", (0.22, 0.03, 0.02), (mx + 0.11, 0, 2.38), M["alu"], C_POWER, grp="panel", bom=16)
tilt = math.radians(15)
box("Solar_Panel_6V6W_Frame", (0.22, 0.30, 0.018), (mx + 0.145, 0, 2.415), M["alu"], C_POWER, rot=(0, tilt, 0), grp="panel", bom=16)
cells = plane("Solar_Panel_6V6W_Cells", (0.205, 0.285), (mx + 0.145, 0, 2.415), M["cells"], C_POWER, grp="panel", bom=16)
cells.rotation_euler = (0, tilt, math.pi / 2)
n_ = Vector((0, 0, 1)); n_.rotate(Euler((0, tilt, 0))); cells.location = Vector((mx + 0.145, 0, 2.415)) + n_ * 0.0095

# ---------------- beacon ----------------
cyl("Beacon_Base_rPETG", 0.045, 0.05, (mx, 0, mz1 + 0.025), M["printed"], C_BEACON, grp="beacon", bom=17)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.042, location=(mx, 0, mz1 + 0.05), segments=32, ring_count=16)
dome = bpy.context.active_object; dome.scale = (1, 1, 1.15)
_finish(dome, "Beacon_Dome_RGB", M["beacon"], C_BEACON, grp="beacon", bom=17)

# ---------------- rain gauge (tipping bucket) ----------------
box("Bracket_RainGauge", (0.03, 0.25, 0.02), (mx, -0.155, 2.30), M["alu"], C_RAIN, grp="raingauge", bom=18)
cyl("RainGauge_Body_rPETG", 0.06, 0.15, (mx, -0.31, 2.375), M["printed"], C_RAIN, grp="raingauge", bom=18)
cone("RainGauge_Funnel_D120", 0.028, 0.06, 0.05, (mx, -0.31, 2.475), M["ink"], C_RAIN, fill='NOTHING', grp="funnel", bom=18)
bpy.ops.mesh.primitive_torus_add(major_radius=0.06, minor_radius=0.004, location=(mx, -0.31, 2.50))
_finish(bpy.context.active_object, "RainGauge_Rim", M["ink"], C_RAIN, grp="funnel", bom=18)
cyl("RainGauge_Drain", 0.008, 0.02, (mx, -0.31, 2.29), M["black"], C_RAIN, grp="raingauge", bom=18, verts=12)

# ---------------- optional camera aimed at the staff gauge ----------------
cam_dir = math.atan2(P["channel_half"] - 0.07, P["gauge_x"] - (mx + 0.02))
cbox = box("Camera_ESP32CAM_Housing", (0.06, 0.07, 0.055), (mx + 0.045, 0.06, 2.05), M["cctv"], C_CAMNODE, rot=(0, math.radians(30), cam_dir), grp="camera", bom=19)
fwd = Vector((1, 0, 0)); fwd.rotate(cbox.rotation_euler)
box("Camera_Bracket", (0.03, 0.06, 0.02), (mx + 0.02, 0.035, 2.05), M["alu"], C_CAMNODE, grp="camera", bom=19)
cyl("Camera_Lens", 0.012, 0.012, cbox.location + fwd * 0.035, M["black"], C_CAMNODE, rot=(0, R90 + math.radians(30), cam_dir), grp="camera", bom=19, verts=16)

# ---------------- sign plate ----------------
box("Sign_Plate_Backing", (0.006, 0.22, 0.13), (mx - mr - 0.006, 0, 1.30), M["alu"], C_STRUCT, grp="sign", bom=20)
plane("Sign_Plate_Face", (0.22, 0.13), (mx - mr - 0.0095, 0, 1.30), M["sign"], C_STRUCT, rot=(R90, 0, -R90), grp="sign", bom=20)

# ---------------- staff gauge on the channel wall ----------------
gx = P["gauge_x"]
box("StaffGauge_Board", (0.15, 0.012, 3.0), (gx, ch - 0.006, bed + 1.5), M["alu"], C_GAUGE, grp="gauge", bom=21)
plane("StaffGauge_Face_0-3m", (0.15, 3.0), (gx, ch - 0.0125, bed + 1.5), M["gauge"], C_GAUGE, rot=(R90, 0, 0), grp="gauge", bom=21)

# ---------------- township CCTV on the bank ----------------
cyl("CCTV_Pole", 0.05, 4.5, (-4.5, 5.2, 2.25), M["gi"], C_CCTV, lineart=False)
cc = box("CCTV_Camera", (0.30, 0.12, 0.12), (-4.3, 5.0, 4.35), M["cctv"], C_CCTV, rot=(0, math.radians(25), math.atan2(-5.0, 8.0)), lineart=False)

# ---------------- visual: ultrasonic beam (60 deg) ----------------
d_norm = P["sensor_face_z"] - LV["normal"]
cone("Viz_Ultrasonic_Beam_60deg", d_norm * math.tan(math.radians(30)), 0.0, d_norm, (hx, 0, P["sensor_face_z"] - d_norm / 2), M["sonar"], C_VIZ, fill='NOTHING', lineart=False)

# ---------------- lighting, world, cameras ----------------
world = bpy.data.worlds.new("Sky"); scn.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]
try:
    sky = world.node_tree.nodes.new("ShaderNodeTexSky")
    for t in ("NISHITA", "MULTIPLE_SCATTERING", "SINGLE_SCATTERING", "HOSEK_WILKIE"):
        try:
            sky.sky_type = t; break
        except Exception:
            continue
    try:
        sky.sun_elevation = math.radians(32); sky.sun_rotation = math.radians(-40)
    except Exception:
        pass
    world.node_tree.links.new(sky.outputs[0], bg.inputs[0]); bg.inputs[1].default_value = 0.32
except Exception as e:
    bg.inputs[0].default_value = (0.55, 0.72, 0.95, 1)
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", 'SUN'))
sun.data.energy = 2.3; sun.data.angle = math.radians(1.2)
scn.collection.objects.link(sun)
sun.rotation_euler = Vector((1.0, -0.9, 1.1)).to_track_quat('Z', 'Y').to_euler()

def add_cam(name, loc, target, lens=35):
    c = bpy.data.objects.new(name, bpy.data.cameras.new(name)); C_CAMS.objects.link(c)
    c.location = loc; c.data.lens = lens; c.data.clip_end = 300
    c.rotation_euler = (Vector(loc) - Vector(target)).to_track_quat('Z', 'Y').to_euler()
    return c
cam_wide = add_cam("Cam_Hero_Wide", (7.2, -6.0, 2.3), (2.4, 0.5, 0.9), 28)
add_cam("Cam_Hero_Detail", (-0.9, -3.5, 2.55), (2.4, 0.0, 1.95), 42)
add_cam("Cam_Hero_Water", (5.6, -3.4, 1.9), (2.6, 0.0, 1.75), 45)
add_cam("Cam_Establishing", (-11, -10.5, 5.5), (1.5, 0.5, -0.2), 28)
add_cam("Cam_Gauge_Close", (3.2, 0.6, 0.6), (gx, ch, -1.0), 50)
scn.camera = cam_wide

# ---------------- animation for the video (water rise + beacon) ----------------
keys = [(1, LV["normal"]), (90, LV["normal"] + 0.1), (150, LV["alert"]), (195, LV["warning"]), (240, LV["danger"]), (300, LV["danger"] + 0.05)]
for f, z in keys:
    wl.location.z = z; wl.keyframe_insert("location", index=2, frame=f)
emis = M["beacon"].node_tree.nodes["BeaconEmission"]
for f, col in [(1, "#2EA043"), (190, "#2EA043"), (196, "#F5A524"), (236, "#F5A524"), (241, "#E5383B")]:
    emis.inputs["Color"].default_value = lin(col); emis.inputs["Color"].keyframe_insert("default_value", frame=f)
for f in range(241, 301, 10):
    emis.inputs["Strength"].default_value = 9.0; emis.inputs["Strength"].keyframe_insert("default_value", frame=f)
    emis.inputs["Strength"].default_value = 0.5; emis.inputs["Strength"].keyframe_insert("default_value", frame=f + 5)
scn.frame_set(1)

# ---------------- render defaults ----------------
scn.render.engine = 'CYCLES'; scn.cycles.device = 'CPU'
scn.cycles.samples = 64; scn.cycles.use_denoising = True
scn.render.resolution_x, scn.render.resolution_y = 1920, 1080
scn.view_settings.view_transform = 'AgX' if 'AgX' in [i.identifier for i in scn.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'

# ---------------- save + export ----------------
try:
    scn.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass
bpy.ops.file.pack_all()
blend = os.path.join(OUT, "floodway_rivernode_scene.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend)

def export_glb(path, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True)

node_objs = [o for o in bpy.data.objects if o.type == 'MESH' and any(c.name.startswith("Node_") for c in o.users_collection)]
export_glb(os.path.join(OUT, "floodway_rivernode_device.glb"), node_objs)
export_glb(os.path.join(OUT, "floodway_rivernode_scene.glb"), [o for o in bpy.data.objects if o.type == 'MESH' and o.name != "Viz_Ultrasonic_Beam_60deg"])

# parts list for the sheets
parts = {o.name: dict(bom=o.get("bom", 0), grp=o.get("grp", ""), loc=list(o.location),
                      dims=list(o.dimensions), lineart=bool(o.get("lineart", False)))
         for o in bpy.data.objects if o.type == 'MESH'}
json.dump(dict(params=P, parts=parts), open(os.path.join(OUT, "scene_parts.json"), "w"), indent=1)
print("BUILD OK", len(parts), "mesh objects")
