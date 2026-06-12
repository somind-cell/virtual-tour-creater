# 360° Panorama Tour Video Creator

Build a **simple, focused web application** using Next.js 14 (App Router) with TypeScript and Tailwind CSS for creating interactive 360° panorama tour videos.

---

## 🎯 Core Features (Only 3 Main Features)

### Feature 1: Upload Panorama Images
- **Drag-and-drop upload** of 360° panoramic images (JPG/PNG)
- Each uploaded image becomes a "scene"
- Display uploaded scenes as tabs
- Validate image format (warn if not 2:1 aspect ratio, but allow)
- Show image preview thumbnail
- Delete scene button

### Feature 2: Create Hotspots
- **Click anywhere on the panorama** to place a hotspot
- Hotspot records exact **yaw (horizontal) and pitch (vertical) position**
- Two hotspot types:
  - **Blue Navigation Hotspot** → Links to another scene
  - **Orange Info Hotspot** → Shows text label
- Each hotspot has:
  - `id` (unique)
  - `type` ('nav' or 'info')
  - `yaw` (0-360°)
  - `pitch` (-90 to 90°)
  - `label` (text)
  - `targetSceneId` (for nav type only)
- **Simple editor panel:**
  - Label input field
  - Type toggle (Nav / Info)
  - Target scene dropdown (for nav hotspots)
  - Delete button
- Hotspots visible as small icons on panorama
- Click hotspot to edit, hover to see label

### Feature 3: Generate Tour Video
- **"Generate Video" button** in toolbar
- Automated walkthrough that:
  1. Starts at Scene 1
  2. Slowly pans across the panorama (4-6 seconds)
  3. Smoothly animates camera toward first navigation hotspot
  4. Hotspot pulses
  5. Fades to next scene (0.8s crossfade)
  6. Repeats for all scenes
  7. Fades to black at end
- **Video settings popup:**
  - Seconds per scene (slider: 3-10s)
  - Include pan animation (toggle)
  - Resolution: 720p / 1080p
  - Transition style: Crossfade / Flash
- **Recording progress:**
  - Show progress bar
  - Current scene indicator
  - Red "REC" pulsing badge
- **After recording completes:**
  - Download WebM video file
  - Show download link + filename

---

## 📊 Data Structure (TypeScript)

```typescript
type HotspotType = 'nav' | 'info';

interface Hotspot {
  id: string;
  type: HotspotType;
  yaw: number;           // 0-360 degrees
  pitch: number;         // -90 to 90 degrees
  label: string;
  targetSceneId?: string; // for nav hotspots only
}

interface Scene {
  id: string;
  name: string;
  imageUrl: string;      // data URL or file path
  hotspots: Hotspot[];
}

interface TourState {
  scenes: Scene[];
  currentSceneId: string;
}
```

---

## 🖥️ UI Layout

```
┌────────────────────────────────────────────────────────┐
│ Toolbar: [+ Upload] | [Generate Video ▶] | [Settings ⚙] │
├────────────────────────────────────────────────────────┤
│ Scene 1 | Scene 2 | Scene 3                            │
├──────────────────────────────┬──────────────────────────┤
│                              │ Hotspots for Scene 1     │
│                              │ ─────────────────────── │
│   360° Panorama Viewer       │ • Label 1 (Nav)  [Edit]  │
│   (Click to place hotspots)  │ • Label 2 (Info) [Edit]  │
│                              │ • Label 3 (Nav)  [Edit]  │
│   🧭 N                       │                          │
│   Yaw: 45° Pitch: 15°       │ Hotspot Editor Panel     │
│                              │ ─────────────────────── │
│   [Blue dot] [Orange dot]   │ Label: [____________]    │
│   (Click to add hotspot)     │ Type: [Nav ▼]            │
│                              │ Target: [Scene 2 ▼]      │
│                              │ [Save] [Delete]          │
└──────────────────────────────┴──────────────────────────┘
```

---

## 🎬 Step-by-Step User Workflow

1. **Upload Images:**
   - Click "Upload" or drag-drop 2-3 panoramic images
   - They appear as tabs (Scene 1, Scene 2, Scene 3)
   
2. **Create Hotspots:**
   - Click on Scene 1 panorama → click a spot where you want a hotspot
   - Input label: "Enter Room 2"
   - Select type: Navigation
   - Choose target: Scene 2
   - Click Save
   
3. **Add More Hotspots:**
   - Click another spot on Scene 1
   - Input label: "Old Lamp"
   - Select type: Info
   - Click Save
   
4. **Link Scenes Together:**
   - Go to Scene 2
   - Add navigation hotspot → target: Scene 3
   - Go to Scene 3
   - Add info hotspots only
   
5. **Generate Video:**
   - Click "Generate Video" button
   - See progress bar
   - Download WebM file when done
   - Video shows automatic tour through all scenes

---

## 🔧 Technical Stack

| Purpose | Package |
|---------|---------|
| 360 viewer | `@photo-sphere-viewer/core` |
| Video recording | Browser `MediaRecorder` API (no install) |
| Animation | `gsap` |
| State management | `zustand` |
| UI components | `shadcn/ui` |
| Icons | `lucide-react` |
| File handling | `react-dropzone` |
| IDs | `uuid` |
| Styling | `tailwind-css` |
| Notifications | `sonner` |

---

## 🎨 Design Details

### Colors
- Navigation hotspot: **#3B82F6** (blue) with ChevronUp icon
- Info hotspot: **#F97316** (orange) with Info icon
- Active button: Underlined
- Hover effect: Scale 1.05 on hotspot icons

### Animations
- **Hotspot pulse:** 1.2s loop (scale 1.0 → 1.3 → 1.0)
- **Hotspot glow on hover:** Soft shadow expand
- **Scene pan:** Smooth camera drift (4-6 seconds)
- **Transition:** Crossfade between scenes (0.8s)
- **Recording badge:** Red "REC" pulsing every 0.8s

### Responsive
- Works on desktop (1024px+)
- Panorama viewer takes main space
- Hotspot list sidebar on right
- Stacks on tablet (hotspots below panorama)

---

## 🎬 Video Generation Details

### Recording Process

1. **Initialize:**
   ```typescript
   const stream = canvasElement.captureStream(30); // 30 fps
   const recorder = new MediaRecorder(stream, { 
     mimeType: 'video/webm;codecs=vp9'
   });
   ```

2. **For each scene:**
   - Load panorama image on canvas
   - Pan yaw slowly: 0° → 360° (4-6 seconds, depends on setting)
   - Animate pitch up/down slightly
   
3. **When nav hotspot exists:**
   - Stop pan animation
   - Smoothly rotate toward hotspot (yaw/pitch)
   - Zoom in slightly (FOV 60° → 45°)
   - Pulse the hotspot icon (animation effect)
   - Wait 1 second
   - Trigger transition (fade/flash)
   - Transition to next scene
   
4. **End of tour:**
   - Final scene pan
   - Fade to black (1 second)
   - Stop recording

### Using GSAP for Smooth Animation

```typescript
import gsap from 'gsap';

// Smoothly pan camera
gsap.to(camera, {
  yaw: targetYaw,
  pitch: targetPitch,
  duration: 3,
  ease: 'power2.inOut',
  onUpdate: () => {
    viewer.setPosition({ yaw: camera.yaw, pitch: camera.pitch });
  }
});
```

---

## ⚙️ Settings Modal

When user clicks "Generate Video":

```
┌──────────────────────────┐
│ Video Generation Settings│
├──────────────────────────┤
│ Seconds per scene:       │
│ [3s ────●────── 10s]     │
│                          │
│ Resolution:              │
│ ○ 720p  ● 1080p          │
│                          │
│ Include pan animation:   │
│ ☑ Yes                    │
│                          │
│ Transition style:        │
│ ○ Crossfade ● Flash      │
│                          │
│ [Cancel] [Generate Video]│
└──────────────────────────┘
```

---

## 📋 File Structure

```
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx                    # Main editor
├── components/
│   ├── PanoramaViewer.tsx          # 360° viewer + hotspot overlay
│   ├── HotspotEditor.tsx           # Edit panel (label, type, target)
│   ├── HotspotList.tsx             # Sidebar list of hotspots
│   ├── ScenesTabs.tsx              # Scene navigation tabs
│   ├── Toolbar.tsx                 # Upload, Generate Video buttons
│   ├── VideoSettings.tsx           # Settings dialog
│   └── RecordingProgress.tsx       # Progress bar + REC badge
├── hooks/
│   ├── useTourState.ts             # Main state management
│   ├── usePanoramaViewer.ts        # Viewer setup
│   └── useVideoRecorder.ts         # Recording logic
├── store/
│   └── tourStore.ts                # Zustand store
├── types/
│   └── index.ts                    # TypeScript interfaces
└── lib/
    ├── recordingEngine.ts          # MediaRecorder wrapper
    └── animationEngine.ts          # GSAP animations
```

---

## ✅ Minimal Success Criteria

✅ Upload multiple 360° images (drag-drop or file picker)
✅ Display scenes as clickable tabs
✅ Click panorama to place hotspots (blue for nav, orange for info)
✅ Edit hotspot label and target scene
✅ Delete hotspots
✅ Generate tour video with smooth pan + transitions
✅ Download WebM video file
✅ Hotspots animate during video playback
✅ Video exports without errors
✅ Works on desktop browsers (Chrome, Firefox, Safari, Edge)

---

## 🚀 Optional Enhancements (Phase 2)

- Save tour project as JSON
- Load previous tours
- Adjust hotspot position (drag on panorama)
- Trim video length
- Add background music
- Add voice-over narration
- Preview video before download
- Social media sharing (YouTube, etc.)
- Analytics (view count, click tracking)
- Mobile-responsive editing

---

## 💡 Example Usage Flow

**Scenario: Create a 3-scene museum tour video**

1. User uploads 3 panoramic images of museum galleries
2. In Scene 1 (Main Gallery):
   - Clicks center of panorama → adds nav hotspot "Go to Room 2" → target Scene 2
   - Clicks a painting → adds info hotspot "Mona Lisa (1503)"
3. In Scene 2 (Ancient Artifacts):
   - Adds nav hotspot "Next Room" → target Scene 3
   - Adds info hotspot "Roman Vase"
4. In Scene 3 (Modern Art):
   - Adds info hotspots only (dead end)
5. Clicks "Generate Video":
   - Settings: 5s per scene, 1080p, crossfade
   - Video generates automatically
   - Shows progress: "Recording Scene 1... Scene 2... Scene 3..."
6. Downloads "tour_video.webm"
7. Shares on website or social media

---

## 🎯 What Gets Generated

- A WebM video file (playable in any modern browser)
- Resolution: 720p or 1080p (user's choice)
- Duration: ~15-30 seconds (depends on scenes and settings)
- File size: 5-20MB
- Includes smooth camera pans, hotspot highlights, and scene transitions
- Can be embedded in websites, shared on social media, etc.

---

## 📝 Notes for Implementation

- Use `@photo-sphere-viewer/core` to render panoramas on canvas (not CSS background)
- Canvas must be accessible to `captureStream()` for recording
- Test video output in Chrome, Firefox, Safari
- Fallback: If WebM not supported, try MP4 via blob conversion
- Auto-save tour state to localStorage
- Show loading spinner while video is being generated
- Provide clear error messages if upload fails

---

**That's it!** A simple, focused tool for creating tour videos from 360° images. Perfect for real estate, museums, hotels, travel guides, and more. 🚀
