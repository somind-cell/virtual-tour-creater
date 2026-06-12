import { useEffect, useRef, useState, useCallback } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { GalleryPlugin } from "@photo-sphere-viewer/gallery-plugin";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { useTourStore } from "@/store/tourStore";
import {
  X,
  RotateCcw,
  Maximize,
  Minimize,
  Map,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
import "@photo-sphere-viewer/gallery-plugin/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";

interface TourViewerProps {
  onClose: () => void;
}

export function TourViewer({ onClose }: TourViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const scenes = useTourStore((s) => s.scenes);

  const [currentScene, setCurrentScene] = useState(scenes[0]?.name ?? "");
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(true);
  const [infoPopup, setInfoPopup] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);

  // ── Build VirtualTourPlugin nodes from store data ─────────────────────────
  const buildNodes = useCallback(() => {
    return scenes.map((scene) => ({
      id: scene.id,
      panorama: scene.imageUrl,
      name: scene.name,
      thumbnail: scene.imageUrl,

      // Nav hotspots → VTP links (rendered as 3D arrows in the panorama)
      // NOTE: position must be a nested object — plugin checks link.position, not spread yaw/pitch
      links: scene.hotspots
        .filter((h) => h.type === "nav" && h.targetSceneId)
        .map((h) => ({
          nodeId: h.targetSceneId!,
          position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
          name: h.label || "Next scene",
        })),

      // Info hotspots → Markers with tooltip + popup content
      markers: scene.hotspots
        .filter((h) => h.type === "info")
        .map((h) => ({
          id: h.id,
          position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
          html: `
            <div class="vtour-info-marker">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>`,
          anchor: "center center",
          size: { width: 40, height: 40 },
          tooltip: { content: h.label, position: "top center" },
          content: `
            <div class="vtour-popup-content">
              <div class="vtour-popup-icon">ℹ</div>
              <h3>${h.label}</h3>
              <p>Info hotspot</p>
            </div>`,
          data: { label: h.label },
        })),
    }));
  }, [scenes]);

  // ── Initialize viewer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || scenes.length === 0) return;

    const nodes = buildNodes();

    const viewer = new Viewer({
      container: containerRef.current,
      panorama: scenes[0].imageUrl,
      navbar: false, // we use our own controls
      defaultZoomLvl: 50,
      minFov: 30,
      maxFov: 100,
      moveSpeed: 1.2,
      zoomSpeed: 2,
      plugins: [
        [
          VirtualTourPlugin,
          {
            nodes,
            startNodeId: scenes[0].id,
            renderMode: "3d",
            preload: true,
            transitionOptions: {
              showLoader: false,
              effect: "fade",
              speed: 1.5,
              rotation: true,
            },
            arrowStyle: {
              style: {
                color: "#3b82f6",
                outlineColor: "rgba(255,255,255,0.8)",
              },
            },
          },
        ],
        [
          GalleryPlugin,
          {
            visibleOnLoad: true,
            hideOnClick: false,
            thumbnailSize: { width: 180, height: 100 },
          },
        ],
        [MarkersPlugin, { markers: [] }],
      ],
    });

    viewerRef.current = viewer;

    // ── Scene change event ──────────────────────────────────────────────────
    const vtp = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin);
    if (vtp) {
      vtp.addEventListener("node-changed", (e: any) => {
        const node = e.node as { name?: string };
        setCurrentScene(node?.name ?? "");
      });
    }

    // ── Fullscreen change ───────────────────────────────────────────────────
    viewer.addEventListener("fullscreen", (e: any) => {
      setIsFullscreen(!!e.fullscreenEnabled);
    });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [scenes, buildNodes]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleAutoRotate = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (isAutoRotate) {
      viewer.stopAutorotate();
    } else {
      viewer.startAutorotate();
    }
    setIsAutoRotate((v) => !v);
  }, [isAutoRotate]);

  const toggleFullscreen = useCallback(() => {
    viewerRef.current?.toggleFullscreen();
  }, []);

  const toggleGallery = useCallback(() => {
    const gallery = viewerRef.current?.getPlugin<GalleryPlugin>(GalleryPlugin);
    if (!gallery) return;
    if (galleryVisible) {
      gallery.hide();
    } else {
      gallery.show();
    }
    setGalleryVisible((v) => !v);
  }, [galleryVisible]);

  if (scenes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-4">No scenes uploaded yet.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary rounded-lg text-white"
          >
            Back to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* ── Top overlay bar ──────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3 bg-gradient-to-b from-black/75 via-black/40 to-transparent pointer-events-none">
        {/* Left: branding + scene name */}
        <div className="pointer-events-auto">
          <p className="text-white/50 text-[11px] uppercase tracking-widest font-medium leading-none mb-0.5">
            Virtual Tour
          </p>
          <p className="text-white text-base font-semibold leading-tight">
            {currentScene || scenes[0]?.name}
          </p>
        </div>

        {/* Right: control buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Auto-rotate */}
          <button
            onClick={toggleAutoRotate}
            title={isAutoRotate ? "Stop auto-rotate" : "Start auto-rotate"}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border backdrop-blur-sm transition-all
              ${
                isAutoRotate
                  ? "bg-primary border-primary text-white"
                  : "bg-black/40 border-white/20 text-white/80 hover:bg-black/60 hover:border-white/40"
              }
            `}
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${isAutoRotate ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isAutoRotate ? "Stop" : "Auto-rotate"}
            </span>
          </button>

          {/* Toggle gallery */}
          <button
            onClick={toggleGallery}
            title={galleryVisible ? "Hide scenes" : "Show scenes"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/40 border border-white/20 text-white/80 hover:bg-black/60 hover:border-white/40 backdrop-blur-sm transition-all"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scenes</span>
            {galleryVisible ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/40 border border-white/20 text-white/80 hover:bg-black/60 hover:border-white/40 backdrop-blur-sm transition-all"
          >
            {isFullscreen ? (
              <Minimize className="w-3.5 h-3.5" />
            ) : (
              <Maximize className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close viewer"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 border border-white/20 text-white/80 hover:bg-red-600 hover:border-red-500 hover:text-white backdrop-blur-sm transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scene count badge ─────────────────────────────────────────────── */}
      <div className="absolute top-14 left-5 z-10 pointer-events-none">
        <div className="flex gap-1.5">
          {scenes.map((scene, i) => (
            <div
              key={scene.id}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                scene.name === currentScene
                  ? "bg-white scale-125"
                  : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── 360° Viewer ───────────────────────────────────────────────────── */}
      <div ref={containerRef} className="flex-1 w-full h-full" />

      {/* ── Hotspot legend (bottom-left) ──────────────────────────────────── */}
      <div className="absolute bottom-40 left-5 z-10 flex flex-col gap-1.5 pointer-events-none">
        {scenes.some((s) => s.hotspots.some((h) => h.type === "nav")) && (
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
            <span className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_6px_#3b82f6]" />
            <span className="text-white/70 text-[11px]">Navigate</span>
          </div>
        )}
        {scenes.some((s) => s.hotspots.some((h) => h.type === "info")) && (
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
            <span className="w-3 h-3 rounded-full bg-[#f97316] shadow-[0_0_6px_#f97316]" />
            <span className="text-white/70 text-[11px]">Info</span>
          </div>
        )}
      </div>

      {/* ── Keyboard hint ─────────────────────────────────────────────────── */}
      <div className="absolute bottom-40 right-5 z-10 pointer-events-none">
        <p className="text-white/30 text-[11px] text-right">
          Drag to look around · Scroll to zoom
        </p>
      </div>
    </div>
  );
}
