import React from 'react';
import { Language, ShopSettings, Order, Customer } from '../types';
import { translations } from '../translations/i18n';
import { 
  Scissors, 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  Sparkles, 
  Ruler, 
  Building2, 
  Database, 
  Globe, 
  X,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export type MainNavTab = 'dashboard' | 'new_order' | 'customers' | 'settings';
export type SettingsSubTab = 'design' | 'measurements' | 'shop' | 'backup';

interface SidebarProps {
  currentTab: MainNavTab;
  settingsSubTab: SettingsSubTab;
  language: Language;
  shopSettings: ShopSettings;
  orders: Order[];
  customers: Customer[];
  designCategoriesCount: number;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
  onSelectNav: (tab: MainNavTab, subTab?: SettingsSubTab) => void;
  onLanguageChange: (lang: Language) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  settingsSubTab,
  language,
  shopSettings,
  orders,
  customers,
  designCategoriesCount,
  isOpenOnMobile,
  onCloseMobile,
  onSelectNav,
  onLanguageChange,
}) => {
  const t = translations[language];
  const isRtl = language === 'fa' || language === 'ps';

  const shopTitle = language === 'ps' 
    ? shopSettings.shopNamePs 
    : language === 'fa' 
    ? shopSettings.shopNameFa 
    : shopSettings.shopNameEn;

  // Stats for badge chips
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const totalCustomersCount = customers.length;

  const handleNavClick = (tab: MainNavTab, subTab?: SettingsSubTab) => {
    onSelectNav(tab, subTab);
    onCloseMobile();
  };

  const isTabActive = (tab: MainNavTab, subTab?: SettingsSubTab) => {
    if (tab !== currentTab) return false;
    if (tab === 'settings') {
      return subTab ? settingsSubTab === subTab : true;
    }
    return true;
  };

  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenOnMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity no-print"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 z-50 flex flex-col w-72 bg-[#1A1A1A] text-white border-stone-800 transition-transform duration-300 ease-in-out lg:translate-x-0 no-print shadow-2xl lg:shadow-none ${
          isRtl 
            ? 'right-0 border-l border-[#2A2A2A]' 
            : 'left-0 border-r border-[#2A2A2A]'
        } ${
          isOpenOnMobile 
            ? 'translate-x-0' 
            : isRtl 
            ? 'translate-x-full lg:translate-x-0' 
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A] shrink-0 bg-[#161616]">
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#1A1A1A] font-black shadow-md group-hover:scale-105 transition-transform duration-200">
              <Scissors className="w-5 h-5 transform -rotate-45" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight truncate">
                {shopTitle || 'Rayan Tailors'}
              </h1>
              <p className="text-[10px] text-[#D4AF37] font-semibold tracking-wide truncate">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button: New Order */}
        <div className="p-4 pb-2 shrink-0">
          <button
            onClick={() => handleNavClick('new_order')}
            id="sidebar-new-order-btn"
            className="w-full flex items-center justify-between px-4 py-3 bg-[#D4AF37] hover:bg-[#B39025] active:bg-[#B39025] text-[#1A1A1A] font-black rounded-xl text-xs transition-all duration-150 cursor-pointer shadow-md group"
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="text-sm">{t.newOrder}</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-black/10 rounded-md">
              F2
            </span>
          </button>
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
          {/* Section: Main Menu */}
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t.menu}
          </div>

          {/* 1. Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            id="sidebar-dashboard-link"
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTabActive('dashboard')
                ? 'bg-white/10 text-[#D4AF37] shadow-xs border border-[#D4AF37]/30 font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={`w-4 h-4 ${isTabActive('dashboard') ? 'text-[#D4AF37]' : 'text-stone-400'}`} />
              <span>{t.dashboard}</span>
            </div>
            {totalOrdersCount > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isTabActive('dashboard') ? 'bg-[#D4AF37] text-[#1A1A1A]' : 'bg-stone-800 text-stone-300'
              }`}>
                {totalOrdersCount}
              </span>
            )}
          </button>

          {/* 2. Customers Directory */}
          <button
            onClick={() => handleNavClick('customers')}
            id="sidebar-customers-link"
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTabActive('customers')
                ? 'bg-white/10 text-[#D4AF37] shadow-xs border border-[#D4AF37]/30 font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className={`w-4 h-4 ${isTabActive('customers') ? 'text-[#D4AF37]' : 'text-stone-400'}`} />
              <span>{t.customers}</span>
            </div>
            {totalCustomersCount > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isTabActive('customers') ? 'bg-[#D4AF37] text-[#1A1A1A]' : 'bg-stone-800 text-stone-300'
              }`}>
                {totalCustomersCount}
              </span>
            )}
          </button>

          {/* Section: Customization & Settings */}
          <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t.designAndSettings}
          </div>

          {/* 3. Design Templates */}
          <button
            onClick={() => handleNavClick('settings', 'design')}
            id="sidebar-design-templates-link"
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTabActive('settings', 'design')
                ? 'bg-white/10 text-[#D4AF37] shadow-xs border border-[#D4AF37]/30 font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className={`w-4 h-4 ${isTabActive('settings', 'design') ? 'text-[#D4AF37]' : 'text-stone-400'}`} />
              <span>{t.designTemplatesNav}</span>
            </div>
            {designCategoriesCount > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isTabActive('settings', 'design') ? 'bg-[#D4AF37] text-[#1A1A1A]' : 'bg-stone-800 text-stone-300'
              }`}>
                {designCategoriesCount}
              </span>
            )}
          </button>

          {/* 4. Measurement Fields Settings */}
          <button
            onClick={() => handleNavClick('settings', 'measurements')}
            id="sidebar-measurement-settings-link"
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTabActive('settings', 'measurements')
                ? 'bg-white/10 text-[#D4AF37] shadow-xs border border-[#D4AF37]/30 font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Ruler className={`w-4 h-4 ${isTabActive('settings', 'measurements') ? 'text-[#D4AF37]' : 'text-stone-400'}`} />
              <span>{t.measurementSettingsNav}</span>
            </div>
            <ChevronIcon className="w-3.5 h-3.5 text-stone-500" />
          </button>

          {/* 5. Shop Profile & Slip Header */}
          <button
            onClick={() => handleNavClick('settings', 'shop')}
            id="sidebar-shop-profile-link"
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTabActive('settings', 'shop')
                ? 'bg-white/10 text-[#D4AF37] shadow-xs border border-[#D4AF37]/30 font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className={`w-4 h-4 ${isTabActive('settings', 'shop') ? 'text-[#D4AF37]' : 'text-stone-400'}`} />
              <span>{t.shopProfileNav}</span>
            </div>
            <ChevronIcon className="w-3.5 h-3.5 text-stone-500" />
          </button>

          {/* 6. Backup & Restore Database */}
          <button
            onClick={() => handleNavClick('settings', 'backup')}
            id="sidebar-backup-link"
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTabActive('settings', 'backup')
                ? 'bg-white/10 text-[#D4AF37] shadow-xs border border-[#D4AF37]/30 font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className={`w-4 h-4 ${isTabActive('settings', 'backup') ? 'text-[#D4AF37]' : 'text-stone-400'}`} />
              <span>{t.backupNav}</span>
            </div>
            <ChevronIcon className="w-3.5 h-3.5 text-stone-500" />
          </button>
        </div>

        {/* Quick Operational Status Widget */}
        <div className="p-3 mx-3 mb-2 rounded-xl bg-stone-900/90 border border-stone-800 shrink-0 text-xs">
          <div className="flex items-center justify-between text-stone-400 text-[11px] mb-1.5">
            <span className="font-semibold">{t.status}</span>
            <span className="font-mono text-[#D4AF37]">{shopSettings.currencyFa || 'AFN'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 p-1.5 bg-black/40 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-400 block leading-none">{t.pendingOrders}</span>
                <span className="font-mono font-bold text-white text-xs">{pendingCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 bg-black/40 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-400 block leading-none">{t.readyOrders}</span>
                <span className="font-mono font-bold text-white text-xs">{readyCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Language Selection Mechanism Footer */}
        <div className="p-4 border-t border-[#2A2A2A] bg-[#141414] shrink-0 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400">
            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{language === 'fa' ? 'انتخاب زبان سیستم' : language === 'ps' ? 'د سیستم ژبه' : 'System Language'}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-black/50 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => onLanguageChange('fa')}
              id="sidebar-lang-fa"
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                language === 'fa'
                  ? 'bg-[#D4AF37] text-[#1A1A1A] font-black shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              دری
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('ps')}
              id="sidebar-lang-ps"
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                language === 'ps'
                  ? 'bg-[#D4AF37] text-[#1A1A1A] font-black shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              پښتو
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              id="sidebar-lang-en"
              className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition text-center cursor-pointer ${
                language === 'en'
                  ? 'bg-[#D4AF37] text-[#1A1A1A] font-black shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
