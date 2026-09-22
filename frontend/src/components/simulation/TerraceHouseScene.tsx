import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  waterDepthCm: number;
  cameraView: 'overview' | 'ground' | 'top';
}

export function TerraceHouseScene({ waterDepthCm, cameraView }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const rainGeoRef = useRef<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1626);
    scene.fog = new THREE.FogExp2(0x0a1626, 0.025);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(10, 8, 12);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambient = new THREE.AmbientLight(0xddeeff, 0.9);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfffaed, 1.6);
    sun.position.set(8, 14, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    scene.add(sun);

    // 5. Malaysian Terrace House Geometry
    // Compound Ground / Asphalt Street
    const groundGeo = new THREE.PlaneGeometry(24, 24);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x272d36, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // House Raised Plinth (Foundation: 0.45m step-up)
    const plinthGeo = new THREE.BoxGeometry(7, 0.5, 9);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0xd6d3cb, roughness: 0.8 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, 0.25, -1);
    plinth.receiveShadow = true;
    scene.add(plinth);

    // Main House Walls (Cream/White Plaster)
    const wallsGeo = new THREE.BoxGeometry(6.4, 2.8, 5.5);
    const wallsMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.7 });
    const walls = new THREE.Mesh(wallsGeo, wallsMat);
    walls.position.set(0, 1.9, -2.5);
    walls.castShadow = true;
    walls.receiveShadow = true;
    scene.add(walls);

    // Roof (Terracotta Clay Gabled Roof)
    const roofGeo = new THREE.ConeGeometry(5.2, 1.8, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 3.8, -2.5);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.1, 1, 1.4);
    roof.castShadow = true;
    scene.add(roof);

    // Car Porch Roof (Flat slab with fascia)
    const porchRoofGeo = new THREE.BoxGeometry(5.8, 0.25, 3.2);
    const porchRoofMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const porchRoof = new THREE.Mesh(porchRoofGeo, porchRoofMat);
    porchRoof.position.set(0, 2.6, 1.4);
    porchRoof.castShadow = true;
    scene.add(porchRoof);

    // Car Porch Twin Square Columns
    const colGeo = new THREE.BoxGeometry(0.35, 2.4, 0.35);
    const colMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const col1 = new THREE.Mesh(colGeo, colMat);
    col1.position.set(-2.4, 1.3, 2.6);
    col1.castShadow = true;
    scene.add(col1);

    const col2 = new THREE.Mesh(colGeo, colMat);
    col2.position.set(2.4, 1.3, 2.6);
    col2.castShadow = true;
    scene.add(col2);

    // Entrance Glazed Door
    const doorGeo = new THREE.BoxGeometry(1.2, 2.1, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(-1.2, 1.55, 0.26);
    scene.add(door);

    // Aluminum Framed Windows
    const winGeo = new THREE.BoxGeometry(1.8, 1.3, 0.08);
    const winMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.1, metalness: 0.8 });
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(1.4, 1.8, 0.26);
    scene.add(win);

    // Perimeter Fence & Gate
    const fenceGeo = new THREE.BoxGeometry(7.2, 0.9, 0.15);
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
    const fence = new THREE.Mesh(fenceGeo, fenceMat);
    fence.position.set(0, 0.45, 3.4);
    scene.add(fence);

    // 6. Dynamic Flood Water Plane
    const waterGeo = new THREE.PlaneGeometry(22, 22, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.72,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.05; // Base height
    scene.add(water);
    waterMeshRef.current = water;

    // 7. Flood Measuring Staff / Gauge
    const gaugeGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 16);
    const gaugeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
    gauge.position.set(-2.8, 1.1, 2.8);
    scene.add(gauge);

    // 8. Rain Particles
    const rainCount = 1200;
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPos[i] = (Math.random() - 0.5) * 20;
      rainPos[i + 1] = Math.random() * 12;
      rainPos[i + 2] = (Math.random() - 0.5) * 20;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    rainGeoRef.current = rainGeo;

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.06,
      transparent: true,
      opacity: 0.6
    });
    const rain = new THREE.Points(rainGeo, rainMat);
    scene.add(rain);

    // Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Ripple water
      if (waterMeshRef.current) {
        waterMeshRef.current.position.y += Math.sin(elapsed * 2.5) * 0.0008;
      }

      // Rain fall
      if (rainGeoRef.current) {
        const positions = rainGeoRef.current.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 0.25;
          if (positions[i] < 0) positions[i] = 12;
        }
        rainGeoRef.current.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Water Level Plane Elevation
  useEffect(() => {
    if (!waterMeshRef.current) return;
    // Scale 100 cm depth -> 1.0 ThreeJS units
    const targetY = Math.max(0.05, (waterDepthCm / 100.0) * 0.85);
    waterMeshRef.current.position.y = targetY;
  }, [waterDepthCm]);

  // Update Camera View Angle
  useEffect(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (cameraView === 'overview') {
      cam.position.set(10, 8, 12);
      cam.lookAt(0, 1.2, 0);
    } else if (cameraView === 'ground') {
      cam.position.set(0.5, 1.2, 6.5);
      cam.lookAt(0, 1.5, -1);
    } else if (cameraView === 'top') {
      cam.position.set(0, 16, -1);
      cam.lookAt(0, 0, -1);
    }
  }, [cameraView]);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />;
}
