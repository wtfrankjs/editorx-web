/**
 * @fileoverview Layer component with proper memoization
 * @module components/Canvas/Layer
 * @description Atomic component for rendering a single canvas layer
 */

import React, { memo } from 'react';
import type { Layer as LayerType } from '../../types';

interface LayerProps {
  layer: LayerType;
  isSelected: boolean;
  isActive: boolean;
  displayPosition: { x: number; y: number };
  displaySize: { width: number; height: number };
  zoomLevel: number;
  showControls: boolean;
  effectiveSkew?: { x: number; y: number };
  onLayerClick: (layerId: string, e: React.MouseEvent) => void;
  onMouseDown: (layerId: string, e: React.MouseEvent) => void;
}

/**
 * Layer component - Renders a single layer on canvas
 * Memoized to prevent unnecessary re-renders
 */
const Layer = memo<LayerProps>(({
  layer,
  isSelected,
  isActive: _isActive,
  displayPosition,
  displaySize,
  zoomLevel,
  showControls,
  effectiveSkew = { x: 0, y: 0 },
  onLayerClick,
  onMouseDown,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    onLayerClick(layer.id, e);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    onMouseDown(layer.id, e);
  };

  // Remove ring border to avoid double frame (TransformHandles draws the selection)
  const ringClasses = '';

  return (
    <div
      data-layer-id={layer.id}
      className={`absolute cursor-move group ${ringClasses}`}
      style={{
        left: `${Math.round(displayPosition.x)}px`,
        top: `${Math.round(displayPosition.y)}px`,
        width: `${Math.round(displaySize.width)}px`,
        height: `${Math.round(displaySize.height)}px`,
        transform: `rotate(${layer.rotation}deg)`,
        opacity: layer.opacity / 100,
        mixBlendMode: layer.blendMode,
        zIndex: layer.zIndex,
        pointerEvents: layer.locked ? 'none' : 'auto',
        transition: isSelected ? 'none' : 'transform 0.15s ease',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Layer Content */}
      {layer.type === 'background' ? (
        <div
          className="w-full h-full"
          style={{ backgroundColor: layer.backgroundColor }}
        />
      ) : (
        <img
          src={layer.imageUrl}
          alt={layer.name}
          className="w-full h-full object-fill select-none pointer-events-none"
          draggable={false}
          style={{
            transform: `skew(${effectiveSkew.x || 0}deg, ${effectiveSkew.y || 0}deg)`,
          }}
        />
      )}

      {/* Layer Label (on hover) */}
      {!isSelected && showControls && (
        <div
          className="absolute -bottom-6 left-0 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity border dark:bg-[#1A1A22]/95 dark:border-gray-700 dark:text-white bg-white/95 border-gray-300 text-gray-900"
          style={{
            transform: `scale(${1 / zoomLevel})`,
            transformOrigin: 'left top',
          }}
        >
          {layer.name}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.layer.id === nextProps.layer.id &&
    prevProps.layer.imageUrl === nextProps.layer.imageUrl &&
    prevProps.layer.name === nextProps.layer.name &&
    prevProps.layer.opacity === nextProps.layer.opacity &&
    prevProps.layer.rotation === nextProps.layer.rotation &&
    prevProps.layer.blendMode === nextProps.layer.blendMode &&
    prevProps.layer.locked === nextProps.layer.locked &&
    prevProps.layer.zIndex === nextProps.layer.zIndex &&
    prevProps.layer.backgroundColor === nextProps.layer.backgroundColor &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.displayPosition.x === nextProps.displayPosition.x &&
    prevProps.displayPosition.y === nextProps.displayPosition.y &&
    prevProps.displaySize.width === nextProps.displaySize.width &&
    prevProps.displaySize.height === nextProps.displaySize.height &&
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.showControls === nextProps.showControls &&
    prevProps.effectiveSkew?.x === nextProps.effectiveSkew?.x &&
    prevProps.effectiveSkew?.y === nextProps.effectiveSkew?.y
  );
});

Layer.displayName = 'Layer';

export default Layer;
