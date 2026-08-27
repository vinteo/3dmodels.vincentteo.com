import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import {
  RotateCcw,
  Play,
  Pause,
  Grid,
  Maximize2,
  Minimize2,
  Box,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface ModelViewerProps {
  meshData: ArrayBuffer | null;
  loading: boolean;
  error?: string | null;
  modelName: string;
  onRefresh?: () => void;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({
  meshData,
  loading,
  error,
  modelName,
  onRefresh
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentMeshRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const frameIdRef = useRef<number>(0);

  // Viewport display controls
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c0919'); // Deep space dark canvas background
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(150, 150, 180);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controls.maxDistance = 1000;
    controls.minDistance = 20;
    controlsRef.current = controls;

    // 5. Studio Lighting Setup matching vincentteo.com aesthetic
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
    scene.add(ambientLight);

    // Key Light (White/neutral main light)
    const keyLight = new THREE.DirectionalLight('#ffffff', 1.8);
    keyLight.position.set(120, 200, 150);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Rim Light (Vibrant violet/fuchsia neon accent)
    const rimLight = new THREE.DirectionalLight('#d946ef', 2.0);
    rimLight.position.set(-150, -50, -100);
    scene.add(rimLight);

    // Fill Light (Cool cyan accent)
    const fillLight = new THREE.DirectionalLight('#38bdf8', 1.0);
    fillLight.position.set(80, -100, -80);
    scene.add(fillLight);

    // 6. Subtle Floor Grid
    const gridHelper = new THREE.GridHelper(300, 30, '#475569', '#1e293b');
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Animation Loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update auto-rotation on control change
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update wireframe property on current mesh
  useEffect(() => {
    if (currentMeshRef.current) {
      const material = currentMeshRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        material.wireframe = wireframe;
      }
    }
  }, [wireframe]);

  // Update grid visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Load and position mesh geometry when meshData changes
  useEffect(() => {
    if (!meshData || !sceneRef.current) return;

    try {
      const loader = new STLLoader();
      const geometry = loader.parse(meshData);

      // Compute bounding box and center geometry
      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      const bbox = geometry.boundingBox;
      if (bbox) {
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        // Translate to origin and rest on bottom plane
        geometry.translate(-center.x, -bbox.min.y, -center.z);
      }

      // Remove existing model mesh if present
      if (currentMeshRef.current && sceneRef.current) {
        sceneRef.current.remove(currentMeshRef.current);
        currentMeshRef.current.geometry.dispose();
        if (Array.isArray(currentMeshRef.current.material)) {
          currentMeshRef.current.material.forEach((m) => m.dispose());
        } else {
          currentMeshRef.current.material.dispose();
        }
        currentMeshRef.current = null;
      }

      // Create material matching the dark futuristic slate-violet CAD aesthetic
      const material = new THREE.MeshStandardMaterial({
        color: '#e2e8f0', // Clean engineering satin finish
        roughness: 0.35,
        metalness: 0.15,
        wireframe
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      sceneRef.current.add(mesh);
      currentMeshRef.current = mesh;

      // Automatically frame camera around geometry size
      if (bbox && cameraRef.current && controlsRef.current) {
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 50);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.9;

        cameraRef.current.position.set(distance * 0.7, distance * 0.7, distance * 0.9);
        cameraRef.current.lookAt(0, size.y / 2, 0);
        controlsRef.current.target.set(0, size.y / 2, 0);
        controlsRef.current.update();
      }
    } catch (err) {
      console.error('Failed to parse or render 3D STL mesh:', err);
    }
  }, [meshData, wireframe]);

  // Camera Reset Handler
  const handleResetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current && currentMeshRef.current) {
      const geometry = currentMeshRef.current.geometry;
      const bbox = geometry.boundingBox;
      if (bbox) {
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 50);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.9;

        cameraRef.current.position.set(distance * 0.7, distance * 0.7, distance * 0.9);
        cameraRef.current.lookAt(0, size.y / 2, 0);
        controlsRef.current.target.set(0, size.y / 2, 0);
        controlsRef.current.update();
      }
    }
  }, []);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 overflow-hidden bg-[#0c0919] flex flex-col justify-between"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Top Overlay Header */}
      <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-800 pointer-events-auto">
          <Box className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs font-bold text-white tracking-wide truncate max-w-[200px]">
            {modelName}
          </span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
            3D Viewport
          </span>
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 pointer-events-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              autoRotate
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={autoRotate ? 'Pause Rotation' : 'Auto-Rotate'}
            aria-label="Toggle auto-rotate"
          >
            {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              wireframe
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Toggle Wireframe"
            aria-label="Toggle wireframe"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              showGrid
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Toggle Ground Grid"
            aria-label="Toggle grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Reset Camera View"
            aria-label="Reset camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Overlay Instructions */}
      <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
        <div className="text-[11px] text-slate-500 bg-slate-900/60 backdrop-blur-sm px-3 py-1 rounded-xl border border-slate-800/60">
          <span className="font-semibold text-slate-400">Left Click:</span> Rotate &nbsp;•&nbsp;
          <span className="font-semibold text-slate-400">Right Click:</span> Pan &nbsp;•&nbsp;
          <span className="font-semibold text-slate-400">Scroll:</span> Zoom
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#120e25]/75 backdrop-blur-sm transition-all duration-300">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-fuchsia-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Box className="w-6 h-6 text-fuchsia-400 animate-pulse" />
            </div>
          </div>
          <span className="mt-4 text-sm font-bold text-white tracking-wide">
            Calculating Parametric Geometry...
          </span>
          <span className="mt-1 text-xs text-slate-400">
            Querying Onshape CAD engine
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {error && !loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#120e25]/90 backdrop-blur-md p-6 text-center">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-3">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Preview Generation Failed</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">
            {error}
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 playful-btn inline-flex items-center gap-2 rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/25"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Preview
            </button>
          )}
        </div>
      )}
    </div>
  );
};
