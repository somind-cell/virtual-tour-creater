import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Play } from 'lucide-react';
import type { PreviewSettings } from './TourRecorder';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PreviewSettings;
  onSettingsChange: (settings: PreviewSettings) => void;
  onGenerate?: () => void;
}

export function PreviewSettingsModal({ open, onOpenChange, settings, onSettingsChange, onGenerate }: Props) {
  const update = <K extends keyof PreviewSettings>(key: K, value: PreviewSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleGenerate = () => {
    onOpenChange(false);
    onGenerate?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Video Generation Settings</DialogTitle>
          <DialogDescription>Configure your automated tour walkthrough video.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Seconds per scene */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Seconds per scene</Label>
              <span className="text-sm font-mono text-muted-foreground">{settings.secondsPerScene}s</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>3s</span>
              <Slider
                value={[settings.secondsPerScene]}
                onValueChange={([v]) => update('secondsPerScene', v)}
                min={3}
                max={10}
                step={1}
                className="flex-1"
              />
              <span>10s</span>
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label>Resolution</Label>
            <div className="flex gap-3">
              {(['720p', '1080p'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => update('quality', q)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    settings.quality === q
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    settings.quality === q ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {settings.quality === q && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </span>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Include pan */}
          <div className="flex items-center justify-between">
            <Label>Include pan animation</Label>
            <Switch
              checked={settings.includePan}
              onCheckedChange={(v) => update('includePan', v)}
            />
          </div>

          {/* Transition style */}
          <div className="space-y-2">
            <Label>Transition style</Label>
            <div className="flex gap-3">
              {(['crossfade', 'flash', 'none'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => update('transition', t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors capitalize ${
                    settings.transition === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    settings.transition === t ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {settings.transition === t && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </span>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="gap-1.5">
            <Play className="w-3.5 h-3.5" />
            Generate Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
