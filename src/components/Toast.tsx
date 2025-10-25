import { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in">
      <div
        className={`
          min-w-[300px] max-w-md rounded-xl shadow-2xl border backdrop-blur-xl p-4 flex items-start gap-3
          ${type === 'error'
            ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-200'
            : 'bg-green-50 dark:bg-green-500/10 border-green-300 dark:border-green-500/30 text-green-800 dark:text-green-200'
          }
        `}
      >
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}



