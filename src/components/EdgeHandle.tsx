import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EdgeHandleProps {
  side: 'left' | 'right';
  open: boolean; // whether the adjacent panel is open
  onClick: () => void;
  className?: string;
  label?: string;
}

export default function EdgeHandle({ side, open, onClick, className = '', label }: EdgeHandleProps) {
  const isLeft = side === 'left';
  const Icon = isLeft ? (open ? ChevronLeft : ChevronRight) : (open ? ChevronRight : ChevronLeft);
  return (
    <button
      onClick={onClick}
      aria-label={label || (open ? 'Paneli gizle' : 'Paneli göster')}
      className={`group absolute top-1/2 -translate-y-1/2 ${isLeft ? 'right-0 translate-x-[70%]' : 'left-0 -translate-x-[70%]'} z-[60]`}
    >
      <div
        className={`flex items-center justify-center w-8 h-24 rounded-full bg-white/95 dark:bg-[#1A1A22]/95 border border-gray-300 dark:border-gray-600 shadow-2xl backdrop-blur-md hover:scale-105 hover:ring-1 hover:ring-[#A97FFF]/40 transition-all ${className}`}
        style={{ clipPath: isLeft ? 'polygon(0% 0%, 100% 10%, 100% 90%, 0% 100%)' : 'polygon(0% 10%, 100% 0%, 100% 100%, 0% 90%)' }}
      >
        <Icon className="w-5 h-5 text-gray-900 dark:text-white drop-shadow" />
      </div>
    </button>
  );
}


