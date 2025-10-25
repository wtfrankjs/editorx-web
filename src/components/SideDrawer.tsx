import { X } from 'lucide-react';
import React, { useEffect } from 'react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  widthClass?: string; // e.g., 'w-96' or 'max-w-md'
  title?: string;
  children: React.ReactNode;
}

export default function SideDrawer({ isOpen, onClose, side = 'right', widthClass = 'w-96', title, children }: SideDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* Panel */}
      <div
        className={`absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full bg-white dark:bg-[#0C0C0F] border-${side === 'right' ? 'l' : 'r'} border-gray-200 dark:border-gray-800 shadow-2xl ${widthClass} animate-slide-in`}
        role="dialog" aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-900 dark:text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded" aria-label="Close drawer">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="h-[calc(100%-52px)] overflow-y-auto">{children}</div>
      </div>
      <style>{`
        @keyframes slide-in { from { transform: translateX(${side === 'right' ? '100%' : '-100%'}); opacity: 0.8; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 160ms ease-out; }
      `}</style>
    </div>
  );
}

