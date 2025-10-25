/**
 * @fileoverview Event delegation and management for canvas interactions
 * @module hooks/canvas/useEventManager
 * @description Provides a centralized event management system with proper cleanup
 * and memory optimization
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Event handler function type
 */
type EventHandler<E extends Event = Event> = (event: E) => void;

/**
 * Event listener options with proper TypeScript typing
 */
interface EventListenerOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

/**
 * Registered listener metadata
 */
interface RegisteredListener {
  target: EventTarget;
  type: string;
  handler: EventHandler;
  options?: EventListenerOptions;
}

/**
 * Custom hook for managing event listeners with automatic cleanup
 * @returns Event management methods
 */
export const useEventManager = () => {
  const listenersRef = useRef<RegisteredListener[]>([]);

  /**
   * Register an event listener with automatic tracking
   */
  const addEventListener = useCallback(
    <K extends keyof WindowEventMap>(
      target: EventTarget,
      type: K,
      handler: EventHandler<WindowEventMap[K]>,
      options?: EventListenerOptions
    ) => {
      // Add listener
      target.addEventListener(type, handler as EventListener, options);

      // Track for cleanup
      listenersRef.current.push({
        target,
        type,
        handler: handler as EventHandler,
        options,
      });
    },
    []
  );

  /**
   * Remove a specific event listener
   */
  const removeEventListener = useCallback(
    <K extends keyof WindowEventMap>(
      target: EventTarget,
      type: K,
      handler: EventHandler<WindowEventMap[K]>
    ) => {
      target.removeEventListener(type, handler as EventListener);

      // Remove from tracking
      listenersRef.current = listenersRef.current.filter(
        (listener) =>
          listener.target !== target ||
          listener.type !== type ||
          listener.handler !== handler
      );
    },
    []
  );

  /**
   * Remove all registered event listeners
   */
  const removeAllListeners = useCallback(() => {
    listenersRef.current.forEach(({ target, type, handler, options }) => {
      target.removeEventListener(type, handler as EventListener, options);
    });
    listenersRef.current = [];
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      removeAllListeners();
    };
  }, [removeAllListeners]);

  return {
    addEventListener,
    removeEventListener,
    removeAllListeners,
  };
};

/**
 * Custom hook for handling global mouse events with proper cleanup
 * @param handlers Event handlers object
 * @param enabled Whether event listeners are active
 */
export const useGlobalMouseEvents = (
  handlers: {
    onMouseMove?: (e: MouseEvent) => void;
    onMouseUp?: (e: MouseEvent) => void;
    onBlur?: (e: FocusEvent) => void;
  },
  enabled: boolean
) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      handlersRef.current.onMouseMove?.(e);
    };

    const handleMouseUp = (e: MouseEvent) => {
      handlersRef.current.onMouseUp?.(e);
    };

    const handleBlur = (e: FocusEvent) => {
      handlersRef.current.onBlur?.(e);
    };

    // Use window for global capture
    window.addEventListener('mousemove', handleMouseMove, false);
    window.addEventListener('mouseup', handleMouseUp, false);
    window.addEventListener('blur', handleBlur, false);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled]);
};

/**
 * Custom hook for RAF-optimized updates
 */
export const useRAF = () => {
  const rafIdRef = useRef<number | null>(null);

  const scheduleUpdate = useCallback((callback: () => void) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(callback);
  }, []);

  const cancelUpdate = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelUpdate();
    };
  }, [cancelUpdate]);

  return { scheduleUpdate, cancelUpdate };
};
