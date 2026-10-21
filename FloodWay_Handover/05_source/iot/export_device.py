"""Export the FloodWay RiverNode device only, with plain materials that Paint 3D's glTF loader handles.
Outputs (in dist/): FloodWay_RiverNode_v1.glb, FloodWay_RiverNode_v1_obj.zip, FloodWay_RiverNode_v1.blend, preview PNGs."""
import bpy, os, math, zipfile, shutil
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, "dist"); os.makedirs(DIST, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "out", "floodway_rivernode_scene.blend"))
scn = bpy.context.scene
scn.frame_set(1)

keep = {o for o in bpy.data.objects if o.type == 'MESH' and any(c.name.startswith("Node_") for c in o.users_collection)}
for o in list(bpy.data.objects):
    if o not in keep:
        bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    if not c.name.startswith("Node_") and c.name != "RiverNode":
        bpy.data.collections.remove(c)

# put the mast foot at the origin
MAST_X, MAST_Z0 = 2.035, 0.10
for o in keep:
    o.location -= Vector((MAST_X, 0, MAST_Z0))

def first_principled(m):
    if not m or not m.node_tree: return None
    return next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)

def simple(name, rgba, rough=0.5, metal=0.0, image=None, emit=None):
    m = bpy.data.materials.new(name + "_P3D"); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if image:
        t = m.node_tree.nodes.new("ShaderNodeTexImage"); t.image = image
        m.node_tree.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if emit:
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = 1.0
    return m

cache = {}
for o in keep:
    for i, slot in enumerate(o.material_slots):
        m = slot.material
        if m is None: continue
        if m.name not in cache:
            if m.name == "Beacon_Light":
                cache[m.name] = simple("Beacon_Light", (0.03, 0.40, 0.06, 1), 0.2, 0, emit=(0.03, 0.40, 0.06, 1))
            else:
                b = first_principled(m)
                img = next((n.image for n in m.node_tree.nodes if n.type == 'TEX_IMAGE'), None) if m.node_tree else None
                if b is not None:
                    col = tuple(b.inputs["Base Color"].default_value)
                    ramp = next((n for n in m.node_tree.nodes if n.type == 'VALTORGB'), None)
                    if ramp: col = tuple(ramp.color_ramp.evaluate(0.5))
                    cache[m.name] = simple(m.name, col, b.inputs["Roughness"].default_value, b.inputs["Metallic"].default_value, img)
                else:
                    cache[m.name] = simple(m.name, (0.7, 0.7, 0.7, 1))
        slot.material = cache[m.name]

bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIST, "FloodWay_RiverNode_v1.blend"))

bpy.ops.object.select_all(action='DESELECT')
for o in keep: o.select_set(True)
bpy.context.view_layer.objects.active = next(iter(keep))
glb = os.path.join(DIST, "FloodWay_RiverNode_v1.glb")
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                          export_extras=False, export_cameras=False, export_lights=False, export_animations=False)

objdir = os.path.join(DIST, "obj"); shutil.rmtree(objdir, ignore_errors=True); os.makedirs(objdir)
bpy.ops.wm.obj_export(filepath=os.path.join(objdir, "FloodWay_RiverNode_v1.obj"), export_selected_objects=True,
                      export_materials=True, path_mode='COPY', apply_modifiers=True, forward_axis='NEGATIVE_Z', up_axis='Y')
with zipfile.ZipFile(os.path.join(DIST, "FloodWay_RiverNode_v1_obj.zip"), "w", zipfile.ZIP_DEFLATED) as z:
    for f in os.listdir(objdir): z.write(os.path.join(objdir, f), f)

# preview renders on a plain background
world = bpy.data.worlds.new("Studio"); scn.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.93, 0.95, 0.97, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.9
sun = bpy.data.objects.new("Key", bpy.data.lights.new("Key", 'SUN')); scn.collection.objects.link(sun)
sun.data.energy = 3.0; sun.rotation_euler = Vector((0.8, -1.0, 1.4)).to_track_quat('Z', 'Y').to_euler()
scn.render.engine = 'CYCLES'; scn.cycles.samples = 40; scn.cycles.use_denoising = True
scn.render.resolution_x, scn.render.resolution_y = 1600, 1600
scn.render.film_transparent = False
try:
    scn.view_settings.view_transform = 'AgX'; scn.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass
target = Vector((0.45, -0.05, 1.45))
for name, d in (("preview_front", (-1.0, -1.25, 0.55)), ("preview_back", (1.2, 1.0, 0.45))):
    cam = bpy.data.objects.new(name, bpy.data.cameras.new(name)); scn.collection.objects.link(cam)
    cam.data.lens = 50
    cam.location = target + Vector(d).normalized() * 5.6
    cam.rotation_euler = (cam.location - target).to_track_quat('Z', 'Y').to_euler()
    scn.camera = cam
    scn.render.filepath = os.path.join(DIST, name + ".png")
    bpy.ops.render.render(write_still=True)
print("EXPORT OK", len(keep), "parts")
