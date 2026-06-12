import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video } from 'lucide-react';
import { useVideoTourStore } from '@/store/videoTourStore';

export function VideoUploadZone() {
  const addScene = useVideoTourStore((s) => s.addScene);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        const name = file.name.replace(/\.[^.]+$/, '');
        // Get duration from video element
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': [], 'video/webm': [] },
    multiple: true,
  });

  return (
    <div className="flex-1 flex items-center justify-center bg-[hsl(var(--viewer-bg))]">
      <div
        {...getRootProps()}
        className={`
          flex flex-col items-center justify-center gap-4 p-16 rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {isDragActive ? (
            <Video className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            {isDragActive ? 'Drop videos here' : 'Upload Video Scenes'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Drag & drop MP4 or WebM video files (max 20MB each)
          </p>
        </div>
      </div>
    </div>
  );
}
