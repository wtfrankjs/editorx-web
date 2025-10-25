import { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConsoleProps {
  logs: Array<{ timestamp: number; type: 'request' | 'response' | 'error'; data: any }>;
}

export default function Console({ logs }: ConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-[#0C0C0F] border-t border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-[#1A1A22]/30 transition-colors"
      >
          <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#A97FFF]" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">{t('console.title')}</span>
          <span className="text-xs text-gray-600 dark:text-gray-500">({logs.length} {t('console.logs')})</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-4 max-h-64 overflow-y-auto">
          <div className="bg-gray-50 dark:bg-[#0A0A0D] rounded-lg p-4 font-mono text-xs space-y-2">
            {logs.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-500">{t('console.noLogs')}</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-800 pb-3 last:border-0 mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`
                      px-2 py-0.5 rounded text-[10px] font-semibold
                      ${log.type === 'request' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : ''}
                      ${log.type === 'response' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : ''}
                      ${log.type === 'error' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : ''}
                    `}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-gray-600 dark:text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all bg-white/80 dark:bg-[#000000]/50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}




