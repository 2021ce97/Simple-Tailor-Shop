import React, { useState, useEffect, useMemo } from 'react';
import { 
  Order, 
  Customer, 
  Language,
  Fabric,
  Product,
  ProductSale
} from '../types';
import { storageService } from '../services/storage';
import { Navbar } from '../components/Navbar';
import { Sidebar, MainNavTab, SettingsSubTab } from '../components/Sidebar';
import { Dashboard } from './DashboardPage';
import { OrderForm } from '../components/OrderForm';
import { CustomersView } from './CustomersPage';
import { FabricsView } from './FabricsPage';
import { ProductsView } from './ProductsPage';
import { SalesHistoryView } from './SalesHistoryPage';
import { DesignSettingsView } from './SettingsPage';
import { ReceiptSlipModal } from '../components/ReceiptSlipModal';
import { LoginView } from './LoginPage';
import { ReportsView } from './ReportsPage';
import { getErrorMessage } from '../lib/errors';
import { useShopData } from '../hooks/useShopData';
import { useSupabaseSession } from '../hooks/useSupabaseSession';
import { useDatabaseSync } from '../hooks/useDatabaseSync';

export default function ShopManagementPage() {

  // 1. Language State & RTL
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());

  const { orders, customers, fabrics, products, productCategories, productSales, measurementFields, designCategories, shopSettings, setShopSettings, reloadData } = useShopData();
  const { currentUser, loginSucceeded, signOut } = useSupabaseSession(reloadData);
  const dbConnected = useDatabaseSync(Boolean(currentUser), reloadData);

  // 4. Navigation & Modal State
  const [currentTab, setCurrentTab] = useState<MainNavTab>('dashboard');
  const [globalOrderSearch, setGlobalOrderSearch] = useState('');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('design');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [prefilledCustomer, setPrefilledCustomer] = useState<Customer | null>(null);
  const [prefilledFabric, setPrefilledFabric] = useState<Fabric | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [pendingSaleProduct, setPendingSaleProduct] = useState<Product | null>(null);

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

  // Product Inventory Handlers
  const handleAddProduct = async (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const saved = await storageService.saveProductAsync(prodData);
    reloadData();
    return saved;
  };

  const handleUpdateProduct = async (prod: Product) => {
    await storageService.saveProductAsync(prod);
    reloadData();
  };

  const handleDeleteProduct = async (productId: string) => {
    await storageService.deleteProduct(productId);
    reloadData();
  };

  const handleRecordProductSale = async (saleData: Omit<ProductSale, 'id' | 'createdAt'>) => {
    let saleToSave = saleData;
    if (saleData.customerName && saleData.customerPhone) {
      const existingCustomer = customers.find(customer =>
        (saleData.customerId && customer.id === saleData.customerId) ||
        customer.phone === saleData.customerPhone
      );
      const customer: Customer = {
        ...(existingCustomer || {}),
        id: existingCustomer?.id || saleData.customerId || `cust_product_${Date.now()}`,
        name: saleData.customerName,
        phone: saleData.customerPhone,
        whatsapp: existingCustomer?.whatsapp || saleData.customerPhone,
        address: existingCustomer?.address || '',
        notes: existingCustomer?.notes || 'Retail product customer',
        standardMeasurements: existingCustomer?.standardMeasurements || {},
        preferredGarmentType: existingCustomer?.preferredGarmentType,
        createdAt: existingCustomer?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalOrdersCount: existingCustomer?.totalOrdersCount || 0,
        totalSpent: existingCustomer?.totalSpent || 0,
        totalBalance: existingCustomer?.totalBalance || 0,
      };
      await storageService.saveCustomerAsync(customer);
      saleToSave = { ...saleData, customerId: customer.id };
    }

    const saved = await storageService.saveProductSaleAsync(saleToSave);
    setPendingSaleProduct(null);
    reloadData();
    return saved;
  };

  const handleMakeProductSale = (product: Product) => {
    setPendingSaleProduct(product);
    setCurrentTab('sales_history');
  };

  const handleAddProductCategory = async (catName: string) => {
    const saved = await storageService.saveProductCategory(catName);
    reloadData();
    return saved;
  };

  // Switch Language
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  // Computed currency symbol for current language
  const currencySymbol = useMemo(() => {
    if (language === 'ps') return shopSettings?.currencyPs || 'افغانۍ';
    if (language === 'fa') return shopSettings?.currencyFa || 'افغانی';
    return shopSettings?.currencySymbol || shopSettings?.currencyEn || 'AFN';
  }, [language, shopSettings]);

  // Navigation Selection Handler (from Sidebar or Navbar)
  const handleSelectNav = (tab: MainNavTab, subTab?: SettingsSubTab) => {
    if (tab === 'new_order') {
      setEditingOrder(null);
      setPrefilledCustomer(null);
      setPrefilledFabric(null);
    }
    if (subTab) {
      setSettingsSubTab(subTab);
    }
    setCurrentTab(tab);
  };

  // Save Order Handler
  const handleSaveOrder = async (savedOrder: Order, shouldPrint: boolean) => {
    try {
      await storageService.saveOrderAsync(savedOrder);
    } catch (error) {
      const detail = getErrorMessage(error);
      setNotification({ type: 'error', message: `Order was not saved to Supabase: ${detail}` });
      throw error;
    }
    reloadData();
    setEditingOrder(null);
    setPrefilledCustomer(null);
    setPrefilledFabric(null);

    if (shouldPrint) {
      setActiveReceiptOrder(savedOrder);
    }
    setCurrentTab('dashboard');
    setNotification({
      type: 'success',
      message: language === 'fa' ? `سفارش ${savedOrder.orderNumber} با موفقیت در دیتابیس ذخیره شد.` : language === 'ps' ? `فرمایش ${savedOrder.orderNumber} په بریالیتوب ډیټابیس ته خوندي شو.` : `Order ${savedOrder.orderNumber} was saved successfully to Supabase.`,
    });
    window.setTimeout(() => setNotification(null), 5000);
  };

  // Start New Blank Order
  const handleStartNewOrder = () => {
    setEditingOrder(null);
    setPrefilledCustomer(null);
    setPrefilledFabric(null);
    setCurrentTab('new_order');
  };

  // Start New Order for a Specific Customer (prefilled measurements!)
  const handleNewOrderForCustomer = (customer: Customer) => {
    setEditingOrder(null);
    setPrefilledCustomer(customer);
    setPrefilledFabric(null);
    setCurrentTab('new_order');
  };

  // Start New Order with a Selected Fabric from Fabric Inventory
  const handleNewOrderForFabric = (fabric: Fabric) => {
    setEditingOrder(null);
    setPrefilledCustomer(null);
    setPrefilledFabric(fabric);
    setCurrentTab('new_order');
  };

  // Edit Order
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setPrefilledCustomer(null);
    setPrefilledFabric(null);
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
        onLoginSuccess={loginSucceeded}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#1A1A1A] flex flex-col font-sans selection:bg-teal-400/30">
      {notification && <div role="status" className={`fixed right-4 top-4 z-[100] max-w-md rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${notification.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>{notification.message}</div>}
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        settingsSubTab={settingsSubTab}
        language={language}
        shopSettings={shopSettings}
        orders={orders}
        customers={customers}
        fabrics={fabrics}
        products={products}
        salesCount={productSales.length}
        designCategoriesCount={designCategories.length}
        isOpenOnMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onSelectNav={handleSelectNav}
        onLanguageChange={handleLanguageChange}
        onSignOut={signOut}
        dbConnected={dbConnected}
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
          onSearchOrders={(query) => {
            setGlobalOrderSearch(query);
            if (query.trim()) setCurrentTab('dashboard');
          }}
          onLanguageChange={handleLanguageChange}
          onSignOut={signOut}
          dbConnected={dbConnected}
        />

        {/* Main Content View Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5">
          {currentTab === 'dashboard' && (
            <Dashboard
              orders={orders}
              productSales={productSales}
              globalSearchTerm={globalOrderSearch}
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
              prefilledFabric={prefilledFabric}
              measurementFields={measurementFields}
              designCategories={designCategories}
              shopSettings={shopSettings}
              language={language}
              onSave={handleSaveOrder}
              onCancel={() => {
                setEditingOrder(null);
                setPrefilledCustomer(null);
                setPrefilledFabric(null);
                setCurrentTab('dashboard');
              }}
            />
          )}

          {currentTab === 'fabrics' && (
            <FabricsView
              fabrics={fabrics}
              shopSettings={shopSettings}
              language={language}
              onFabricUpdated={reloadData}
              onSelectFabricForOrder={handleNewOrderForFabric}
            />
          )}

          {currentTab === 'products' && (
            <ProductsView
              products={products}
              categories={productCategories}
              sales={productSales}
              currencySymbol={currencySymbol}
              language={language}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onMakeSale={handleMakeProductSale}
              onAddCategory={handleAddProductCategory}
            />
          )}

          {currentTab === 'sales_history' && (
            <SalesHistoryView
              sales={productSales}
              products={products}
              categories={productCategories}
              customers={customers}
              shopSettings={shopSettings}
              currencySymbol={currencySymbol}
              language={language}
              onRecordSale={handleRecordProductSale}
              onNavigateToProducts={() => setCurrentTab('products')}
              initialProduct={pendingSaleProduct}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              orders={orders}
              products={products}
              fabrics={fabrics}
              productSales={productSales}
              shopSettings={shopSettings}
              language={language}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              orders={orders}
              productSales={productSales}
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
              onUpdateShopSettings={setShopSettings}
              onCategoryUpdated={reloadData}
              onMeasurementFieldsUpdated={reloadData}
              onSettingsUpdated={reloadData}
              onDatabaseRestored={reloadData}
            />
          )}
        </main>
      </div>

      {/* Printable Receipt Modal Slip */}
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
