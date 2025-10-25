/**
 * @fileoverview Canvas interaction state management hook
 * @module hooks/canvas/useCanvasInteraction
 * @description Manages all canvas interaction states with proper TypeScript typing
 * and memory optimization
 */

import { useState, useRef, useCallback } from 'react';

/**
 * Canvas interaction modes
 */
export type InteractionMode = 
  | 'idle'
  | 'dragging'
  | 'resizing'
  | 'marquee'
  | 'viewport-panning';

/**
 * Drag state interface
 */
interface DragState {
  isDragging: boolean;
  dragReady: boolean;
  dragStart: { x: number; y: number };
  dragStartPos: { x: number; y: number };
  dragStartPositions: Record<string, { x: number; y: number }>;
}

/**
 * Resize state interface
 */
interface ResizeState {
  isResizing: boolean;
  resizeHandle: string | null;
  isMultiResizing: boolean;
  multiResizeHandle: string | null;
  multiResizeStartBounds: { x: number; y: number; width: number; height: number } | null;
  multiResizeStartRects: Record<string, { x: number; y: number; width: number; height: number }>;
}

/**
 * Viewport state interface
 */
interface ViewportState {
  pan: { x: number; y: number };
  isViewportPanning: boolean;
  spaceDown: boolean;
}

/**
 * Marquee selection state
 */
interface MarqueeState {
  marqueeSelecting: boolean;
  marqueeStart: { x: number; y: number } | null;
  marqueeRect: { x: number; y: number; width: number; height: number } | null;
}

/**
 * Temporary transform state for live preview
 */
interface TempTransformState {
  tempPosition: { x: number; y: number } | null;
  tempSize: { width: number; height: number } | null;
  tempPositions: Record<string, { x: number; y: number }>;
  tempSizes: Record<string, { width: number; height: number }>;
}

/**
 * Combined interaction state
 */
interface InteractionState {
  mode: InteractionMode;
  drag: DragState;
  resize: ResizeState;
  viewport: ViewportState;
  marquee: MarqueeState;
  tempTransforms: TempTransformState;
}

/**
 * Initial state factory
 */
const createInitialState = (): InteractionState => ({
  mode: 'idle',
  drag: {
    isDragging: false,
    dragReady: false,
    dragStart: { x: 0, y: 0 },
    dragStartPos: { x: 0, y: 0 },
    dragStartPositions: {},
  },
  resize: {
    isResizing: false,
    resizeHandle: null,
    isMultiResizing: false,
    multiResizeHandle: null,
    multiResizeStartBounds: null,
    multiResizeStartRects: {},
  },
  viewport: {
    pan: { x: 0, y: 0 },
    isViewportPanning: false,
    spaceDown: false,
  },
  marquee: {
    marqueeSelecting: false,
    marqueeStart: null,
    marqueeRect: null,
  },
  tempTransforms: {
    tempPosition: null,
    tempSize: null,
    tempPositions: {},
    tempSizes: {},
  },
});

/**
 * Custom hook for managing canvas interactions
 * @returns Interaction state and control methods
 */
export const useCanvasInteraction = () => {
  const [state, setState] = useState<InteractionState>(createInitialState);
  
  // Refs for avoiding stale closures
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * Set interaction mode with automatic state cleanup
   */
  const setMode = useCallback((mode: InteractionMode) => {
    setState(prev => {
      // Clean up previous mode state
      const nextState = createInitialState();
      nextState.mode = mode;
      nextState.viewport = prev.viewport; // Preserve viewport state
      return nextState;
    });
  }, []);

  /**
   * Update drag state
   */
  const setDragState = useCallback((updates: Partial<DragState>) => {
    setState(prev => ({
      ...prev,
      drag: { ...prev.drag, ...updates },
    }));
  }, []);

  /**
   * Update resize state
   */
  const setResizeState = useCallback((updates: Partial<ResizeState>) => {
    setState(prev => ({
      ...prev,
      resize: { ...prev.resize, ...updates },
    }));
  }, []);

  /**
   * Update viewport state
   */
  const setViewportState = useCallback((updates: Partial<ViewportState>) => {
    setState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, ...updates },
    }));
  }, []);

  /**
   * Update marquee state
   */
  const setMarqueeState = useCallback((updates: Partial<MarqueeState>) => {
    setState(prev => ({
      ...prev,
      marquee: { ...prev.marquee, ...updates },
    }));
  }, []);

  /**
   * Update temp transforms
   */
  const setTempTransforms = useCallback((updates: Partial<TempTransformState>) => {
    setState(prev => ({
      ...prev,
      tempTransforms: { ...prev.tempTransforms, ...updates },
    }));
  }, []);

  /**
   * Reset all interaction state to idle
   */
  const resetInteraction = useCallback(() => {
    setState(createInitialState);
  }, []);

  /**
   * Check if any interaction is active
   */
  const isInteracting = useCallback(() => {
    const s = stateRef.current;
    return (
      s.drag.isDragging ||
      s.resize.isResizing ||
      s.resize.isMultiResizing ||
      s.viewport.isViewportPanning ||
      s.marquee.marqueeSelecting
    );
  }, []);

  return {
    state,
    setMode,
    setDragState,
    setResizeState,
    setViewportState,
    setMarqueeState,
    setTempTransforms,
    resetInteraction,
    isInteracting,
  };
};

/**
 * Type exports for external usage
 */
export type {
  DragState,
  ResizeState,
  ViewportState,
  MarqueeState,
  TempTransformState,
  InteractionState,
};
