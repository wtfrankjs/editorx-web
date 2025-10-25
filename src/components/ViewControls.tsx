import { ZoomIn, Maximize, Split } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ViewControlsProps {
  onZoom: () => void;
  onFit: () => void;
  onCompare: () => void;
  hasResult: boolean;
  currentMode?: 'fit' | 'zoom' | 'compare';
}

export default function ViewControls({ onZoom, onFit, onCompare, hasResult, currentMode = 'fit' }: ViewControlsProps) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center gap-3 py-4 bg-[#0C0C0F]/30 border-t border-gray-800/50">
      <button
        onClick={onZoom}
        className={`
          px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2
          ${currentMode === 'zoom'
            ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white shadow-lg shadow-[#A97FFF]/30'
            : 'bg-[#1A1A22] text-white hover:bg-[#242430]'
          }
        `}
      >
        <ZoomIn className="w-4 h-4" />
  <span className="text-sm font-medium">{t('view.zoom')}</span>
      </button>

      <button
        onClick={onFit}
        className={`
          px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2
          ${currentMode === 'fit'
            ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white shadow-lg shadow-[#A97FFF]/30'
            : 'bg-[#1A1A22] text-white hover:bg-[#242430]'
          }
        `}
      >
        <Maximize className="w-4 h-4" />
  <span className="text-sm font-medium">{t('view.fit')}</span>
      </button>

      <button
        onClick={onCompare}
        disabled={!hasResult}
        className={`
          px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2
          ${currentMode === 'compare' && hasResult
            ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white shadow-lg shadow-[#A97FFF]/30'
            : 'bg-[#1A1A22] text-white hover:bg-[#242430]'
          }
          ${!hasResult ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <Split className="w-4 h-4" />
  <span className="text-sm font-medium">{t('view.compare')}</span>
      </button>
    </div>
  );
}
