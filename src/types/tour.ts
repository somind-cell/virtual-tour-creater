export type HotspotType = 'nav' | 'info';

export interface Hotspot {
  id: string;
  type: HotspotType;
  yaw: number;
  pitch: number;
  label: string;
  targetSceneId?: string;
}

export interface Scene {
  id: string;
  name: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

export type EditorMode = 'view' | 'add-nav' | 'add-info';

export interface TourState {
  scenes: Scene[];
  currentSceneId: string | null;
  mode: EditorMode;
}
