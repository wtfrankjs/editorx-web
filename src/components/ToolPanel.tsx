import { 
  MousePointer2, 
  Move, 
  Square, 
  Circle, 
  Triangle,
  Minus,
  Pipette,
  PaintBucket,
  Brush,
  Eraser,
  Type,
  Lasso,
  Wand2,
  Crop,
  RotateCw,
  Maximize2,
  Palette
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type Tool = 
  | 'select' 
  | 'move' 
  | 'crop'
  | 'rotate'
  | 'rectangle' 
  | 'circle' 
  | 'triangle' 
  | 'line'
  | 'gradient'
  | 'bucket'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'lasso'
  | 'rect-select'
  | 'ellipse-select'
  | 'magic-wand'
  | 'eyedropper'
  | 'upscale'
  | 'enhance';

interface ToolPanelProps {
  activeTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

export default function ToolPanel({ activeTool, onToolSelect }: ToolPanelProps) {
  const [hoveredTool, setHoveredTool] = useState<Tool | null>(null);
  const [showLassoFlyout, setShowLassoFlyout] = useState(false);
  const lassoBtnRef = useRef<HTMLButtonElement | null>(null);
  const lassoFlyoutRef = useRef<HTMLDivElement | null>(null);

  // Close the lasso flyout only when clicking outside the button+flyout or clicking the button again.
  useEffect(() => {
    const onGlobalMouseDown = (e: MouseEvent) => {
      if (!showLassoFlyout) return;
      const t = e.target as HTMLElement;
      const insideBtn = lassoBtnRef.current && lassoBtnRef.current.contains(t);
      const insideFlyout = lassoFlyoutRef.current && lassoFlyoutRef.current.contains(t);
      if (!insideBtn && !insideFlyout) {
        setShowLassoFlyout(false);
      }
    };
    window.addEventListener('mousedown', onGlobalMouseDown, true);
    return () => window.removeEventListener('mousedown', onGlobalMouseDown, true);
  }, [showLassoFlyout]);

  const tools: { id: Tool; icon: any; label: string; group: 'selection' | 'shape' | 'paint' | 'edit' | 'ai' }[] = [
    // Selection Tools
    { id: 'select', icon: MousePointer2, label: 'Select', group: 'selection' },
    { id: 'move', icon: Move, label: 'Move', group: 'selection' },
    { id: 'crop', icon: Crop, label: 'Crop', group: 'selection' },
    { id: 'lasso', icon: Lasso, label: 'Lasso', group: 'selection' },
    { id: 'magic-wand', icon: Wand2, label: 'Magic Wand', group: 'selection' },
    
    // Shape Tools  
    { id: 'rectangle', icon: Square, label: 'Rectangle', group: 'shape' },
    { id: 'circle', icon: Circle, label: 'Circle', group: 'shape' },
    { id: 'triangle', icon: Triangle, label: 'Triangle', group: 'shape' },
    { id: 'line', icon: Minus, label: 'Line', group: 'shape' },
    
    // Paint Tools
    { id: 'gradient', icon: Pipette, label: 'Gradient', group: 'paint' },
    { id: 'bucket', icon: PaintBucket, label: 'Paint Bucket', group: 'paint' },
    { id: 'brush', icon: Brush, label: 'Brush', group: 'paint' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', group: 'paint' },
    { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', group: 'paint' },
    
    // Edit Tools
    { id: 'text', icon: Type, label: 'Text', group: 'edit' },
    { id: 'rotate', icon: RotateCw, label: 'Rotate', group: 'edit' },
    
    // AI Tools
    { id: 'upscale', icon: Maximize2, label: 'AI Upscale', group: 'ai' },
    { id: 'enhance', icon: Palette, label: 'AI Enhance', group: 'ai' },
  ];

  const groupedTools = {
    selection: tools.filter(t => t.group === 'selection'),
    shape: tools.filter(t => t.group === 'shape'),
    paint: tools.filter(t => t.group === 'paint'),
    edit: tools.filter(t => t.group === 'edit'),
    ai: tools.filter(t => t.group === 'ai'),
  };

  const renderToolButton = (tool: typeof tools[0]) => {
    const Icon = tool.icon;
    const isActive = activeTool === tool.id;
    const isHovered = hoveredTool === tool.id;

    return (
      <div key={tool.id} className="relative">
        <button
          ref={tool.id === 'lasso' ? lassoBtnRef : undefined}
          onClick={() => {
            if (tool.id === 'lasso') {
              // Toggle flyout on click for lasso
              setShowLassoFlyout(v => !v);
              // Default to lasso free selection on first click
              if (!showLassoFlyout) onToolSelect('lasso');
            } else {
              onToolSelect(tool.id);
            }
          }}
          onMouseEnter={() => setHoveredTool(tool.id)}
          onMouseLeave={() => setHoveredTool(null)}
          className={`
            relative p-2.5 rounded-lg transition-all duration-200 group
            ${isActive 
              ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white shadow-lg shadow-[#A97FFF]/30' 
              : 'bg-transparent text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }
          `}
          title={tool.label}
        >
          <Icon className="w-5 h-5" />
          {/* Tooltip */}
          {isHovered && !isActive && tool.id !== 'lasso' && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-xl">
              {tool.label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </div>
          )}
        </button>

        {/* Lasso Flyout - opens to the right of the button (horizontal, persistent) */}
        {tool.id === 'lasso' && showLassoFlyout && (
          <div
            ref={lassoFlyoutRef}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-white dark:bg-[#1A1A22] border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl p-2 flex flex-row items-center gap-2 z-50"
          >
            <button
              onClick={() => { onToolSelect('lasso'); setShowLassoFlyout(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${activeTool==='lasso' ? 'bg-[#A97FFF] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              <Lasso className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Lasso</span>
            </button>
            <button
              onClick={() => { onToolSelect('rect-select'); setShowLassoFlyout(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${activeTool==='rect-select' ? 'bg-[#A97FFF] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              <Square className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Rect Select</span>
            </button>
            <button
              onClick={() => { onToolSelect('ellipse-select'); setShowLassoFlyout(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${activeTool==='ellipse-select' ? 'bg-[#A97FFF] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              <Circle className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Ellipse Select</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-16 bg-white dark:bg-[#1A1A22] border-r border-gray-200 dark:border-gray-800 flex flex-col py-3 px-2 gap-1">
      {/* Selection Tools */}
      <div className="flex flex-col gap-1 pb-2 border-b border-gray-300 dark:border-gray-700">
        {groupedTools.selection.map(renderToolButton)}
      </div>

      {/* Shape Tools */}
      <div className="flex flex-col gap-1 py-2 border-b border-gray-300 dark:border-gray-700">
        {groupedTools.shape.map(renderToolButton)}
      </div>

      {/* Paint Tools */}
      <div className="flex flex-col gap-1 py-2 border-b border-gray-300 dark:border-gray-700">
        {groupedTools.paint.map(renderToolButton)}
      </div>

      {/* Edit Tools */}
      <div className="flex flex-col gap-1 py-2 border-b border-gray-300 dark:border-gray-700">
        {groupedTools.edit.map(renderToolButton)}
      </div>

      {/* AI Tools */}
      <div className="flex flex-col gap-1 pt-2">
        {groupedTools.ai.map(renderToolButton)}
      </div>
    </div>
  );
}
