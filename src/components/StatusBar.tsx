import { Activity, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface StatusBarProps {
  status: string;
  processingTime?: number;
  modelVersion?: string;
}

export default function StatusBar({ status, processingTime }: StatusBarProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-white dark:bg-[#0C0C0F] border-t border-gray-200 dark:border-gray-800 px-6 py-3">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#A97FFF]" />
          <span className="text-gray-600 dark:text-gray-400">{t('status.label')}</span>
          <span className="text-gray-900 dark:text-white font-medium">{status}</span>
        </div>

        {processingTime !== undefined && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#A97FFF]" />
            <span className="text-gray-600 dark:text-gray-400">{t('status.processingTime')}</span>
            <span className="text-gray-900 dark:text-white font-medium">{processingTime.toFixed(2)}s</span>
          </div>
        )}
      </div>
    </div>
  );
}

