import { useEffect, useRef, useCallback } from 'react';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { useTourStore } from '@/store/tourStore';
import { toast } from 'sonner';
import type { Scene } from '@/types/tour';

export function PanoramaViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const markersPluginRef = useRef<MarkersPlugin | null>(null);
  const currentScene = useTourStore((s) => s.getCurrentScene());
  const mode = useTourStore((s) => s.mode);
  const scenes = useTourStore((s) => s.scenes);
  const addHotspot = useTourStore((s) => s.addHotspot);
  const removeHotspot = useTourStore((s) => s.removeHotspot);
  const setCurrentScene = useTourStore((s) => s.setCurrentScene);
  const setMode = useTourStore((s) => s.setMode);

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current || !currentScene) return;

    if (viewerRef.current) {
      viewerRef.current.destroy();
    }

    const viewer = new Viewer({
      container: containerRef.current,
      panorama: currentScene.imageUrl,
      navbar: false,
      defaultYaw: 0,
      defaultPitch: 0,
      plugins: [[MarkersPlugin, { markers: [] }]],
    });

    viewerRef.current = viewer;
    // Expose viewer instance for tour recorder
    (window as any).__viewer = viewer;
    const container = containerRef.current.querySelector('.psv-container');
    if (container) (container as any).__viewer = viewer;
    markersPluginRef.current = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      markersPluginRef.current = null;
    };
  }, [currentScene?.id, currentScene?.imageUrl]);

  // Update markers when hotspots change
  useEffect(() => {
    const plugin = markersPluginRef.current;
    if (!plugin || !currentScene) return;

    plugin.clearMarkers();

    currentScene.hotspots.forEach((hotspot) => {
      const isNav = hotspot.type === 'nav';
      const targetScene = isNav
        ? scenes.find((s) => s.id === hotspot.targetSceneId)
        : null;

      plugin.addMarker({
        id: hotspot.id,
        position: { yaw: `${hotspot.yaw}deg`, pitch: `${hotspot.pitch}deg` },
        html: `
          <div class="hotspot-${hotspot.type}" style="position:relative" data-hotspot-id="${hotspot.id}" data-type="${hotspot.type}" data-target="${hotspot.targetSceneId || ''}">
            <span class="hotspot-tooltip">${hotspot.label}${targetScene ? ` → ${targetScene.name}` : ''}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${isNav
                ? '<path d="m18 15-6-6-6 6"/>'
                : '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
              }
            </svg>
            <span class="hotspot-delete" data-delete="${hotspot.id}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </span>
          </div>
        `,
        anchor: 'center center',
        size: { width: 40, height: 40 },
        data: { hotspot },
      });
    });
  }, [currentScene?.hotspots, currentScene?.id, scenes]);

  // Handle clicks
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Handle delete button click
      const deleteBtn = target.closest('[data-delete]') as HTMLElement;
      if (deleteBtn && currentScene) {
        const hotspotId = deleteBtn.dataset.delete!;
        removeHotspot(currentScene.id, hotspotId);
        return;
      }

      // Handle nav hotspot click in view mode
      const hotspotEl = target.closest('[data-hotspot-id]') as HTMLElement;
      if (hotspotEl && mode === 'view') {
        const type = hotspotEl.dataset.type;
        const targetId = hotspotEl.dataset.target;
        if (type === 'nav' && targetId) {
          const targetScene = scenes.find((s) => s.id === targetId);
          if (targetScene) {
            setCurrentScene(targetId);
            toast(`Navigated to ${targetScene.name}`);
          }
        }
        return;
      }
    },
    [currentScene, mode, scenes, removeHotspot, setCurrentScene]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [handleClick]);

  // Handle panorama click for adding hotspots
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !currentScene) return;

    const handler = (e: any) => {
      if (mode === 'view') return;

      // ---- Guard against missing/invalid yaw/pitch ----
      const rawYaw = e?.data?.yaw;
      const rawPitch = e?.data?.pitch;
      if (typeof rawYaw !== 'number' || typeof rawPitch !== 'number' || Number.isNaN(rawYaw) || Number.isNaN(rawPitch)) {
        console.warn('PanoramaViewer: click event missing or invalid yaw/pitch – hotspot not created');
        return;
      }
      // ----------------------------------------------
      const { yaw, pitch } = e.data;
      const yawDeg = (yaw * 180) / Math.PI;
      const pitchDeg = (pitch * 180) / Math.PI;
      const type = mode === 'add-nav' ? 'nav' : 'info';
      addHotspot(currentScene.id, type, yawDeg, pitchDeg);
      toast(`${type === 'nav' ? 'Navigation' : 'Info'} hotspot placed`);
    };

    viewer.addEventListener('click', handler);
    return () => viewer.removeEventListener('click', handler);
  }, [mode, currentScene?.id, addHotspot]);

  // Cursor style based on mode
  const cursorClass = mode !== 'view' ? 'cursor-crosshair' : '';

  return (
    <div
      ref={containerRef}
      className={`flex-1 bg-[hsl(var(--viewer-bg))] ${cursorClass}`}
    />
  );
}
