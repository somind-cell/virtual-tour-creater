export type VideoHotspotType = 'nav' | 'info';

export interface VideoHotspot {
  id: string;
  type: VideoHotspotType;
  time: number;       // seconds when hotspot appears
  x: number;          // 0-100 percentage from left
  y: number;          // 0-100 percentage from top
  label: string;
  targetSceneId?: string;
}

export interface VideoScene {
  id: string;
  name: string;
  videoUrl: string;
  duration: number;
  hotspots: VideoHotspot[];
}

export interface VideoSettings {
  transitionDuration: number;    // 0.3–2.0s
  autoPlayOnSwitch: boolean;
  hotspotLabelMode: 'always' | 'hover' | 'never';
}

export type VideoEditorMode = 'view' | 'add-nav' | 'add-info';
