import { X, Bell, Check, Info, AlertCircle, Gift, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'gift';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'İşlem Tamamlandı!',
      message: 'Görseliniz başarıyla upscale edildi ve kaydedildi.',
      timestamp: Date.now() - 300000,
      read: false
    },
    {
      id: '2',
      type: 'gift',
      title: '🎉 Hoş Geldin Bonusu!',
      message: 'Hesabınıza 100 kredi yüklendi. Hemen kullanmaya başlayın!',
      timestamp: Date.now() - 3600000,
      read: false,
      action: {
        label: 'Kullan',
        onClick: () => console.log('Use credits')
      }
    },
    {
      id: '3',
      type: 'info',
      title: 'Yeni Özellik: AI Chat',
      message: 'Artık AI asistanı ile görselleri düzenleyebilirsiniz!',
      timestamp: Date.now() - 7200000,
      read: true
    },
    {
      id: '4',
      type: 'warning',
      title: 'Bakiye Azaldı',
      message: 'Krediniz 10$\'ın altına düştü. Yeni paket almayı düşünün.',
      timestamp: Date.now() - 86400000,
      read: true,
      action: {
        label: 'Yükle',
        onClick: () => console.log('Top up')
      }
    },
    {
      id: '5',
      type: 'success',
      title: 'Profil Güncellendi',
      message: 'Profil bilgileriniz başarıyla kaydedildi.',
      timestamp: Date.now() - 172800000,
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return `${diffMins} ${t('notifications.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('notifications.hoursAgo')}`;
    if (diffDays === 1) return t('notifications.yesterday');
    if (diffDays < 7) return `${diffDays} ${t('notifications.daysAgo')}`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'gift':
        return <Gift className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getColorClasses = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'gift':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0C0C0F] rounded-2xl shadow-2xl w-full max-w-md h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800 animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('notifications.title')}</h2>
                {unreadCount > 0 && (
                  <p className="text-white/80 text-sm">
                    {unreadCount} {t('notifications.unread')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-all text-sm font-medium"
              >
                <Check className="w-4 h-4 inline mr-1" />
                {t('notifications.markAll')}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-all text-sm font-medium"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                {t('notifications.clearAll')}
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="p-4 bg-gray-100 dark:bg-[#1A1A22] rounded-2xl mb-4">
                <Bell className="w-12 h-12 text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {t('notifications.noNotifications')}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {t('notifications.noNotificationsDesc')}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative p-4 rounded-xl border transition-all ${
                  notification.read
                    ? 'bg-gray-50 dark:bg-[#1A1A22]/50 border-gray-200 dark:border-gray-800'
                    : 'bg-white dark:bg-[#1A1A22] border-[#A97FFF]/50 shadow-lg shadow-[#A97FFF]/10'
                }`}
              >
                {/* Unread Indicator */}
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-[#A97FFF] rounded-full animate-pulse"></div>
                )}

                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${getColorClasses(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 dark:text-white font-semibold mb-1 pr-4">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      
                      {notification.action && (
                        <button
                          onClick={notification.action.onClick}
                          className="px-3 py-1 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] text-white rounded-lg text-xs font-medium transition-all"
                        >
                          {notification.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-[#0C0C0F] hover:bg-gray-200 dark:hover:bg-[#1A1A22] text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg text-xs transition-all"
                    >
                      <Check className="w-3 h-3 inline mr-1" />
                      {t('notifications.markRead')}
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-[#0C0C0F] hover:bg-red-500/20 text-gray-800 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-xs transition-all"
                  >
          <Trash2 className="w-3 h-3 inline mr-1" />
        {t('notifications.delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Stats */}
        {notifications.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-[#1A1A22]/50 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {t('notifications.total')}: {notifications.length}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {t('notifications.unreadCount')}: {unreadCount}
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-right {
          from { 
            opacity: 0;
            transform: translateX(100%);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}





