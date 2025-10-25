import { X, Settings, Bell, Lock, Palette, Globe, Zap, Shield, Database, Eye, Monitor } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, languageNames } from '../contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'notifications' | 'advanced'>('general');
  
  // Settings state
  const [settings, setSettings] = useState({
    autoSave: true,
    highQuality: true,
    notifications: true,
    emailNotifications: false,
    soundEffects: true,
    autoExport: false,
    dataCollection: false,
    betaFeatures: false,
    maxResolution: '4k',
    compressionQuality: 90,
    defaultModule: 'upscale'
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', name: t('settings.general'), icon: Settings },
    { id: 'privacy', name: t('settings.privacy'), icon: Shield },
    { id: 'notifications', name: t('settings.notifications'), icon: Bell },
    { id: 'advanced', name: t('settings.advanced'), icon: Zap }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0C0C0F] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800 animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Settings className="w-7 h-7" />
                {t('settings.title')}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {t('settings.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-[#1A1A22]/50 border-r border-gray-200 dark:border-gray-800 p-4 overflow-y-auto">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#0C0C0F]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    {t('settings.appearance')}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-gray-800 dark:text-white font-medium">{t('settings.theme')}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{t('settings.darkLightMode')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => theme === 'light' && toggleTheme()}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            theme === 'dark'
                              ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {t('history.darkMode')}
                        </button>
                        <button
                          onClick={() => theme === 'dark' && toggleTheme()}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            theme === 'light'
                              ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {t('history.lightMode')}
                        </button>
                      </div>
                    </div>

                    {/* Language */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-gray-800 dark:text-white font-medium">{t('settings.language')}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{t('settings.interfaceLanguage')}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as any)}
                          className="w-56 bg-white dark:bg-[#0C0C0F] text-gray-800 dark:text-white pl-12 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-[#A97FFF] focus:outline-none appearance-none cursor-pointer transition-all"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23A97FFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1rem'
                          }}
                        >
                          {Object.entries(languageNames).map(([code, { name }]) => (
                            <option key={code} value={code}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                          <img 
                            src={`https://flagcdn.com/w20/${languageNames[language].countryCode}.png`}
                            srcSet={`https://flagcdn.com/w40/${languageNames[language].countryCode}.png 2x`}
                            width="20"
                            alt={languageNames[language].name}
                            className="rounded-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    {t('settings.processingSettings')}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Auto Save */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                      <div>
                        <p className="text-gray-800 dark:text-white font-medium">{t('settings.autoSave')}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('settings.autoSaveImages')}</p>
                      </div>
                      <button
                        onClick={() => updateSetting('autoSave', !settings.autoSave)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          settings.autoSave ? 'bg-[#A97FFF]' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          settings.autoSave ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* High Quality */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                      <div>
                        <p className="text-gray-800 dark:text-white font-medium">{t('settings.highQuality')}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('settings.slowerButHigherQuality')}</p>
                      </div>
                      <button
                        onClick={() => updateSetting('highQuality', !settings.highQuality)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          settings.highQuality ? 'bg-[#A97FFF]' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          settings.highQuality ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Default Module */}
                    <div className="p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                      <label className="block text-gray-800 dark:text-white font-medium mb-2">
                        {t('settings.defaultModule')}
                      </label>
                      <select
                        value={settings.defaultModule}
                        onChange={(e) => updateSetting('defaultModule', e.target.value)}
                        className="w-full bg-white dark:bg-[#0C0C0F] text-gray-800 dark:text-white px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-[#A97FFF] focus:outline-none"
                      >
                        <option value="upscale">{t('toolbar.upscale')}</option>
                        <option value="remove-bg">{t('toolbar.removeBg')}</option>
                        <option value="pixel-change">{t('toolbar.enhance')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  {t('settings.privacySecurity')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                    <div>
                      <p className="text-gray-800 dark:text-white font-medium">{t('settings.dataCollection')}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{t('settings.shareAnonymousUsageData')}</p>
                    </div>
                    <button
                      onClick={() => updateSetting('dataCollection', !settings.dataCollection)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        settings.dataCollection ? 'bg-[#A97FFF]' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        settings.dataCollection ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Eye className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-800 dark:text-white font-medium">{t('settings.processingHistory')}</p>
                    </div>
                    <button className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all font-medium">
                      {t('settings.clearAllHistory')}
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-800 dark:text-white font-medium">{t('settings.accountSecurity')}</p>
                    </div>
                    <button className="w-full px-4 py-2 bg-[#A97FFF]/20 hover:bg-[#A97FFF]/30 text-[#A97FFF] rounded-lg transition-all font-medium">
                      {t('settings.changePassword')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t('settings.notifications')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                    <div>
                      <p className="text-gray-800 dark:text-white font-medium">{t('settings.inAppNotifications')}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{t('settings.notifyWhenProcessingComplete')}</p>
                    </div>
                    <button
                      onClick={() => updateSetting('notifications', !settings.notifications)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        settings.notifications ? 'bg-[#A97FFF]' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        settings.notifications ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                    <div>
                      <p className="text-gray-800 dark:text-white font-medium">{t('settings.emailNotifications')}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{t('settings.emailForImportantUpdates')}</p>
                    </div>
                    <button
                      onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        settings.emailNotifications ? 'bg-[#A97FFF]' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        settings.emailNotifications ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                    <div>
                      <p className="text-gray-800 dark:text-white font-medium">{t('settings.soundEffects')}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{t('settings.playSoundWhenComplete')}</p>
                    </div>
                    <button
                      onClick={() => updateSetting('soundEffects', !settings.soundEffects)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        settings.soundEffects ? 'bg-[#A97FFF]' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        settings.soundEffects ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {t('settings.advancedSettings')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                    <div>
                      <p className="text-gray-800 dark:text-white font-medium">{t('settings.betaFeatures')}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{t('settings.tryNewFeaturesEarly')}</p>
                    </div>
                    <button
                      onClick={() => updateSetting('betaFeatures', !settings.betaFeatures)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        settings.betaFeatures ? 'bg-[#A97FFF]' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        settings.betaFeatures ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                    <label className="block text-gray-800 dark:text-white font-medium mb-2">
                      {t('settings.maximumResolution')}
                    </label>
                    <select
                      value={settings.maxResolution}
                      onChange={(e) => updateSetting('maxResolution', e.target.value)}
                      className="w-full bg-white dark:bg-[#0C0C0F] text-gray-800 dark:text-white px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-[#A97FFF] focus:outline-none"
                    >
                      <option value="1080p">1080p (Full HD)</option>
                      <option value="2k">2K (QHD)</option>
                      <option value="4k">4K (Ultra HD)</option>
                      <option value="8k">8K (Premium)</option>
                    </select>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                    <label className="block text-gray-800 dark:text-white font-medium mb-2">
                      {t('settings.compressionQuality')}: {settings.compressionQuality}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.compressionQuality}
                      onChange={(e) => updateSetting('compressionQuality', Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{t('settings.low')}</span>
                      <span>{t('settings.high')}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ {t('settings.advancedSettingsWarning')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#1A1A22]/50 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <p className="text-gray-600 dark:text-gray-500 text-sm">
            {t('settings.settingsAutoSaved')}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] text-white rounded-lg transition-all font-medium shadow-lg shadow-[#A97FFF]/20"
          >
            {t('settings.ok')}
          </button>
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




