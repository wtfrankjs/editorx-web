import { X, Clock, Image as ImageIcon, Download, Trash2, Filter, Search, ChevronDown, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';

interface HistoryItem {
  id: string;
  module: string;
  inputUrl: string;
  outputUrl: string;
  timestamp: number;
  processingTime: number;
  status: 'success' | 'failed' | 'processing';
  cost: number;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadImage: (inputUrl: string, outputUrl: string) => void;
  userId: string | null;
}

export default function HistoryModal({ isOpen, onClose, onLoadImage, userId }: HistoryModalProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // Fetch history from database
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('processing_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const items: HistoryItem[] = (data || []).map((item) => ({
          id: item.id,
          module: item.operation_type,
          inputUrl: item.input_image_url || '',
          outputUrl: item.output_image_url || '',
          timestamp: new Date(item.created_at).getTime(),
          processingTime: item.processing_time || 0,
          status: item.status === 'completed' ? 'success' : item.status === 'failed' ? 'failed' : 'processing',
          cost: item.credits_used || 0
        }));

        setHistoryItems(items);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        // no-op
      }
    };

    fetchHistory();
  }, [isOpen, userId]);

  // Close on ESC and lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const getModuleIcon = (module: string) => {
    const icons: Record<string, JSX.Element> = {
      'upscale': <TrendingUp className="w-4 h-4" />,
      'remove-bg': <Zap className="w-4 h-4" />,
      'pixel-change': <ImageIcon className="w-4 h-4" />
    };
    return icons[module] || <ImageIcon className="w-4 h-4" />;
  };

  const getModuleName = (module: string) => {
    const names: Record<string, string> = {
      'upscale': t('history.upscale'),
      'remove-bg': t('history.removeBg'),
      'pixel-change': t('history.enhance')
    };
    return names[module] || module;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      getModuleName(item.module).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterModule === 'all' || item.module === filterModule;
    return matchesSearch && matchesFilter;
  });

  const totalProcessed = historyItems.length;
  const totalCost = historyItems.reduce((sum, item) => sum + item.cost, 0);
  const avgProcessingTime = historyItems.reduce((sum, item) => sum + item.processingTime, 0) / historyItems.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={(e) => {
      // Close when clicking the dimmed backdrop (but not when clicking inside the dialog)
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white dark:bg-[#0C0C0F] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800 animate-scale-in" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Clock className="w-7 h-7" />
                {t('history.title') || 'İşlem Geçmişi'}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {t('history.subtitle') || 'Tüm görsel işleme geçmişiniz ve istatistikleriniz'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-xs font-medium">{t('history.totalOperations')}</p>
              <p className="text-white text-2xl font-bold mt-1">{totalProcessed}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-xs font-medium">{t('history.totalSpent')}</p>
              <p className="text-white text-2xl font-bold mt-1">${totalCost.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-xs font-medium">{t('history.avgProcessingTime')}</p>
              <p className="text-white text-2xl font-bold mt-1">{avgProcessingTime.toFixed(1)}s</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-6 bg-[#1A1A22]/50 bg-gray-50 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-3">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('history.searchOperations')}
                className="w-full bg-white dark:bg-[#0C0C0F] text-gray-800 dark:text-white pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:border-[#A97FFF] focus:outline-none"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="px-4 py-3 bg-white dark:bg-[#0C0C0F] text-gray-800 dark:text-white rounded-xl border border-gray-300 dark:border-gray-700 hover:border-[#A97FFF] transition-all flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                <span>{t('history.quickActions') /* reuse quickActions as a short label */}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1A1A22] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                  {['all', 'upscale', 'remove-bg', 'pixel-change'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setFilterModule(filter);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#242430] transition-colors ${
                        filterModule === filter 
                          ? 'text-[#A97FFF] font-semibold' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {filter === 'all' ? t('history.allModules') : getModuleName(filter)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="overflow-y-auto max-h-[50vh] p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('history.noHistory') || 'Henüz işlem geçmişi yok'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-[#1A1A22] rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:border-[#A97FFF] transition-all duration-200 group"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail Preview */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <img
                          src={item.inputUrl}
                          alt="Input"
                          className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300 dark:border-gray-700"
                        />
                        <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-lg border-2 border-[#A97FFF] overflow-hidden shadow-lg">
                          <img
                            src={item.outputUrl}
                            alt="Output"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] rounded-lg">
                              {getModuleIcon(item.module)}
                            </div>
                            <h3 className="text-gray-800 dark:text-white font-semibold">
                              {getModuleName(item.module)}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'success'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {item.status === 'success' ? t('history.successStatus') : t('history.failedStatus')}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            {formatTimestamp(item.timestamp)} • {item.processingTime}s • ${item.cost.toFixed(2)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onLoadImage(item.inputUrl, item.outputUrl)}
                            className="p-2 bg-gray-100 dark:bg-[#0C0C0F] hover:bg-[#A97FFF] text-gray-600 dark:text-gray-300 hover:text-white rounded-lg transition-all"
                            title={t('history.reload')}
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = item.outputUrl;
                              link.download = `result-${item.id}.png`;
                              link.click();
                            }}
                            className="p-2 bg-gray-100 dark:bg-[#0C0C0F] hover:bg-[#A97FFF] text-gray-600 dark:text-gray-300 hover:text-white rounded-lg transition-all"
                            title={t('history.download')}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => console.log('Delete', item.id)}
                            className="p-2 bg-gray-100 dark:bg-[#0C0C0F] hover:bg-red-500 text-gray-600 dark:text-gray-300 hover:text-white rounded-lg transition-all"
                            title={t('history.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}




