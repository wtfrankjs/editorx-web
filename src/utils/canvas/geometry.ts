/**
 * @fileoverview Canvas utility functions with TypeScript support
 * @module utils/canvas
 * @description Pure functions for canvas calculations and transformations
 */

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle bounds
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Convert client coordinates to canvas content coordinates
 * @param clientX - Client X coordinate
 * @param clientY - Client Y coordinate
 * @param canvasRect - Canvas element bounding rect
 * @param pan - Current pan offset
 * @param zoom - Current zoom level
 * @returns Point in content coordinates
 */
export const clientToContent = (
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  pan: Point,
  zoom: number
): Point => {
  return {
    x: (clientX - canvasRect.left) / zoom - pan.x / zoom,
    y: (clientY - canvasRect.top) / zoom - pan.y / zoom,
  };
};

/**
 * Convert content coordinates to client coordinates
 * @param contentX - Content X coordinate
 * @param contentY - Content Y coordinate
 * @param canvasRect - Canvas element bounding rect
 * @param pan - Current pan offset
 * @param zoom - Current zoom level
 * @returns Point in client coordinates
 */
export const contentToClient = (
  contentX: number,
  contentY: number,
  canvasRect: DOMRect,
  pan: Point,
  zoom: number
): Point => {
  return {
    x: contentX * zoom + pan.x + canvasRect.left,
    y: contentY * zoom + pan.y + canvasRect.top,
  };
};

/**
 * Calculate bounding box for multiple rectangles
 * @param rects - Array of rectangles
 * @returns Bounding rectangle
 */
export const getBoundingRect = (rects: Rect[]): Rect | null => {
  if (rects.length === 0) return null;

  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.width));
  const maxY = Math.max(...rects.map((r) => r.y + r.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Check if point is inside rectangle
 * @param point - Point to test
 * @param rect - Rectangle bounds
 * @returns True if point is inside
 */
export const pointInRect = (point: Point, rect: Rect): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

/**
 * Check if two rectangles intersect
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns True if rectangles intersect
 */
export const rectsIntersect = (rect1: Rect, rect2: Rect): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

/**
 * Clamp a number between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Round point coordinates to integers
 * @param point - Point to round
 * @returns Rounded point
 */
export const roundPoint = (point: Point): Point => ({
  x: Math.round(point.x),
  y: Math.round(point.y),
});

/**
 * Round size dimensions to integers
 * @param size - Size to round
 * @returns Rounded size
 */
export const roundSize = (size: Size): Size => ({
  width: Math.round(size.width),
  height: Math.round(size.height),
});

/**
 * Round rectangle to integers
 * @param rect - Rectangle to round
 * @returns Rounded rectangle
 */
export const roundRect = (rect: Rect): Rect => ({
  x: Math.round(rect.x),
  y: Math.round(rect.y),
  width: Math.round(rect.width),
  height: Math.round(rect.height),
});

/**
 * Calculate distance between two points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance
 */
export const distance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Scale a rectangle by a factor
 * @param rect - Rectangle to scale
 * @param scaleX - X scale factor
 * @param scaleY - Y scale factor (defaults to scaleX)
 * @returns Scaled rectangle
 */
export const scaleRect = (
  rect: Rect,
  scaleX: number,
  scaleY: number = scaleX
): Rect => ({
  x: rect.x * scaleX,
  y: rect.y * scaleY,
  width: rect.width * scaleX,
  height: rect.height * scaleY,
});

/**
 * Calculate aspect ratio
 * @param width - Width
 * @param height - Height
 * @returns Aspect ratio (width / height)
 */
export const getAspectRatio = (width: number, height: number): number => {
  return height !== 0 ? width / height : 1;
};

/**
 * Fit size into bounds while maintaining aspect ratio
 * @param size - Original size
 * @param bounds - Bounds to fit into
 * @returns Fitted size
 */
export const fitSize = (size: Size, bounds: Size): Size => {
  const aspectRatio = getAspectRatio(size.width, size.height);
  const boundsAspect = getAspectRatio(bounds.width, bounds.height);

  if (aspectRatio > boundsAspect) {
    // Width-constrained
    return {
      width: bounds.width,
      height: bounds.width / aspectRatio,
    };
  } else {
    // Height-constrained
    return {
      width: bounds.height * aspectRatio,
      height: bounds.height,
    };
  }
};

/**
 * Debounce a function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle a function
 * @param func - Function to throttle
 * @param limit - Limit time in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};
