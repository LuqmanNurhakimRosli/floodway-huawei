"""Photoreal hero renders. Usage: python3 render_hero.py CAMERA WIDTH HEIGHT SAMPLES OUTFILE [FRAME] [beam]"""
import bpy, sys, os, time
HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
cam, w, h, spp, out = args[0], int(args[1]), int(args[2]), int(args[3]), args[4]
frame = int(args[5]) if len(args) > 5 else 1
beam = len(args) > 6 and args[6] == "beam"
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "out", "floodway_rivernode_scene.blend"))
s = bpy.context.scene
s.camera = bpy.data.objects[cam]
s.frame_set(frame)
s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = w, h, 100
s.cycles.samples = spp; s.cycles.use_denoising = True
s.cycles.max_bounces = 6; s.cycles.transparent_max_bounces = 8
s.render.use_freestyle = False
bpy.data.objects["Viz_Ultrasonic_Beam_60deg"].hide_render = not beam
s.render.filepath = out
t = time.time(); bpy.ops.render.render(write_still=True)
print("HERO OK", out, round(time.time() - t, 1), "s")
