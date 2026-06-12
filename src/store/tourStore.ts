import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Scene, Hotspot, HotspotType, EditorMode } from '@/types/tour';

interface TourStore {
  scenes: Scene[];
  currentSceneId: string | null;
  mode: EditorMode;
  editingHotspotId: string | null;

  setMode: (mode: EditorMode) => void;
  setCurrentScene: (id: string) => void;
  setEditingHotspot: (id: string | null) => void;

  addScene: (name: string, imageUrl: string) => void;
  removeScene: (id: string) => void;

  addHotspot: (sceneId: string, type: HotspotType, yaw: number, pitch: number) => void;
  updateHotspot: (sceneId: string, hotspotId: string, updates: Partial<Hotspot>) => void;
  removeHotspot: (sceneId: string, hotspotId: string) => void;

  getCurrentScene: () => Scene | undefined;
}

export const useTourStore = create<TourStore>((set, get) => ({
  scenes: [],
  currentSceneId: null,
  mode: 'view',
  editingHotspotId: null,

  setMode: (mode) => set({ mode }),
  setCurrentScene: (id) => set({ currentSceneId: id, editingHotspotId: null }),
  setEditingHotspot: (id) => set({ editingHotspotId: id }),

  addScene: (name, imageUrl) => {
    const id = uuidv4();
    set((state) => ({
      scenes: [...state.scenes, { id, name, imageUrl, hotspots: [] }],
      currentSceneId: state.currentSceneId ?? id,
    }));
  },

  removeScene: (id) => {
    set((state) => {
      const scenes = state.scenes.filter((s) => s.id !== id);
      return {
        scenes,
        currentSceneId: state.currentSceneId === id ? (scenes[0]?.id ?? null) : state.currentSceneId,
      };
    });
  },

  addHotspot: (sceneId, type, yaw, pitch) => {
    const hotspot: Hotspot = {
      id: uuidv4(),
      type,
      yaw,
      pitch,
      label: type === 'nav' ? 'Go to...' : 'Info',
    };
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId ? { ...s, hotspots: [...s.hotspots, hotspot] } : s
      ),
      mode: 'view',
      editingHotspotId: hotspot.id,
    }));
  },

  updateHotspot: (sceneId, hotspotId, updates) => {
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? {
              ...s,
              hotspots: s.hotspots.map((h) =>
                h.id === hotspotId ? { ...h, ...updates } : h
              ),
            }
          : s
      ),
    }));
  },

  removeHotspot: (sceneId, hotspotId) => {
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, hotspots: s.hotspots.filter((h) => h.id !== hotspotId) }
          : s
      ),
      editingHotspotId: state.editingHotspotId === hotspotId ? null : state.editingHotspotId,
    }));
  },

  getCurrentScene: () => {
    const state = get();
    return state.scenes.find((s) => s.id === state.currentSceneId);
  },
}));
