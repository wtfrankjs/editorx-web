/**
 * @fileoverview Crop Overlay component
 * @module components/Canvas/CropOverlay
 * @description Renders crop overlay with draggable area and handles
 */

import React, { memo } from 'react';
import { RENDER_CONFIG } from '../../constants/canvas';

interface CropOverlayProps {
  cropRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  canvasBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  zoomLevel: number;
  onCropAreaMouseDown: (e: React.MouseEvent) => void;
  onCropHandleMouseDown: (handle: string, e: React.MouseEvent) => void;
}

type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const CROP_HANDLES: CropHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const CROP_HANDLE_CURSORS: Record<CropHandle, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
};

/**
 * CropOverlay component - Renders crop selection overlay
 * Includes darkened areas outside crop, crop border, and resize handles
 */
const CropOverlay = memo<CropOverlayProps>(({
  cropRect,
  canvasBounds,
  zoomLevel,
  onCropAreaMouseDown,
  onCropHandleMouseDown,
}) => {
  const handleSize = RENDER_CONFIG.HANDLE_SIZE / zoomLevel;

  /**
   * Get crop handle position based on direction
   */
  const getCropHandlePosition = (handle: CropHandle): { x: number; y: number } => {
    const halfWidth = cropRect.width / 2;
    const halfHeight = cropRect.height / 2;
    const offset = handleSize / 2;

    const positions: Record<CropHandle, { x: number; y: number }> = {
      nw: { x: cropRect.x - offset, y: cropRect.y - offset },
      n: { x: cropRect.x + halfWidth - offset, y: cropRect.y - offset },
      ne: { x: cropRect.x + cropRect.width - offset, y: cropRect.y - offset },
      e: { x: cropRect.x + cropRect.width - offset, y: cropRect.y + halfHeight - offset },
      se: { x: cropRect.x + cropRect.width - offset, y: cropRect.y + cropRect.height - offset },
      s: { x: cropRect.x + halfWidth - offset, y: cropRect.y + cropRect.height - offset },
      sw: { x: cropRect.x - offset, y: cropRect.y + cropRect.height - offset },
      w: { x: cropRect.x - offset, y: cropRect.y + halfHeight - offset },
    };

    return positions[handle];
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Dark overlay - Top */}
      <div
        className="absolute bg-black/60 pointer-events-auto"
        style={{
          left: `${Math.round(canvasBounds.x)}px`,
          top: `${Math.round(canvasBounds.y)}px`,
          width: `${Math.round(canvasBounds.width)}px`,
          height: `${Math.round(cropRect.y - canvasBounds.y)}px`,
        }}
      />

      {/* Dark overlay - Bottom */}
      <div
        className="absolute bg-black/60 pointer-events-auto"
        style={{
          left: `${Math.round(canvasBounds.x)}px`,
          top: `${Math.round(cropRect.y + cropRect.height)}px`,
          width: `${Math.round(canvasBounds.width)}px`,
          height: `${Math.round(canvasBounds.y + canvasBounds.height - (cropRect.y + cropRect.height))}px`,
        }}
      />

      {/* Dark overlay - Left */}
      <div
        className="absolute bg-black/60 pointer-events-auto"
        style={{
          left: `${Math.round(canvasBounds.x)}px`,
          top: `${Math.round(cropRect.y)}px`,
          width: `${Math.round(cropRect.x - canvasBounds.x)}px`,
          height: `${Math.round(cropRect.height)}px`,
        }}
      />

      {/* Dark overlay - Right */}
      <div
        className="absolute bg-black/60 pointer-events-auto"
        style={{
          left: `${Math.round(cropRect.x + cropRect.width)}px`,
          top: `${Math.round(cropRect.y)}px`,
          width: `${Math.round(canvasBounds.x + canvasBounds.width - (cropRect.x + cropRect.width))}px`,
          height: `${Math.round(cropRect.height)}px`,
        }}
      />

      {/* Crop area border */}
      <div
        className="absolute border-2 pointer-events-auto cursor-move"
        style={{
          left: `${Math.round(cropRect.x)}px`,
          top: `${Math.round(cropRect.y)}px`,
          width: `${Math.round(cropRect.width)}px`,
          height: `${Math.round(cropRect.height)}px`,
          borderColor: RENDER_CONFIG.SELECTION_COLOR,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        }}
        onMouseDown={onCropAreaMouseDown}
      >
        {/* Rule of thirds grid */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical lines */}
          <div
            className="absolute top-0 bottom-0 border-l border-white/30"
            style={{ left: '33.333%' }}
          />
          <div
            className="absolute top-0 bottom-0 border-l border-white/30"
            style={{ left: '66.666%' }}
          />
          {/* Horizontal lines */}
          <div
            className="absolute left-0 right-0 border-t border-white/30"
            style={{ top: '33.333%' }}
          />
          <div
            className="absolute left-0 right-0 border-t border-white/30"
            style={{ top: '66.666%' }}
          />
        </div>

        {/* Crop handles */}
        {CROP_HANDLES.map((handle) => {
          const pos = getCropHandlePosition(handle);
          return (
            <div
              key={handle}
              data-crop-handle={handle}
              className="absolute pointer-events-auto"
              style={{
                left: `${Math.round(pos.x - cropRect.x)}px`,
                top: `${Math.round(pos.y - cropRect.y)}px`,
                width: `${Math.round(handleSize)}px`,
                height: `${Math.round(handleSize)}px`,
                backgroundColor: RENDER_CONFIG.HANDLE_COLOR,
                border: `${Math.max(1, 2 / zoomLevel)}px solid ${RENDER_CONFIG.HANDLE_BORDER_COLOR}`,
                cursor: CROP_HANDLE_CURSORS[handle],
                borderRadius: '2px',
              }}
              onMouseDown={(e) => onCropHandleMouseDown(handle, e)}
            />
          );
        })}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.cropRect.x === nextProps.cropRect.x &&
    prevProps.cropRect.y === nextProps.cropRect.y &&
    prevProps.cropRect.width === nextProps.cropRect.width &&
    prevProps.cropRect.height === nextProps.cropRect.height &&
    prevProps.canvasBounds.x === nextProps.canvasBounds.x &&
    prevProps.canvasBounds.y === nextProps.canvasBounds.y &&
    prevProps.canvasBounds.width === nextProps.canvasBounds.width &&
    prevProps.canvasBounds.height === nextProps.canvasBounds.height &&
    prevProps.zoomLevel === nextProps.zoomLevel
  );
});

CropOverlay.displayName = 'CropOverlay';

export default CropOverlay;
