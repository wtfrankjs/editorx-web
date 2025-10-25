import { 
  AlignLeft, 
  AlignRight, 
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';

export default function AlignmentToolbar() {
  const { layers, updateLayersBatch, selectedLayerIds } = useProject();

  // Only show if 2+ layers selected
  if (selectedLayerIds.length < 2) return null;

  const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));
  const selectedUnlocked = selectedLayers.filter(l => !l.locked);
  // Determine the largest layer (locked or unlocked) to serve as stationary anchor.
  // We'll move only unlocked layers and never move the anchor.
  const anchor = selectedLayers.length
    ? [...selectedLayers].sort((a, b) => (b.size.width * b.size.height) - (a.size.width * a.size.height))[0]
    : null;
  
  // Anchor is the largest layer; others move relative to it

  // Alignment functions - use requestAnimationFrame to batch updates
  const alignLeft = () => {
    if (!anchor) {
      console.warn('⚠️ No anchor for alignLeft');
      return;
    }
    const ax = anchor.position.x;
    const updates = selectedLayers
      .filter(l => !l.locked && l.id !== anchor.id)
      .map(l => ({ id: l.id, updates: { position: { ...l.position, x: ax } } }));
    if (updates.length) updateLayersBatch(updates);
  };

  const alignCenterH = () => {
    if (!anchor) {
      console.warn('⚠️ No anchor for alignCenterH');
      return;
    }
    const axc = anchor.position.x + anchor.size.width / 2;
    const updates = selectedLayers
      .filter(l => !l.locked && l.id !== anchor.id)
      .map(l => ({ id: l.id, updates: { position: { ...l.position, x: axc - l.size.width / 2 } } }));
    if (updates.length) updateLayersBatch(updates);
  };

  const alignRight = () => {
    if (!anchor) {
      console.warn('⚠️ No anchor for alignRight');
      return;
    }
    const ar = anchor.position.x + anchor.size.width;
    const updates = selectedLayers
      .filter(l => !l.locked && l.id !== anchor.id)
      .map(l => ({ id: l.id, updates: { position: { ...l.position, x: ar - l.size.width } } }));
    if (updates.length) updateLayersBatch(updates);
  };

  const alignTop = () => {
    if (!anchor) {
      console.warn('⚠️ No anchor for alignTop');
      return;
    }
    const ay = anchor.position.y;
    const updates = selectedLayers
      .filter(l => !l.locked && l.id !== anchor.id)
      .map(l => ({ id: l.id, updates: { position: { ...l.position, y: ay } } }));
    if (updates.length) updateLayersBatch(updates);
  };

  const alignCenterV = () => {
    if (!anchor) {
      console.warn('⚠️ No anchor for alignCenterV');
      return;
    }
    const ayc = anchor.position.y + anchor.size.height / 2;
    const updates = selectedLayers
      .filter(l => !l.locked && l.id !== anchor.id)
      .map(l => ({ id: l.id, updates: { position: { ...l.position, y: ayc - l.size.height / 2 } } }));
    if (updates.length) updateLayersBatch(updates);
  };

  const alignBottom = () => {
    if (!anchor) {
      console.warn('⚠️ No anchor for alignBottom');
      return;
    }
    const ab = anchor.position.y + anchor.size.height;
    const updates = selectedLayers
      .filter(l => !l.locked && l.id !== anchor.id)
      .map(l => ({ id: l.id, updates: { position: { ...l.position, y: ab - l.size.height } } }));
    if (updates.length) updateLayersBatch(updates);
  };

  const distributeH = () => {
    const sorted = [...selectedUnlocked].sort((a, b) => a.position.x - b.position.x);
    if (sorted.length <= 2) {
      console.warn('⚠️ Distribute H requires 3+ layers');
      return;
    }
    const first = sorted[0].position.x;
    const last = sorted[sorted.length - 1].position.x + sorted[sorted.length - 1].size.width;
    const totalGap = last - first - sorted.reduce((sum, l) => sum + l.size.width, 0);
    const gap = totalGap / (sorted.length - 1);
    let currentX = first;
  const updates = [] as Array<{ id: string; updates: Partial<typeof sorted[number]> }>;
    sorted.forEach((layer, i) => {
      if (i === 0 || i === sorted.length - 1) return; // Keep first and last
      currentX += sorted[i - 1].size.width + gap;
      updates.push({ id: layer.id, updates: { position: { ...layer.position, x: currentX } } });
    });
    if (updates.length) updateLayersBatch(updates as any);
  };

  const distributeV = () => {
    const sorted = [...selectedUnlocked].sort((a, b) => a.position.y - b.position.y);
    if (sorted.length <= 2) {
      console.warn('⚠️ Distribute V requires 3+ layers');
      return;
    }
    const first = sorted[0].position.y;
    const last = sorted[sorted.length - 1].position.y + sorted[sorted.length - 1].size.height;
    const totalGap = last - first - sorted.reduce((sum, l) => sum + l.size.height, 0);
    const gap = totalGap / (sorted.length - 1);
    let currentY = first;
    const updates = [] as Array<{ id: string; updates: Partial<typeof sorted[number]> }>;
    sorted.forEach((layer, i) => {
      if (i === 0 || i === sorted.length - 1) return; // Keep first and last
      currentY += sorted[i - 1].size.height + gap;
      updates.push({ id: layer.id, updates: { position: { ...layer.position, y: currentY } } });
    });
    if (updates.length) updateLayersBatch(updates as any);
  };

  const alignButtons = [
    { icon: AlignLeft, label: 'Left', action: alignLeft, shortcut: 'Ctrl+Shift+←' },
    { icon: AlignHorizontalJustifyCenter, label: 'Center H', action: alignCenterH, shortcut: 'Ctrl+Shift+C' },
    { icon: AlignRight, label: 'Right', action: alignRight, shortcut: 'Ctrl+Shift+→' },
    { icon: AlignVerticalJustifyStart, label: 'Top', action: alignTop, shortcut: 'Ctrl+Shift+↑' },
    { icon: AlignVerticalJustifyCenter, label: 'Center V', action: alignCenterV, shortcut: 'Ctrl+Shift+M' },
    { icon: AlignVerticalJustifyEnd, label: 'Bottom', action: alignBottom, shortcut: 'Ctrl+Shift+↓' },
  ];

  const distributeButtons = [
    { icon: AlignHorizontalDistributeCenter, label: 'Distribute H', action: distributeH },
    { icon: AlignVerticalDistributeCenter, label: 'Distribute V', action: distributeV },
  ];

  // Keyboard shortcuts moved to App-level to avoid conflicts with global handlers

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white/95 dark:bg-[#1A1A22]/95 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl p-2">
      <div className="flex items-center gap-1">
        {/* Alignment Tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-700">
          {alignButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors group relative"
              title={`${btn.label} (${btn.shortcut})`}
            >
              <btn.icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {btn.label} <span className="text-gray-400">({btn.shortcut})</span>
              </span>
            </button>
          ))}
        </div>

        {/* Distribute Tools */}
        <div className="flex items-center gap-1">
          {distributeButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors group relative"
              title={btn.label}
            >
              <btn.icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {btn.label}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Count */}
        <div className="pl-2 border-l border-gray-300 dark:border-gray-700">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {selectedLayerIds.length} selected
          </span>
        </div>
      </div>
    </div>
  );
}
