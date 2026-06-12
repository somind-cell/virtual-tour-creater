import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Info, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useVideoTourStore } from '@/store/videoTourStore';
import { toast } from 'sonner';
import type { VideoHotspot } from '@/types/videoTour';

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    scenes,
    currentSceneId,
    mode,
    isPlaying,
    isMuted,
    currentTime,
    settings,
    setCurrentScene,
    setIsPlaying,
    setIsMuted,
    setCurrentTime,
    addHotspot,
  } = useVideoTourStore();

  const currentScene = useVideoTourStore((s) => s.getCurrentScene());
  const [transitioning, setTransitioning] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>();

  // Sync video state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentScene) return;

    video.src = currentScene.videoUrl;
    video.currentTime = 0;
    video.muted = isMuted;

    if (settings.autoPlayOnSwitch) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentSceneId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  // Time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => setCurrentTime(video.currentTime);
    video.addEventListener('timeupdate', handler);
    return () => video.removeEventListener('timeupdate', handler);
  }, [setCurrentTime]);

  // Auto-transition on video end
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => {
      const idx = scenes.findIndex((s) => s.id === currentSceneId);
      if (idx < scenes.length - 1) {
        handleSceneTransition(scenes[idx + 1].id);
      } else {
        setIsPlaying(false);
        toast('Tour Complete', { description: 'You have viewed all scenes.' });
      }
    };
    video.addEventListener('ended', handler);
    return () => video.removeEventListener('ended', handler);
  }, [scenes, currentSceneId]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !currentScene) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * (currentScene.duration || video.duration);
  }, [currentScene]);

  const handleSceneTransition = useCallback((targetId: string) => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentScene(targetId);
      const target = scenes.find((s) => s.id === targetId);
      if (target) toast(`Scene: ${target.name}`);
      setTimeout(() => setTransitioning(false), settings.transitionDuration * 500);
    }, settings.transitionDuration * 500);
  }, [scenes, settings.transitionDuration, setCurrentScene]);

  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'view') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (!currentScene) return;
    addHotspot(currentScene.id, {
      type: mode === 'add-nav' ? 'nav' : 'info',
      time: currentTime,
      x,
      y,
      label: mode === 'add-nav' ? 'Go to...' : 'Info',
    });
    toast.success(`${mode === 'add-nav' ? 'Navigation' : 'Info'} hotspot added at ${currentTime.toFixed(1)}s`);
  }, [mode, currentScene, currentTime, addHotspot]);

  const handleHotspotClick = useCallback((hotspot: VideoHotspot) => {
    if (hotspot.type === 'nav' && hotspot.targetSceneId) {
      handleSceneTransition(hotspot.targetSceneId);
    } else {
      setShowTooltip(hotspot.id);
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = setTimeout(() => setShowTooltip(null), 2000);
    }
  }, [handleSceneTransition]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const visibleHotspots = currentScene?.hotspots.filter(
    (h) => Math.abs(h.time - currentTime) <= 0.5
  ) ?? [];

  const duration = currentScene?.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentScene) return null;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-[hsl(var(--viewer-bg))] relative overflow-hidden">
      {/* Transition overlay */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            key="transition"
            className="absolute inset-0 bg-background z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: settings.transitionDuration / 2 }}
          />
        )}
      </AnimatePresence>

      {/* Video + Hotspot area */}
      <div
        className="flex-1 relative cursor-crosshair"
        onClick={handleVideoClick}
        style={{ cursor: mode === 'view' ? 'default' : 'crosshair' }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          playsInline
        />

        {/* Hotspot overlays */}
        <AnimatePresence>
          {visibleHotspots.map((hotspot) => {
            const isNav = hotspot.type === 'nav';
            return (
              <motion.button
                key={hotspot.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
                className="absolute z-20 group"
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHotspotClick(hotspot);
                }}
              >
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full animate-[video-hotspot-pulse_1.2s_ease-in-out_infinite]"
                  style={{
                    backgroundColor: isNav ? 'hsl(var(--nav-hotspot) / 0.3)' : 'hsl(var(--info-hotspot) / 0.3)',
                  }}
                />
                {/* Icon */}
                <span
                  className={`
                    relative flex items-center justify-center w-9 h-9 rounded-full
                    transition-all duration-200 group-hover:scale-125
                    ${isNav
                      ? 'bg-[hsl(var(--nav-hotspot))] shadow-[0_0_12px_hsl(var(--nav-hotspot)/0.5)] group-hover:shadow-[0_0_24px_hsl(var(--nav-hotspot)/0.7)]'
                      : 'bg-[hsl(var(--info-hotspot))] shadow-[0_0_12px_hsl(var(--info-hotspot)/0.5)] group-hover:shadow-[0_0_24px_hsl(var(--info-hotspot)/0.7)]'
                    }
                  `}
                >
                  {isNav ? <ChevronUp className="w-4 h-4 text-white" /> : <Info className="w-4 h-4 text-white" />}
                </span>

                {/* Label tooltip */}
                {(settings.hotspotLabelMode === 'always' ||
                  (settings.hotspotLabelMode === 'hover') ||
                  showTooltip === hotspot.id) && (
                  <span className={`
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-md
                    text-xs font-medium whitespace-nowrap pointer-events-none
                    bg-card text-card-foreground border border-border shadow-md
                    ${settings.hotspotLabelMode === 'hover' && showTooltip !== hotspot.id
                      ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                      : 'opacity-100'}
                  `}>
                    {hotspot.label}
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[hsl(var(--toolbar-bg))] border-t border-border">
        <button onClick={togglePlay} className="text-foreground hover:text-primary transition-colors">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        {/* Progress bar */}
        <div
          className="flex-1 h-1.5 bg-muted rounded-full cursor-pointer relative group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-100 relative"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
          </div>
        </div>

        <span className="text-xs text-muted-foreground font-mono min-w-[80px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button onClick={() => setIsMuted(!isMuted)} className="text-foreground hover:text-primary transition-colors">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button onClick={toggleFullscreen} className="text-foreground hover:text-primary transition-colors">
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
