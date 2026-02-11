import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageViewerModalProps {
  imageUrl: string;
  onClose: () => void;
  imageTitle?: string;
}

export default function ImageViewerModal({ imageUrl, onClose, imageTitle }: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-4">
            <h3 className="text-white font-semibold text-lg">
              {imageTitle || 'Visualizar Imagem'}
            </h3>
            <span className="text-white/70 text-sm">Zoom: {zoom}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 25}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 300}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-white/20 mx-2" />

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-black/30 rounded-lg flex items-center justify-center">
          <div className="p-8">
            <img
              src={imageUrl}
              alt={imageTitle || 'Imagem'}
              className="transition-all duration-300 ease-out"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                maxWidth: 'none',
                cursor: zoom > 100 ? 'grab' : 'default',
              }}
              draggable={false}
            />
          </div>
        </div>

        <div className="mt-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-center">
          <p className="text-white/70 text-sm">
            Clique fora da imagem ou pressione ESC para fechar
          </p>
        </div>
      </div>
    </div>
  );
}
