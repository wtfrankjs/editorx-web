import { CheckCircle, Clock, ExternalLink, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultDisplayProps {
  outputUrl: string;
  status?: string;
  predictTime?: number;
  webUrl?: string;
  onDownload: () => void;
}

export default function ResultDisplay({
  outputUrl,
  status,
  predictTime,
  webUrl,
  onDownload,
}: ResultDisplayProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-[#1A1A22]">
        <img
          src={outputUrl}
          alt="Processed result"
          className="w-full h-auto"
        />
      </div>

      <div className="bg-[#1A1A22] rounded-xl p-4 border border-gray-800 space-y-3">
        {status && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">{t('result.statusLabel')}</span>
            <span className="text-sm font-semibold text-green-400">{status}</span>
          </div>
        )}

        {predictTime !== undefined && typeof predictTime === 'number' && !isNaN(predictTime) && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#A97FFF]" />
            <span className="text-sm text-gray-400">{t('result.predictTime')}</span>
            <span className="text-sm font-medium text-white">{predictTime.toFixed(2)}s</span>
          </div>
        )}

        {webUrl && (
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">{t('result.webUrl')}</span>
            <a
              href={webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 underline truncate flex-1"
            >
              {webUrl}
            </a>
          </div>
        )}

        <button
          onClick={onDownload}
          className="w-full mt-4 py-3 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#A97FFF]/20"
        >
          <Download className="w-5 h-5" />
          {t('result.download')}
        </button>
      </div>
    </div>
  );
}
