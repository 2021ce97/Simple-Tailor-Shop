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
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (target) {
        const href = target.getAttribute('href');
        if (href && (href === '/' || href === '/login' || href === '/track' || href === '/customer-tracking' || href === '/customer-search')) {
          e.preventDefault();
          window.history.pushState({}, '', href);
          setCurrentPath(href);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  if (currentPath === '/login') {
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
  const [pendingSaleProduct, setPendingSaleProduct] = useState<Product | null>(null);

  // Sync RTL and Document Language
  useEffect(() => {
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = language === 'en' ? 'en' : language === 'fa' ? 'fa' : 'ps';
    storageService.saveLanguage(language);
  }, [language]);

  // Initial & Periodic Automatic Background Database Sync
  useEffect(() => {
    const doSync = () => {
      storageService.syncFromDatabase().then((updated) => {
        if (updated) {
          reloadData();
        }
      });
    };

    // Initial sync
    doSync();

    // Auto-sync every 4 seconds so orders from other computers appear automatically in real-time
    const syncInterval = setInterval(doSync, 4000);

    // Sync on window focus and visibility change
    const handleFocus = () => doSync();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        doSync();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      storageService.saveCustomer(customer);
      saleToSave = { ...saleData, customerId: customer.id };
    }

    const saved = await storageService.saveProductSale(saleToSave);
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
  const handleSaveOrder = async (savedOrder: Order, shouldPrint: boolean) => {
    await storageService.saveOrderAsync(savedOrder);
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
