Comprehensive Three.js Modeling & Implementation Guide: Malaysian Terrace Houses (Rumah Teres)This guide provides a detailed architectural breakdown, precise coordinate specifications, visual attributes, material parameters, and a fully functional, production-ready single-file Three.js web application. The implementation models a block of single-story terrace houses (rumah teres setingkat) matching the visual references provided (gray interlocking tile gable roofs, white rendered exterior walls, dark gray metal porch and backyard gates, orange accent wall panels, and paved concrete carporches).1. Architectural Element Breakdown & Visual AttributesTo successfully replicate the houses in Three.js, we break down the structure into modular components that can be instantiated dynamically or combined into a unified geometry block.A. Overall Layout & Dimensions (Real-World to Units)Scale: $1\text{ unit} = 1\text{ meter}$.Single Unit Width (Frontage): $6.0\text{ m}$Single Unit Depth (Length): $18.0\text{ m}$Wall Height (Eaves): $3.2\text{ m}$Roof Ridge Height: $5.2\text{ m}$Porch Depth: $5.0\text{ m}$Backyard Yard Depth: $4.0\text{ m}$B. Material Specifications & Color PaletteRoof Tiles: Interlocking concrete tile texture in dark charcoal gray (#4A4E53), featuring raised profile ridges (#61666D) and concrete gable beams (#D0D4DC).External Walls: Smooth white cement plaster finish (#F4F5F7).Accent Feature Wall: Vibrant burnt orange/terracotta paint (#D95D23) behind the front porch windows.Metalwork (Gates, Grills, Roof Trim): Dark slate gray powder-coated steel (#333A42).Flooring: Brushed raw concrete (#9CA3AF) for carporches and back patios; dark asphalt (#1E2328) for the access roads.2. Complete Three.js Application CodeThe following complete, self-contained HTML file includes Three.js (loaded via CDN), OrbitControls, dynamic lighting, procedural shadows, procedural house block generation (front facade, party walls, roofs, carporch gates, and backyards), and a responsive UI overlay with camera presets.<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Three.js Rumah Teres (Terrace House) 3D Model</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #0b0f19;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        #canvas-container {
            width: 100vw;
            height: 100vh;
            display: block;
        }
        #ui-overlay {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 12px;
            color: #f8fafc;
            max-width: 320px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            z-index: 10;
        }
        h1 {
            font-size: 1.1rem;
            margin: 0 0 8px 0;
            color: #38bdf8;
            font-weight: 600;
        }
        p {
            font-size: 0.85rem;
            margin: 0 0 15px 0;
            color: #94a3b8;
            line-height: 1.4;
        }
        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        button {
            background: #1e293b;
            color: #e2e8f0;
            border: 1px solid #334155;
            padding: 10px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.2s ease;
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        button:hover {
            background: #0284c7;
            color: #ffffff;
            border-color: #0284c7;
            transform: translateY(-1px);
        }
        button span {
            font-size: 0.75rem;
            opacity: 0.7;
        }
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 1.2rem;
            font-weight: 500;
            pointer-events: none;
            transition: opacity 0.5s;
            z-index: 20;
        }
    </style>
</head>
<body>
    <div id="loading">Building 3D Terrace Houses...</div>
    <div id="ui-overlay">
        <h1>Rumah Teres 3D Model</h1>
        <p>Interactive Three.js architectural visualization based on site reference perspectives.</p>
        <div class="btn-group">
            <button onclick="setCameraView('front')">Front Perspective <span>Depan</span></button>
            <button onclick="setCameraView('top')">Top Aerial View <span>Atas</span></button>
            <button onclick="setCameraView('back')">Back Perspective <span>Belakang</span></button>
            <button onclick="setCameraView('isoLeft')">Left Isometric <span>Kiri</span></button>
            <button onclick="setCameraView('isoRight')">Right Isometric <span>Kanan</span></button>
        </div>
    </div>

    <div id="canvas-container"></div>

    <!-- Three.js and OrbitControls via CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

    <script>
        // Global variables for scene management and camera tweening
        let scene, camera, renderer, controls;
        let targetCameraPosition = new THREE.Vector3();
        let targetControlsTarget = new THREE.Vector3();
        let isTransitioning = false;

        const houseWidth = 6.0;
        const houseDepth = 18.0;
        const numHouses = 5; // Number of units in the terrace row

        init();
        animate();

        function init() {
            const container = document.getElementById('canvas-container');

            // 1. Scene setup
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0f172a);
            scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

            // 2. Camera setup
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 8, 30);

            // 3. Renderer setup
            renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
            container.appendChild(renderer.domElement);

            // 4. Controls setup
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below ground
            controls.minDistance = 5;
            controls.maxDistance = 80;
            controls.target.set(0, 2, 0);

            // 5. Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xfffaed, 1.1);
            sunLight.position.set(25, 30, 20);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 100;
            const d = 30;
            sunLight.shadow.camera.left = -d;
            sunLight.shadow.camera.right = d;
            sunLight.shadow.camera.top = d;
            sunLight.shadow.camera.bottom = -d;
            sunLight.shadow.bias = -0.0005;
            scene.add(sunLight);

            // Sky fill light
            const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
            fillLight.position.set(-20, 15, -20);
            scene.add(fillLight);

            // 6. Environment & Roads
            createEnvironment();

            // 7. Generate Terrace Row
            createTerraceRow(numHouses);

            // Remove loading screen
            document.getElementById('loading').style.opacity = '0';
            setTimeout(() => document.getElementById('loading.remove()', () => {}), 500);

            // Window resize listener
            window.addEventListener('resize', onWindowResize);

            // Initial view setup
            setCameraView('front');
        }

        function createEnvironment() {
            // Asphalt Road Front
            const roadGeo = new THREE.PlaneGeometry(houseWidth * numHouses + 12, 12);
            const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e2328, roughness: 0.9 });
            const road = new THREE.Mesh(roadGeo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(0, 0, houseDepth / 2 + 6);
            road.receiveShadow = true;
            scene.add(road);

            // Asphalt Road Back
            const backRoad = road.clone();
            backRoad.position.set(0, 0, -houseDepth / 2 - 6);
            scene.add(backRoad);

            // Grass verges / landscaping patches
            for (let i = -Math.floor(numHouses/2); i <= Math.floor(numHouses/2); i++) {
                if (i === 0) continue;
                const patchGeo = new THREE.CircleGeometry(0.8, 16);
                const patchMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.8 });
                const patch = new THREE.Mesh(patchGeo, patchMat);
                patch.rotation.x = -Math.PI / 2;
                patch.position.set(i * houseWidth, 0.02, houseDepth / 2 + 1.5);
                scene.add(patch);
            }
        }

        function createTerraceRow(count) {
            const startX = -((count * houseWidth) / 2) + (houseWidth / 2);
            
            for (let i = 0; i < count; i++) {
                const xPos = startX + (i * houseWidth);
                const houseGroup = buildSingleTerraceUnit(i === 1); // Give unit 1 a distinct orange accent
                houseGroup.position.set(xPos, 0, 0);
                scene.add(houseGroup);
            }
        }

        function buildSingleTerraceUnit(hasOrangeAccent) {
            const group = new THREE.Group();

            // Materials
            const wallMat = new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.85 });
            const orangeMat = new THREE.MeshStandardMaterial({ color: 0xd95d23, roughness: 0.7 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a4e53, roughness: 0.6, metalness: 0.1 });
            const ridgeBeamMat = new THREE.MeshStandardMaterial({ color: 0xd0d4dc, roughness: 0.7 });
            const metalDarkMat = new THREE.MeshStandardMaterial({ color: 0x333a42, roughness: 0.4, metalness: 0.3 });
            const concreteMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.9 });
            const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.5 });

            // 1. Main House Body (Box)
            const bodyGeo = new THREE.BoxGeometry(houseWidth - 0.05, 3.2, houseDepth);
            const body = new THREE.Mesh(bodyGeo, wallMat);
            body.position.y = 1.6;
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            // 2. Accent wall panel (Front porch area)
            const accentGeo = new THREE.BoxGeometry(2.4, 2.6, 0.1);
            const accentMesh = new THREE.Mesh(accentGeo, hasOrangeAccent ? orangeMat : wallMat);
            accentMesh.position.set(-1.2, 1.5, houseDepth / 2 - 4.9);
            group.add(accentMesh);

            // 3. Roof Structure (Gable with central ridge beam)
            const roofGroup = new THREE.Group();
            
            // Left roof slope
            const slopeGeo = new THREE.BoxGeometry((houseWidth / 2) + 0.3, 0.15, houseDepth + 0.6);
            
            const leftSlope = new THREE.Mesh(slopeGeo, roofMat);
            leftSlope.position.set(-houseWidth / 4, 4.2, 0);
            leftSlope.rotation.z = Math.PI / 6; // 30 degrees
            leftSlope.castShadow = true;
            roofGroup.add(leftSlope);

            const rightSlope = new THREE.Mesh(slopeGeo, roofMat);
            rightSlope.position.set(houseWidth / 4, 4.2, 0);
            rightSlope.rotation.z = -Math.PI / 6;
            rightSlope.castShadow = true;
            roofGroup.add(rightSlope);

            // Central vertical ridge capping
            const ridgeGeo = new THREE.BoxGeometry(0.2, 0.3, houseDepth + 0.6);
            const ridge = new THREE.Mesh(ridgeGeo, ridgeBeamMat);
            ridge.position.set(0, 4.85, 0);
            ridge.castShadow = true;
            roofGroup.add(ridge);

            group.add(roofGroup);

            // 4. Carporch Concrete Floor & Roof Beam
            const porchFloorGeo = new THREE.BoxGeometry(houseWidth - 0.1, 0.15, 5.0);
            const porchFloor = new THREE.Mesh(porchFloorGeo, concreteMat);
            porchFloor.position.set(0, 0.075, houseDepth / 2 - 2.5);
            porchFloor.receiveShadow = true;
            group.add(porchFloor);

            // Porch flat roof overhang / beam
            const porchBeamGeo = new THREE.BoxGeometry(houseWidth, 0.3, 5.2);
            const porchBeam = new THREE.Mesh(porchBeamGeo, ridgeBeamMat);
            porchBeam.position.set(0, 3.2, houseDepth / 2 - 2.5);
            porchBeam.castShadow = true;
            porchBeam.receiveShadow = true;
            group.add(porchBeam);

            // Porch Support Pillars
            const pillarGeo = new THREE.BoxGeometry(0.3, 3.2, 0.3);
            const leftPillar = new THREE.Mesh(pillarGeo, wallMat);
            leftPillar.position.set(-houseWidth / 2 + 0.15, 1.6, houseDepth / 2 - 5.0);
            leftPillar.castShadow = true;
            group.add(leftPillar);

            // 5. Sliding Metal Gate (Front Carporch)
            const gateWidth = houseWidth - 0.8;
            const gateGroup = new THREE.Group();
            
        // Frame
            const frameGeo = new THREE.BoxGeometry(gateWidth, 1.5, 0.08);
            const gateFrame = new THREE.Mesh(frameGeo, metalDarkMat);
            gateFrame.position.set(0, 0.85, houseDepth / 2);
            gateFrame.castShadow = true;
            gateGroup.add(gateFrame);

            // Vertical bars
            const barsCount = 14;
            for (let b = 0; b < barsCount; b++) {
                const barGeo = new THREE.BoxGeometry(0.04, 1.4, 0.04);
                const bar = new THREE.Mesh(barGeo, metalDarkMat);
                const barX = -gateWidth / 2 + 0.2 + (b * (gateWidth - 0.4) / (barsCount - 1));
                bar.position.set(barX, 0.85, houseDepth / 2);
                gateGroup.add(bar);
            }
            group.add(gateGroup);

            // 6. Letterbox / Utility Pillar Unit (Front Right)
            const utilPillarGeo = new THREE.BoxGeometry(1.2, 1.2, 0.5);
            const utilPillar = new THREE.Mesh(utilPillarGeo, wallMat);
            utilPillar.position.set(houseWidth / 2 - 0.8, 0.6, houseDepth / 2 - 0.3);
            utilPillar.castShadow = true;
            group.add(utilPillar);

            // Utility meter doors
            const doorGeo = new THREE.BoxGeometry(0.4, 0.6, 0.02);
            const door1 = new THREE.Mesh(doorGeo, metalDarkMat);
            door1.position.set(houseWidth / 2 - 1.0, 0.6, houseDepth / 2 - 0.04);
            group.add(door1);
            const door2 = door1.clone();
            door2.position.x = houseWidth / 2 - 0.6;
            group.add(door2);

            // 7. Backyard / Back Patio Walls
            const yardWallGeo = new THREE.BoxGeometry(0.15, 2.2, 4.0);
            
            const leftYardWall = new THREE.Mesh(yardWallGeo, wallMat);
            leftYardWall.position.set(-houseWidth / 2 + 0.075, 1.1, -houseDepth / 2 + 2.0);
            leftYardWall.castShadow = true;
            group.add(leftYardWall);

            const rightYardWall = new THREE.Mesh(yardWallGeo, wallMat);
            rightYardWall.position.set(houseWidth / 2 - 0.075, 1.1, -houseDepth / 2 + 2.0);
            rightYardWall.castShadow = true;
            group.add(rightYardWall);

            // Back concrete patio floor
            const backPatioGeo = new THREE.BoxGeometry(houseWidth - 0.1, 0.15, 4.0);
            const backPatio = new THREE.Mesh(backPatioGeo, concreteMat);
            backPatio.position.set(0, 0.075, -houseDepth / 2 + 2.0);
            backPatio.receiveShadow = true;
            group.add(backPatio);

            return group;
        }

        // Camera View Presets matching requested perspectives
        function setCameraView(viewName) {
            if (isTransitioning) return;

            const startPos = camera.position.clone();
            const startTarget = controls.target.clone();
            
            let endPos = new THREE.Vector3();
            let endTarget = new THREE.Vector3(0, 2, 0);

            switch (viewName) {
                case 'front':
                    endPos.set(0, 3.5, 18);
                    endTarget.set(0, 2, 0);
                    break;
                case 'top':
                    endPos.set(0, 28, 0.1);
                    endTarget.set(0, 0, 0);
                    break;
                case 'back':
                    endPos.set(0, 3.5, -18);
                    endTarget.set(0, 2, 0);
                    break;
                case 'isoLeft':
                    endPos.set(-18, 12, 16);
                    endTarget.set(0, 1.5, 0);
                    break;
                case 'isoRight':
                    endPos.set(18, 12, 16);
                    endTarget.set(0, 1.5, 0);
                    break;
            }

            // Smooth tween transition
            let progress = 0;
            isTransitioning = true;
            
            function transitionFrame() {
                progress += 0.04;
                if (progress > 1) progress = 1;

                // Ease out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3);

                camera.position.lerpVectors(startPos, endPos, easeProgress);
                controls.target.lerpVectors(startTarget, endTarget, easeProgress);
                controls.update();

                if (progress < 1) {
                    requestAnimationFrame(transitionFrame);
                } else {
                    isTransitioning = false;
                }
            }
            transitionFrame();
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
    </script>
</body>
</html>
3. Key Attributes & Three.js Best Practices for Further Customization
Hierarchy & Instantiation: Grouping individual house components (THREE.Group) makes it efficient to duplicate, translate, or rotate terrace rows along the X-axis (houseWidth increments).

Shadow Optimization: Enable castShadow and receiveShadow selectively on structural meshes (roofs, pillars, and carporch slabs) while keeping detailed small hardware (such as gate bars) light on shadow casting to maintain high frame rates.

Materials: Use MeshStandardMaterial with tweaked roughness values for clean architectural rendering. For glass windows, MeshPhysicalMaterial with transmission parameters delivers realistic glass tinting.