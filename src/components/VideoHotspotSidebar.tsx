import { Navigation, Info, Trash2, ChevronRight, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVideoTourStore } from '@/store/videoTourStore';

export function VideoHotspotSidebar() {
  const {
    scenes,
    editingHotspotId,
    currentTime,
    setEditingHotspot,
    updateHotspot,
    removeHotspot,
    addHotspot,
  } = useVideoTourStore();
  const currentScene = useVideoTourStore((s) => s.getCurrentScene());

  if (!currentScene) return null;

  const editingHotspot = currentScene.hotspots.find((h) => h.id === editingHotspotId);

  const handleAddHotspot = () => {
    addHotspot(currentScene.id, {
      type: 'info',
      time: currentTime,
      x: 50,
      y: 50,
      label: 'New Hotspot',
    });
  };

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Hotspots</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentScene.hotspots.length} hotspot{currentScene.hotspots.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={handleAddHotspot}>
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {currentScene.hotspots.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <Navigation className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              No hotspots yet. Click "Add" or use the toolbar modes.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {currentScene.hotspots.map((hotspot) => {
              const isNav = hotspot.type === 'nav';
              const isEditing = editingHotspotId === hotspot.id;
              return (
                <button
                  key={hotspot.id}
                  onClick={() => setEditingHotspot(isEditing ? null : hotspot.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm
                    transition-colors group
                    ${isEditing
                      ? 'bg-primary/10 text-foreground'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isNav ? 'bg-[hsl(var(--nav-hotspot)/0.2)] text-[hsl(var(--nav-hotspot))]' : 'bg-[hsl(var(--info-hotspot)/0.2)] text-[hsl(var(--info-hotspot))]'
                  }`}>
                    {isNav ? <Navigation className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="truncate block text-xs font-medium">{hotspot.label}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {hotspot.time.toFixed(1)}s
                    </span>
                  </div>
                  <ChevronRight className={`w-3 h-3 transition-transform ${isEditing ? 'rotate-90' : ''}`} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Panel */}
      {editingHotspot && currentScene && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Edit Hotspot</h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => removeHotspot(currentScene.id, editingHotspot.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              value={editingHotspot.label}
              onChange={(e) => updateHotspot(currentScene.id, editingHotspot.id, { label: e.target.value })}
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Time ({editingHotspot.time.toFixed(1)}s)</Label>
            <Slider
              value={[editingHotspot.time]}
              min={0}
              max={currentScene.duration || 60}
              step={0.1}
              onValueChange={([v]) => updateHotspot(currentScene.id, editingHotspot.id, { time: v })}
              className="py-1"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={editingHotspot.type}
              onValueChange={(v) => updateHotspot(currentScene.id, editingHotspot.id, { type: v as 'nav' | 'info' })}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nav" className="text-xs">Navigation</SelectItem>
                <SelectItem value="info" className="text-xs">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editingHotspot.type === 'nav' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Target Scene</Label>
              <Select
                value={editingHotspot.targetSceneId || ''}
                onValueChange={(v) => updateHotspot(currentScene.id, editingHotspot.id, { targetSceneId: v })}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Select scene..." />
                </SelectTrigger>
                <SelectContent>
                  {scenes.filter((s) => s.id !== currentScene.id).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground">X: {editingHotspot.x.toFixed(0)}%</span>
                <Slider
                  value={[editingHotspot.x]}
                  min={0} max={100} step={1}
                  onValueChange={([v]) => updateHotspot(currentScene.id, editingHotspot.id, { x: v })}
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Y: {editingHotspot.y.toFixed(0)}%</span>
                <Slider
                  value={[editingHotspot.y]}
                  min={0} max={100} step={1}
                  onValueChange={([v]) => updateHotspot(currentScene.id, editingHotspot.id, { y: v })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
