import { useCallback, useState } from 'react';
import type { Customer, DesignCategory, Fabric, MeasurementField, Order, Product, ProductCategory, ProductSale, ShopSettings } from '../types';
import { storageService } from '../services/storage';

export function useShopData() {
  const [orders, setOrders] = useState<Order[]>(storageService.getOrders);
  const [customers, setCustomers] = useState<Customer[]>(storageService.getCustomers);
  const [fabrics, setFabrics] = useState<Fabric[]>(storageService.getFabrics);
  const [products, setProducts] = useState<Product[]>(storageService.getProducts);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(storageService.getProductCategories);
  const [productSales, setProductSales] = useState<ProductSale[]>(storageService.getProductSales);
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>(storageService.getMeasurementFields);
  const [designCategories, setDesignCategories] = useState<DesignCategory[]>(() => storageService.getDesignCategories());
  const [shopSettings, setShopSettings] = useState<ShopSettings>(storageService.getShopSettings);

  const reloadData = useCallback(() => {
    setOrders(storageService.getOrders());
    setCustomers(storageService.getCustomers());
    setFabrics(storageService.getFabrics());
    setProducts(storageService.getProducts());
    setProductCategories(storageService.getProductCategories());
    setProductSales(storageService.getProductSales());
    setMeasurementFields(storageService.getMeasurementFields());
    setDesignCategories(storageService.getDesignCategories());
    setShopSettings(storageService.getShopSettings());
  }, []);

  return { orders, customers, fabrics, products, productCategories, productSales, measurementFields, designCategories, shopSettings, setShopSettings, reloadData };
}
