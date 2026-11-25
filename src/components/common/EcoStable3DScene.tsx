import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Eye, Layers, RotateCcw, Sun } from 'lucide-react';

type CameraPresetKey = 'overview' | 'horse' | 'solar' | 'iot';
type CoatPresetKey = 'altyn_dor' | 'ak_gyr' | 'gara' | 'dor';

interface CameraPreset {
  key: CameraPresetKey;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

interface CoatPreset {
  key: CoatPresetKey;
  label: string;
  swatch: string;
  color: number;
  roughness: number;
  metalness: number;
  clearcoat: number;
  maneColor: number;
}

const CAMERA_PRESETS: CameraPreset[] = [
  { key: 'overview', label: 'Umumy Görüş', position: [10.5, 6.2, 11.2], target: [0, 1.8, 0] },
  { key: 'horse', label: 'Ahalteke Bedewi', position: [4.2, 2.3, 4.8], target: [1.6, 1.35, 1.6] },
  { key: 'solar', label: 'Gün Panelleri', position: [-6.4, 7.6, 7.2], target: [-0.8, 4.1, -1.2] },
  { key: 'iot', label: 'IoT we Suw', position: [-6.8, 2.9, 5.4], target: [-4.1, 1.6, 0.8] },
];

const COAT_PRESETS: CoatPreset[] = [
  {
    key: 'altyn_dor',
    label: 'Altyn dor',
    swatch: '#C99646',
    color: 0xc99646,
    roughness: 0.28,
    metalness: 0.28,
    clearcoat: 0.65,
    maneColor: 0x1e1610,
  },
  {
    key: 'ak_gyr',
    label: 'Ak gyr',
    swatch: '#E8E6DF',
    color: 0xe8e6df,
    roughness: 0.3,
    metalness: 0.16,
    clearcoat: 0.55,
    maneColor: 0xd4d0c5,
  },
  {
    key: 'gara',
    label: 'Gara',
    swatch: '#232830',
    color: 0x20252d,
    roughness: 0.24,
    metalness: 0.3,
    clearcoat: 0.8,
    maneColor: 0x111317,
  },
  {
    key: 'dor',
    label: 'Goýy dor',
    swatch: '#7A3A1E',
    color: 0x7a3a1e,
    roughness: 0.3,
    metalness: 0.22,
    clearcoat: 0.6,
    maneColor: 0x1a110d,
  },
];

// Pre-allocated scratch vectors for zero-GC render loop
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _treeColor = new THREE.Color();

function createStonePlinthTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#E6E2D8';
  ctx.fillRect(0, 0, 512, 512);

  // Travertine stone tile grid with subtle organic variation
  const tile = 64;
  for (let y = 0; y < 512; y += tile) {
    for (let x = 0; x < 512; x += tile) {
      const shade = 224 + ((x * 7 + y * 13) % 14) - 7;
      ctx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 12})`;
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
    }
  }
  ctx.strokeStyle = 'rgba(6, 78, 59, 0.12)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += tile) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createSolarCellTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0B2336';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(148, 210, 235, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }
  for (let j = 0; j <= 256; j += 64) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(256, j);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.22)';
  ctx.lineWidth = 1;
  for (let i = 16; i < 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(6, 42, 31, 0.42)');
  grad.addColorStop(0.55, 'rgba(6, 42, 31, 0.16)');
  grad.addColorStop(1, 'rgba(6, 42, 31, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 12+ bölekli prosedural Ahalteke bedewi (THREE.Group, aýaklary y = 0 tekizliginde)
 */
function buildAkhalTekeHorse(
  coatMat: THREE.MeshPhysicalMaterial,
  maneMat: THREE.MeshStandardMaterial,
  hoofMat: THREE.MeshStandardMaterial,
  goldMat: THREE.MeshPhysicalMaterial,
  emeraldAccentMat: THREE.MeshStandardMaterial
): { horseRoot: THREE.Group; headNeckGroup: THREE.Group } {
  const horseRoot = new THREE.Group();

  // 1. Primary sculpted barrel torso
  const torsoGeo = new THREE.CapsuleGeometry(0.37, 1.05, 12, 24);
  torsoGeo.rotateZ(Math.PI / 2);
  const torso = new THREE.Mesh(torsoGeo, coatMat);
  torso.position.set(0, 1.32, 0);
  torso.scale.set(1.05, 0.96, 0.84);
  torso.castShadow = true;
  torso.receiveShadow = true;
  horseRoot.add(torso);

  // 2. Chest / Shoulder mass
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), coatMat);
  chest.position.set(0.52, 1.35, 0);
  chest.scale.set(1.02, 1.08, 0.84);
  chest.castShadow = true;
  horseRoot.add(chest);

  // 3. Athletic Hindquarters / Croup
  const croup = new THREE.Mesh(new THREE.SphereGeometry(0.39, 20, 16), coatMat);
  croup.position.set(-0.58, 1.36, 0);
  croup.scale.set(1.12, 1.02, 0.86);
  croup.castShadow = true;
  horseRoot.add(croup);

  // 4. Articulated Neck & Head Group (for subtle breathing / regal poise)
  const headNeckGroup = new THREE.Group();
  headNeckGroup.position.set(0.62, 1.48, 0);
  horseRoot.add(headNeckGroup);

  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, -0.05, 0),
    new THREE.Vector3(0.24, 0.36, 0),
    new THREE.Vector3(0.42, 0.78, 0),
    new THREE.Vector3(0.54, 0.92, 0),
  ]);
  const neckGeo = new THREE.TubeGeometry(neckCurve, 20, 0.165, 14, false);
  const neck = new THREE.Mesh(neckGeo, coatMat);
  neck.scale.set(1, 1, 0.78);
  neck.castShadow = true;
  headNeckGroup.add(neck);

  // Traditional Turkmen brushed-gold decorative collar (Alaja / Boýunlyk)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.032, 10, 24), goldMat);
  collar.position.set(0.16, 0.24, 0);
  collar.rotation.set(0, Math.PI / 2, -0.58);
  collar.castShadow = true;
  headNeckGroup.add(collar);

  const emeraldMedallion = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), emeraldAccentMat);
  emeraldMedallion.position.set(0.34, 0.12, 0);
  emeraldMedallion.scale.set(0.6, 1.1, 0.6);
  headNeckGroup.add(emeraldMedallion);

  // Sculpted refined Akhal-Teke head + tapered muzzle
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 14), coatMat);
  cranium.position.set(0.56, 0.93, 0);
  cranium.scale.set(1.15, 0.95, 0.82);
  cranium.castShadow = true;
  headNeckGroup.add(cranium);

  const muzzleGeo = new THREE.CylinderGeometry(0.068, 0.125, 0.42, 14);
  muzzleGeo.rotateZ(-Math.PI / 2 - 0.52);
  const muzzle = new THREE.Mesh(muzzleGeo, coatMat);
  muzzle.position.set(0.76, 0.82, 0);
  muzzle.scale.set(1, 1, 0.82);
  muzzle.castShadow = true;
  headNeckGroup.add(muzzle);

  // Alert ears
  const earGeo = new THREE.ConeGeometry(0.038, 0.16, 8);
  [-0.065, 0.065].forEach((zOff) => {
    const ear = new THREE.Mesh(earGeo, coatMat);
    ear.position.set(0.52, 1.1, zOff);
    ear.rotation.z = -0.15;
    ear.rotation.x = zOff > 0 ? 0.15 : -0.15;
    headNeckGroup.add(ear);
  });

  // Flowing sculpted mane crest
  const maneCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 0.12, 0),
    new THREE.Vector3(0.14, 0.5, 0),
    new THREE.Vector3(0.35, 0.88, 0),
    new THREE.Vector3(0.49, 1.04, 0),
  ]);
  const mane = new THREE.Mesh(new THREE.TubeGeometry(maneCurve, 16, 0.045, 8, false), maneMat);
  mane.scale.set(1, 1, 0.55);
  headNeckGroup.add(mane);

  // 5. Four articulated slender legs grounded precisely at y = 0
  const legSpecs = [
    { x: 0.56, z: 0.18, kneeOffset: 0.03 }, // Front Right
    { x: 0.52, z: -0.18, kneeOffset: -0.02 }, // Front Left
    { x: -0.62, z: 0.19, kneeOffset: -0.06 }, // Rear Right
    { x: -0.66, z: -0.19, kneeOffset: -0.05 }, // Rear Left
  ];

  const upperLegGeo = new THREE.CylinderGeometry(0.082, 0.056, 0.62, 12);
  const lowerLegGeo = new THREE.CylinderGeometry(0.05, 0.042, 0.56, 12);
  const hoofGeo = new THREE.CylinderGeometry(0.048, 0.064, 0.1, 12);

  legSpecs.forEach((spec) => {
    const upper = new THREE.Mesh(upperLegGeo, coatMat);
    upper.position.set(spec.x, 0.92, spec.z);
    upper.castShadow = true;
    horseRoot.add(upper);

    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.056, 10, 10), coatMat);
    knee.position.set(spec.x + spec.kneeOffset, 0.61, spec.z);
    horseRoot.add(knee);

    const lower = new THREE.Mesh(lowerLegGeo, coatMat);
    lower.position.set(spec.x + spec.kneeOffset, 0.34, spec.z);
    lower.castShadow = true;
    horseRoot.add(lower);

    const hoof = new THREE.Mesh(hoofGeo, hoofMat);
    hoof.position.set(spec.x + spec.kneeOffset + 0.015, 0.05, spec.z);
    hoof.castShadow = true;
    horseRoot.add(hoof);
  });

  // 6. Graceful arched Akhal-Teke tail
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.92, 1.38, 0),
    new THREE.Vector3(-1.14, 1.18, 0),
    new THREE.Vector3(-1.2, 0.78, 0),
    new THREE.Vector3(-1.15, 0.44, 0),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 16, 0.055, 8, false), maneMat);
  tail.castShadow = true;
  horseRoot.add(tail);

  return { horseRoot, headNeckGroup };
}

export const EcoStable3DScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPresetKey>('overview');
  const [activeCoat, setActiveCoat] = useState<CoatPresetKey>('altyn_dor');
  const [ecoLayerOpen, setEcoLayerOpen] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);

  // Refs for React -> Three.js imperative updates without tearing down WebGL
  const coatMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const maneMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const targetPresetRef = useRef<CameraPreset | null>(null);
  const ecoLayerRef = useRef<boolean>(false);
  const requestRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    ecoLayerRef.current = ecoLayerOpen;
    requestRenderRef.current?.();
  }, [ecoLayerOpen]);

  useEffect(() => {
    const preset = COAT_PRESETS.find((c) => c.key === activeCoat);
    if (!preset || !coatMatRef.current || !maneMatRef.current) return;
    coatMatRef.current.color.setHex(preset.color);
    coatMatRef.current.roughness = preset.roughness;
    coatMatRef.current.metalness = preset.metalness;
    coatMatRef.current.clearcoat = preset.clearcoat;
    maneMatRef.current.color.setHex(preset.maneColor);
    requestRenderRef.current?.();
  }, [activeCoat]);

  const handleSelectPreset = (key: CameraPresetKey) => {
    setActivePreset(key);
    const found = CAMERA_PRESETS.find((p) => p.key === key);
    if (found) {
      targetPresetRef.current = found;
      requestRenderRef.current?.();
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL (SwiftShader / llvmpipe / WARP) cleanly
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xedf4f1);
    scene.fog = new THREE.Fog(0xedf4f1, 18, 52);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(10.5, 6.2, 11.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Mandatory studio environment reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();

    // Warm key + cool HemisphereLight fill + subtle gold rim
    const hemiLight = new THREE.HemisphereLight(0xd9f2ec, 0x8e7d67, 0.72);
    hemiLight.position.set(0, 24, 0);
    scene.add(hemiLight);

    const sunKey = new THREE.DirectionalLight(0xfff1d4, 1.85);
    sunKey.position.set(11, 15, 9);
    sunKey.castShadow = !isSoftwareGl;
    sunKey.shadow.mapSize.set(1024, 1024);
    sunKey.shadow.camera.near = 2;
    sunKey.shadow.camera.far = 40;
    sunKey.shadow.camera.left = -12;
    sunKey.shadow.camera.right = 12;
    sunKey.shadow.camera.top = 12;
    sunKey.shadow.camera.bottom = -12;
    sunKey.shadow.bias = -0.0005;
    sunKey.shadow.normalBias = 0.02;
    scene.add(sunKey);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 0.55);
    rimLight.position.set(-9, 7, -10);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Shared PBR Materials with deliberate roughness/metalness contrast
    const stoneTex = createStonePlinthTexture(maxAniso);
    const solarTex = createSolarCellTexture(maxAniso);
    const contactTex = createContactShadowTexture();

    const terrainMat = new THREE.MeshStandardMaterial({ color: 0xcfe0d6, roughness: 0.94, metalness: 0.0 });
    const plinthMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.78, metalness: 0.04 });
    const emeraldSteelMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.36, metalness: 0.45 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x8a5e3b, roughness: 0.72, metalness: 0.05 });
    const plasterMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.86, metalness: 0.0 });
    const brushedGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      roughness: 0.18,
      metalness: 0.92,
      clearcoat: 0.4,
    });
    const solarPanelMat = new THREE.MeshPhysicalMaterial({
      map: solarTex,
      roughness: 0.14,
      metalness: 0.35,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });
    const aluminumMat = new THREE.MeshStandardMaterial({ color: 0xd4dce0, roughness: 0.25, metalness: 0.85 });
    const ecoGlowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.55,
      roughness: 0.22,
      metalness: 0.2,
    });

    const initialCoat = COAT_PRESETS[0];
    const coatMat = new THREE.MeshPhysicalMaterial({
      color: initialCoat.color,
      roughness: initialCoat.roughness,
      metalness: initialCoat.metalness,
      clearcoat: initialCoat.clearcoat,
      clearcoatRoughness: 0.24,
    });
    coatMatRef.current = coatMat;

    const maneMat = new THREE.MeshStandardMaterial({
      color: initialCoat.maneColor,
      roughness: 0.78,
      metalness: 0.04,
    });
    maneMatRef.current = maneMat;

    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x26221e, roughness: 0.48, metalness: 0.1 });

    // --- 1. Extended Outdoor Ground & Natural Paddock ---
    const ground = new THREE.Mesh(new THREE.CircleGeometry(46, 48), terrainMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle Kopetdag background dunes/hills ring so outdoor world feels expansive
    const hillMat = new THREE.MeshStandardMaterial({ color: 0xbdd2c6, roughness: 0.96, metalness: 0.0 });
    const hillCoords: [number, number, number, number][] = [
      [-18, -22, 14, 4.2],
      [4, -26, 18, 5.4],
      [22, -19, 13, 3.8],
      [-24, -6, 11, 2.8],
    ];
    hillCoords.forEach(([x, z, r, h]) => {
      const hill = new THREE.Mesh(new THREE.ConeGeometry(r, h, 24), hillMat);
      hill.position.set(x, h / 2 - 0.3, z);
      scene.add(hill);
    });

    // --- 2. «Ýaşyl Athana» Eco-Stable Pavilion (Composite Group) ---
    const stableGroup = new THREE.Group();
    scene.add(stableGroup);

    // Travertine architectural plinth (offset +0.02 from ground to prevent Z-fighting)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.22, 7.6), plinthMat);
    plinth.position.set(-0.6, 0.11, -1.0);
    plinth.receiveShadow = true;
    stableGroup.add(plinth);

    // Back & Side breathable stone/timber stable walls with stall windows
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.2, 2.9, 0.28), plasterMat);
    backWall.position.set(-0.6, 1.66, -4.2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    stableGroup.add(backWall);

    // Timber stall partitions (2 visible eco-boxes)
    [-3.1, -0.6, 1.9].forEach((xPos) => {
      const partition = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.75, 2.6), timberMat);
      partition.position.set(xPos, 1.09, -2.85);
      partition.castShadow = true;
      partition.receiveShadow = true;
      stableGroup.add(partition);
    });

    // Architectural emerald columns with brushed-gold plinth bases
    const colPositions: [number, number][] = [
      [-4.6, -4.1],
      [-0.6, -4.1],
      [3.4, -4.1],
      [-4.6, 1.4],
      [-0.6, 1.4],
      [3.4, 1.4],
    ];
    const colGeo = new THREE.CylinderGeometry(0.13, 0.14, 3.6, 14);
    const colBaseGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.24, 14);
    colPositions.forEach(([x, z]) => {
      const base = new THREE.Mesh(colBaseGeo, brushedGoldMat);
      base.position.set(x, 0.34, z);
      base.castShadow = true;
      stableGroup.add(base);

      const col = new THREE.Mesh(colGeo, emeraldSteelMat);
      col.position.set(x, 2.18, z);
      col.castShadow = true;
      stableGroup.add(col);
    });

    // Slanted Eco-Roof + Solar Array Group (lifts smoothly when Eco-Layer is active)
    const solarRoofGroup = new THREE.Group();
    solarRoofGroup.position.set(-0.6, 4.15, -1.35);
    stableGroup.add(solarRoofGroup);

    const roofFrame = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.22, 6.8), emeraldSteelMat);
    roofFrame.rotation.x = 0.13;
    roofFrame.castShadow = true;
    roofFrame.receiveShadow = true;
    solarRoofGroup.add(roofFrame);

    // Gold decorative fascia trim along front roof edge
    const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(9.46, 0.08, 0.12), brushedGoldMat);
    roofTrim.position.set(0, -0.39, 3.4);
    solarRoofGroup.add(roofTrim);

    // 8 Individual Photovoltaic Solar Panels on the angled roof
    const panelFrameGeo = new THREE.BoxGeometry(1.96, 0.07, 2.55);
    const panelSurfaceGeo = new THREE.PlaneGeometry(1.82, 2.4);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const px = -3.15 + col * 2.1;
        const pz = -1.45 + row * 2.85;
        const py = 0.18 - pz * Math.sin(0.13);

        const pFrame = new THREE.Mesh(panelFrameGeo, aluminumMat);
        pFrame.position.set(px, py, pz);
        pFrame.rotation.x = 0.13;
        pFrame.castShadow = true;
        solarRoofGroup.add(pFrame);

        const pSurface = new THREE.Mesh(panelSurfaceGeo, solarPanelMat);
        pSurface.position.set(px, py + 0.042, pz);
        pSurface.rotation.x = -Math.PI / 2 + 0.13;
        solarRoofGroup.add(pSurface);
      }
    }

    // --- 3. Rainwater Harvesting Cistern & Downspout Pipe ---
    const cisternGroup = new THREE.Group();
    cisternGroup.position.set(-5.05, 0.22, -0.35);
    stableGroup.add(cisternGroup);

    const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.72, 1.95, 24), emeraldSteelMat);
    tankBody.position.y = 0.975;
    tankBody.castShadow = true;
    cisternGroup.add(tankBody);

    const tankBandTop = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.03, 10, 24), brushedGoldMat);
    tankBandTop.rotation.x = Math.PI / 2;
    tankBandTop.position.y = 1.65;
    cisternGroup.add(tankBandTop);

    const tankBandLow = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.03, 10, 24), brushedGoldMat);
    tankBandLow.rotation.x = Math.PI / 2;
    tankBandLow.position.y = 0.45;
    cisternGroup.add(tankBandLow);

    const tankCap = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.28, 24), aluminumMat);
    tankCap.position.y = 2.09;
    cisternGroup.add(tankCap);

    // Water level gauge strip
    const waterGauge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 0.06), ecoGlowMat);
    waterGauge.position.set(0.0, 1.0, 0.7);
    cisternGroup.add(waterGauge);

    // Curved downspout pipe from roof gutter to cistern
    const pipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.45, 3.5, 0),
      new THREE.Vector3(0.32, 2.75, 0),
      new THREE.Vector3(0.18, 2.15, 0),
    ]);
    const downspout = new THREE.Mesh(new THREE.TubeGeometry(pipeCurve, 14, 0.065, 10, false), aluminumMat);
    cisternGroup.add(downspout);

    // --- 4. Smart IoT Weather & Air-Quality Sensor Mast ---
    const iotMastGroup = new THREE.Group();
    iotMastGroup.position.set(-4.35, 0.22, 2.25);
    stableGroup.add(iotMastGroup);

    const mastBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.2, 16), emeraldSteelMat);
    mastBase.position.y = 0.1;
    iotMastGroup.add(mastBase);

    const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.6, 12), aluminumMat);
    mastPole.position.y = 1.4;
    mastPole.castShadow = true;
    iotMastGroup.add(mastPole);

    const sensorHead = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.34, 16), plasterMat);
    sensorHead.position.y = 2.65;
    sensorHead.castShadow = true;
    iotMastGroup.add(sensorHead);

    const sensorLens = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.028, 10, 20), ecoGlowMat);
    sensorLens.rotation.x = Math.PI / 2;
    sensorLens.position.y = 2.68;
    iotMastGroup.add(sensorLens);

    const miniSolar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.32), solarPanelMat);
    miniSolar.position.set(0, 2.95, 0);
    miniSolar.rotation.x = 0.32;
    iotMastGroup.add(miniSolar);

    // Eco-Telemetry Architectural Overlay Rings (visible when Eco-Layer toggled ON)
    const ecoOverlayGroup = new THREE.Group();
    ecoOverlayGroup.visible = false;
    scene.add(ecoOverlayGroup);

    const iotSignalRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.65, 36),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    iotSignalRing.rotation.x = -Math.PI / 2;
    iotSignalRing.position.set(-4.35, 2.68, 2.25);
    ecoOverlayGroup.add(iotSignalRing);

    const horseSensorRing = new THREE.Mesh(
      new THREE.RingGeometry(1.35, 1.44, 48),
      new THREE.MeshBasicMaterial({ color: 0xd4af37, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
    );
    horseSensorRing.rotation.x = -Math.PI / 2;
    horseSensorRing.position.set(1.65, 0.25, 1.65);
    ecoOverlayGroup.add(horseSensorRing);

    // --- 5. Hero Composite Akhal-Teke Horse ---
    const { horseRoot, headNeckGroup } = buildAkhalTekeHorse(
      coatMat,
      maneMat,
      hoofMat,
      brushedGoldMat,
      ecoGlowMat
    );
    horseRoot.position.set(1.65, 0.22, 1.65);
    horseRoot.rotation.y = -0.68;
    scene.add(horseRoot);

    // Soft radial contact shadow beneath horse
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.1),
      new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.rotation.z = 0.68;
    contactShadow.position.set(1.65, 0.235, 1.65);
    scene.add(contactShadow);

    // --- 6. Instanced Cypress & Tamarisk Eco-Grove (>20 repeated trees) ---
    const treeCount = 26;
    const trunkGeo = new THREE.CylinderGeometry(0.11, 0.16, 0.85, 8);
    const canopyGeo = new THREE.ConeGeometry(0.68, 2.6, 10);
    const instTrunks = new THREE.InstancedMesh(trunkGeo, timberMat, treeCount);
    const instCanopies = new THREE.InstancedMesh(
      canopyGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 }),
      treeCount
    );
    instCanopies.castShadow = !isSoftwareGl;

    const paletteTints = [0x0f6b4e, 0x167d5b, 0x1f8a64, 0x2d6a4f];
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 1.45 + Math.PI * 0.72;
      const radius = 11.2 + (i % 4) * 2.1;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius - 2.0;
      const scaleVar = 0.86 + ((i * 37) % 30) / 100; // ±15% natural scale variation

      _dummy.position.set(tx, 0.42 * scaleVar, tz);
      _dummy.scale.set(scaleVar, scaleVar, scaleVar);
      _dummy.rotation.set(0, i * 0.7, 0);
      _dummy.updateMatrix();
      instTrunks.setMatrixAt(i, _dummy.matrix);

      _dummy.position.set(tx, (0.85 + 1.15) * scaleVar, tz);
      _dummy.updateMatrix();
      instCanopies.setMatrixAt(i, _dummy.matrix);

      _treeColor.setHex(paletteTints[i % paletteTints.length]);
      instCanopies.setColorAt(i, _treeColor);
    }
    instTrunks.instanceMatrix.needsUpdate = true;
    instCanopies.instanceMatrix.needsUpdate = true;
    if (instCanopies.instanceColor) instCanopies.instanceColor.needsUpdate = true;
    instTrunks.computeBoundingSphere();
    instCanopies.computeBoundingSphere();
    scene.add(instTrunks);
    scene.add(instCanopies);

    // --- OrbitControls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.8, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.2;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minPolarAngle = 0.22;
    controls.update();

    // Cancel camera preset transition immediately if user manually drags/zooms
    controls.addEventListener('start', () => {
      targetPresetRef.current = null;
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // --- Animation & Software-WebGL Paced Render Loop ---
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let roofLiftProgress = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.getElapsedTime();

      // Subtle living poise for the Akhal-Teke head/neck
      if (!prefersReducedMotion) {
        headNeckGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.032;
        headNeckGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.04;
      }

      // Smooth damped exploded roof elevation when Eco-Layer is toggled
      const roofGoal = ecoLayerRef.current ? 1 : 0;
      roofLiftProgress = THREE.MathUtils.damp(roofLiftProgress, roofGoal, 6, delta);
      solarRoofGroup.position.y = 4.15 + roofLiftProgress * 0.95;
      ecoOverlayGroup.visible = roofLiftProgress > 0.05;
      if (ecoOverlayGroup.visible) {
        const ringScale = 1 + Math.sin(elapsed * 2.2) * 0.04;
        iotSignalRing.scale.set(ringScale, ringScale, 1);
      }

      // Smooth damped camera preset transitions
      const goal = targetPresetRef.current;
      if (goal) {
        _camGoalPos.set(goal.position[0], goal.position[1], goal.position[2]);
        _camGoalTarget.set(goal.target[0], goal.target[1], goal.target[2]);
        const alpha = isSoftwareGl ? 0.38 : 1 - Math.exp(-5.5 * delta);
        camera.position.lerp(_camGoalPos, alpha);
        controls.target.lerp(_camGoalTarget, alpha);
        if (
          camera.position.distanceTo(_camGoalPos) < 0.05 &&
          controls.target.distanceTo(_camGoalTarget) < 0.05
        ) {
          camera.position.copy(_camGoalPos);
          controls.target.copy(_camGoalTarget);
          targetPresetRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    requestRenderRef.current = () => {
      // Loop is already active; ensure clock delta stays smooth
    };

    tick();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      envRT.dispose();
      stoneTex.dispose();
      solarTex.dispose();
      contactTex.dispose();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[500px] sm:h-[560px] lg:h-[600px] rounded-2xl overflow-hidden border border-[#DCE6E1] bg-[#EDF4F1]">
      {/* Dedicated isolated WebGL canvas container (zero sibling re-mount) */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Graceful fallback if WebGL context is lost */}
      {contextLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#064E3B] text-white p-6 text-center">
          <p className="font-display text-2xl font-bold">3D WebGL Sahnasy Wagtlaýyn Elýeterli Däl</p>
          <p className="mt-2 text-sm text-white/80 max-w-md">
            Brauzeriňizde WebGL konteksti dikeldilýär. Sahypany täzeläp ýa-da grafika sazlamalaryny barlap bilersiňiz.
          </p>
        </div>
      )}

      {/* Minimal Top-Left Scene Spec (Solid surface, NO backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-4 left-4 z-10 max-w-[300px] rounded-xl bg-[#FFFFFF]/95 border border-[#DCE6E1] px-4 py-3 shadow-xs">
        <p className="text-[11px] font-semibold tracking-wide text-[#064E3B]">
          Interaktiw 3D Eko-Athana · Three.js PBR
        </p>
        <p className="mt-0.5 text-xs text-[#415850]">
          Syçanjyk ýa-da barmak bilen 360° aýlaň we ýakynlaşdyryň
        </p>
      </div>

      {/* Collapsible Unified Bottom Control Dock (Zero viewport occlusion, solid surface, NO backdrop-filter) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[min(920px,94%)] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          className="mb-1.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-t-xl rounded-b-lg bg-[#064E3B] text-white text-xs font-medium shadow-sm hover:bg-[#04392B] transition-colors cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>3D Gözegçiligi aç</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Paneli gizle</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="w-full rounded-2xl bg-[#FFFFFF]/96 border border-[#DCE6E1] shadow-[0_12px_32px_rgba(6,78,59,0.14)] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            {/* Camera Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#415850] mr-1">
                <Eye className="w-3.5 h-3.5 text-[#064E3B]" aria-hidden="true" />
                Rakurs:
              </span>
              {CAMERA_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleSelectPreset(preset.key)}
                  className={[
                    'min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                    activePreset === preset.key
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-[#EEF3F1] text-[#0F241D] hover:bg-[#DCE6E1]',
                  ].join(' ')}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Horse Coat Finishes */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-[#415850]">Bedew reňki:</span>
              <div className="flex items-center gap-1.5">
                {COAT_PRESETS.map((coat) => (
                  <button
                    key={coat.key}
                    type="button"
                    onClick={() => setActiveCoat(coat.key)}
                    title={coat.label}
                    className={[
                      'min-h-[36px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors cursor-pointer',
                      activeCoat === coat.key
                        ? 'border-[#064E3B] bg-[#ECFDF5] text-[#064E3B]'
                        : 'border-[#DCE6E1] bg-white text-[#415850] hover:border-[#064E3B]/40',
                    ].join(' ')}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: coat.swatch }}
                    />
                    <span>{coat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Eco-Layer Exploded View & Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEcoLayerOpen((prev) => !prev)}
                className={[
                  'min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                  ecoLayerOpen
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#FBF7E9] text-[#5C4507] border border-[#E7D497] hover:bg-[#F5EBCB]',
                ].join(' ')}
              >
                {ecoLayerOpen ? (
                  <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{ecoLayerOpen ? 'Eko-Gatlak: Açyk' : 'Eko-Gatlak'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEcoLayerOpen(false);
                  handleSelectPreset('overview');
                }}
                aria-label="Kamerany başlangyç ýagdaýa getirmek"
                title="Başlangyç görnüş"
                className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-[#DCE6E1] bg-white text-[#415850] hover:bg-[#EEF3F1] hover:text-[#064E3B] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
