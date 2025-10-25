import { Maximize2, Eraser, Palette } from 'lucide-react';
import { Module } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ToolbarProps {
  activeModule: Module;
  onModuleSelect: (module: Module) => void;
}

export default function Toolbar({ activeModule, onModuleSelect }: ToolbarProps) {
  const { t } = useLanguage();

  const tools = [
    { id: 'upscale' as Module, nameKey: 'toolbar.upscale', icon: Maximize2 },
    { id: 'remove-bg' as Module, nameKey: 'toolbar.removeBg', icon: Eraser },
    { id: 'pixel-change' as Module, nameKey: 'toolbar.enhance', icon: Palette },
  ];

  return (
    <div className="bg-gray-50 dark:bg-[#0C0C0F] border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      <div className="flex items-center justify-center gap-2 overflow-x-auto">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeModule === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onModuleSelect(tool.id)}
              className={`
                px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap
                ${isActive
                  ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white shadow-lg shadow-[#A97FFF]/30'
                  : 'bg-white dark:bg-[#1A1A22] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#242430] hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{t(tool.nameKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}



