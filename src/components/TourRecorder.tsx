import { useState, useRef, useCallback, useEffect } from 'react';
import { useTourStore } from '@/store/tourStore';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import type { Scene, Hotspot } from '@/types/tour';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PreviewSettings {
  secondsPerScene: number;
  includePan: boolean;
  quality: '720p' | '1080p';
  transition: 'crossfade' | 'flash' | 'none';
}

export const defaultPreviewSettings: PreviewSettings = {
  secondsPerScene: 5,
  includePan: true,
  quality: '1080p',
  transition: 'crossfade',
};

interface TourRecorderProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  settings: PreviewSettings;
}

interface NavStep {
  scene: Scene;
  navHotspot: Hotspot | null; // hotspot we pan TOWARD in this scene
}

// ─── Pure helpers (outside component, no hooks) ───────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

/** Smooth ease-in-out: 0 → 1 */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

/**
 * Build the ordered navigation path by following nav-hotspot links.
 * Stops when there are no more nav hotspots or a cycle is detected.
 */
const buildNavPath = (scenes: Scene[]): NavStep[] => {
  if (scenes.length === 0) return [];

  const path: NavStep[] = [];
  let current: Scene | undefined = scenes[0];
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const navHotspot = current.hotspots.find((h) => h.type === 'nav') ?? null;
    path.push({ scene: current, navHotspot });

    if (!navHotspot?.targetSceneId) break;
    current = scenes.find((s) => s.id === navHotspot.targetSceneId);
  }

  return path;
};

/**
 * Render a rectilinear viewport of an equirectangular panorama.
 *
 * - yaw  : degrees, 0 = centre of image, positive = right
 * - pitch: degrees, 0 = horizon, positive = up
 * - hFov : horizontal field-of-view in degrees (≈ 90 is a normal lens)
 */
const renderEquirectView = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  yaw: number,
  pitch: number,
  hFov: number,
  W: number,
  H: number,
) => {
  const IW = img.naturalWidth || img.width;
  const IH = img.naturalHeight || img.height;

  // Pixel in the equirectangular image corresponding to (yaw, pitch)
  const cx = ((IW / 2 + (yaw / 360) * IW) % IW + IW) % IW;
  const cy = IH / 2 - (pitch / 180) * IH;

  // How many source pixels correspond to the requested FOV
  const cropW = (hFov / 360) * IW;
  const cropH = cropW * (H / W); // keep output aspect ratio

  // Clamp vertical so we don't go off the image
  const srcY = Math.max(0, Math.min(IH - cropH, cy - cropH / 2));
  const x0 = cx - cropW / 2;
  const scaleX = W / cropW;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (x0 >= 0 && x0 + cropW <= IW) {
    // Simple: no horizontal wrap
    ctx.drawImage(img, x0, srcY, cropW, cropH, 0, 0, W, H);
  } else if (x0 < 0) {
    // Wrap: left portion comes from the right edge of the panorama
    const wrapLen = -x0;
    const mainLen = cropW - wrapLen;
    ctx.drawImage(img, IW - wrapLen, srcY, wrapLen, cropH, 0, 0, wrapLen * scaleX, H);
    ctx.drawImage(img, 0, srcY, mainLen, cropH, wrapLen * scaleX, 0, mainLen * scaleX, H);
  } else {
    // Wrap: right portion spills over the right edge
    const mainLen = IW - x0;
    const wrapLen = cropW - mainLen;
    ctx.drawImage(img, x0, srcY, mainLen, cropH, 0, 0, mainLen * scaleX, H);
    ctx.drawImage(img, 0, srcY, wrapLen, cropH, mainLen * scaleX, 0, wrapLen * scaleX, H);
  }
};

/**
 * Draw an animated hotspot indicator at the centre of the canvas.
 * phase: 0–1 loop counter (advances each frame)
 */
const drawHotspotIndicator = (
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  phase: number,
  isNav: boolean,
) => {
  const cx = W / 2;
  const cy = H / 2;
  const baseColor = isNav ? '59,130,246' : '249,115,22'; // blue : orange

  // Expanding pulsing ring
  const pulse = (Math.sin(phase * Math.PI * 2) + 1) / 2; // 0–1 oscillation
  const ringR = 28 + 20 * pulse;
  const ringAlpha = 0.9 - 0.6 * pulse;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${baseColor},${ringAlpha})`;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Solid inner dot
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${baseColor},0.95)`;
  ctx.fill();

  // Label tag above
  ctx.fillStyle = `rgba(${baseColor},0.85)`;
  ctx.beginPath();
  const tw = isNav ? 80 : 60;
  roundRect(ctx, cx - tw / 2, cy - 58, tw, 26, 6);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isNav ? '→ Go' : 'ℹ Info', cx, cy - 45);

  ctx.restore();
};

/** Polyfill-safe roundRect helper */
const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

/** Encode one canvas frame into the VideoEncoder. */
const encodeFrame = (
  canvas: HTMLCanvasElement,
  encoder: VideoEncoder,
  frameIdx: number,
  FPS: number,
) => {
  const frame = new VideoFrame(canvas, {
    timestamp: Math.round(frameIdx * (1_000_000 / FPS)),
    duration: Math.round(1_000_000 / FPS),
  });
  encoder.encode(frame, { keyFrame: frameIdx % (FPS * 2) === 0 });
  frame.close();
};

/** Crossfade-to-black, then crossfade-from-black into next scene. Returns updated frameIdx. */
const crossfade = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  encoder: VideoEncoder,
  fromImg: HTMLImageElement, fromYaw: number, fromPitch: number, fromFov: number,
  toImg: HTMLImageElement, toYaw: number, toPitch: number,
  W: number, H: number,
  frames: number,
  FPS: number,
  frameIdx: number,
  abortRef: React.MutableRefObject<boolean>,
): number => {
  // Fade out
  for (let f = 0; f <= frames; f++) {
    if (abortRef.current) return frameIdx;
    const alpha = f / frames;
    renderEquirectView(ctx, fromImg, fromYaw, fromPitch, fromFov, W, H);
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    encodeFrame(canvas, encoder, frameIdx++, FPS);
  }
  // Fade in directly at the next scene's hotspot position
  for (let f = 0; f <= frames; f++) {
    if (abortRef.current) return frameIdx;
    const alpha = 1 - f / frames;
    renderEquirectView(ctx, toImg, toYaw, toPitch, 90, W, H);
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    encodeFrame(canvas, encoder, frameIdx++, FPS);
  }
  return frameIdx;
};

/** Flash-white transition. Returns updated frameIdx. */
const flashTransition = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  encoder: VideoEncoder,
  toImg: HTMLImageElement, toYaw: number, toPitch: number,
  W: number, H: number,
  frames: number,
  FPS: number,
  frameIdx: number,
  abortRef: React.MutableRefObject<boolean>,
): number => {
  const half = Math.ceil(frames / 2);
  for (let f = 0; f <= half; f++) {
    if (abortRef.current) return frameIdx;
    ctx.fillStyle = `rgba(255,255,255,${f / half})`;
    ctx.fillRect(0, 0, W, H);
    encodeFrame(canvas, encoder, frameIdx++, FPS);
  }
  for (let f = 0; f <= half; f++) {
    if (abortRef.current) return frameIdx;
    const alpha = 1 - f / half;
    renderEquirectView(ctx, toImg, toYaw, toPitch, 90, W, H);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    encodeFrame(canvas, encoder, frameIdx++, FPS);
  }
  return frameIdx;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TourRecorder({ isRecording, onStart, onStop, settings }: TourRecorderProps) {
  const scenes = useTourStore((s) => s.scenes);
  const [progress, setProgress] = useState(0);
  const [currentRecScene, setCurrentRecScene] = useState('');
  const abortRef = useRef(false);
  const encoderRef = useRef<VideoEncoder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopRecording = useCallback(() => {
    abortRef.current = true;
    encoderRef.current?.close();
    encoderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (scenes.length === 0) {
      toast.error('No scenes to record');
      return;
    }

    if (!window.isSecureContext) {
      toast.error(
        'MP4 recording requires a secure context. Open the app via http://localhost (not an IP address) or HTTPS.',
        { duration: 8000 }
      );
      onStop();
      return;
    }

    if (!('VideoEncoder' in window)) {
      toast.error('MP4 encoding is not supported in this browser. Please use Chrome or Edge 94+.', { duration: 6000 });
      onStop();
      return;
    }

    // ── 1. Build the navigation path ─────────────────────────────────────────
    const path = buildNavPath(scenes);
    if (path.length === 0) {
      toast.error('Could not build tour path');
      return;
    }

    abortRef.current = false;
    onStart();

    // ── 2. Create the off-screen canvas ──────────────────────────────────────
    const isHD = settings.quality === '1080p';
    const W = isHD ? 1920 : 1280;
    const H = isHD ? 1080 : 720;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    Object.assign(canvas.style, {
      position: 'fixed', top: '0', left: '0',
      opacity: '0', pointerEvents: 'none', zIndex: '-9999',
      width: '1px', height: '1px',
    });
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // ── 3. Set up mp4-muxer + VideoEncoder ───────────────────────────────────
    const FPS = 30;
    const FRAMES_PER_SCENE = settings.secondsPerScene * FPS;
    const FADE_FRAMES = Math.round(FPS * 0.8); // 0.8 s fade
    const PULSE_FRAMES = Math.round(1.5 * FPS); // 1.5 s pulse

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: 'avc',
        width: W,
        height: H,
      },
      fastStart: 'in-memory',
    });

    let frameIdx = 0;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('VideoEncoder error:', e),
    });
    encoderRef.current = encoder;

    encoder.configure({
      codec: isHD ? 'avc1.640028' : 'avc1.42001f',
      width: W,
      height: H,
      bitrate: isHD ? 8_000_000 : 4_000_000,
      framerate: FPS,
    });

    toast('Encoding MP4…', { icon: '🔴' });

    // ── 4. Encode all frames ──────────────────────────────────────────────────
    try {
      setCurrentRecScene('Loading images…');

      const images = await Promise.all(
        path.map((step) => loadImage(step.scene.imageUrl))
      );

      for (let i = 0; i < path.length; i++) {
        if (abortRef.current) break;

        const { scene, navHotspot } = path[i];
        const img = images[i];

        setCurrentRecScene(scene.name);
        setProgress((i / path.length) * 100);

        const targetYaw = navHotspot ? navHotspot.yaw : 0;
        const targetPitch = navHotspot ? navHotspot.pitch : 0;
        const holdFov = settings.includePan ? 80 : 90;

        // ── Phase A: Hold at hotspot position ──────────────────────────────
        for (let f = 0; f < FRAMES_PER_SCENE; f++) {
          if (abortRef.current) break;
          renderEquirectView(ctx, img, targetYaw, targetPitch, holdFov, W, H);
          encodeFrame(canvas, encoder, frameIdx++, FPS);
          // Yield to UI every 30 frames so progress bar updates
          if (frameIdx % 30 === 0) await sleep(0);
        }

        if (abortRef.current) break;

        // ── Phase B: Pulse on the hotspot for 1.5 s ────────────────────────
        if (navHotspot) {
          const arrivedFov = settings.includePan ? 80 : 90;
          for (let f = 0; f < PULSE_FRAMES; f++) {
            if (abortRef.current) break;
            const phase = f / (FPS * 0.8); // full pulse cycle ≈ 0.8 s
            renderEquirectView(ctx, img, targetYaw, targetPitch, arrivedFov, W, H);
            drawHotspotIndicator(ctx, W, H, phase, navHotspot.type === 'nav');
            encodeFrame(canvas, encoder, frameIdx++, FPS);
            if (frameIdx % 30 === 0) await sleep(0);
          }
        }

        if (abortRef.current) break;

        // ── Phase C: Transition to next scene ──────────────────────────────
        const isLast = i === path.length - 1;
        if (!isLast) {
          const nextImg = images[i + 1];
          const arrivedFov = navHotspot && settings.includePan ? 80 : 90;
          const nextHotspot = path[i + 1].navHotspot;
          const nextStartYaw = nextHotspot ? nextHotspot.yaw : 0;
          const nextStartPitch = nextHotspot ? nextHotspot.pitch : 0;

          if (settings.transition === 'crossfade') {
            frameIdx = crossfade(
              ctx, canvas, encoder,
              img, targetYaw, targetPitch, arrivedFov,
              nextImg, nextStartYaw, nextStartPitch,
              W, H, FADE_FRAMES, FPS, frameIdx, abortRef,
            );
          } else if (settings.transition === 'flash') {
            frameIdx = flashTransition(
              ctx, canvas, encoder,
              nextImg, nextStartYaw, nextStartPitch,
              W, H, FADE_FRAMES, FPS, frameIdx, abortRef,
            );
          } else {
            // No transition: one frame cut at next hotspot position
            renderEquirectView(ctx, nextImg, nextStartYaw, nextStartPitch, 90, W, H);
            encodeFrame(canvas, encoder, frameIdx++, FPS);
          }
          await sleep(0);
        }

        setProgress(((i + 1) / path.length) * 100);
      }

      // ── Final fade to black ───────────────────────────────────────────────
      if (!abortRef.current) {
        const lastImg = images[path.length - 1];
        const lastStep = path[path.length - 1];
        const lastYaw = lastStep.navHotspot?.yaw ?? 0;
        const lastPitch = lastStep.navHotspot?.pitch ?? 0;
        const lastFov = lastStep.navHotspot && settings.includePan ? 80 : 90;

        for (let f = 0; f <= FPS; f++) {
          renderEquirectView(ctx, lastImg, lastYaw, lastPitch, lastFov, W, H);
          ctx.fillStyle = `rgba(0,0,0,${f / FPS})`;
          ctx.fillRect(0, 0, W, H);
          encodeFrame(canvas, encoder, frameIdx++, FPS);
        }
        setProgress(100);
      }

      // ── Finalize and download ─────────────────────────────────────────────
      if (!abortRef.current) {
        await encoder.flush();
        muxer.finalize();

        const buffer = target.buffer;
        const blob = new Blob([buffer], { type: 'video/mp4' });

        if (blob.size < 1000) {
          toast.error('Recording was empty — try again.');
        } else {
          const filename = `tour_video_${new Date().toISOString().slice(0, 10)}.mp4`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(`Saved as "${filename}"`, { duration: 6000 });
        }
      }
    } catch (err) {
      console.error('Recording error:', err);
      toast.error('Recording failed — see console.');
    } finally {
      if (canvasRef.current && document.body.contains(canvasRef.current)) {
        document.body.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
      if (encoderRef.current?.state !== 'closed') {
        encoderRef.current?.close();
      }
      encoderRef.current = null;
      onStop();
    }
  }, [scenes, settings, onStart, onStop]);

  useEffect(() => {
    (window as any).__tourRecorder = { start: startRecording, stop: stopRecording };
    return () => { delete (window as any).__tourRecorder; };
  }, [startRecording, stopRecording]);

  if (!isRecording) return null;

  const sceneIndex = scenes.findIndex((s) => s.name === currentRecScene);

  return (
    <div className="fixed top-4 right-4 z-[101] flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2.5 shadow-xl">
        <div className="flex items-center gap-1.5 bg-destructive/20 rounded-md px-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-bold text-destructive tracking-widest">REC</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-foreground truncate max-w-36">
            {currentRecScene || 'Preparing…'}
          </span>
          {sceneIndex >= 0 && (
            <span className="text-[10px] text-muted-foreground">
              Scene {sceneIndex + 1} of {scenes.length}
            </span>
          )}
        </div>
        <button
          onClick={stopRecording}
          className="ml-2 text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded hover:bg-destructive/80 transition-colors"
        >
          Stop
        </button>
      </div>

      <div className="w-64 space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Recording progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}
