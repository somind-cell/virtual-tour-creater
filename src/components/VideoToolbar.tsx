import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Eye, Navigation, Info, Plus, X, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoTourStore } from '@/store/videoTourStore';
import { VideoSettingsModal } from './VideoSettingsModal';
import { toast } from 'sonner';
import type { VideoEditorMode } from '@/types/videoTour';

export function VideoToolbar() {
  const { scenes, currentSceneId, mode, setMode, setCurrentScene, addScene, removeScene, exportTourData } =
    useVideoTourStore();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        const name = file.name.replace(/\.[^.]+$/, '');
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          addScene(name, url, video.duration);
          URL.revokeObjectURL(video.src);
        };
        video.src = url;
      });
    },
    [addScene]
  );

  const { getInputProps, open } = useDropzone({
    onDrop,
    accept: { 'video/mp4': [], 'video/webm': [] },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const handleExport = () => {
    const data = exportTourData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video-tour.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tour data exported');
  };

  const modeButtons: { mode: VideoEditorMode; icon: typeof Eye; label: string }[] = [
    { mode: 'view', icon: Eye, label: 'View' },
    { mode: 'add-nav', icon: Navigation, label: '+Nav' },
    { mode: 'add-info', icon: Info, label: '+Info' },
  ];

  return (
    <>
      <input {...getInputProps()} />
      <div className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--toolbar-bg))] border-b border-border">
        {/* Mode buttons */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {modeButtons.map((btn) => (
            <Button
              key={btn.mode}
              size="sm"
              variant={mode === btn.mode ? 'default' : 'ghost'}
              className={`h-8 gap-1.5 text-xs ${
                mode === btn.mode ? '' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMode(btn.mode)}
            >
              <btn.icon className="w-3.5 h-3.5" />
              {btn.label}
            </Button>
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={open}>
          <Plus className="w-3.5 h-3.5" />
          Add Scene
        </Button>

        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={handleExport} disabled={scenes.length === 0}>
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>

        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSettingsOpen(true)}>
          <Settings className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Scene tabs */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setCurrentScene(scene.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                whitespace-nowrap transition-colors group
                ${scene.id === currentSceneId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              {scene.name}
              <X
                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeScene(scene.id);
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <VideoSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
