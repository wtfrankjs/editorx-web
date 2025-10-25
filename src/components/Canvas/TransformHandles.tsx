/**
 * @fileoverview Transform Handles component
 * @module components/Canvas/TransformHandles
 * @description Renders resize and rotate handles for selected layers
 */

import React, { memo } from 'react';
import { RENDER_CONFIG } from '../../constants/canvas';

interface TransformHandlesProps {
  displayPosition: { x: number; y: number };
  displaySize: { width: number; height: number };
  rotation: number;
  zoomLevel: number;
  showRotateHandle?: boolean;
  onHandleMouseDown: (handle: string, e: React.MouseEvent) => void;
}

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLE_POSITIONS: HandlePosition[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const HANDLE_CURSORS: Record<HandlePosition, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
};

const TransformHandles = memo<TransformHandlesProps>(({
  displayPosition,
  displaySize,
  rotation,
  zoomLevel,
  showRotateHandle = true,
  onHandleMouseDown,
}) => {
  const { x, y } = displayPosition;
  const { width, height } = displaySize;

  const handleSize = RENDER_CONFIG.HANDLE_SIZE / zoomLevel;
  // Classic rotate handle above the selection (old frame system)
  const rotateDistance = RENDER_CONFIG.ROTATE_HANDLE_DISTANCE / zoomLevel;

  /**
   * Get handle position based on direction
   */
  const getHandlePosition = (handle: HandlePosition): { x: number; y: number } => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const offset = handleSize / 2;

    const positions: Record<HandlePosition, { x: number; y: number }> = {
      nw: { x: x - offset, y: y - offset },
      n: { x: x + halfWidth - offset, y: y - offset },
      ne: { x: x + width - offset, y: y - offset },
      e: { x: x + width - offset, y: y + halfHeight - offset },
      se: { x: x + width - offset, y: y + height - offset },
      s: { x: x + halfWidth - offset, y: y + height - offset },
      sw: { x: x - offset, y: y + height - offset },
      w: { x: x - offset, y: y + halfHeight - offset },
    };

    return positions[handle];
  };

  // Default: place handle centered above top edge by rotateDistance
  const rotateHandlePos = {
    x: x + width / 2 - handleSize / 2,
    y: y - rotateDistance - handleSize / 2,
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${Math.round(x)}px`,
        top: `${Math.round(y)}px`,
        width: `${Math.round(width)}px`,
        height: `${Math.round(height)}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: '0 0',
        zIndex: 20, // ensure handles render above control bar
      }}
    >
      {/* Selection Border */}
      <div
        className="absolute inset-0 border-2 pointer-events-none"
        style={{
          borderColor: RENDER_CONFIG.SELECTION_COLOR,
          zIndex: 20,
        }}
      />

      {/* Resize Handles */}
      {HANDLE_POSITIONS.map((handle) => {
        const pos = getHandlePosition(handle);
        return (
          <div
            key={handle}
            data-handle={handle}
            className="absolute pointer-events-auto"
            style={{
              left: `${Math.round(pos.x - x)}px`,
              top: `${Math.round(pos.y - y)}px`,
              width: `${Math.round(handleSize)}px`,
              height: `${Math.round(handleSize)}px`,
              backgroundColor: RENDER_CONFIG.HANDLE_COLOR,
              border: `${Math.max(1, 2 / zoomLevel)}px solid ${RENDER_CONFIG.HANDLE_BORDER_COLOR}`,
              cursor: HANDLE_CURSORS[handle],
              borderRadius: '2px',
              zIndex: 21,
            }}
            onMouseDown={(e) => onHandleMouseDown(handle, e)}
          />
        );
      })}

      {/* Rotate Handle (classic, above selection) */}
      {showRotateHandle && (
        <>
          {/* Connection Line (from top edge upward) */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${Math.round(width / 2 - 0.5 / zoomLevel)}px`,
              top: `${Math.round(-rotateDistance)}px`,
              width: `${Math.max(1, 1 / zoomLevel)}px`,
              height: `${Math.round(rotateDistance)}px`,
              backgroundColor: RENDER_CONFIG.SELECTION_COLOR,
              zIndex: 21,
            }}
          />

          {/* Rotate Handle */}
          <div
            data-handle="rotate"
            className="absolute pointer-events-auto"
            style={{
              left: `${Math.round(rotateHandlePos.x - x)}px`,
              top: `${Math.round(rotateHandlePos.y - y)}px`,
              width: `${Math.round(handleSize)}px`,
              height: `${Math.round(handleSize)}px`,
              backgroundColor: RENDER_CONFIG.ROTATE_HANDLE_COLOR,
              border: `${Math.max(1, 2 / zoomLevel)}px solid ${RENDER_CONFIG.HANDLE_BORDER_COLOR}`,
              borderRadius: '50%',
              cursor: 'grab',
              zIndex: 22, // keep rotate above everything
            }}
            onMouseDown={(e) => onHandleMouseDown('rotate', e)}
          />
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.displayPosition.x === nextProps.displayPosition.x &&
    prevProps.displayPosition.y === nextProps.displayPosition.y &&
    prevProps.displaySize.width === nextProps.displaySize.width &&
    prevProps.displaySize.height === nextProps.displaySize.height &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.showRotateHandle === nextProps.showRotateHandle
  );
});

TransformHandles.displayName = 'TransformHandles';

export default TransformHandles;
