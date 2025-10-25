import { Clock, RotateCcw, ChevronRight, Check, AlertCircle, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProcessingTimeline() {
  const { t } = useLanguage();
  const { layers, activeLayerId, jumpToStep, clearLayerHistory } = useProject();

  const activeLayer = layers.find(l => l.id === activeLayerId);
  
  // Find current step index (last step in history)
  const currentStepIndex = activeLayer ? activeLayer.processingHistory.length - 1 : -1;

  const goToPreviousStep = () => {
    if (activeLayer && currentStepIndex > 0) {
      jumpToStep(activeLayer.id, currentStepIndex - 1);
    }
  };

  // const goToNextStep = () => {
  //   // Note: This won't work with current implementation as we slice history
  //   // We need to track "current position" separately
  //   if (activeLayer && currentStepIndex < activeLayer.processingHistory.length - 1) {
  //     jumpToStep(activeLayer.id, currentStepIndex + 1);
  //   }
  // };

  const goToFirst = () => {
    if (activeLayer && activeLayer.processingHistory.length > 0) {
      jumpToStep(activeLayer.id, 0);
    }
  };

  const goToLast = () => {
    if (activeLayer && activeLayer.processingHistory.length > 0) {
      jumpToStep(activeLayer.id, activeLayer.processingHistory.length - 1);
    }
  };

  // Always show timeline if there's any layer with history
  const layersWithHistory = layers.filter(l => l.processingHistory.length > 0);
  
  if (layersWithHistory.length === 0) {
    return null; // Don't show timeline at all if no layers have history
  }

  if (!activeLayer || activeLayer.processingHistory.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-[#1A1A22] border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-500">
              {t('timeline.selectLayer') || 'Select a processed layer to view history'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-[#1A1A22] border-t border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#A97FFF]" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('timeline.title') || 'Processing History'}
          </h4>
          <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
            {activeLayer.processingHistory.length} {activeLayer.processingHistory.length === 1 ? 'step' : 'steps'}
          </span>
          
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={goToFirst}
              disabled={currentStepIndex <= 0}
              className="p-1.5 rounded hover:bg-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="First step"
            >
              <ChevronsLeft className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={goToPreviousStep}
              disabled={currentStepIndex <= 0}
              className="p-1.5 rounded hover:bg-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous step"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-xs text-gray-500 px-2">
              {currentStepIndex + 1} / {activeLayer.processingHistory.length}
            </span>
            <button
              onClick={goToLast}
              disabled={currentStepIndex >= activeLayer.processingHistory.length - 1}
              className="p-1.5 rounded hover:bg-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Latest step"
            >
              <ChevronsRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        <button
          onClick={() => clearLayerHistory(activeLayer.id)}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          title="Reset to original"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('timeline.reset') || 'Reset'}
        </button>
      </div>

      {/* Timeline */}
      <div className="p-4 overflow-x-auto">
        <div className="flex items-center gap-3 min-w-max">
          {/* Original */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-900">
                <img
                  src={activeLayer.originalImage}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-900 dark:text-white">0</span>
              </div>
            </div>
            <span className="text-xs text-gray-500 font-medium">Original</span>
          </div>

          {/* Steps */}
          {activeLayer.processingHistory.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />

              {/* Step */}
              <button
                onClick={() => jumpToStep(activeLayer.id, index)}
                className="flex flex-col items-center gap-2 group"
                title={`Jump to step ${index + 1}`}
              >
                <div className="relative">
                  <div className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === activeLayer.processingHistory.length - 1
                      ? 'border-[#A97FFF] shadow-lg shadow-[#A97FFF]/30'
                      : 'border-gray-300 dark:border-gray-700 group-hover:border-[#A97FFF]/50'
                  } bg-gray-200 dark:bg-gray-900`}>
                    <img
                      src={step.outputImage}
                      alt={`Step ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Step Number Badge */}
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                    index === activeLayer.processingHistory.length - 1
                      ? 'bg-[#A97FFF]'
                      : 'bg-gray-300 dark:bg-gray-700'
                  }`}>
                    <span className="text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -left-1">
                    {step.status === 'success' && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {step.status === 'failed' && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {step.status === 'processing' && (
                      <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Step Info */}
                <div className="text-center">
                  <p className={`text-xs font-medium ${
                    index === activeLayer.processingHistory.length - 1
                      ? 'text-[#A97FFF]'
                      : 'text-gray-400 group-hover:text-[#A97FFF]'
                  }`}>
                    {step.module}
                  </p>
                  {step.processingTime && (
                    <p className="text-[10px] text-gray-600">
                      {step.processingTime.toFixed(1)}s
                    </p>
                  )}
                </div>
              </button>
            </div>
          ))}

          {/* Current State Indicator */}
          <div className="ml-3 px-4 py-2 bg-[#A97FFF]/10 border border-[#A97FFF]/30 rounded-lg">
            <p className="text-xs text-[#A97FFF] font-semibold">Current</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {new Date(activeLayer.processingHistory[activeLayer.processingHistory.length - 1].timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-600 dark:text-gray-500">
          💡 {t('timeline.hint') || 'Click any step to jump back to that state'}
        </p>
      </div>
    </div>
  );
}




