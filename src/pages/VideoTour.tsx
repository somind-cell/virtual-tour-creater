import { VideoToolbar } from '@/components/VideoToolbar';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoHotspotSidebar } from '@/components/VideoHotspotSidebar';
import { VideoUploadZone } from '@/components/VideoUploadZone';
import { useVideoTourStore } from '@/store/videoTourStore';

const VideoTour = () => {
  const scenes = useVideoTourStore((s) => s.scenes);
  const hasScenes = scenes.length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <VideoToolbar />
      <div className="flex-1 flex overflow-hidden">
        {hasScenes ? (
          <>
            <VideoPlayer />
            <VideoHotspotSidebar />
          </>
        ) : (
          <VideoUploadZone />
        )}
      </div>
    </div>
  );
};

export default VideoTour;
