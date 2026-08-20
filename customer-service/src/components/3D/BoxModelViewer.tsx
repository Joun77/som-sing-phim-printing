import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface BoxModelViewerProps {
  lengthMM?: number; // X dimension in mm
  widthMM?: number;  // Z dimension in mm
  heightMM?: number; // Y dimension in mm
  artworkUrl?: string | null;
  finishingEffect?: 'none' | 'gold_foil' | 'silver_foil' | 'spot_uv' | 'matte';
  foilColor?: 'gold' | 'silver';
  boxColor?: string;
  autoRotate?: boolean;
}

export const BoxModelViewer: React.FC<BoxModelViewerProps> = ({
  lengthMM = 160,
  widthMM = 110,
  heightMM = 65,
  artworkUrl = null,
  finishingEffect = 'gold_foil',
  foilColor = 'gold',
  boxColor = '#1E1B4B', // Luxury Midnight Indigo
  autoRotate = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState<boolean>(autoRotate);
  const [activePreset, setActivePreset] = useState<'iso' | 'front' | 'top'>('iso');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const boxMeshRef = useRef<THREE.Mesh | null>(null);
  const reqAnimRef = useRef<number | null>(null);

  // Interaction drag states
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationVelocity = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 340;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3.2, 2.5, 4.0);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High Precision & Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.9);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, -4, 5);
    scene.add(rimLight);

    // Floor Shadow Plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(8, 8);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 5. Normalized Geometry Builder
    const maxDim = Math.max(lengthMM, widthMM, heightMM, 1);
    const scaleFactor = 2.4 / maxDim;
    const geoW = lengthMM * scaleFactor;
    const geoH = heightMM * scaleFactor;
    const geoD = widthMM * scaleFactor;

    const boxGeometry = new THREE.BoxGeometry(geoW, geoH, geoD, 32, 32, 32);

    // Generate Custom Texture with Luxury Print Mockup Canvas
    const createBoxTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Base Box Color
        ctx.fillStyle = boxColor;
        ctx.fillRect(0, 0, 1024, 1024);

        // Luxury Geometric Frame
        ctx.strokeStyle = finishingEffect === 'gold_foil' ? '#F59E0B' : finishingEffect === 'silver_foil' ? '#E2E8F0' : '#38BDF8';
        ctx.lineWidth = 12;
        ctx.strokeRect(60, 60, 904, 904);

        ctx.lineWidth = 4;
        ctx.strokeRect(80, 80, 864, 864);

        // Brand Emblem
        ctx.fillStyle = finishingEffect === 'gold_foil' ? '#FBBF24' : finishingEffect === 'silver_foil' ? '#F8FAFC' : '#FFFFFF';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SOM SING PHIM', 512, 450);

        ctx.font = '600 24px sans-serif';
        ctx.letterSpacing = '6px';
        ctx.fillText('LUXURY PACKAGING STUDIO', 512, 510);

        ctx.font = '500 18px monospace';
        ctx.fillText(`${lengthMM} × ${widthMM} × ${heightMM} MM`, 512, 570);

        if (finishingEffect === 'gold_foil') {
          ctx.font = 'bold 20px sans-serif';
          ctx.fillStyle = '#FDE68A';
          ctx.fillText('✨ GOLD HOT-FOIL EMBOSSED', 512, 630);
        } else if (finishingEffect === 'spot_uv') {
          ctx.font = 'bold 20px sans-serif';
          ctx.fillStyle = '#67E8F9';
          ctx.fillText('💎 SPOT UV GLOSS VARNISH', 512, 630);
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 8;
      return texture;
    };

    let material: THREE.Material;

    if (artworkUrl) {
      const loader = new THREE.TextureLoader();
      const artTex = loader.load(artworkUrl);
      artTex.anisotropy = 8;

      if (finishingEffect === 'gold_foil' || finishingEffect === 'silver_foil') {
        material = new THREE.MeshStandardMaterial({
          map: artTex,
          metalness: 0.85,
          roughness: 0.18,
          color: foilColor === 'gold' ? 0xfff0c2 : 0xf1f5f9,
        });
      } else if (finishingEffect === 'spot_uv') {
        material = new THREE.MeshPhysicalMaterial({
          map: artTex,
          metalness: 0.1,
          roughness: 0.15,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          map: artTex,
          metalness: 0.05,
          roughness: 0.65,
        });
      }
    } else {
      const procTexture = createBoxTexture();
      if (finishingEffect === 'gold_foil' || finishingEffect === 'silver_foil') {
        material = new THREE.MeshStandardMaterial({
          map: procTexture,
          metalness: 0.75,
          roughness: 0.22,
        });
      } else if (finishingEffect === 'spot_uv') {
        material = new THREE.MeshPhysicalMaterial({
          map: procTexture,
          metalness: 0.05,
          roughness: 0.2,
          clearcoat: 0.95,
          clearcoatRoughness: 0.05,
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          map: procTexture,
          metalness: 0.05,
          roughness: 0.7,
        });
      }
    }

    const boxMesh = new THREE.Mesh(boxGeometry, material);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    scene.add(boxMesh);
    boxMeshRef.current = boxMesh;

    // 6. Render Loop & Momentum Rotation
    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);

      if (boxMeshRef.current) {
        if (isRotating && !isDraggingRef.current) {
          boxMeshRef.current.rotation.y += 0.008;
        } else if (!isDraggingRef.current) {
          // Apply light damping to manual velocity
          boxMeshRef.current.rotation.y += rotationVelocity.current.y;
          boxMeshRef.current.rotation.x += rotationVelocity.current.x;
          rotationVelocity.current.x *= 0.92;
          rotationVelocity.current.y *= 0.92;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Touch & Mouse Orbit Event Handlers
    const dom = renderer.domElement;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMousePos.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !boxMeshRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevMousePos.current.x;
      const deltaY = clientY - prevMousePos.current.y;

      const rotSpeed = 0.006;
      boxMeshRef.current.rotation.y += deltaX * rotSpeed;
      boxMeshRef.current.rotation.x += deltaY * rotSpeed;

      rotationVelocity.current = { x: deltaY * rotSpeed * 0.5, y: deltaX * rotSpeed * 0.5 };
      prevMousePos.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomFactor = e.deltaY * 0.003;
      cameraRef.current.position.z = Math.min(8.0, Math.max(2.0, cameraRef.current.position.z + zoomFactor));
    };

    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    dom.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      boxGeometry.dispose();
    };
  }, [lengthMM, widthMM, heightMM, artworkUrl, finishingEffect, foilColor, boxColor, isRotating]);

  // Preset angle resets
  const setPresetAngle = (preset: 'iso' | 'front' | 'top') => {
    setActivePreset(preset);
    setIsRotating(false);
    if (!boxMeshRef.current || !cameraRef.current) return;

    if (preset === 'iso') {
      boxMeshRef.current.rotation.set(0.35, 0.7, 0);
    } else if (preset === 'front') {
      boxMeshRef.current.rotation.set(0, 0, 0);
    } else if (preset === 'top') {
      boxMeshRef.current.rotation.set(Math.PI / 2, 0, 0);
    }
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* 3D Viewport Canvas */}
      <div ref={containerRef} className="w-full h-[340px] sm:h-[400px] cursor-grab active:cursor-grabbing touch-none" />

      {/* Top Overlay Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-white rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          3D Interactive Model
        </span>
        <span className="px-2.5 py-1 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-indigo-300 rounded-full text-[10px] font-mono font-bold">
          {lengthMM}×{widthMM}×{heightMM}mm
        </span>
      </div>

      {/* Finishing Simulation Indicator */}
      <div className="absolute top-4 right-4">
        {finishingEffect === 'gold_foil' && (
          <span className="px-3 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 rounded-full text-[10px] font-black uppercase">
            ✨ Gold Hot-Foil Sim
          </span>
        )}
        {finishingEffect === 'silver_foil' && (
          <span className="px-3 py-1 bg-slate-200/20 backdrop-blur-md border border-slate-200/40 text-slate-200 rounded-full text-[10px] font-black uppercase">
            ⚡ Silver Foil Sim
          </span>
        )}
        {finishingEffect === 'spot_uv' && (
          <span className="px-3 py-1 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 text-cyan-300 rounded-full text-[10px] font-black uppercase">
            💎 Spot UV Gloss Sim
          </span>
        )}
      </div>

      {/* Bottom Floating Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Preset Angle Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl pointer-events-auto shadow-lg">
          <button
            type="button"
            onClick={() => setPresetAngle('iso')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition ${
              activePreset === 'iso' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ISO 3D
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle('front')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition ${
              activePreset === 'front' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            FRONT
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle('top')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition ${
              activePreset === 'top' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            TOP
          </button>
        </div>

        {/* Auto Rotate Toggle */}
        <button
          type="button"
          onClick={() => setIsRotating((prev) => !prev)}
          className={`px-3 py-2 rounded-2xl text-[11px] font-black pointer-events-auto backdrop-blur-md border transition shadow-lg flex items-center gap-1.5 ${
            isRotating
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-black/70 border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          <span>{isRotating ? '⏸ Pause 360°' : '▶ 360° Spin'}</span>
        </button>
      </div>
    </div>
  );
};

export default BoxModelViewer;
