import { X, Download } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, quality: number) => void;
  imageUrl: string;
}

export default function ExportDialog({ isOpen, onClose, onExport, imageUrl }: ExportDialogProps) {
  const { t } = useLanguage();
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [quality, setQuality] = useState(95);

  if (!isOpen) return null;

  const formats = [
    { value: 'png', label: 'PNG', desc: t('export.pngDesc') },
    { value: 'jpg', label: 'JPG', desc: t('export.jpgDesc') },
    { value: 'webp', label: 'WebP', desc: t('export.webpDesc') },
  ];

  const handleExport = () => {
    onExport(selectedFormat, quality);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1A22] rounded-2xl border border-gray-800 p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Download className="w-6 h-6 text-[#A97FFF]" />
              {t('export.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('export.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="w-full h-32 object-cover"
          />
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('export.format')}
          </label>
          <div className="space-y-2">
            {formats.map((format) => (
              <button
                key={format.value}
                onClick={() => setSelectedFormat(format.value)}
                className={`
                  w-full p-4 rounded-lg border transition-all duration-200 text-left
                  ${selectedFormat === format.value
                    ? 'border-[#A97FFF] bg-[#A97FFF]/10'
                    : 'border-gray-300 dark:border-gray-700 bg-[#0C0C0F] hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">{format.label}</span>
                  {selectedFormat === format.value && (
                    <div className="w-5 h-5 rounded-full bg-[#A97FFF] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{format.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Slider (only for JPG and WebP) */}
        {(selectedFormat === 'jpg' || selectedFormat === 'webp') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('export.quality')}
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-6 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t('export.lowerSize')}</span>
              <span className="text-[#A97FFF] font-semibold">{quality}%</span>
              <span>{t('export.bestQuality')}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-all duration-200"
          >
            {t('export.cancel')}
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] text-gray-900 dark:text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-[#A97FFF]/20 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t('export.export')}
          </button>
        </div>
      </div>
    </div>
  );
}





