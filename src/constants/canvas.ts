/**
 * @fileoverview Canvas constants and configuration
 * @module constants/canvas
 * @description Centralized constants for canvas behavior
 */

/**
 * Canvas interaction thresholds
 */
export const INTERACTION_THRESHOLDS = {
  /** Minimum drag distance in pixels to start drag operation */
  DRAG_THRESHOLD: 2,
  
  /** Double-click time threshold in milliseconds */
  DOUBLE_CLICK_THRESHOLD: 300,
  
  /** Minimum size for layers/crop in pixels */
  MIN_SIZE: 20,
  
  /** Maximum history stack size */
  MAX_HISTORY_SIZE: 50,
} as const;

/**
 * Canvas zoom configuration
 */
export const ZOOM_CONFIG = {
  /** Minimum zoom level */
  MIN_ZOOM: 0.25,
  
  /** Maximum zoom level */
  MAX_ZOOM: 3,
  
  /** Zoom step for button controls */
  ZOOM_STEP: 0.25,
  
  /** Zoom step for wheel controls */
  WHEEL_ZOOM_STEP: 0.1,
  
  /** Default zoom level */
  DEFAULT_ZOOM: 1,
} as const;

/**
 * Canvas rendering configuration
 */
export const RENDER_CONFIG = {
  /** Handle size in pixels (unscaled) */
  HANDLE_SIZE: 16,
  
  /** Selection ring thickness */
  SELECTION_RING_WIDTH: 2,
  
  /** Selection color */
  SELECTION_COLOR: '#A97FFF',
  
  /** Handle fill color */
  HANDLE_COLOR: '#FFFFFF',
  
  /** Handle border color */
  HANDLE_BORDER_COLOR: '#A97FFF',
  
  /** Rotate handle color */
  ROTATE_HANDLE_COLOR: '#A97FFF',
  
  /** Rotate handle distance from top edge */
  ROTATE_HANDLE_DISTANCE: 30,
  
  /** Grid size for alignment */
  GRID_SIZE: 20,
  
  /** Snap threshold */
  SNAP_THRESHOLD: 5,
} as const;

/**
 * Performance configuration
 */
export const PERFORMANCE_CONFIG = {
  /** Throttle limit for mouse move events (ms) */
  MOUSE_MOVE_THROTTLE: 16, // ~60fps
  
  /** Debounce delay for history save (ms) */
  HISTORY_SAVE_DEBOUNCE: 500,
  
  /** RAF batch size for updates */
  RAF_BATCH_SIZE: 10,
} as const;

/**
 * Event configuration
 */
export const EVENT_CONFIG = {
  /** Mouse button constants */
  MOUSE_BUTTON: {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
  },
  
  /** Keyboard keys */
  KEY: {
    SPACE: ' ',
    ESCAPE: 'Escape',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
    ENTER: 'Enter',
    SHIFT: 'Shift',
    CTRL: 'Control',
    ALT: 'Alt',
    C: 'c',
    V: 'v',
    Z: 'z',
    Y: 'y',
  },
} as const;

/**
 * Layer configuration
 */
export const LAYER_CONFIG = {
  /** Default layer name prefix */
  DEFAULT_NAME_PREFIX: 'Layer',
  
  /** Default layer opacity */
  DEFAULT_OPACITY: 100,
  
  /** Default blend mode */
  DEFAULT_BLEND_MODE: 'normal',
  
  /** Cascade offset for new layers */
  CASCADE_OFFSET: 40,
  
  /** Maximum cascade offset */
  MAX_CASCADE_OFFSET: 320, // 8 * CASCADE_OFFSET
} as const;

/**
 * Type exports for type safety
 */
export type InteractionThresholds = typeof INTERACTION_THRESHOLDS;
export type ZoomConfig = typeof ZOOM_CONFIG;
export type RenderConfig = typeof RENDER_CONFIG;
export type PerformanceConfig = typeof PERFORMANCE_CONFIG;
export type EventConfig = typeof EVENT_CONFIG;
export type LayerConfig = typeof LAYER_CONFIG;
