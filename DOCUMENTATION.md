# Virtual Tour Creator — Complete Documentation

> A full-featured React SPA for creating interactive 360° panorama tours and video-based guided tours with hotspot navigation.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [Project Structure](#3-project-structure)
4. [Tech Stack & Dependencies](#4-tech-stack--dependencies)
5. [Core Data Types](#5-core-data-types)
6. [State Management](#6-state-management)
7. [Routing](#7-routing)
8. [Pages](#8-pages)
9. [Panorama Tour Components](#9-panorama-tour-components)
10. [Video Tour Components](#10-video-tour-components)
11. [Shared UI Library](#11-shared-ui-library)
12. [Styling & Theming](#12-styling--theming)
13. [Key Libraries & Integrations](#13-key-libraries--integrations)
14. [Data Flow](#14-data-flow)
15. [Browser API Usage](#15-browser-api-usage)
16. [Build & Deployment](#16-build--deployment)
17. [Testing](#17-testing)
18. [Performance Notes](#18-performance-notes)
19. [Error Handling](#19-error-handling)

---

## 1. Project Overview

**Virtual Tour Creator** is a client-side Single Page Application (SPA) that allows users to build two types of interactive tours:

| Tour Type | Description |
|-----------|-------------|
| **Panorama Tour** | 360° equirectangular images with navigation and information hotspots |
| **Video Tour** | MP4/WebM video scenes with time-coded interactive hotspots |

### Core Capabilities

- Upload and manage multiple panorama or video scenes
- Place navigation hotspots (link to another scene) and info hotspots (display text)
- View tours in an immersive fullscreen viewer
- Generate MP4 flythrough videos from panorama tours
- Persist video tour data via LocalStorage
- Export video tour definitions as JSON

---

## 2. Getting Started

### Prerequisites

- Node.js 16+
- npm

### Installation

```bash
cd /var/www/virtual-tour-creator
npm install
```

### Development Server

```bash
npm run dev
# Starts at http://localhost:8080
```

### Production Build

```bash
npm run build        # Output → dist/
npm run preview      # Serve dist/ locally
```

### Other Scripts

```bash
npm run lint          # ESLint check
npm run test          # Run tests once (Vitest)
npm run test:watch    # Watch mode
npm run build:dev     # Development-mode build
```

---

## 3. Project Structure

```
/var/www/virtual-tour-creator/
├── src/
│   ├── pages/
│   │   ├── Index.tsx                  # Panorama tour editor
│   │   ├── VideoTour.tsx              # Video tour editor
│   │   └── NotFound.tsx               # 404 page
│   │
│   ├── components/
│   │   │
│   │   ├── ── Panorama Tour ──
│   │   ├── Toolbar.tsx                # Mode buttons, scene tabs, export
│   │   ├── PanoramaViewer.tsx         # 360° image viewer + hotspot canvas
│   │   ├── HotspotSidebar.tsx         # Hotspot editor panel (panorama)
│   │   ├── UploadZone.tsx             # Drag-and-drop panorama images
│   │   ├── TourRecorder.tsx           # MP4 video generation engine
│   │   ├── TourViewer.tsx             # Immersive tour playback modal
│   │   ├── PreviewSettingsModal.tsx   # Settings for MP4 generation
│   │   │
│   │   ├── ── Video Tour ──
│   │   ├── VideoToolbar.tsx           # Toolbar for video editor
│   │   ├── VideoPlayer.tsx            # Video player + hotspot overlay
│   │   ├── VideoHotspotSidebar.tsx    # Hotspot editor panel (video)
│   │   ├── VideoUploadZone.tsx        # Drag-and-drop video files
│   │   ├── VideoSettingsModal.tsx     # Playback/transition settings
│   │   │
│   │   ├── NavLink.tsx                # Router-aware nav link
│   │   └── ui/                        # shadcn/ui component library (~50 files)
│   │
│   ├── store/
│   │   ├── tourStore.ts               # Zustand store — panorama tours
│   │   └── videoTourStore.ts          # Zustand store — video tours (persisted)
│   │
│   ├── types/
│   │   ├── tour.ts                    # Panorama tour interfaces
│   │   └── videoTour.ts               # Video tour interfaces
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx             # Mobile viewport detection
│   │   └── use-toast.ts               # Toast notification hook
│   │
│   ├── lib/
│   │   └── utils.ts                   # cn() — Tailwind class merger
│   │
│   ├── App.tsx                        # Root component with router
│   ├── main.tsx                       # React entry point
│   └── index.css                      # Global styles + CSS variables
│
├── vite.config.ts                     # Vite bundler configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── tsconfig.json / tsconfig.app.json  # TypeScript configuration
├── components.json                    # shadcn/ui configuration
├── vitest.config.ts                   # Test runner configuration
└── package.json                       # Dependencies & scripts
```

---

## 4. Tech Stack & Dependencies

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | DOM rendering |
| `typescript` | ^5.8.3 | Static typing |
| `vite` | ^5.4.19 | Bundler & dev server |
| `@vitejs/plugin-react-swc` | ^3.11.0 | React + SWC compiler |

### State & Data

| Package | Version | Purpose |
|---------|---------|---------|
| `zustand` | ^5.0.12 | Client state management |
| `@tanstack/react-query` | ^5.83.0 | Server state (ready for API) |
| `react-hook-form` | ^7.61.1 | Form state management |
| `zod` | ^3.25.76 | Schema validation |

### Panorama Viewer

| Package | Version | Purpose |
|---------|---------|---------|
| `@photo-sphere-viewer/core` | ^5.14.1 | 360° panorama renderer |
| `@photo-sphere-viewer/markers-plugin` | ^5.14.1 | Hotspot markers |
| `@photo-sphere-viewer/virtual-tour-plugin` | ^5.14.1 | Scene-to-scene navigation |
| `@photo-sphere-viewer/gallery-plugin` | ^5.14.1 | Scene thumbnail gallery |
| `three` | ^0.183.2 | 3D engine (PSV dependency) |

### Video Processing

| Package | Version | Purpose |
|---------|---------|---------|
| `mp4-muxer` | ^5.2.2 | MP4 container encoding |
| `framer-motion` | ^11.0.0 | Scene transition animations |

### UI & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^3.4.17 | Utility CSS framework |
| `@radix-ui/*` | Various | Headless UI primitives |
| `lucide-react` | ^0.462.0 | SVG icon library |
| `sonner` | ^1.7.4 | Toast notifications |
| `react-dropzone` | ^15.0.0 | File drag-and-drop |
| `gsap` | ^3.14.2 | Animation library |
| `clsx` + `tailwind-merge` | ^2.1.1 / ^2.6.0 | Class name utilities |

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `uuid` | ^13.0.0 | Unique ID generation |
| `date-fns` | ^3.6.0 | Date utilities |
| `recharts` | ^2.15.4 | Charts (available for analytics) |

---

## 5. Core Data Types

### Panorama Tour (`src/types/tour.ts`)

```typescript
type HotspotType = 'nav' | 'info';

interface Hotspot {
  id: string;               // UUID
  type: HotspotType;        // 'nav' = navigate to scene, 'info' = show label
  yaw: number;              // Horizontal angle in degrees (0–360)
  pitch: number;            // Vertical angle in degrees (-90 to +90)
  label: string;            // Display text
  targetSceneId?: string;   // Required when type = 'nav'
}

interface Scene {
  id: string;               // UUID
  name: string;             // Display name
  imageUrl: string;         // Equirectangular panorama image (data: or object URL)
  hotspots: Hotspot[];
}

type EditorMode = 'view' | 'add-nav' | 'add-info';
```

### Video Tour (`src/types/videoTour.ts`)

```typescript
type VideoHotspotType = 'nav' | 'info';

interface VideoHotspot {
  id: string;
  type: VideoHotspotType;
  time: number;             // Seconds from start when hotspot appears
  x: number;               // Horizontal position 0–100 (% from left)
  y: number;               // Vertical position 0–100 (% from top)
  label: string;
  targetSceneId?: string;  // Required when type = 'nav'
}

interface VideoScene {
  id: string;
  name: string;
  videoUrl: string;        // Object URL for uploaded video
  duration: number;        // Video duration in seconds
  hotspots: VideoHotspot[];
}

interface VideoSettings {
  transitionDuration: number;                          // 0.3–2.0 seconds
  autoPlayOnSwitch: boolean;                           // Resume on scene change
  hotspotLabelMode: 'always' | 'hover' | 'never';
}

type VideoEditorMode = 'view' | 'add-nav' | 'add-info';
```

---

## 6. State Management

### Panorama Tour Store (`src/store/tourStore.ts`)

Built with **Zustand** (no persistence — resets on page refresh).

#### State Shape

```typescript
{
  scenes: Scene[];
  currentSceneId: string | null;
  mode: EditorMode;
  editingHotspotId: string | null;
}
```

#### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setMode` | `(mode: EditorMode) => void` | Switch editor mode |
| `setCurrentScene` | `(id: string) => void` | Activate a scene |
| `setEditingHotspot` | `(id: string \| null) => void` | Select hotspot for edit |
| `addScene` | `(name, imageUrl) => void` | Add panorama scene |
| `removeScene` | `(id: string) => void` | Delete scene; auto-switch if current |
| `addHotspot` | `(sceneId, type, yaw, pitch) => void` | Create hotspot (auto-selects it) |
| `updateHotspot` | `(sceneId, hotspotId, updates) => void` | Partial update |
| `removeHotspot` | `(sceneId, hotspotId) => void` | Delete hotspot |
| `getCurrentScene` | `() => Scene \| undefined` | Get active scene object |

---

### Video Tour Store (`src/store/videoTourStore.ts`)

Built with **Zustand + persist middleware** — saves `scenes` and `settings` to `localStorage` under key `'video-tour-storage'`.

#### State Shape

```typescript
{
  scenes: VideoScene[];
  currentSceneId: string | null;
  mode: VideoEditorMode;
  editingHotspotId: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  settings: VideoSettings;
}
```

#### Actions

| Action | Description |
|--------|-------------|
| `addScene(name, videoUrl, duration)` | Add video scene |
| `removeScene(id)` | Delete scene |
| `renameScene(id, name)` | Rename scene |
| `addHotspot(sceneId, type, time, x, y)` | Create hotspot at position+time |
| `updateHotspot(sceneId, hotspotId, updates)` | Partial update |
| `removeHotspot(sceneId, hotspotId)` | Delete hotspot |
| `setIsPlaying(value)` | Control playback |
| `setIsMuted(value)` | Toggle audio |
| `setCurrentTime(value)` | Seek to time |
| `setSettings(partial)` | Update settings (merged) |
| `exportTourData()` | Returns JSON string of scenes + settings |

---

## 7. Routing

Configured in `src/App.tsx` using **React Router v6**.

```
/             →  Index.tsx       (Panorama Tour Editor)
/video-tour   →  VideoTour.tsx   (Video Tour Editor)
*             →  NotFound.tsx    (404)
```

Both top-level pages are independent — each with their own store, toolbar, viewer, and sidebar.

---

## 8. Pages

### `src/pages/Index.tsx` — Panorama Tour Editor

The main panorama editing page. Renders:

- **`Toolbar`** — scene management, mode switching, export
- **`UploadZone`** — shown when no scenes exist
- **`PanoramaViewer`** — 360° viewer (hidden when no scenes)
- **`HotspotSidebar`** — always visible when scenes exist
- **`TourViewer`** (modal) — immersive playback
- **`PreviewSettingsModal`** (modal) — MP4 generation settings
- **`TourRecorder`** — floating progress bar while generating

**Key local state:**
- `isRecording: boolean` — whether MP4 generation is running
- `viewerOpen: boolean` — whether immersive viewer is open

---

### `src/pages/VideoTour.tsx` — Video Tour Editor

The video editing page. Renders:

- **`VideoToolbar`** — mode, scenes, export/settings
- **`VideoUploadZone`** — shown when no scenes exist
- **`VideoPlayer`** — player + hotspot overlay
- **`VideoHotspotSidebar`** — hotspot editor
- **`VideoSettingsModal`** (modal) — playback settings

---

### `src/pages/NotFound.tsx` — 404 Page

Displays error message and a link back to `/`. Logs the unknown route via `console.error`.

---

## 9. Panorama Tour Components

### `Toolbar.tsx`

Control bar at the top of the panorama editor.

**Props:**
```typescript
{
  isRecording: boolean;
  onStartRecording: () => void;
  onViewTour: () => void;
}
```

**Features:**
- Mode buttons: View / +Nav / +Info
- Add Scene via file upload (react-dropzone, JPG/PNG)
- Validates equirectangular aspect ratio (~2:1 ± 0.15) and warns if off
- Scene tab list with thumbnail badges
- "View Tour" button → opens immersive viewer
- "Generate Video" button → opens PreviewSettingsModal
- Exposes video settings to `window.__previewSettings` for TourRecorder

---

### `PanoramaViewer.tsx`

Renders the 360° equirectangular panorama using **Photo Sphere Viewer**.

**Behavior:**
- Loads image from `currentScene.imageUrl`
- Registers a `MarkersPlugin` with one marker per hotspot
- **View mode:** click a nav hotspot → switches scene; click info → no action
- **Add-nav / Add-info mode:** clicking the panorama computes yaw/pitch from PSV and calls `addHotspot()`
- Cursor changes to crosshair in add modes

**Marker HTML:**
- Nav hotspot: blue circle with SVG arrow icon
- Info hotspot: orange circle with SVG "i" icon
- Delete button (red ✕) visible on hover

**Coordinate Conversion:**
- PSV returns radians → converted to degrees for the store
- Yaw: 0° = front center, increases clockwise
- Pitch: 0° = horizon, positive = up, negative = down

---

### `HotspotSidebar.tsx`

Right-side panel for inspecting and editing hotspots.

**Sections:**

1. **Hotspot list** — shows all hotspots in current scene with type icon and label
2. **Edit panel** — appears when a hotspot is selected (`editingHotspotId`)

**Edit panel fields:**

| Field | Type | Condition |
|-------|------|-----------|
| Type | Toggle (Nav / Info) | Always |
| Label | Text input | Always |
| Target Scene | Dropdown | type = 'nav' only |
| Yaw / Pitch | Display only | Always |
| Delete | Button | Always |

---

### `UploadZone.tsx`

Drag-and-drop landing zone for panorama images (shown when `scenes.length === 0`).

- Accepts `image/jpeg`, `image/png`
- On drop: creates object URL, validates aspect ratio, calls `addScene()`
- File name (without extension) becomes scene name
- Shows warning toast if image is not ~2:1

---

### `TourRecorder.tsx`

Generates an MP4 flythrough video from the panorama tour.

**Trigger:** called by `Index.tsx` when user confirms settings.

**Settings (`PreviewSettings`):**
```typescript
{
  secondsPerScene: number;    // 3–10 seconds per scene
  includePan: boolean;        // Pan camera to hotspot position
  quality: '720p' | '1080p'; // Output resolution
  transition: 'crossfade' | 'flash' | 'none';
}
```

**Encoding stack:**
- `VideoEncoder` Web API (Chrome/Edge 94+ only)
- `mp4-muxer` for container muxing
- `<canvas>` for frame rendering
- H.264 AVC codec, 30 FPS, 4–8 Mbps bitrate

**Rendering pipeline:**

```
1. Load all panorama images into Image elements
2. Build navigation path by following nav hotspots from scene[0]
3. For each scene in path:
   a. Hold panorama view at hotspot yaw/pitch for N seconds
   b. Render pulsing ring indicator (1.5s)
   c. Apply transition (crossfade / flash / cut) to next scene
4. Fade to black at end
5. Encode each frame via VideoEncoder
6. Finalize mp4-muxer → Uint8Array
7. Trigger browser download of .mp4 file
```

**Equirectangular projection algorithm:**

```typescript
// Crop a rectilinear viewport from the equirectangular image
const cx = ((IW/2 + (yaw/360) * IW) % IW + IW) % IW;
const cy = IH/2 - (pitch/180) * IH;
const cropW = (hFov/360) * IW;
const cropH = cropW * (H/W);
ctx.drawImage(img, cx - cropW/2, cy - cropH/2, cropW, cropH, 0, 0, W, H);
```

Wraps horizontally to support seamless left/right edge crossing.

**UI:** Floating card (top-right) with progress bar, scene name, and percentage.

---

### `TourViewer.tsx`

Fullscreen immersive tour player. Opens as a modal overlay from `Index.tsx`.

**Photo Sphere Viewer plugins:**

| Plugin | Role |
|--------|------|
| `VirtualTourPlugin` | 3D arrow markers for nav hotspots, scene transitions, preloading |
| `GalleryPlugin` | Thumbnail strip at bottom for quick scene jumping |
| `MarkersPlugin` | Info hotspot circles with popup labels |

**Controls (custom buttons):**
- Auto-rotate toggle
- Gallery show/hide
- Fullscreen
- Close (X)

**Scene indicator:** dot row showing current position.

---

### `PreviewSettingsModal.tsx`

Modal dialog for configuring MP4 export before recording starts.

**Fields:**
- Seconds per scene: Slider (3–10)
- Resolution: Radio (720p / 1080p)
- Include pan animation: Switch toggle
- Transition style: Radio (crossfade / flash / none)

Calls `onStartRecording(settings)` on confirm.

---

## 10. Video Tour Components

### `VideoToolbar.tsx`

Top control bar for the video editor.

**Features:**
- Mode buttons: View / +Nav / +Info
- Add Scene via video file upload (MP4, WebM)
- Export JSON — calls `exportTourData()` and triggers download
- Settings gear icon → opens `VideoSettingsModal`
- Scene tabs for switching between video scenes

---

### `VideoPlayer.tsx`

Video playback with interactive hotspot overlay.

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│   <video> element (black bg)    │
│                                 │
│  [hotspot] [hotspot]            │  ← absolute positioned overlays
│                                 │
├─────────────────────────────────┤
│  ▶  0:12 / 1:45  ──────●────  🔊 ⛶  │  ← controls bar
└─────────────────────────────────┘
```

**Hotspot display logic:**
- Hotspot shown if `|hotspot.time - currentTime| ≤ 0.5` seconds
- Position: `left: ${x}%`, `top: ${y}%` (absolute within video)
- Label visibility based on `settings.hotspotLabelMode`
- Pulsing ring animation via CSS keyframes

**Interaction modes:**
- **View mode:** Click nav hotspot → switch scene; click info → show label 2s
- **Add-nav/info mode:** Click video area → create hotspot at `(clickX%, clickY%, currentTime)`

**Auto-advance:** When video reaches `duration`, automatically navigates to the next scene (by index).

**Transitions:** `framer-motion` `AnimatePresence` fade overlay between scenes.

---

### `VideoHotspotSidebar.tsx`

Right-side panel for editing video hotspots.

**Features:**
- Hotspot list with type icon and timestamp
- Quick-add button (creates hotspot at current playback time)
- **Edit panel fields:**

| Field | Control | Notes |
|-------|---------|-------|
| Label | Text input | |
| Time | Slider (0 → duration) | Shows formatted time |
| Type | Dropdown | nav / info |
| Target Scene | Dropdown | Excludes current scene |
| X position | Slider (0–100%) | |
| Y position | Slider (0–100%) | |
| Delete | Button | |

---

### `VideoUploadZone.tsx`

Drag-and-drop zone for video files (shown when no scenes).

- Accepts `video/mp4`, `video/webm`
- Creates a hidden `<video>` element to extract `duration` via `loadedmetadata` event
- Calls `addScene(name, objectURL, duration)`

---

### `VideoSettingsModal.tsx`

Modal for configuring playback behavior.

**Settings:**
- Transition duration: Slider (0.3–2.0s)
- Auto-play on switch: Toggle switch
- Hotspot label mode: Select (always / hover / never)

Changes are saved immediately via `setSettings()` → persisted to LocalStorage.

---

## 11. Shared UI Library

Located at `src/components/ui/`. All components are from **shadcn/ui** (Radix UI primitives + Tailwind).

**Available components:**

```
accordion       alert           alert-dialog    aspect-ratio
avatar          badge           breadcrumb      button
calendar        card            carousel        chart
checkbox        collapsible     command         context-menu
dialog          drawer          dropdown-menu   form
hover-card      input           input-otp       label
menubar         navigation-menu pagination      popover
progress        radio-group     resizable       scroll-area
select          separator       sheet           sidebar
skeleton        slider          sonner          switch
table           tabs            textarea        toast
toggle          toggle-group    tooltip
```

**Usage pattern:**

```tsx
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
```

---

## 12. Styling & Theming

### Color System

Defined in `src/index.css` as CSS custom properties (HSL values). The app uses a **dark theme only**.

```css
:root {
  --background:    220 16% 10%;   /* dark blue-gray */
  --foreground:    210 20% 92%;   /* near-white */
  --primary:       217 91% 60%;   /* bright blue */
  --secondary:     220 14% 20%;
  --accent:         30 90% 55%;   /* bright orange */
  --destructive:     0 72% 51%;   /* red */
  --muted:         220 12% 18%;
  --border:        220 12% 22%;
  --card:          220 14% 14%;

  --nav-hotspot:   217 91% 60%;   /* same as primary */
  --info-hotspot:   30 90% 55%;   /* same as accent */
  --toolbar-bg:    220 16%  8%;
  --viewer-bg:     220 16%  6%;
}
```

### Custom Hotspot CSS

```css
.hotspot-nav      /* Blue 36×36px circle, border, box-shadow */
.hotspot-info     /* Orange variant */
.hotspot-delete   /* Red ✕ button, appears on hover */
.hotspot-tooltip  /* Label above marker */
.hotspot-pulse-ring  /* CSS @keyframes pulsing ring */
```

### Custom Viewer CSS

```css
.vtour-info-marker    /* Info hotspot in TourViewer */
.psv-gallery          /* Gallery panel (dark blur) */
.psv-virtual-tour__arrow  /* Nav arrow override */
```

### Tailwind Config (`tailwind.config.ts`)

- Content: `src/**/*.{ts,tsx}`
- Plugin: `tailwindcss-animate`
- Custom keyframes: `accordion-down`, `accordion-up`, `hotspot-pulse-ring`, `video-hotspot-pulse`

---

## 13. Key Libraries & Integrations

### Photo Sphere Viewer

The core library for rendering 360° equirectangular panoramas.

**Editor (`PanoramaViewer.tsx`):**
```typescript
const viewer = new Viewer({
  container: ref.current,
  panorama: imageUrl,
  plugins: [[MarkersPlugin, {}]],
  navbar: false,
  defaultZoomLvl: 50,
});
```

**Immersive Viewer (`TourViewer.tsx`):**
```typescript
plugins: [
  [VirtualTourPlugin, {
    nodes: scenes.map(sceneToNode),
    startNodeId: currentSceneId,
    preload: true,
    transitionOptions: { fadeDuration: 500 },
  }],
  [GalleryPlugin, { thumbnailSize: { width: 120, height: 60 } }],
  [MarkersPlugin, {}],
]
```

Each `VirtualTourNode` links nav hotspots as `links` pointing to other node IDs.

---

### Zustand

Minimal state library. No context providers needed.

```typescript
// Define store
const useStore = create<State & Actions>()((set, get) => ({
  value: 0,
  increment: () => set(s => ({ value: s.value + 1 })),
  getValue: () => get().value,
}));

// Use in component (granular subscription)
const value = useStore(s => s.value);
const increment = useStore(s => s.increment);
```

**Persist middleware** (video tour store):
```typescript
create(persist(stateCreator, {
  name: 'video-tour-storage',
  partialize: (s) => ({ scenes: s.scenes, settings: s.settings }),
}))
```

---

### mp4-muxer + VideoEncoder

Used by `TourRecorder.tsx` for MP4 generation.

```typescript
// Setup
const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc' } });
const encoder = new VideoEncoder({
  output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
  error: console.error,
});
encoder.configure({ codec: 'avc1.42001f', width: W, height: H, bitrate: 4_000_000 });

// Per frame
const frame = new VideoFrame(canvas, { timestamp: frameIndex * (1_000_000 / FPS) });
encoder.encode(frame, { keyFrame: frameIndex % 60 === 0 });
frame.close();

// Finalize
await encoder.flush();
muxer.finalize();
const { buffer } = muxer.target;
```

---

### Framer Motion

Used in `VideoPlayer.tsx` for scene transition overlays.

```tsx
<AnimatePresence>
  {transitioning && (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: settings.transitionDuration }}
      className="absolute inset-0 bg-black z-50"
    />
  )}
</AnimatePresence>
```

---

## 14. Data Flow

### Panorama Tour

```
User uploads image
  → UploadZone validates aspect ratio
  → useTourStore.addScene(name, dataURL)

PanoramaViewer mounts
  → Photo Sphere Viewer renders panorama
  → MarkersPlugin renders hotspot markers

User clicks panorama (add mode)
  → PSV click event fires with yaw/pitch (radians)
  → Convert to degrees
  → useTourStore.addHotspot(...)
  → HotspotSidebar auto-opens edit panel

User edits in HotspotSidebar
  → useTourStore.updateHotspot(...)
  → PanoramaViewer re-renders markers on store change

User clicks "View Tour"
  → TourViewer modal opens
  → Builds VirtualTour node graph from scenes
  → PSV VirtualTourPlugin enables arrow navigation

User clicks "Generate Video"
  → PreviewSettingsModal opens
  → On confirm: Index.tsx calls onStartRecording(settings)
  → TourRecorder encodes MP4 from canvas frames
  → Browser downloads .mp4 file
```

---

### Video Tour

```
User uploads video
  → VideoUploadZone extracts duration via HTMLVideoElement
  → videoTourStore.addScene(name, objectURL, duration)
  → Persisted to localStorage

VideoPlayer mounts
  → Loads video src from objectURL
  → On timeupdate: filters visible hotspots (|time - currentTime| ≤ 0.5)
  → Renders hotspot overlays absolutely positioned

User clicks video (add mode)
  → Compute x%, y% from click coords
  → videoTourStore.addHotspot(sceneId, type, currentTime, x, y)

User edits in VideoHotspotSidebar
  → videoTourStore.updateHotspot(...)

Video ends
  → VideoPlayer auto-advances to next scene by index

User clicks "Export"
  → videoTourStore.exportTourData() → JSON string
  → Browser downloads .json file
```

---

## 15. Browser API Usage

| Feature | API | Minimum Browser |
|---------|-----|-----------------|
| MP4 Video Encoding | `VideoEncoder` | Chrome 94 / Edge 94 |
| Video Frame | `VideoFrame` | Chrome 94 / Edge 94 |
| Canvas Rendering | `CanvasRenderingContext2D` | All modern |
| File API | `Blob`, `URL.createObjectURL` | All modern |
| HTML5 Video | `<video>` element | All modern |
| Fullscreen | `requestFullscreen()` | All modern |
| LocalStorage | `localStorage` | All modern |

**Security note:** `VideoEncoder` requires a **secure context** (HTTPS or `localhost`). If accessed via IP without HTTPS, `TourRecorder.tsx` shows a warning toast.

---

## 16. Build & Deployment

### Development

```bash
npm run dev
# Vite dev server: http://localhost:8080
# Hot module replacement enabled
# SWC compiler for fast builds
```

### Production Build

```bash
npm run build
# Output: dist/
# Code splitting, tree shaking, minification
# Cache-busted asset filenames
```

### Vite Config Highlights

```typescript
// vite.config.ts
export default defineConfig({
  server: { host: '::', port: 8080 },   // IPv4 + IPv6
  resolve: {
    alias: { '@': '/src' },
    dedupe: ['react', '@tanstack/react-query'],
  },
  plugins: [react(), lovableTagger()],   // lovableTagger in dev only
});
```

### Deployment Requirements

- **No backend required** — fully static files
- Serve `dist/` from any static host (Nginx, S3, Netlify, Vercel, etc.)
- HTTPS required for MP4 generation feature (`VideoEncoder`)
- All routing is client-side — configure server to serve `index.html` for all paths

**Example Nginx config:**
```nginx
location / {
  root /var/www/virtual-tour-creator/dist;
  try_files $uri $uri/ /index.html;
}
```

---

## 17. Testing

**Framework:** Vitest + @testing-library/react

```bash
npm run test          # Single run
npm run test:watch    # Watch mode
```

**Test file location:** `src/test/`

**Config (`vitest.config.ts`):**
- Environment: jsdom
- Setup file: `src/test/setup.ts`
- Globals: true

**Test utilities available:**
- `@testing-library/react` — render components
- `@testing-library/jest-dom` — DOM matchers (`toBeInTheDocument`, etc.)

---

## 18. Performance Notes

### Optimizations in Place

- **Zustand selector subscriptions** — components only re-render when their slice changes
- **useCallback** — prevents function recreation in effect dependencies
- **Canvas frame yielding** — `await new Promise(r => setTimeout(r, 0))` every 30 frames to prevent UI freeze during encoding
- **Image preloading** — all panoramas loaded before encoding starts
- **PSV preload: true** — virtual tour preloads adjacent scenes

### Potential Bottlenecks

| Scenario | Impact | Mitigation |
|----------|--------|------------|
| Panorama images > 20MB | Slow encoding | Recommend max 8K resolution |
| 10+ scenes with large images | High memory | Encode scenes sequentially, release refs |
| Many video hotspots | Filter re-renders | `visibleHotspots` computed on each frame |

---

## 19. Error Handling

### User-facing Toasts (Sonner)

| Condition | Message |
|-----------|---------|
| Image aspect ratio not ~2:1 | Warning toast with recommendation |
| VideoEncoder not supported | "Browser does not support video encoding" |
| Accessed via HTTP (non-local) | Warning about HTTPS requirement |
| Recording fails mid-way | "Recording failed" + error message |
| No scenes when recording | "Add scenes before recording" |

### Silent Fallbacks

- Image load fails → scene still added (broken image renders in PSV)
- Video metadata fails → duration defaults to `0`
- Unknown route → `NotFound.tsx` with redirect link

### Console Logging

- `PanoramaViewer`: Invalid yaw/pitch coordinates
- `TourRecorder`: VideoEncoder chunk errors
- `NotFound`: Unknown route path

---

*Generated from source code analysis — reflects the state of the codebase as of April 2026.*
