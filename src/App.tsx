import React, { useState, useEffect, useMemo } from 'react';
import { 
  Order, 
  Customer, 
  MeasurementField, 
  DesignCategory, 
  ShopSettings, 
  Language,
  Fabric,
  Product,
  ProductCategory,
  ProductSale
} from './types';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { Sidebar, MainNavTab, SettingsSubTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { OrderForm } from './components/OrderForm';
import { CustomersView } from './components/CustomersView';
import { FabricsView } from './components/FabricsView';
import { ProductsView } from './components/ProductsView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { DesignSettingsView } from './components/DesignSettingsView';
import { ReceiptSlipModal } from './components/ReceiptSlipModal';
import { LoginView } from './components/LoginView';
import { PublicTrackingView } from './components/PublicTrackingView';
import { ReportsView } from './components/ReportsView';

export default function App() {
  if (window.location.pathname === '/' || window.location.pathname === '/track' || window.location.pathname === '/customer-tracking' || window.location.pathname === '/customer-search') {
    return <PublicTrackingView />;
  }

  if (window.location.pathname === '/login') {
    return <ShopApp />;
  }

  return <PublicTrackingView />;
}

function ShopApp() {

  // 1. Language State & RTL
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());

  // 2. Authentication State
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(() => 
    storageService.getAuthUser()
  );

  // 3. Data State
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => storageService.getCustomers());
  const [fabrics, setFabrics] = useState<Fabric[]>(() => storageService.getFabrics());
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(() => 
    storageService.getProductCategories()
  );
  const [productSales, setProductSales] = useState<ProductSale[]>(() => 
    storageService.getProductSales()
  );
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
  const [globalOrderSearch, setGlobalOrderSearch] = useState('');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('design');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [prefilledCustomer, setPrefilledCustomer] = useState<Customer | null>(null);
  const [prefilledFabric, setPrefilledFabric] = useState<Fabric | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Sync RTL and Document Language
  useEffect(() => {
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = language === 'en' ? 'en' : language === 'fa' ? 'fa' : 'ps';
    storageService.saveLanguage(language);
  }, [language]);

  // Initial Database Sync from Supabase PostgreSQL in background
  useEffect(() => {
    storageService.syncFromDatabase().then(() => {
      reloadData();
    });
  }, []);

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
    setFabrics(storageService.getFabrics());
    setProducts(storageService.getProducts());
    setProductCategories(storageService.getProductCategories());
    setProductSales(storageService.getProductSales());
    setMeasurementFields(storageService.getMeasurementFields());
    setDesignCategories(storageService.getDesignCategories());
    setShopSettings(storageService.getShopSettings());
  };

  // Product Inventory Handlers
  const handleAddProduct = async (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const saved = await storageService.saveProduct(prodData);
    reloadData();
    return saved;
  };

  const handleUpdateProduct = async (prod: Product) => {
    await storageService.saveProduct(prod);
    reloadData();
  };

  const handleDeleteProduct = async (productId: string) => {
    await storageService.deleteProduct(productId);
    reloadData();
  };

  const handleRecordProductSale = async (saleData: Omit<ProductSale, 'id' | 'createdAt'>) => {
    const saved = await storageService.saveProductSale(saleData);
    reloadData();
    return saved;
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
      setPrefilledFabric(null);
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
    setPrefilledFabric(null);

    if (shouldPrint) {
      setActiveReceiptOrder(savedOrder);
    }
    setCurrentTab('dashboard');
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
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#1A1A1A] flex flex-col font-sans selection:bg-teal-400/30">
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
          onSearchOrders={(query) => {
            setGlobalOrderSearch(query);
            if (query.trim()) setCurrentTab('dashboard');
          }}
          onLanguageChange={handleLanguageChange}
          onSignOut={handleSignOut}
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
              onRecordSale={handleRecordProductSale}
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
