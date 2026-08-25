import React from 'react';
import { Language, ShopSettings, Order, Customer } from '../types';
import { translations } from '../translations/i18n';
import { 
  Scissors, 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  SlidersHorizontal, 
  Globe, 
  X,
  Clock,
  CheckCircle2,
  LogOut,
  UserCheck
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
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  language,
  shopSettings,
  orders,
  customers,
  isOpenOnMobile,
  onCloseMobile,
  onSelectNav,
  onLanguageChange,
  onSignOut,
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

  const handleNavClick = (tab: MainNavTab) => {
    onSelectNav(tab);
    onCloseMobile();
  };

  const isTabActive = (tab: MainNavTab) => {
    return currentTab === tab;
  };

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
            className="flex items-center gap-3 cursor-pointer group select-none overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#1A1A1A] font-black shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Scissors className="w-5 h-5 transform -rotate-45" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight truncate">
                {shopTitle || 'Rayan Tailor'}
              </h1>
              <p className="text-[10px] text-[#D4AF37] font-semibold tracking-wide truncate">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer shrink-0"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Main Options Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {/* 1. New Order Button */}
          <button
            onClick={() => handleNavClick('new_order')}
            id="sidebar-new-order-btn"
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black transition-all duration-150 cursor-pointer shadow-md group ${
              isTabActive('new_order')
                ? 'bg-[#B39025] text-[#1A1A1A] ring-2 ring-[#D4AF37]'
                : 'bg-[#D4AF37] hover:bg-[#C29E2E] text-[#1A1A1A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="text-sm font-black">{t.newOrder}</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-black/15 rounded-md">
              F2
            </span>
          </button>

          {/* Navigation Section Header */}
          <div className="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t.menu}
          </div>

          {/* 2. Order Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            id="sidebar-dashboard-link"
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

          {/* 3. Customer Directory */}
          <button
            onClick={() => handleNavClick('customers')}
            id="sidebar-customers-link"
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

          {/* 4. Design & Settings */}
          <button
            onClick={() => handleNavClick('settings')}
            id="sidebar-settings-link"
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTabActive('settings')
                ? 'bg-white/10 text-[#D4AF37] shadow-xs border border-[#D4AF37]/30 font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className={`w-4 h-4 ${isTabActive('settings') ? 'text-[#D4AF37]' : 'text-stone-400'}`} />
              <span>{t.designAndSettings}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-stone-800 rounded text-stone-400">
              4
            </span>
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

        {/* User Account & Sign Out Section */}
        <div className="px-3 py-2 mx-3 mb-2 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden leading-tight">
              <span className="font-bold text-white block text-[11px] truncate">
                tailor1@gmail.com
              </span>
              <span className="text-[9px] text-[#D4AF37] font-medium block truncate">
                {t.adminAccount || 'Master Tailor Admin'}
              </span>
            </div>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              id="sidebar-signout-btn"
              title={t.signOut}
              className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Language Selection Mechanism Footer */}
        <div className="p-3.5 border-t border-[#2A2A2A] bg-[#141414] shrink-0 space-y-2">
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
