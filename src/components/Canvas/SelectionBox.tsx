/**
 * @fileoverview Selection Box component
 * @module components/Canvas/SelectionBox
 * @description Renders multi-selection bounding box (marquee)
 */

import { memo } from 'react';
import { RENDER_CONFIG } from '../../constants/canvas';

interface SelectionBoxProps {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  zoomLevel: number;
}

/**
 * SelectionBox component - Renders marquee selection rectangle
 * Used for multi-selecting layers by dragging
 */
const SelectionBox = memo<SelectionBoxProps>(({
  startPoint,
  endPoint,
  zoomLevel,
}) => {
  const left = Math.min(startPoint.x, endPoint.x);
  const top = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${Math.round(left)}px`,
        top: `${Math.round(top)}px`,
        width: `${Math.round(width)}px`,
        height: `${Math.round(height)}px`,
        border: `${Math.max(1, 1 / zoomLevel)}px dashed ${RENDER_CONFIG.SELECTION_COLOR}`,
        backgroundColor: `${RENDER_CONFIG.SELECTION_COLOR}20`, // 20 = ~12% opacity
      }}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.startPoint.x === nextProps.startPoint.x &&
    prevProps.startPoint.y === nextProps.startPoint.y &&
    prevProps.endPoint.x === nextProps.endPoint.x &&
    prevProps.endPoint.y === nextProps.endPoint.y &&
    prevProps.zoomLevel === nextProps.zoomLevel
  );
});

SelectionBox.displayName = 'SelectionBox';

export default SelectionBox;
