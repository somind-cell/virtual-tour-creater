import { useState, useCallback } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { PanoramaViewer } from '@/components/PanoramaViewer';
import { HotspotSidebar } from '@/components/HotspotSidebar';
import { UploadZone } from '@/components/UploadZone';
import { TourRecorder, defaultPreviewSettings } from '@/components/TourRecorder';
import { TourViewer } from '@/components/TourViewer';
import { useTourStore } from '@/store/tourStore';

const Index = () => {
  const scenes = useTourStore((s) => s.scenes);
  const hasScenes = scenes.length > 0;
  const [isRecording, setIsRecording] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleStartRecording = useCallback(() => {
    setTimeout(() => {
      (window as any).__tourRecorder?.start();
    }, 100);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toolbar
        isRecording={isRecording}
        onStartRecording={handleStartRecording}
        onViewTour={() => setViewerOpen(true)}
      />
      <div className="flex-1 flex overflow-hidden">
        {hasScenes ? (
          <>
            <PanoramaViewer />
            <HotspotSidebar />
          </>
        ) : (
          <UploadZone />
        )}
      </div>
      <TourRecorder
        isRecording={isRecording}
        onStart={() => setIsRecording(true)}
        onStop={() => setIsRecording(false)}
        settings={(window as any).__previewSettings || defaultPreviewSettings}
      />
      {viewerOpen && <TourViewer onClose={() => setViewerOpen(false)} />}
    </div>
  );
};

export default Index;
