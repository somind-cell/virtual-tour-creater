import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Eye, Navigation, Info, Plus, X, Video, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTourStore } from '@/store/tourStore';
import { PreviewSettingsModal } from './PreviewSettingsModal';
import { defaultPreviewSettings, type PreviewSettings } from './TourRecorder';
import type { EditorMode } from '@/types/tour';
import { toast } from 'sonner';

interface ToolbarProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onViewTour: () => void;
}

export function Toolbar({ isRecording, onStartRecording, onViewTour }: ToolbarProps) {
  const { scenes, currentSceneId, mode, setMode, setCurrentScene, addScene, removeScene } =
    useTourStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<PreviewSettings>(defaultPreviewSettings);

  // Expose settings for the recorder
  (window as any).__previewSettings = settings;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        const name = file.name.replace(/\.[^.]+$/, '');
        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          if (Math.abs(ratio - 2) > 0.15) {
            toast.warning(`"${file.name}" may not be equirectangular (expected 2:1 ratio).`);
          }
          addScene(name, url);
        };
        img.onerror = () => addScene(name, url);
        img.src = url;
      });
    },
    [addScene]
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const modeButtons: { mode: EditorMode; icon: typeof Eye; label: string }[] = [
    { mode: 'view', icon: Eye, label: 'View' },
    { mode: 'add-nav', icon: Navigation, label: '+Nav' },
    { mode: 'add-info', icon: Info, label: '+Info' },
  ];

  return (
    <>
      <div
        {...getRootProps()}
        className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--toolbar-bg))] border-b border-border"
      >
        <input {...getInputProps()} />

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
              disabled={isRecording}
            >
              <btn.icon className="w-3.5 h-3.5" />
              {btn.label}
            </Button>
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Add Scene */}
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={open} disabled={isRecording}>
          <Plus className="w-3.5 h-3.5" />
          Add Scene
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* View Tour (immersive 360° viewer) */}
        <Button
          size="sm"
          variant="default"
          className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90"
          onClick={onViewTour}
          disabled={isRecording || scenes.length === 0}
        >
          <Play className="w-3.5 h-3.5" />
          View Tour
        </Button>

        {/* Generate Video */}
        <Button
          size="sm"
          variant="secondary"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setSettingsOpen(true)}
          disabled={isRecording || scenes.length === 0}
        >
          <Video className="w-3.5 h-3.5" />
          Generate Video
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Scene tabs */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setCurrentScene(scene.id)}
              disabled={isRecording}
              className={`
                flex items-center gap-2 pl-1 pr-2 py-1 rounded-md text-xs font-medium
                whitespace-nowrap transition-colors group
                ${
                  scene.id === currentSceneId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }
                ${isRecording ? 'pointer-events-none opacity-60' : ''}
              `}
            >
              <img
                src={scene.imageUrl}
                alt={scene.name}
                className="w-8 h-5 object-cover rounded-sm opacity-80 flex-shrink-0"
              />
              {scene.name}
              <X
                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive ml-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  removeScene(scene.id);
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <PreviewSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
        onGenerate={onStartRecording}
      />
    </>
  );
}
