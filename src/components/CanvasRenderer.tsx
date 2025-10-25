import React, { useRef, useEffect, useState } from 'react';

interface CanvasRendererProps {
  width?: number;
  height?: number;
  className?: string;
  showControls?: boolean;
  viewMode?: string;
  zoomLevel?: number;
  onZoomChange?: (level: number) => void;
  onViewModeChange?: (mode: string) => void;
  activeTool?: string;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  width = 800,
  height = 600,
  className = '',
  showControls = false,
  viewMode = 'fit',
  zoomLevel = 1,
  onZoomChange,
  onViewModeChange,
  activeTool = 'move'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(width);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas ayarları
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Temizleme fonksiyonu
    const clearCanvas = () => {
      ctx.clearRect(0, 0, width, height);
    };

    // Mouse olayları
    const startDrawing = (e: MouseEvent) => {
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setIsDrawing(false);
    };

    // Event listener'ları ekle
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Temizleme
    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [width, height, isDrawing]);

  return (
    <div className={`canvas-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg cursor-crosshair"
        style={{ backgroundColor: '#ffffff' }}
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
              }
            }
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear Canvas
        </button>
      </div>
    </div>
  );
};

export default CanvasRenderer;