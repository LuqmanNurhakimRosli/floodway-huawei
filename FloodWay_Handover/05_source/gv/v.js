const fs=require('fs'); const v=require('gltf-validator');
const p=process.argv[2]; const d=new Uint8Array(fs.readFileSync(p));
v.validateBytes(d).then(r=>{const i=r.issues; console.log('errors',i.numErrors,'warnings',i.numWarnings,'infos',i.numInfos);
 i.messages.filter(m=>m.severity<=1).slice(0,15).forEach(m=>console.log(m.severity,m.code,m.pointer||'',m.message));
 console.log('extensionsUsed',JSON.stringify(r.info.extensionsUsed||[]),'required',JSON.stringify(r.info.extensionsRequired||[]));
 console.log('meshes/prims/tris', r.info.drawCallCount, r.info.totalTriangleCount, 'materials', r.info.materialCount, 'textures', r.info.textureCount);}).catch(e=>console.log('ERR',e));
