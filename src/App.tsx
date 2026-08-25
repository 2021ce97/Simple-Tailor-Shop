import React, { useState, useEffect } from 'react';
import { 
  Order, 
  Customer, 
  MeasurementField, 
  DesignCategory, 
  ShopSettings, 
  Language 
} from './types';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { Sidebar, MainNavTab, SettingsSubTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { OrderForm } from './components/OrderForm';
import { CustomersView } from './components/CustomersView';
import { DesignSettingsView } from './components/DesignSettingsView';
import { ReceiptSlipModal } from './components/ReceiptSlipModal';
import { LoginView } from './components/LoginView';

export default function App() {
  // 1. Language State & RTL
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());

  // 2. Authentication State
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(() => 
    storageService.getAuthUser()
  );

  // 3. Data State
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => storageService.getCustomers());
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>(() => 
    storageService.getMeasurementFields()
  );
  const [designCategories, setDesignCategories] = useState<DesignCategory[]>(() => 
    storageService.getDesignCategories()
  );
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => 
    storageService.getShopSettings()
  );

  // 4. Navigation & Modal State
  const [currentTab, setCurrentTab] = useState<MainNavTab>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('design');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [prefilledCustomer, setPrefilledCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Sync RTL and Document Language
  useEffect(() => {
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = language === 'en' ? 'en' : language === 'fa' ? 'fa' : 'ps';
    storageService.saveLanguage(language);
  }, [language]);

  // Keyboard shortcuts (e.g. F2 for new order)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleStartNewOrder();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Refresh all state from storage
  const reloadData = () => {
    setOrders(storageService.getOrders());
    setCustomers(storageService.getCustomers());
    setMeasurementFields(storageService.getMeasurementFields());
    setDesignCategories(storageService.getDesignCategories());
    setShopSettings(storageService.getShopSettings());
  };

  // Switch Language
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  // Login handler
  const handleLoginSuccess = (user: { email: string; name: string }) => {
    storageService.saveAuthUser(user);
    setCurrentUser(user);
  };

  // Logout handler
  const handleSignOut = () => {
    storageService.saveAuthUser(null);
    setCurrentUser(null);
  };

  // Navigation Selection Handler (from Sidebar or Navbar)
  const handleSelectNav = (tab: MainNavTab, subTab?: SettingsSubTab) => {
    if (tab === 'new_order') {
      setEditingOrder(null);
      setPrefilledCustomer(null);
    }
    if (subTab) {
      setSettingsSubTab(subTab);
    }
    setCurrentTab(tab);
  };

  // Save Order Handler
  const handleSaveOrder = (savedOrder: Order, shouldPrint: boolean) => {
    storageService.saveOrder(savedOrder);
    reloadData();
    setEditingOrder(null);
    setPrefilledCustomer(null);

    if (shouldPrint) {
      setActiveReceiptOrder(savedOrder);
    }
    setCurrentTab('dashboard');
  };

  // Start New Blank Order
  const handleStartNewOrder = () => {
    setEditingOrder(null);
    setPrefilledCustomer(null);
    setCurrentTab('new_order');
  };

  // Start New Order for a Specific Customer (prefilled measurements!)
  const handleNewOrderForCustomer = (customer: Customer) => {
    setEditingOrder(null);
    setPrefilledCustomer(customer);
    setCurrentTab('new_order');
  };

  // Edit Order
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setPrefilledCustomer(null);
    setCurrentTab('new_order');
  };

  // View Receipt
  const handleViewReceipt = (order: Order) => {
    setActiveReceiptOrder(order);
  };

  // Select Customer from Dashboard
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentTab('customers');
  };

  const isRtl = language === 'fa' || language === 'ps';

  // If not logged in, display the Login View
  if (!currentUser) {
    return (
      <LoginView
        language={language}
        shopSettings={shopSettings}
        onLanguageChange={handleLanguageChange}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#D4AF37]/30">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        settingsSubTab={settingsSubTab}
        language={language}
        shopSettings={shopSettings}
        orders={orders}
        customers={customers}
        designCategoriesCount={designCategories.length}
        isOpenOnMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onSelectNav={handleSelectNav}
        onLanguageChange={handleLanguageChange}
        onSignOut={handleSignOut}
      />

      {/* Main Content Layout with responsive margin for desktop sidebar */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${
        isRtl ? 'lg:mr-72' : 'lg:ml-72'
      }`}>
        {/* Top Navbar Header */}
        <Navbar
          currentTab={currentTab}
          language={language}
          shopSettings={shopSettings}
          onToggleSidebar={() => setIsSidebarOpenMobile(prev => !prev)}
          onTabChange={handleSelectNav}
          onLanguageChange={handleLanguageChange}
          onSignOut={handleSignOut}
        />

        {/* Main Content View Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentTab === 'dashboard' && (
            <Dashboard
              orders={orders}
              shopSettings={shopSettings}
              language={language}
              onNewOrder={handleStartNewOrder}
              onEditOrder={handleEditOrder}
              onViewReceipt={handleViewReceipt}
              onSelectCustomer={handleSelectCustomer}
              onOrderUpdated={reloadData}
            />
          )}

          {currentTab === 'new_order' && (
            <OrderForm
              initialOrder={editingOrder}
              prefilledCustomer={prefilledCustomer}
              measurementFields={measurementFields}
              designCategories={designCategories}
              shopSettings={shopSettings}
              language={language}
              onSave={handleSaveOrder}
              onCancel={() => {
                setEditingOrder(null);
                setPrefilledCustomer(null);
                setCurrentTab('dashboard');
              }}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              orders={orders}
              measurementFields={measurementFields}
              shopSettings={shopSettings}
              language={language}
              selectedCustomerId={selectedCustomerId}
              onNewOrderForCustomer={handleNewOrderForCustomer}
              onViewReceipt={handleViewReceipt}
              onCustomerUpdated={reloadData}
            />
          )}

          {currentTab === 'settings' && (
            <DesignSettingsView
              designCategories={designCategories}
              measurementFields={measurementFields}
              shopSettings={shopSettings}
              language={language}
              activeSubTab={settingsSubTab}
              onSubTabChange={setSettingsSubTab}
              onUpdateDesignCategories={cats => {
                setDesignCategories(cats);
                reloadData();
              }}
              onUpdateMeasurementFields={fields => {
                setMeasurementFields(fields);
                reloadData();
              }}
              onUpdateShopSettings={settings => {
                setShopSettings(settings);
                reloadData();
              }}
              onDataReset={reloadData}
            />
          )}
        </main>
      </div>

      {/* Tailor Receipt & Measurement Slip Modal */}
      {activeReceiptOrder && (
        <ReceiptSlipModal
          order={activeReceiptOrder}
          shopSettings={shopSettings}
          measurementFields={measurementFields}
          designCategories={designCategories}
          language={language}
          onClose={() => setActiveReceiptOrder(null)}
          onEdit={handleEditOrder}
        />
      )}
    </div>
  );
}
