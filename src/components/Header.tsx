import { History, Settings, Download, Sun, Moon, Globe, Wallet, User, LogIn, ChevronDown, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, languageNames, Language } from '../contexts/LanguageContext';
import logo from '/assets/Logo2.png';

interface HeaderProps {
  onHistoryClick: () => void;
  onSettingsClick: () => void;
  onExportClick: () => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  onBalanceClick: () => void;
  onLoginClick: () => void;
  hasResult?: boolean;
  isLoggedIn: boolean;
  userCredits: number; // Changed from userBalance to userCredits
}

export default function Header({ 
  onHistoryClick, 
  onSettingsClick, 
  onExportClick, 
  onNotificationClick,
  onProfileClick,
  onBalanceClick,
  onLoginClick,
  hasResult = false,
  isLoggedIn,
  userCredits // Changed from userBalance to userCredits
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadNotifications] = useState(3); // Mock unread count
  
  const langMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  const allLanguages: Language[] = ['tr', 'en', 'fr', 'de', 'es', 'it', 'ar', 'ru', 'cn', 'jp'];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
  <header className="bg-white dark:bg-[#0C0C0F] border-b border-gray-200 dark:border-gray-800 px-3 md:px-6 py-3 md:py-4 z-40 sticky top-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div>
            <a href="/editor/"><img src={logo} alt="EditorX_Logo" className="w-30 md:w-40 h-15 md:h-15 p-1 md:p-2" /></a>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap justify-end">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#1A1A22] dark:hover:bg-[#242430] text-gray-800 dark:text-white rounded-lg transition-all duration-200 flex-shrink-0"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
          </button>

          {/* Language Selector - Scrollable */}
          <div className="relative flex-shrink-0" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2 md:px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg transition-all duration-200 flex items-center gap-1 md:gap-2 border border-gray-300 dark:border-gray-700"
            >
              <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <img 
                src={`https://flagcdn.com/w20/${languageNames[language].countryCode}.png`}
                srcSet={`https://flagcdn.com/w40/${languageNames[language].countryCode}.png 2x`}
                width="20"
                alt={languageNames[language].name}
                className="rounded-sm w-4 h-3 md:w-5 md:h-4 object-cover"
              />
              <ChevronDown className="w-3 h-3 md:w-4 md:h-4 hidden md:block" />
            </button>
            
            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {allLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                        language === lang 
                          ? 'text-amber-400 font-semibold bg-amber-50 dark:bg-gray-700/50 text-amber-600 dark:text-amber-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <img 
                        src={`https://flagcdn.com/w20/${languageNames[lang].countryCode}.png`}
                        srcSet={`https://flagcdn.com/w40/${languageNames[lang].countryCode}.png 2x`}
                        width="24"
                        alt={languageNames[lang].name}
                        className="rounded-sm"
                      />
                      <span>{languageNames[lang].name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            onClick={onNotificationClick}
            className="relative p-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#1A1A22] dark:hover:bg-[#242430] text-gray-800 dark:text-white rounded-lg transition-all duration-200 flex-shrink-0"
            title={t('notifications.title')}
            aria-label={t('notifications.title')}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Edge toggle tabs handle panel visibility; header keeps minimal */}

          {/* History Button - Now visible on mobile (icon-only) */}
          <button
            onClick={onHistoryClick}
            className="flex px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#1A1A22] dark:hover:bg-[#242430] text-gray-800 dark:text-white rounded-lg transition-all duration-200 items-center gap-2"
            aria-label={t('header.history')}
          >
            <History className="w-4 h-4" />
            <span className="hidden md:block text-sm font-medium">{t('header.history')}</span>
          </button>

          {/* Settings Button - Now visible on mobile (icon-only) */}
          <button
            onClick={onSettingsClick}
            className="flex px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#1A1A22] dark:hover:bg-[#242430] text-gray-800 dark:text-white rounded-lg transition-all duration-200 items-center gap-2"
            aria-label={t('header.settings')}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:block text-sm font-medium">{t('header.settings')}</span>
          </button>

          {/* Layers toggle moved to edge handle */}

          {/* Export Button - visible on mobile as icon-only when hasResult */}
          <button
            onClick={onExportClick}
            disabled={!hasResult}
            className="flex px-3 md:px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:shadow-none text-white rounded-lg transition-all duration-200 items-center gap-2 shadow-lg shadow-amber-500/20 flex-shrink-0"
            aria-label={t('header.export')}
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:block text-sm font-semibold">{t('header.export')}</span>
          </button>

          {/* Balance & Profile */}
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-700"></div>

          {isLoggedIn ? (
            <>
              {/* Credits Display */}
              <button
                onClick={onBalanceClick}
                className="px-2 md:px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 dark:from-amber-500/20 dark:to-yellow-500/20 dark:hover:from-amber-500/30 dark:hover:to-yellow-500/30 rounded-lg flex items-center gap-1 md:gap-2 border border-amber-500/30 border-amber-400 transition-all group flex-shrink-0"
              >
                <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400">
                  {userCredits.toLocaleString()}
                </span>
                <span className="hidden md:block text-xs text-amber-600/70 dark:text-amber-400/70">{t('credits')}</span>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-amber-600/70 dark:text-amber-400/70 hidden sm:block" />
              </button>

              {/* Profile Menu */}
              <div className="relative flex-shrink-0" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20"
                >
                  <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('header.welcome')}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('header.viewProfile')}</p>
                    </div>
                    <button
                      onClick={() => {
                        onProfileClick();
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      {t('header.profile')}
                    </button>
                    <button
                      onClick={() => {
                        onBalanceClick();
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-medium">{t('header.balance')}</div>
                        <div className="text-xs text-amber-400">{userCredits.toLocaleString()} {t('credits')}</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-3 md:px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-lg transition-all duration-200 flex items-center gap-1 md:gap-2 shadow-lg shadow-amber-500/20 flex-shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span className="text-xs md:text-sm font-semibold">{t('header.login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}




