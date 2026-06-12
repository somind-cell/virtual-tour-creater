import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { VideoScene, VideoHotspot, VideoHotspotType, VideoEditorMode, VideoSettings } from '@/types/videoTour';

interface VideoTourStore {
  scenes: VideoScene[];
  currentSceneId: string | null;
  mode: VideoEditorMode;
  editingHotspotId: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  settings: VideoSettings;

  setMode: (mode: VideoEditorMode) => void;
  setCurrentScene: (id: string) => void;
  setEditingHotspot: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setCurrentTime: (time: number) => void;
  setSettings: (settings: Partial<VideoSettings>) => void;

  addScene: (name: string, videoUrl: string, duration: number) => void;
  removeScene: (id: string) => void;
  renameScene: (id: string, name: string) => void;

  addHotspot: (sceneId: string, hotspot: Omit<VideoHotspot, 'id'>) => void;
  updateHotspot: (sceneId: string, hotspotId: string, updates: Partial<VideoHotspot>) => void;
  removeHotspot: (sceneId: string, hotspotId: string) => void;

  getCurrentScene: () => VideoScene | undefined;
  exportTourData: () => string;
}

export const useVideoTourStore = create<VideoTourStore>()(
  persist(
    (set, get) => ({
      scenes: [],
      currentSceneId: null,
      mode: 'view',
      editingHotspotId: null,
      isPlaying: false,
      isMuted: false,
      currentTime: 0,
      settings: {
        transitionDuration: 0.8,
        autoPlayOnSwitch: true,
        hotspotLabelMode: 'hover',
      },

      setMode: (mode) => set({ mode }),
      setCurrentScene: (id) => set({ currentSceneId: id, editingHotspotId: null, currentTime: 0 }),
      setEditingHotspot: (id) => set({ editingHotspotId: id }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setIsMuted: (muted) => set({ isMuted: muted }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),

      addScene: (name, videoUrl, duration) => {
        const id = uuidv4();
        set((state) => ({
          scenes: [...state.scenes, { id, name, videoUrl, duration, hotspots: [] }],
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

      renameScene: (id, name) => {
        set((state) => ({
          scenes: state.scenes.map((s) => (s.id === id ? { ...s, name } : s)),
        }));
      },

      addHotspot: (sceneId, hotspotData) => {
        const hotspot: VideoHotspot = { ...hotspotData, id: uuidv4() };
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
              ? { ...s, hotspots: s.hotspots.map((h) => (h.id === hotspotId ? { ...h, ...updates } : h)) }
              : s
          ),
        }));
      },

      removeHotspot: (sceneId, hotspotId) => {
        set((state) => ({
          scenes: state.scenes.map((s) =>
            s.id === sceneId ? { ...s, hotspots: s.hotspots.filter((h) => h.id !== hotspotId) } : s
          ),
          editingHotspotId: state.editingHotspotId === hotspotId ? null : state.editingHotspotId,
        }));
      },

      getCurrentScene: () => {
        const state = get();
        return state.scenes.find((s) => s.id === state.currentSceneId);
      },

      exportTourData: () => {
        const { scenes, settings } = get();
        return JSON.stringify({ scenes, settings }, null, 2);
      },
    }),
    {
      name: 'video-tour-storage',
      partialize: (state) => ({
        scenes: state.scenes,
        settings: state.settings,
      }),
    }
  )
);
