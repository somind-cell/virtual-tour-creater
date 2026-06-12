import { Navigation, Info, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTourStore } from '@/store/tourStore';

export function HotspotSidebar() {
  const {
    scenes,
    editingHotspotId,
    setEditingHotspot,
    updateHotspot,
    removeHotspot,
  } = useTourStore();
  const currentScene = useTourStore((s) => s.getCurrentScene());

  if (!currentScene) return null;

  const editingHotspot = currentScene.hotspots.find(
    (h) => h.id === editingHotspotId
  );

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Hotspots</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {currentScene.hotspots.length} hotspot
          {currentScene.hotspots.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {currentScene.hotspots.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <Navigation className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              No hotspots yet. Use the toolbar to add one.
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
                  onClick={() =>
                    setEditingHotspot(isEditing ? null : hotspot.id)
                  }
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm
                    transition-colors group
                    ${
                      isEditing
                        ? 'bg-primary/10 text-foreground'
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isNav ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                    }`}
                  >
                    {isNav ? (
                      <Navigation className="w-3 h-3" />
                    ) : (
                      <Info className="w-3 h-3" />
                    )}
                  </div>
                  <span className="truncate flex-1 text-xs font-medium">
                    {hotspot.label}
                  </span>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${
                      isEditing ? 'rotate-90' : ''
                    }`}
                  />
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
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Edit Hotspot
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => {
                removeHotspot(currentScene.id, editingHotspot.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Type toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <div className="flex gap-1">
              <button
                onClick={() => updateHotspot(currentScene.id, editingHotspot.id, { type: 'nav', targetSceneId: undefined })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  editingHotspot.type === 'nav'
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Navigation className="w-3 h-3" />
                Nav
              </button>
              <button
                onClick={() => updateHotspot(currentScene.id, editingHotspot.id, { type: 'info', targetSceneId: undefined })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  editingHotspot.type === 'info'
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/50'
                }`}
              >
                <Info className="w-3 h-3" />
                Info
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              value={editingHotspot.label}
              onChange={(e) =>
                updateHotspot(currentScene.id, editingHotspot.id, {
                  label: e.target.value,
                })
              }
              className="h-8 text-xs bg-background"
            />
          </div>

          {editingHotspot.type === 'nav' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Target Scene
              </Label>
              <Select
                value={editingHotspot.targetSceneId || ''}
                onValueChange={(value) =>
                  updateHotspot(currentScene.id, editingHotspot.id, {
                    targetSceneId: value,
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Select scene..." />
                </SelectTrigger>
                <SelectContent>
                  {scenes
                    .filter((s) => s.id !== currentScene.id)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 text-[10px] text-muted-foreground">
            <span>Yaw: {editingHotspot.yaw.toFixed(1)}°</span>
            <span>Pitch: {editingHotspot.pitch.toFixed(1)}°</span>
          </div>
        </div>
      )}
    </div>
  );
}
