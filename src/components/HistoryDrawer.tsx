import { useEffect, useState } from 'react';
import SideDrawer from './SideDrawer';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, Download, Image as ImageIcon, Trash2, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '../services/supabase';

interface HistoryItem {
  id: string;
  module: string;
  inputUrl: string;
  outputUrl: string;
  timestamp: number;
  processingTime: number;
  status: 'success' | 'failed' | 'processing';
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadImage: (inputUrl: string, outputUrl: string) => void;
  userId: string | null;
}

export default function HistoryDrawer({ isOpen, onClose, onLoadImage, userId }: HistoryDrawerProps) {
  const { t } = useLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);

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
          .limit(20);

        if (error) throw error;

        const historyItems: HistoryItem[] = (data || []).map((item) => ({
          id: item.id,
          module: item.operation_type,
          inputUrl: item.input_image_url || '',
          outputUrl: item.output_image_url || '',
          timestamp: new Date(item.created_at).getTime(),
          processingTime: item.processing_time || 0,
          status: item.status === 'completed' ? 'success' : item.status === 'failed' ? 'failed' : 'processing'
        }));

        setItems(historyItems);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        // no-op
      }
    };

    fetchHistory();
  }, [isOpen, userId]);

  const getIcon = (m: string) => ({
    'upscale': <TrendingUp className="w-3.5 h-3.5" />,
    'remove-bg': <Zap className="w-3.5 h-3.5" />,
    'pixel-change': <ImageIcon className="w-3.5 h-3.5" />,
  } as Record<string, JSX.Element>)[m] || <ImageIcon className="w-3.5 h-3.5" />;

  const fmt = (ts: number) => new Date(ts).toLocaleTimeString();

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} side="right" widthClass="w-[420px]" title={t('history.title') || 'İşlem Geçmişi'}>
      <div className="p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3" />{t('history.noHistory')}
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-gray-800 hover:border-[#A97FFF] transition-colors">
              <img src={item.inputUrl} className="w-16 h-16 rounded object-cover border border-gray-300 dark:border-gray-700" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{getIcon(item.module)}<span>{item.module}</span></span>
                  <span>• {fmt(item.timestamp)}</span>
                  <span>• {item.processingTime.toFixed(1)}s</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    className="px-2 py-1 text-xs bg-[#1A1A22] border border-gray-300 dark:border-gray-700 rounded hover:bg-[#242430] text-gray-900 dark:text-white"
                    onClick={() => onLoadImage(item.inputUrl, item.outputUrl)}
                  >
                    <ImageIcon className="w-3.5 h-3.5 inline mr-1" /> {t('history.reload')}
                  </button>
                  <button
                    className="px-2 py-1 text-xs bg-[#1A1A22] border border-gray-300 dark:border-gray-700 rounded hover:bg-[#242430] text-gray-900 dark:text-white"
                    onClick={() => { const a = document.createElement('a'); a.href=item.outputUrl; a.download=`result-${item.id}.png`; a.click(); }}
                  >
                    <Download className="w-3.5 h-3.5 inline mr-1" /> {t('history.download')}
                  </button>
                  <button
                    className="px-2 py-1 text-xs bg-[#1A1A22] border border-gray-300 dark:border-gray-700 rounded hover:bg-red-600/30 text-gray-900 dark:text-white"
                    onClick={() => console.log('delete', item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" /> {t('history.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </SideDrawer>
  );
}


