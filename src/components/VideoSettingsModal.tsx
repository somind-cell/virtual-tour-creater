import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVideoTourStore } from '@/store/videoTourStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoSettingsModal({ open, onOpenChange }: Props) {
  const { settings, setSettings } = useVideoTourStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Video Tour Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Transition Duration ({settings.transitionDuration.toFixed(1)}s)</Label>
            <Slider
              value={[settings.transitionDuration]}
              min={0.3} max={2.0} step={0.1}
              onValueChange={([v]) => setSettings({ transitionDuration: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Auto-play on scene switch</Label>
            <Switch
              checked={settings.autoPlayOnSwitch}
              onCheckedChange={(v) => setSettings({ autoPlayOnSwitch: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Show hotspot labels</Label>
            <Select
              value={settings.hotspotLabelMode}
              onValueChange={(v) => setSettings({ hotspotLabelMode: v as any })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always" className="text-xs">Always</SelectItem>
                <SelectItem value="hover" className="text-xs">On Hover</SelectItem>
                <SelectItem value="never" className="text-xs">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
