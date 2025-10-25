import { Upload, ImagePlus, Sparkles, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../contexts/LanguageContext';
import { uploadImage } from '../services/api';

export default function MultiFileDropZone() {
  const { t } = useLanguage();
  const { addLayer } = useProject();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    // Basic validation: type and size (<= 10MB each)
    const MAX_MB = 10;
    const validFiles: File[] = [];
    const newErrors: string[] = [];
    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        newErrors.push(`${f.name}: Desteklenmeyen dosya türü`);
        continue;
      }
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > MAX_MB) {
        newErrors.push(`${f.name}: ${sizeMB.toFixed(1)} MB > ${MAX_MB} MB sınırı`);
        continue;
      }
      validFiles.push(f);
    }
    if (newErrors.length) setErrors(prev => [...prev, ...newErrors]);

    if (validFiles.length === 0) return;

    const fileNames = validFiles.map(f => f.name);
    setUploadingFiles(prev => [...prev, ...fileNames]);

    // Process all files in parallel
    const uploadPromises = validFiles.map(async (file) => {
      try {
        // Simulate progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 100);

        const dataUrl = await uploadImage(file);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        // Add as new layer
        addLayer(dataUrl, file.name.replace(/\.[^/.]+$/, ''));

        // Remove from uploading list after short delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(name => name !== file.name));
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 500);

      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
  };

  const cancelUpload = (fileName: string) => {
    setUploadingFiles(prev => prev.filter(name => name !== fileName));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative h-full flex flex-col items-center justify-center transition-all duration-300 ${
          isDragging
            ? 'bg-[#A97FFF]/10 border-[#A97FFF]'
            : 'bg-transparent'
        }`}
      >
        {/* Main Upload Area */}
        <div className="text-center space-y-6 px-8">
          {/* Icon */}
          <div className={`relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-[#A97FFF] to-[#7C5DFF] flex items-center justify-center shadow-2xl transition-transform duration-300 ${
            isDragging ? 'scale-110 rotate-3' : 'scale-100'
          }`}>
            <Upload className="w-12 h-12 text-white" />
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gray-900" />
            </div>
          </div>

          {/* Text */}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('dropzone.multiTitle') || 'Upload Multiple Images'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-md mx-auto">
              {t('dropzone.multiSubtitle') || 'Drag and drop multiple images here, or click to browse'}
            </p>
          </div>

          {/* Upload Button */}
          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-4 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] text-white rounded-xl font-semibold shadow-lg shadow-[#A97FFF]/30 transition-all hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <ImagePlus className="w-5 h-5" />
              {t('dropzone.selectMultiple') || 'Select Multiple Images'}
            </button>

            <p className="text-xs text-gray-600 dark:text-gray-500">
              {t('dropzone.formats') || 'PNG, JPG, WEBP (max. 10MB each)'}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="p-4 bg-white/50 dark:bg-[#1A1A22]/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-2">🎨</div>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {t('dropzone.feature1') || 'Multi-Layer Editing'}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-[#1A1A22]/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {t('dropzone.feature2') || 'Batch Processing'}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-[#1A1A22]/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-3xl mb-2">🔄</div>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {t('dropzone.feature3') || 'Non-Destructive'}
              </p>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="absolute bottom-4 left-4 max-w-md bg-red-600/90 text-white text-xs rounded-lg shadow-lg p-3 space-y-1 z-50">
          {errors.slice(-5).map((msg, idx) => (
            <div key={idx} className="leading-snug">{msg}</div>
          ))}
        </div>
      )}

      {/* Upload Progress Overlay */}
      {uploadingFiles.length > 0 && (
        <div className="absolute bottom-4 right-4 w-80 max-h-96 overflow-y-auto bg-white/95 dark:bg-[#1A1A22]/95 backdrop-blur-lg border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('dropzone.uploading') || 'Uploading'} ({uploadingFiles.length})
            </h4>
          </div>

          <div className="space-y-3">
            {uploadingFiles.map((fileName) => (
              <div
                key={fileName}
                className="p-3 bg-gray-50 dark:bg-[#0C0C0F] rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-900 dark:text-white font-medium truncate flex-1">
                    {fileName}
                  </span>
                  <button
                    onClick={() => cancelUpload(fileName)}
                    className="ml-2 p-1 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] transition-all duration-300"
                    style={{ width: `${uploadProgress[fileName] || 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500">
                    {uploadProgress[fileName] === 100 ? 'Complete!' : `${uploadProgress[fileName] || 0}%`}
                  </span>
                  {uploadProgress[fileName] === 100 && (
                    <span className="text-[10px] text-green-400">✓ Added to canvas</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#A97FFF]/20 backdrop-blur-sm border-4 border-dashed border-[#A97FFF] rounded-2xl flex items-center justify-center pointer-events-none z-40">
          <div className="text-center">
            <Upload className="w-20 h-20 text-[#A97FFF] mx-auto mb-4 animate-bounce" />
            <p className="text-2xl font-bold text-[#A97FFF]">
              {t('dropzone.dropHere') || 'Drop images here'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}



