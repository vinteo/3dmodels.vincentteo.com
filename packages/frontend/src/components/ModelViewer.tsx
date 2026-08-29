import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  AlertCircle,
  Share2,
  Check,
  Palette,
  X,
  Sparkles
} from 'lucide-react';
import { PreviewMeshData } from '../types/model';
import {
  PRESET_SWATCHES,
  THEME_PALETTES,
  ThemePalette,
  formatPartName,
  resolveThemeColorForPart
} from '../utils/partColors';

interface ModelViewerProps {
  meshData: PreviewMeshData | null;
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
  const currentGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const frameIdRef = useRef<number>(0);
  const prevModelNameRef = useRef<string>('');
  const hasFramedCameraRef = useRef<boolean>(false);

  // Viewport display controls
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [showColorStudio, setShowColorStudio] = useState<boolean>(false);
  const [customPartColors, setCustomPartColors] = useState<Record<string, string>>({});

  // Active parts in current model
  const activeParts = useMemo(() => {
    if (!meshData) return [];
    if (meshData instanceof ArrayBuffer) {
      return [
        {
          name: 'Main Body',
          displayName: 'Main Body',
          defaultColor: '#e2e8f0',
          currentColor: customPartColors['Main Body'] || '#e2e8f0'
        }
      ];
    }
    if ('parts' in meshData) {
      return meshData.parts.map((p) => ({
        name: p.name,
        displayName: formatPartName(p.name),
        defaultColor: p.color || '#3b82f6',
        currentColor: customPartColors[p.name] || p.color || '#3b82f6'
      }));
    }
    return [];
  }, [meshData, customPartColors]);

  const handleSetPartColor = (partName: string, newColor: string) => {
    setCustomPartColors((prev) => ({
      ...prev,
      [partName]: newColor
    }));

    if (currentGroupRef.current) {
      currentGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (child.name === partName || (!child.name && partName === 'Main Body')) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.color.set(newColor);
          }
        }
      });
    }
  };

  const handleApplyTheme = (theme: ThemePalette) => {
    const updated: Record<string, string> = { ...customPartColors };
    activeParts.forEach((part, index) => {
      const color = resolveThemeColorForPart(theme, part.name, index);
      updated[part.name] = color;
    });

    setCustomPartColors(updated);

    if (currentGroupRef.current) {
      currentGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const partKey = child.name || 'Main Body';
          if (updated[partKey]) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.color.set(updated[partKey]);
          }
        }
      });
    }
  };

  const handleResetColors = () => {
    setCustomPartColors({});
    if (currentGroupRef.current && meshData) {
      if (meshData instanceof ArrayBuffer) {
        currentGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            (child.material as THREE.MeshStandardMaterial).color.set('#e2e8f0');
          }
        });
      } else if ('parts' in meshData) {
        const defaultMap = new Map(meshData.parts.map((p) => [p.name, p.color || '#e2e8f0']));
        currentGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const defaultCol = defaultMap.get(child.name) || '#e2e8f0';
            (child.material as THREE.MeshStandardMaterial).color.set(defaultCol);
          }
        });
      }
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

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
    controls.maxDistance = 800;
    controls.minDistance = 10;
    controlsRef.current = controls;

    // 5. Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.2);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight('#ffffff', 2.0);
    mainKeyLight.position.set(120, 200, 150);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.bias = -0.0001;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight('#93c5fd', 1.0);
    fillLight.position.set(-150, 100, -100);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#c084fc', 1.2);
    rimLight.position.set(0, -100, -150);
    scene.add(rimLight);

    // 6. Ground Reference Grid
    const grid = new THREE.GridHelper(300, 30, '#382bf0', '#1c154a');
    grid.position.y = -0.01;
    grid.visible = showGrid;
    scene.add(grid);
    gridHelperRef.current = grid;

    // 7. Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();
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

  // Update wireframe property on all meshes in current group
  useEffect(() => {
    if (currentGroupRef.current) {
      currentGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.wireframe = wireframe;
        }
      });
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
      const group = new THREE.Group();

      if (meshData instanceof ArrayBuffer) {
        const geometry = loader.parse(meshData);
        geometry.computeVertexNormals();
        const material = new THREE.MeshStandardMaterial({
          color: customPartColors['Main Body'] || '#e2e8f0',
          roughness: 0.35,
          metalness: 0.15,
          wireframe
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Main Body';
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      } else if (meshData && 'parts' in meshData) {
        for (const part of meshData.parts) {
          const geometry = loader.parse(part.buffer);
          geometry.computeVertexNormals();
          const partColor = customPartColors[part.name] || part.color || '#e2e8f0';
          const material = new THREE.MeshStandardMaterial({
            color: partColor,
            roughness: 0.35,
            metalness: 0.15,
            wireframe
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = part.name;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          group.add(mesh);
        }
      }

      if (group.children.length === 0) return;

      // Compute bounding box and center geometry
      const bbox = new THREE.Box3().setFromObject(group);
      const rawSize = new THREE.Vector3();
      bbox.getSize(rawSize);

      // Auto-orient: If CAD model was extruded along Z (thin along Z), rotate to lie flat on the Three.js XZ ground grid
      if (rawSize.z < rawSize.x && rawSize.z < rawSize.y) {
        group.rotateX(-Math.PI / 2);
      }

      const updatedBbox = new THREE.Box3().setFromObject(group);
      const center = new THREE.Vector3();
      updatedBbox.getCenter(center);

      // Center horizontally on X & Z, and place bottom on ground plane (Y = 0)
      group.position.set(-center.x, -updatedBbox.min.y, -center.z);

      // Remove existing model group if present
      if (currentGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(currentGroupRef.current);
        currentGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        currentGroupRef.current = null;
      }

      sceneRef.current.add(group);
      currentGroupRef.current = group;

      // Check if this is a newly switched model or initial load
      const isNewModel = prevModelNameRef.current !== modelName;
      if (isNewModel) {
        prevModelNameRef.current = modelName;
        hasFramedCameraRef.current = false;
      }

      // Automatically frame camera around geometry size ONLY on initial load or model change
      if (cameraRef.current && controlsRef.current) {
        const finalBbox = new THREE.Box3().setFromObject(group);
        if (!hasFramedCameraRef.current) {
          const finalSize = new THREE.Vector3();
          finalBbox.getSize(finalSize);
          const maxDim = Math.max(finalSize.x, finalSize.y, finalSize.z, 20);
          const fov = cameraRef.current.fov * (Math.PI / 180);
          const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.85;

          cameraRef.current.position.set(distance * 0.65, distance * 0.7, distance * 0.85);
          cameraRef.current.lookAt(0, finalSize.y / 2, 0);
          controlsRef.current.target.set(0, finalSize.y / 2, 0);
          controlsRef.current.update();
          hasFramedCameraRef.current = true;
        } else {
          controlsRef.current.update();
        }
      }
    } catch (err) {
      console.error('Failed to parse or render 3D STL mesh:', err);
    }
  }, [meshData, modelName, wireframe]);

  // Camera Reset Handler
  const handleResetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current && currentGroupRef.current) {
      const bbox = new THREE.Box3().setFromObject(currentGroupRef.current);
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
            onClick={() => setShowColorStudio(!showColorStudio)}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              showColorStudio
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={showColorStudio ? 'Close Part Colors' : 'Part Colors & Materials Studio'}
            aria-label="Toggle part color studio"
          >
            <Palette className="w-4 h-4" />
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
            onClick={handleCopyShareLink}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              copiedShareLink
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={copiedShareLink ? 'Permalink Copied!' : 'Copy Model Permalink'}
            aria-label="Copy direct permalink"
          >
            {copiedShareLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
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

      {/* Floating Part Color Studio Overlay Panel */}
      {showColorStudio && (
        <div
          className="absolute top-16 right-4 z-30 w-80 sm:w-96 max-h-[calc(100vh-140px)] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-label="Part Color Studio"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-fuchsia-400" />
              <span className="text-xs font-bold text-white tracking-wide">
                Part Materials & Colors
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {activeParts.length} {activeParts.length === 1 ? 'part' : 'parts'}
              </span>
            </div>
            <button
              onClick={() => setShowColorStudio(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Panel"
              aria-label="Close part color studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Theme Presets */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  1-Click Theme Palettes
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {THEME_PALETTES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleApplyTheme(theme)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-violet-500/50 transition-all text-left group"
                  >
                    <span className="text-sm">{theme.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                        {theme.name}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {theme.fallback.slice(0, 4).map((c, i) => (
                          <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-slate-900/50"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Parts Customization */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Component Parts
              </div>
              <div className="space-y-2.5">
                {activeParts.map((part) => (
                  <div
                    key={part.name}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <label className="relative cursor-pointer group">
                          <input
                            type="color"
                            value={part.currentColor}
                            onChange={(e) => handleSetPartColor(part.name, e.target.value)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            aria-label={`Select color for ${part.displayName}`}
                          />
                          <div
                            className="w-6 h-6 rounded-lg border-2 border-white/20 shadow-sm group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: part.currentColor }}
                          />
                        </label>
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {part.displayName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {part.currentColor.toUpperCase()}
                      </span>
                    </div>

                    {/* Quick Swatches */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_SWATCHES.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleSetPartColor(part.name, color)}
                          className={`w-5 h-5 rounded-md border transition-all ${
                            part.currentColor.toLowerCase() === color.toLowerCase()
                              ? 'border-white scale-110 shadow-sm'
                              : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                          aria-label={`Set color to ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <button
              onClick={handleResetColors}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Defaults
            </button>
            <span className="text-[10px] text-slate-500">
              Live Real-Time Preview
            </span>
          </div>
        </div>
      )}

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
