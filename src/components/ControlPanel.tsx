import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Module } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ControlPanelProps {
  module: Module;
  onProcess: (params: any) => void;
  isProcessing: boolean;
  disabled?: boolean;
}


export default function ControlPanel({ module, onProcess, isProcessing, disabled = false }: ControlPanelProps) {
  const { t } = useLanguage();
  const [upscaleParams, setUpscaleParams] = useState({ scale: 4, face_enhance: false });
  const [removeBgParams, setRemoveBgParams] = useState({ threshold: 0 });
  const [pixelParams, setPixelParams] = useState({ prompt: '', strength: 0.5 });
  const [useComposite, setUseComposite] = useState(false);

  const handleProcess = () => {
    if (module === 'upscale') {
      onProcess({ ...upscaleParams, composite: useComposite });
    } else if (module === 'remove-bg') {
      onProcess({ ...removeBgParams, composite: useComposite });
    } else if (module === 'pixel-change') {
      onProcess({ ...pixelParams, composite: useComposite });
    }
  };

  if (!module) return null;

  return (
    <div className="bg-white dark:bg-[#1A1A22] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 backdrop-blur-xl">
      <div className="space-y-6">
        {/* Composite toggle when layers exist handled by parent; always available as an option */}
        <div className="flex items-center justify-between">
          <label className={`text-sm font-medium ${disabled ? 'text-gray-600 dark:text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {t('control.processComposite') || 'Kompoziti işle'}
          </label>
          <button
            onClick={() => !disabled && setUseComposite(v => !v)}
            disabled={disabled}
            className={`relative w-12 h-6 rounded-full transition-all ${useComposite ? 'bg-[#A97FFF]' : 'bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useComposite ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        {/* Process */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleProcess}
            disabled={isProcessing || disabled}
            className="flex-1 py-3 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#A97FFF]/20"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('control.processingImage')}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {module ? t(`control.process${module.charAt(0).toUpperCase() + module.slice(1).replace('-', '')}`) || t('control.processImage') : t('control.processImage')}
              </>
            )}
          </button>

          {/* Reroll removed with smart-crop */}
        </div>

        {module === 'upscale' && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-2 ${disabled ? 'text-gray-600 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                {t('control.scaleFactor')}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={upscaleParams.scale}
                onChange={(e) => !disabled && setUpscaleParams({ ...upscaleParams, scale: Number(e.target.value) })}
                disabled={disabled}
                className={`w-full h-6 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mt-1">
                <span>1x</span>
                <span className="text-[#A97FFF] font-semibold">{upscaleParams.scale}x</span>
                <span>10x</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${disabled ? 'text-gray-600 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                {t('control.faceEnhancement')}
              </label>
              <button
                onClick={() => !disabled && setUpscaleParams({ ...upscaleParams, face_enhance: !upscaleParams.face_enhance })}
                disabled={disabled}
                className={`
                  relative w-12 h-6 rounded-full transition-all duration-200
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${upscaleParams.face_enhance ? 'bg-[#A97FFF]' : 'bg-gray-700'}
                `}
              >
                <div className={`
                  absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200
                  ${upscaleParams.face_enhance ? 'left-7' : 'left-1'}
                `} />
              </button>
            </div>
          </>
        )}

        {/* Smart-crop controls removed */}

        {module === 'remove-bg' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('control.threshold')}
                <span className="text-xs text-gray-600 dark:text-gray-500 ml-2">({t('control.edgeSensitivity')})</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={removeBgParams.threshold}
                onChange={(e) => setRemoveBgParams({ ...removeBgParams, threshold: Number(e.target.value) })}
                className="w-full h-6 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mt-1">
                <span>{t('control.soft')} (0.0)</span>
                <span className="text-[#A97FFF] font-semibold">{removeBgParams.threshold.toFixed(2)}</span>
                <span>{t('control.balanced')} (0.5)</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-500 mt-2">
                {removeBgParams.threshold < 0.15 ? `🌊 ${t('control.verySoft')}` : 
                 removeBgParams.threshold < 0.35 ? `⚖️ ${t('control.naturalEdges')}` : 
                 `✂️ ${t('control.cleanCutout')}`}
              </p>
            </div>
          </>
        )}

        {module === 'pixel-change' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('control.enhancementPrompt')}
              </label>
              <textarea
                value={pixelParams.prompt}
                onChange={(e) => setPixelParams({ ...pixelParams, prompt: e.target.value })}
                placeholder={t('history.enhanceColorsAdjustBrightness')}
                rows={3}
                className="w-full bg-white dark:bg-[#0C0C0F] text-white px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-[#A97FFF] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('control.strength')}
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={pixelParams.strength}
                onChange={(e) => setPixelParams({ ...pixelParams, strength: Number(e.target.value) })}
                className="w-full h-6 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mt-1">
                <span>{t('control.subtle')}</span>
                <span className="text-[#A97FFF] font-semibold">{(pixelParams.strength * 100).toFixed(0)}%</span>
                <span>{t('control.strong')}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


