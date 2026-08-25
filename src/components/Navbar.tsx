import React from 'react';
import { Language, ShopSettings } from '../types';
import { translations } from '../translations/i18n';
import { 
  Scissors, 
  Menu, 
  PlusCircle, 
  Globe, 
  LayoutDashboard,
  Users,
  Sparkles
} from 'lucide-react';
import { MainNavTab, SettingsSubTab } from './Sidebar';

interface NavbarProps {
  currentTab: MainNavTab;
  language: Language;
  shopSettings: ShopSettings;
  onToggleSidebar: () => void;
  onTabChange: (tab: MainNavTab, subTab?: SettingsSubTab) => void;
  onLanguageChange: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  language,
  shopSettings,
  onToggleSidebar,
  onTabChange,
  onLanguageChange,
}) => {
  const t = translations[language];

  const shopTitle = language === 'ps' 
    ? shopSettings.shopNamePs 
    : language === 'fa' 
    ? shopSettings.shopNameFa 
    : shopSettings.shopNameEn;

  return (
    <header className="sticky top-0 z-30 bg-[#1A1A1A] text-white border-b border-[#2A2A2A] shadow-md no-print">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left / Start: Sidebar Toggle & Brand */}
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button (visible on all screens for quick collapse/expand) */}
            <button
              onClick={onToggleSidebar}
              id="sidebar-toggle-btn"
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title={t.menu}
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Shop Brand */}
            <div 
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#1A1A1A] font-black shadow-sm group-hover:scale-105 transition">
                <Scissors className="w-4 h-4 transform -rotate-45" />
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight flex items-center gap-2">
                  <span>{shopTitle || 'Rayan Tailor Shop Management'}</span>
                </h1>
                <p className="text-[10px] text-[#D4AF37] font-medium hidden sm:block">
                  {t.appSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onTabChange('new_order')}
              id="nav-quick-new-order"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] font-black rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t.newOrder}</span>
            </button>

            {/* Language Switcher Bar */}
            <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-xl border border-stone-700/80">
              <Globe className="w-3.5 h-3.5 text-[#D4AF37] ml-1 mr-0.5" />
              
              <button
                type="button"
                onClick={() => onLanguageChange('fa')}
                id="topbar-lang-fa"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  language === 'fa'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] font-black'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                دری
              </button>

              <button
                type="button"
                onClick={() => onLanguageChange('ps')}
                id="topbar-lang-ps"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  language === 'ps'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] font-black'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                پښتو
              </button>

              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                id="topbar-lang-en"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] font-black'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

