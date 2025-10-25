import { Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  currentImage: string | null;
}

export default function DropZone({ onFileSelect, currentImage }: DropZoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      onFileSelect(file);
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'video/mp4'];
    const maxSize = 200 * 1024 * 1024;

    return validTypes.includes(file.type) && file.size <= maxSize;
  };

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,video/mp4"
        onChange={handleFileInput}
        className="hidden"
      />

      {currentImage ? (
        <div className="w-full h-full flex items-center justify-center p-8">
          <img
            src={currentImage}
            alt="Uploaded content"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full h-full flex flex-col items-center justify-center
            border-2 border-dashed rounded-2xl cursor-pointer
            transition-all duration-300
            ${isDragging
              ? 'border-[#A97FFF] bg-[#A97FFF]/5 scale-[0.98]'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#1A1A22]/30'
            }
          `}
        >
          <div className={`
            w-20 h-20 rounded-full flex items-center justify-center mb-6
            transition-all duration-300
            ${isDragging
              ? 'bg-gradient-to-br from-[#A97FFF] to-[#7C5DFF] scale-110'
              : 'bg-gray-100 dark:bg-[#1A1A22]'
            }
          `}>
            <Upload className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('drop.title')}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('drop.formats')}
          </p>
        </div>
      )}
    </div>
  );
}
