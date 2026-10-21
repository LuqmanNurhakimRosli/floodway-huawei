import bpy, os
from mathutils import Vector
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'dist')
bpy.ops.wm.open_mainfile(filepath=os.path.join(D,'FloodWay_RiverNode_v1.blend'))
s=bpy.context.scene
w=bpy.data.worlds.new('W'); s.world=w; w.use_nodes=True
w.node_tree.nodes['Background'].inputs[0].default_value=(0.92,0.94,0.97,1); w.node_tree.nodes['Background'].inputs[1].default_value=0.9
sun=bpy.data.objects.new('Key',bpy.data.lights.new('Key','SUN')); s.collection.objects.link(sun)
sun.data.energy=3.2; sun.rotation_euler=Vector((0.6,-1.0,1.3)).to_track_quat('Z','Y').to_euler()
s.render.engine='CYCLES'; s.cycles.samples=40; s.cycles.use_denoising=True
s.render.resolution_x=s.render.resolution_y=1400
try: s.view_settings.view_transform='AgX'; s.view_settings.look='AgX - Medium High Contrast'
except Exception: pass
t=Vector((0.55,-0.05,1.32))
for n,d,dist in (('preview_front',(-1.0,-1.3,0.45),4.9),('preview_back',(1.25,-0.9,0.4),4.9),('preview_top',(-0.75,-0.95,0.55),1.6)):
    c=bpy.data.objects.new(n,bpy.data.cameras.new(n)); s.collection.objects.link(c); c.data.lens=50
    tt = Vector((0.05,-0.05,1.95)) if n=='preview_top' else t
    c.location=tt+Vector(d).normalized()*dist; c.rotation_euler=(c.location-tt).to_track_quat('Z','Y').to_euler()
    s.camera=c; s.render.filepath=os.path.join(D,n+'.png'); bpy.ops.render.render(write_still=True)
print('PREVIEW OK')
