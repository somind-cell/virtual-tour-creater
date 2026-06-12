import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image } from 'lucide-react';
import { useTourStore } from '@/store/tourStore';
import { toast } from 'sonner';

export function UploadZone() {
  const addScene = useTourStore((s) => s.addScene);

  const checkAspectRatio = (file: File, url: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (Math.abs(ratio - 2) > 0.15) {
          toast.warning(`"${file.name}" doesn't appear to be a 2:1 equirectangular image. The panorama may look distorted.`);
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        const name = file.name.replace(/\.[^.]+$/, '');
        checkAspectRatio(file, url).then(() => {
          addScene(name, url);
        });
      });
    },
    [addScene]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
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
            <Image className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            {isDragActive ? 'Drop panoramas here' : 'Upload 360° Panoramas'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Drag & drop equirectangular images (JPG/PNG, 2:1 ratio)
          </p>
        </div>
      </div>
    </div>
  );
}
