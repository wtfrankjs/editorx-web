/*
  Debug logger utility for EditorXWeb
  - Enable via query string: ?debug=all or ?debug=project,crop
  - Or via console/localStorage: localStorage.DEBUG = 'project,crop'; location.reload()
  - Or set window.DEBUG = 'all' at runtime.
*/

// Parse debug namespaces string like "ns1,ns2" with support for 'all' and wildcard '*'
function parseNamespaces(src: string | null | undefined): Set<string> {
  if (!src) return new Set();
  const raw = src.trim().toLowerCase();
  if (!raw) return new Set();
  if (raw === '1' || raw === 'true') return new Set(['all']);
  return new Set(
    raw
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean)
  );
}

function getQueryParam(name: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  } catch {
    return null;
  }
}

function resolveEnabledNamespaces(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const fromQuery = parseNamespaces(getQueryParam('debug'));
  // Prefer query when present
  if (fromQuery.size > 0) return fromQuery;
  // Fallback to localStorage or global window
  const fromLS = parseNamespaces((() => {
    try { return window.localStorage.getItem('DEBUG'); } catch { return null; }
  })());
  if (fromLS.size > 0) return fromLS;
  const fromGlobal = parseNamespaces((window as any).DEBUG);
  return fromGlobal;
}

let enabled = resolveEnabledNamespaces();

export function refreshDebugNamespaces() {
  enabled = resolveEnabledNamespaces();
}

export function isDebug(ns: string): boolean {
  if (enabled.has('all') || enabled.has('*')) return true;
  return enabled.has(ns.toLowerCase());
}

export type Logger = {
  ns: string;
  enabled: () => boolean;
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  group: (label?: string) => void;
  groupCollapsed: (label?: string) => void;
  groupEnd: () => void;
  time: (label?: string) => void;
  timeEnd: (label?: string) => void;
};

export function createLogger(ns: string): Logger {
  const prefix = `%c[${ns}]`;
  const style = 'color:#A97FFF;font-weight:600';
  const enabledFn = () => isDebug(ns);
  const consoleLike = (method: keyof Console) =>
    (...args: any[]) => {
      if (!enabledFn()) return;
      try {
        // @ts-ignore
        console[method](prefix, style, ...args);
      } catch {
        // ignore
      }
    };
  const timeMap = new Map<string, number>();
  const time = (label = 'time'): void => {
    if (!enabledFn()) return;
    timeMap.set(label, performance.now());
    consoleLike('log')(`${label} start`);
  };
  const timeEnd = (label = 'time'): void => {
    if (!enabledFn()) return;
    const t0 = timeMap.get(label) ?? performance.now();
    const dt = performance.now() - t0;
    consoleLike('log')(`${label} end`, `${dt.toFixed(1)}ms`);
  };
  return {
    ns,
    enabled: enabledFn,
    log: consoleLike('log'),
    info: consoleLike('info'),
    warn: consoleLike('warn'),
    error: consoleLike('error'),
    group: (label?: string) => { if (enabledFn()) console.group(label ?? `[${ns}]`); },
    groupCollapsed: (label?: string) => { if (enabledFn()) console.groupCollapsed(label ?? `[${ns}]`); },
    groupEnd: () => { if (enabledFn()) console.groupEnd(); },
    time,
    timeEnd,
  };
}

// Predefined loggers for common namespaces
export const logProject = createLogger('project');
export const logCrop = createLogger('crop');
export const logCanvas = createLogger('canvas');
export const logAPI = createLogger('api');
