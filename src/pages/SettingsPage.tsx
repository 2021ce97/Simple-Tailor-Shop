import React, { useState, useMemo } from 'react';
import { 
  DesignCategory, 
  DesignOption, 
  MeasurementField, 
  GarmentTypeConfig,
  ShopSettings, 
  Language 
} from '../types';
import { translations } from '../translations/i18n';
import { storageService } from '../services/storage';
import { 
  Sparkles, 
  Scissors, 
  Plus, 
  Trash2, 
  Pencil, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Building2, 
  X,
  Database,
  Shirt,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  Printer,
  RefreshCw
} from 'lucide-react';
import { ReceiptSettingsPanel } from '../components/ReceiptSettingsPanel';

interface DesignSettingsViewProps {
  designCategories: DesignCategory[];
  measurementFields: MeasurementField[];
  shopSettings: ShopSettings;
  language: Language;
  activeSubTab?: 'design' | 'measurements' | 'garments' | 'shop' | 'receipt' | 'backup';
  onSubTabChange?: (sub: 'design' | 'measurements' | 'garments' | 'shop' | 'receipt' | 'backup') => void;
  onUpdateDesignCategories?: (cats: DesignCategory[]) => void;
  onUpdateMeasurementFields?: (fields: MeasurementField[]) => void;
  onUpdateShopSettings?: (settings: ShopSettings) => void;
  onDataReset?: () => void;
  // Alternative handler names for maximum backwards compatibility
  onCategoryUpdated?: () => void;
  onMeasurementFieldsUpdated?: () => void;
  onSettingsUpdated?: () => void;
  onDatabaseRestored?: () => void;
}

export const DesignSettingsView: React.FC<DesignSettingsViewProps> = ({
  designCategories,
  measurementFields,
  shopSettings,
  language,
  activeSubTab = 'design',
  onSubTabChange,
  onUpdateDesignCategories,
  onUpdateMeasurementFields,
  onUpdateShopSettings,
  onDataReset,
  onCategoryUpdated,
  onMeasurementFieldsUpdated,
  onSettingsUpdated,
  onDatabaseRestored,
}) => {
  const t = translations[language];

  // Active Tab: 'garments' | 'measurements' | 'design' | 'shop' | 'receipt' | 'backup'
  const [activeTab, setActiveTab] = useState<'garments' | 'measurements' | 'design' | 'shop' | 'receipt' | 'backup'>(
    (activeSubTab as any) || 'design'
  );

  React.useEffect(() => {
    if (activeSubTab) {
      setActiveTab(activeSubTab as any);
    }
  }, [activeSubTab]);

  const handleTabClick = (tab: 'garments' | 'measurements' | 'design' | 'shop' | 'receipt' | 'backup') => {
    setActiveTab(tab);
    if (onSubTabChange) onSubTabChange(tab as any);
  };

  // Garment Types Local State
  const [garmentTypes, setGarmentTypes] = useState<GarmentTypeConfig[]>(() => 
    storageService.getGarmentTypes()
  );

  // Selected Garment Category Filter for Tabs (e.g. 'all', 'perahan_tunban', 'wescott', etc.)
  const [selectedGarmentFilter, setSelectedGarmentFilter] = useState<string>('all');

  // Categories Local State
  const [categories, setCategories] = useState<DesignCategory[]>(designCategories);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCatGarment, setNewCatGarment] = useState<string>('perahan_tunban');
  const [newCatTitleFa, setNewCatTitleFa] = useState('');
  const [newCatTitlePs, setNewCatTitlePs] = useState('');
  const [newCatTitleEn, setNewCatTitleEn] = useState('');

  // Category Edit State
  const [editCatGarment, setEditCatGarment] = useState<string>('perahan_tunban');
  const [editCatTitleFa, setEditCatTitleFa] = useState('');
  const [editCatTitlePs, setEditCatTitlePs] = useState('');
  const [editCatTitleEn, setEditCatTitleEn] = useState('');

  // Option Adding / Editing State
  const [addingOptionForCatId, setAddingOptionForCatId] = useState<string | null>(null);
  const [newOptionNameFa, setNewOptionNameFa] = useState('');
  const [newOptionNamePs, setNewOptionNamePs] = useState('');
  const [newOptionNameEn, setNewOptionNameEn] = useState('');

  const [editingOption, setEditingOption] = useState<{
    catId: string;
    optId: string;
    nameFa: string;
    namePs: string;
    nameEn: string;
  } | null>(null);

  // Measurements Local State
  const [fields, setFields] = useState<MeasurementField[]>(measurementFields);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newFieldGarment, setNewFieldGarment] = useState<string>('perahan_tunban');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldFa, setNewFieldFa] = useState('');
  const [newFieldPs, setNewFieldPs] = useState('');
  const [newFieldEn, setNewFieldEn] = useState('');
  const [newFieldUnit, setNewFieldUnit] = useState<'in' | 'cm'>('in');

  // Field Edit State
  const [editFieldGarment, setEditFieldGarment] = useState<string>('perahan_tunban');
  const [editFieldFa, setEditFieldFa] = useState('');
  const [editFieldPs, setEditFieldPs] = useState('');
  const [editFieldEn, setEditFieldEn] = useState('');
  const [editFieldUnit, setEditFieldUnit] = useState<'in' | 'cm'>('in');

  // Garment Types Management State
  const [editingGarmentKey, setEditingGarmentKey] = useState<string | null>(null);
  const [newGarmentKey, setNewGarmentKey] = useState('');
  const [newGarmentFa, setNewGarmentFa] = useState('');
  const [newGarmentPs, setNewGarmentPs] = useState('');
  const [newGarmentEn, setNewGarmentEn] = useState('');
  const [newGarmentIcon, setNewGarmentIcon] = useState('✂️');

  const [editGarmentFa, setEditGarmentFa] = useState('');
  const [editGarmentPs, setEditGarmentPs] = useState('');
  const [editGarmentEn, setEditGarmentEn] = useState('');
  const [editGarmentIcon, setEditGarmentIcon] = useState('');

  // Shop Profile State
  const [shop, setShop] = useState<ShopSettings>({ ...shopSettings });

  // Notification Toast
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 3500);
  };

  // Sync incoming props
  React.useEffect(() => {
    setCategories(designCategories);
  }, [designCategories]);

  React.useEffect(() => {
    setFields(measurementFields);
  }, [measurementFields]);

  React.useEffect(() => {
    setShop({ ...shopSettings });
  }, [shopSettings]);

  // Helper to get localized name of garment type
  const getGarmentName = (key: string) => {
    if (key === 'all') {
      return language === 'fa' ? 'تمام لباس‌ها (عمومی)' : language === 'ps' ? 'ټول کالي (عمومي)' : 'All Garments (General)';
    }
    const found = garmentTypes.find(g => g.key === key || g.id === key);
    if (found) {
      return language === 'ps' ? found.namePs : language === 'fa' ? found.nameFa : found.nameEn;
    }
    return key;
  };

  // Filtered fields based on selected garment filter
  const filteredMeasurementFields = useMemo(() => {
    if (selectedGarmentFilter === 'all') return fields;
    return fields.filter(f => f.garmentCategory === selectedGarmentFilter || !f.garmentCategory || f.garmentCategory === 'all');
  }, [fields, selectedGarmentFilter]);

  // Filtered design categories based on selected garment filter
  const filteredDesignCategories = useMemo(() => {
    if (selectedGarmentFilter === 'all') return categories;
    return categories.filter(c => c.garmentCategory === selectedGarmentFilter || !c.garmentCategory || c.garmentCategory === 'all');
  }, [categories, selectedGarmentFilter]);

  // ================= GARMENT TYPES ACTIONS =================
  const handleAddGarmentType = () => {
    if (!newGarmentFa.trim() && !newGarmentPs.trim() && !newGarmentEn.trim()) {
      alert(language === 'fa' ? 'لطفاً نام لباس را وارد نمایید' : 'Please enter garment name');
      return;
    }
    const key = (newGarmentKey.trim() || newGarmentEn.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'garment_' + Date.now());
    const nameFa = newGarmentFa.trim() || newGarmentPs.trim() || newGarmentEn.trim();
    const namePs = newGarmentPs.trim() || nameFa;
    const nameEn = newGarmentEn.trim() || nameFa;

    const newGarment: GarmentTypeConfig = {
      id: key,
      key,
      nameFa,
      namePs,
      nameEn,
      icon: newGarmentIcon.trim() || '✂️',
      isStandard: false,
      sortOrder: garmentTypes.length + 1,
    };

    const updated = [...garmentTypes, newGarment];
    setGarmentTypes(updated);
    storageService.saveGarmentTypes(updated);

    setNewGarmentKey('');
    setNewGarmentFa('');
    setNewGarmentPs('');
    setNewGarmentEn('');
    setNewGarmentIcon('✂️');
    showNotification(t.savedSuccessfully);
  };

  const startEditGarment = (g: GarmentTypeConfig) => {
    setEditingGarmentKey(g.key);
    setEditGarmentFa(g.nameFa);
    setEditGarmentPs(g.namePs);
    setEditGarmentEn(g.nameEn);
    setEditGarmentIcon(g.icon || '✂️');
  };

  const handleSaveGarmentEdit = () => {
    if (!editingGarmentKey) return;
    const updated = garmentTypes.map(g => {
      if (g.key === editingGarmentKey) {
        return {
          ...g,
          nameFa: editGarmentFa.trim() || g.nameFa,
          namePs: editGarmentPs.trim() || g.namePs,
          nameEn: editGarmentEn.trim() || g.nameEn,
          icon: editGarmentIcon.trim() || g.icon,
        };
      }
      return g;
    });

    setGarmentTypes(updated);
    storageService.saveGarmentTypes(updated);
    setEditingGarmentKey(null);
    showNotification(t.savedSuccessfully);
  };

  const handleDeleteGarment = (key: string) => {
    if (window.confirm(t.confirmDelete || 'Are you sure you want to delete this garment type?')) {
      const updated = garmentTypes.filter(g => g.key !== key);
      setGarmentTypes(updated);
      storageService.saveGarmentTypes(updated);
      if (selectedGarmentFilter === key) {
        setSelectedGarmentFilter('all');
      }
      showNotification(t.deletedSuccessfully);
    }
  };

  // ================= DESIGN CATEGORIES ACTIONS =================
  const handleAddCategory = () => {
    if (!newCatTitleFa.trim() && !newCatTitlePs.trim() && !newCatTitleEn.trim()) {
      alert(language === 'fa' ? 'لطفاً نام دسته دیزاین را وارد نمایید' : 'Please enter category title');
      return;
    }

    const titleFa = newCatTitleFa.trim() || newCatTitlePs.trim() || newCatTitleEn.trim();
    const titlePs = newCatTitlePs.trim() || titleFa;
    const titleEn = newCatTitleEn.trim() || titleFa;
    const key = 'custom_' + Date.now();

    const newCat: DesignCategory = {
      id: 'cat_' + Date.now(),
      key,
      garmentCategory: newCatGarment,
      titleFa,
      titlePs,
      titleEn,
      allowCustomInput: true,
      options: [
        { id: 'opt_1', nameFa: 'ساده', namePs: 'ساده', nameEn: 'Standard' },
      ],
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    storageService.saveDesignCategories(updated);
    if (onUpdateDesignCategories) onUpdateDesignCategories(updated);
    if (onCategoryUpdated) onCategoryUpdated();

    setNewCatTitleFa('');
    setNewCatTitlePs('');
    setNewCatTitleEn('');
    showNotification(t.savedSuccessfully);
  };

  const startEditCategory = (cat: DesignCategory) => {
    setEditingCategoryId(cat.id);
    setEditCatGarment(cat.garmentCategory || 'perahan_tunban');
    setEditCatTitleFa(cat.titleFa);
    setEditCatTitlePs(cat.titlePs);
    setEditCatTitleEn(cat.titleEn);
  };

  const handleSaveCategoryEdit = () => {
    if (!editingCategoryId) return;
    const titleFa = editCatTitleFa.trim() || editCatTitlePs.trim() || editCatTitleEn.trim();
    const titlePs = editCatTitlePs.trim() || titleFa;
    const titleEn = editCatTitleEn.trim() || titleFa;

    const updated = categories.map(c => {
      if (c.id === editingCategoryId) {
        return {
          ...c,
          garmentCategory: editCatGarment,
          titleFa,
          titlePs,
          titleEn,
        };
      }
      return c;
    });

    setCategories(updated);
    storageService.saveDesignCategories(updated);
    if (onUpdateDesignCategories) onUpdateDesignCategories(updated);
    if (onCategoryUpdated) onCategoryUpdated();
    setEditingCategoryId(null);
    showNotification(t.savedSuccessfully);
  };

  const handleDeleteCategory = (catId: string) => {
    if (window.confirm(t.confirmDelete)) {
      const updated = categories.filter(c => c.id !== catId);
      setCategories(updated);
      storageService.saveDesignCategories(updated);
      if (onUpdateDesignCategories) onUpdateDesignCategories(updated);
      if (onCategoryUpdated) onCategoryUpdated();
      showNotification(t.deletedSuccessfully);
    }
  };

  const handleAddOptionToCategory = (catId: string) => {
    if (!newOptionNameFa.trim() && !newOptionNamePs.trim() && !newOptionNameEn.trim()) {
      return;
    }

    const nameFa = newOptionNameFa.trim() || newOptionNamePs.trim() || newOptionNameEn.trim();
    const namePs = newOptionNamePs.trim() || nameFa;
    const nameEn = newOptionNameEn.trim() || nameFa;

    const newOpt: DesignOption = {
      id: 'opt_' + Date.now(),
      nameFa,
      namePs,
      nameEn,
    };

    const updated = categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          options: [...c.options, newOpt],
        };
      }
      return c;
    });

    setCategories(updated);
    storageService.saveDesignCategories(updated);
    if (onUpdateDesignCategories) onUpdateDesignCategories(updated);
    if (onCategoryUpdated) onCategoryUpdated();

    setNewOptionNameFa('');
    setNewOptionNamePs('');
    setNewOptionNameEn('');
    setAddingOptionForCatId(null);
    showNotification(t.savedSuccessfully);
  };

  const startEditOption = (catId: string, opt: DesignOption) => {
    setEditingOption({
      catId,
      optId: opt.id,
      nameFa: opt.nameFa,
      namePs: opt.namePs,
      nameEn: opt.nameEn,
    });
  };

  const handleSaveOptionEdit = () => {
    if (!editingOption) return;
    const nameFa = editingOption.nameFa.trim() || editingOption.namePs.trim() || editingOption.nameEn.trim();
    const namePs = editingOption.namePs.trim() || nameFa;
    const nameEn = editingOption.nameEn.trim() || nameFa;

    const updated = categories.map(c => {
      if (c.id === editingOption.catId) {
        return {
          ...c,
          options: c.options.map(o => {
            if (o.id === editingOption.optId) {
              return { ...o, nameFa, namePs, nameEn };
            }
            return o;
          }),
        };
      }
      return c;
    });

    setCategories(updated);
    storageService.saveDesignCategories(updated);
    if (onUpdateDesignCategories) onUpdateDesignCategories(updated);
    if (onCategoryUpdated) onCategoryUpdated();
    setEditingOption(null);
    showNotification(t.savedSuccessfully);
  };

  const handleDeleteOption = (catId: string, optId: string) => {
    const updated = categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          options: c.options.filter(o => o.id !== optId),
        };
      }
      return c;
    });

    setCategories(updated);
    storageService.saveDesignCategories(updated);
    if (onUpdateDesignCategories) onUpdateDesignCategories(updated);
    if (onCategoryUpdated) onCategoryUpdated();
    showNotification(t.deletedSuccessfully);
  };

  // ================= MEASUREMENT FIELDS ACTIONS =================
  const handleAddField = () => {
    if (!newFieldFa.trim() && !newFieldPs.trim() && !newFieldEn.trim()) {
      alert(language === 'fa' ? 'لطفاً نام اندازه را وارد کنید' : 'Please enter measurement label');
      return;
    }

    const labelFa = newFieldFa.trim() || newFieldPs.trim() || newFieldEn.trim();
    const labelPs = newFieldPs.trim() || labelFa;
    const labelEn = newFieldEn.trim() || labelFa;
    const key = newFieldKey.trim() || 'f_' + Date.now();

    const newF: MeasurementField = {
      id: 'field_' + Date.now(),
      key,
      garmentCategory: newFieldGarment,
      labelFa,
      labelPs,
      labelEn,
      unit: newFieldUnit,
      isStandard: false,
    };

    const updated = [...fields, newF];
    setFields(updated);
    storageService.saveMeasurementFields(updated);
    if (onUpdateMeasurementFields) onUpdateMeasurementFields(updated);
    if (onMeasurementFieldsUpdated) onMeasurementFieldsUpdated();

    setNewFieldKey('');
    setNewFieldFa('');
    setNewFieldPs('');
    setNewFieldEn('');
    showNotification(t.savedSuccessfully);
  };

  const startEditField = (field: MeasurementField) => {
    setEditingFieldId(field.id);
    setEditFieldGarment(field.garmentCategory || 'perahan_tunban');
    setEditFieldFa(field.labelFa);
    setEditFieldPs(field.labelPs);
    setEditFieldEn(field.labelEn);
    setEditFieldUnit((field.unit as any) || 'in');
  };

  const handleSaveFieldEdit = () => {
    if (!editingFieldId) return;
    const labelFa = editFieldFa.trim() || editFieldPs.trim() || editFieldEn.trim();
    const labelPs = editFieldPs.trim() || labelFa;
    const labelEn = editFieldEn.trim() || labelFa;

    const updated = fields.map(f => {
      if (f.id === editingFieldId) {
        return {
          ...f,
          garmentCategory: editFieldGarment,
          labelFa,
          labelPs,
          labelEn,
          unit: editFieldUnit,
        };
      }
      return f;
    });

    setFields(updated);
    storageService.saveMeasurementFields(updated);
    if (onUpdateMeasurementFields) onUpdateMeasurementFields(updated);
    if (onMeasurementFieldsUpdated) onMeasurementFieldsUpdated();
    setEditingFieldId(null);
    showNotification(t.savedSuccessfully);
  };

  const handleDeleteField = (fieldId: string) => {
    if (window.confirm(t.confirmDelete || 'Are you sure?')) {
      const updated = fields.filter(f => f.id !== fieldId);
      setFields(updated);
      storageService.saveMeasurementFields(updated);
      if (onUpdateMeasurementFields) onUpdateMeasurementFields(updated);
      if (onMeasurementFieldsUpdated) onMeasurementFieldsUpdated();
      showNotification(t.deletedSuccessfully);
    }
  };

  // ================= SHOP PROFILE ACTIONS =================
  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveShopSettings(shop);
    if (onUpdateShopSettings) onUpdateShopSettings(shop);
    if (onSettingsUpdated) onSettingsUpdated();
    showNotification(t.savedSuccessfully);
  };

  // ================= BACKUP ACTIONS =================
  const handleExportBackup = () => {
    const json = storageService.exportFullDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mujeeb_Afghan_Fashion_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(language === 'fa' ? 'فایل پشتیبان با موفقیت دانلود شد' : 'Backup downloaded successfully');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && storageService.importFullDatabase(content)) {
        if (onDataReset) onDataReset();
        if (onDatabaseRestored) onDatabaseRestored();
        showNotification(language === 'fa' ? 'اطلاعات با موفقیت بازیابی شد' : 'Backup restored successfully');
      } else {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDemo = () => {
    if (window.confirm(t.areYouSure)) {
      storageService.resetAllToDemo();
      if (onDataReset) onDataReset();
      if (onDatabaseRestored) onDatabaseRestored();
      showNotification(t.savedSuccessfully);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
            <h1 className="text-xl font-black text-[#1A1A1A] tracking-tight">
              {t.designAndSettings}
            </h1>
          </div>
          <p className="text-xs text-[#706E6B] mt-0.5">
            {language === 'fa' 
              ? 'مدیریت انواع لباس‌ها، فیلدهای اندازه و طرح‌های خیاطی به تفکیک هر لباس' 
              : language === 'ps' 
              ? 'د جامو د ډولونو، اندازو او د خیاطۍ ډیزاینونو تنظیمول' 
              : 'Configure garment categories, measurements, design options and shop profile'}
          </p>
        </div>

        {/* Notification Toast */}
        {saveMessage && (
          <div className="px-4 py-2 bg-[#1A1A1A] text-[#D4AF37] text-xs font-bold rounded-xl shadow-md flex items-center gap-2 animate-in fade-in border border-[#D4AF37]">
            <Check className="w-4 h-4 text-[#D4AF37]" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5E5] pb-2">
        <button
          onClick={() => handleTabClick('garments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'garments'
              ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>{t.garmentCategories || 'انواع لباس / کالي'}</span>
          <span className="px-1.5 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-[10px] font-mono font-bold">
            {garmentTypes.length}
          </span>
        </button>

        <button
          onClick={() => handleTabClick('measurements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'measurements'
              ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>{t.measurementSettings}</span>
          <span className="px-1.5 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-[10px] font-mono font-bold">
            {fields.length}
          </span>
        </button>

        <button
          onClick={() => handleTabClick('design')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'design'
              ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.designTemplates}</span>
          <span className="px-1.5 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-[10px] font-mono font-bold">
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => handleTabClick('shop')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'shop'
              ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t.shopProfile}</span>
        </button>

        <button
          onClick={() => handleTabClick('receipt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'receipt'
              ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>{language === 'fa' ? 'تنظیمات رسید و پرینتر' : language === 'ps' ? 'د رسید او پرینټر ترتیبات' : 'Receipt Settings'}</span>
          <span className="px-1.5 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-[10px] font-mono font-bold uppercase">
            {shop.receiptFormat === 'a5' ? 'A5' : 'A6'}
          </span>
        </button>

        <button
          onClick={() => handleTabClick('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{t.backupAndRestore}</span>
        </button>
      </div>

      {/* ================= TAB 1: GARMENT CATEGORIES ================= */}
      {activeTab === 'garments' && (
        <div className="space-y-6">
          {/* Add New Garment Category Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
              <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.addGarmentType || 'افزودن نوع لباس جدید (Add Garment Type)'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">دری (Dari)</label>
                <input
                  type="text"
                  value={newGarmentFa}
                  onChange={e => setNewGarmentFa(e.target.value)}
                  placeholder="مثال: پیراهن و تنبان"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">پښتو (Pashto)</label>
                <input
                  type="text"
                  value={newGarmentPs}
                  onChange={e => setNewGarmentPs(e.target.value)}
                  placeholder="مثال: کمیس او پرتوګ"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">English</label>
                <input
                  type="text"
                  value={newGarmentEn}
                  onChange={e => setNewGarmentEn(e.target.value)}
                  placeholder="e.g. Perahan Tunban / Kurta"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">آیکون / Icon</label>
                <input
                  type="text"
                  value={newGarmentIcon}
                  onChange={e => setNewGarmentIcon(e.target.value)}
                  placeholder="✂️, 🥻, 🧥, 👔"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddGarmentType}
                className="px-5 py-2 bg-[#1A1A1A] hover:bg-black text-[#D4AF37] text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addGarmentType || 'افزودن لباس'}</span>
              </button>
            </div>
          </div>

          {/* Existing Garment Types Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {garmentTypes.map(g => {
              const displayName = language === 'ps' ? g.namePs : language === 'fa' ? g.nameFa : g.nameEn;
              const isEditing = editingGarmentKey === g.key;
              const measCount = fields.filter(f => f.garmentCategory === g.key).length;
              const designCount = categories.filter(c => c.garmentCategory === g.key).length;

              return (
                <div key={g.key} className="bg-white rounded-2xl border border-[#E5E5E5] p-4 space-y-3 shadow-xs">
                  {isEditing ? (
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-[#1A1A1A] flex items-center justify-between">
                        <span>{language === 'fa' ? 'ویرایش مشخصات لباس' : 'Edit Garment'}</span>
                        <button onClick={() => setEditingGarmentKey(null)} className="text-stone-400 hover:text-stone-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">دری</label>
                        <input
                          type="text"
                          value={editGarmentFa}
                          onChange={e => setEditGarmentFa(e.target.value)}
                          className="w-full px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">پښتو</label>
                        <input
                          type="text"
                          value={editGarmentPs}
                          onChange={e => setEditGarmentPs(e.target.value)}
                          className="w-full px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">English</label>
                        <input
                          type="text"
                          value={editGarmentEn}
                          onChange={e => setEditGarmentEn(e.target.value)}
                          className="w-full px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">Icon</label>
                        <input
                          type="text"
                          value={editGarmentIcon}
                          onChange={e => setEditGarmentIcon(e.target.value)}
                          className="w-full px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingGarmentKey(null)}
                          className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 rounded text-xs"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveGarmentEdit}
                          className="px-3 py-1 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] font-bold rounded text-xs shadow-xs"
                        >
                          {t.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{g.icon || '✂️'}</span>
                          <div>
                            <h4 className="font-extrabold text-sm text-[#1A1A1A]">{displayName}</h4>
                            <span className="text-[10px] text-stone-400 font-mono">key: {g.key}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditGarment(g)}
                            className="p-1.5 text-stone-400 hover:text-[#D4AF37] hover:bg-stone-100 rounded-lg transition"
                            title={t.edit}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!g.isStandard && (
                            <button
                              onClick={() => handleDeleteGarment(g.key)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title={t.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-[11px] text-stone-600">
                        <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold">
                          {measCount} {t.measurementSettings}
                        </span>
                        <span className="px-2 py-0.5 bg-stone-100 rounded-md font-bold">
                          {designCount} {t.designTemplates}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: MEASUREMENT SETTINGS ================= */}
      {activeTab === 'measurements' && (
        <div className="space-y-6">
          {/* Garment Selector Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
              <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{language === 'fa' ? 'فیلتر بر اساس نوع لباس:' : language === 'ps' ? 'د جامو د ډول پر بنسټ فلټر:' : 'Filter by Garment Type:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedGarmentFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedGarmentFilter === 'all'
                    ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>🌐 {language === 'fa' ? 'همه اندازه‌ها' : language === 'ps' ? 'ټولې اندازې' : 'All Measurements'}</span>
                <span className="ms-1.5 px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-full text-[10px]">
                  {fields.length}
                </span>
              </button>
              {garmentTypes.map(g => {
                const name = language === 'ps' ? g.namePs : language === 'fa' ? g.nameFa : g.nameEn;
                const count = fields.filter(f => f.garmentCategory === g.key).length;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setSelectedGarmentFilter(g.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedGarmentFilter === g.key
                        ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <span>{g.icon || '✂️'}</span>
                    <span>{name}</span>
                    <span className="px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-full text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add New Measurement Field Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
              <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.addMeasurementField}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                  {t.garmentType || 'نوع لباس'}
                </label>
                <select
                  value={newFieldGarment}
                  onChange={e => setNewFieldGarment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="all">{language === 'fa' ? 'عمومی (تمام لباس‌ها)' : 'General (All Garments)'}</option>
                  {garmentTypes.map(g => (
                    <option key={g.key} value={g.key}>
                      {language === 'ps' ? g.namePs : language === 'fa' ? g.nameFa : g.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">دری (Dari)</label>
                <input
                  type="text"
                  value={newFieldFa}
                  onChange={e => setNewFieldFa(e.target.value)}
                  placeholder="مثال: قد / بغل / آستین"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">پښتو (Pashto)</label>
                <input
                  type="text"
                  value={newFieldPs}
                  onChange={e => setNewFieldPs(e.target.value)}
                  placeholder="مثال: قد / لستوڼی"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">English</label>
                <input
                  type="text"
                  value={newFieldEn}
                  onChange={e => setNewFieldEn(e.target.value)}
                  placeholder="e.g. Length / Chest"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">واحد / Unit</label>
                <select
                  value={newFieldUnit}
                  onChange={e => setNewFieldUnit(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="in">انچ / Inch (in)</option>
                  <option value="cm">سانتی‌متر / Centimeter (cm)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddField}
                className="px-5 py-2 bg-[#1A1A1A] hover:bg-black text-[#D4AF37] text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addMeasurementField}</span>
              </button>
            </div>
          </div>

          {/* Current Measurement Fields List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredMeasurementFields.map(f => {
              const label = language === 'ps' ? f.labelPs : language === 'fa' ? f.labelFa : f.labelEn;
              const isEditing = editingFieldId === f.id;
              const garmentName = getGarmentName(f.garmentCategory || 'all');

              return (
                <div 
                  key={f.id}
                  className="p-3.5 bg-white rounded-xl border border-[#E5E5E5] shadow-xs space-y-2 hover:border-[#D4AF37]/50 transition"
                >
                  {isEditing ? (
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-[#1A1A1A] flex items-center justify-between">
                        <span>{language === 'fa' ? 'ویرایش فیلد اندازه' : 'Edit Measurement'}</span>
                        <button onClick={() => setEditingFieldId(null)} className="text-stone-400 hover:text-stone-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">لباس مربوطه</label>
                        <select
                          value={editFieldGarment}
                          onChange={e => setEditFieldGarment(e.target.value)}
                          className="w-full px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs font-bold"
                        >
                          <option value="all">عمومی (همه)</option>
                          {garmentTypes.map(g => (
                            <option key={g.key} value={g.key}>
                              {language === 'ps' ? g.namePs : language === 'fa' ? g.nameFa : g.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">دری</label>
                        <input
                          type="text"
                          value={editFieldFa}
                          onChange={e => setEditFieldFa(e.target.value)}
                          className="w-full px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">پښتو</label>
                        <input
                          type="text"
                          value={editFieldPs}
                          onChange={e => setEditFieldPs(e.target.value)}
                          className="w-full px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">English</label>
                        <input
                          type="text"
                          value={editFieldEn}
                          onChange={e => setEditFieldEn(e.target.value)}
                          className="w-full px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingFieldId(null)}
                          className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 rounded text-xs"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveFieldEdit}
                          className="px-3 py-1 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] font-bold rounded text-xs shadow-xs"
                        >
                          {t.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-xs text-[#1A1A1A] block">{label}</span>
                          <span className="text-[10px] text-stone-400 font-mono">key: {f.key} ({f.unit || 'in'})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditField(f)}
                            className="p-1 text-stone-400 hover:text-[#D4AF37] hover:bg-stone-100 rounded-md transition"
                            title={t.edit}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteField(f.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title={t.delete}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 bg-amber-50 text-[#B39025] border border-[#D4AF37]/30 rounded-md font-bold">
                          {garmentName}
                        </span>
                        <span className="text-stone-400 font-mono font-bold">{f.unit || 'in'}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: DESIGN TEMPLATES ================= */}
      {activeTab === 'design' && (
        <div className="space-y-6">
          {/* Garment Selector Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
              <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{language === 'fa' ? 'فیلتر دیزاین‌ها بر اساس نوع لباس:' : language === 'ps' ? 'د جامو د ډول پر بنسټ د ډیزاینونو فلټر:' : 'Filter Design Options by Garment:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedGarmentFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedGarmentFilter === 'all'
                    ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>🌐 {language === 'fa' ? 'تمام دیزاین‌ها' : language === 'ps' ? 'ټول ډیزاینونه' : 'All Design Styles'}</span>
                <span className="ms-1.5 px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-full text-[10px]">
                  {categories.length}
                </span>
              </button>
              {garmentTypes.map(g => {
                const name = language === 'ps' ? g.namePs : language === 'fa' ? g.nameFa : g.nameEn;
                const count = categories.filter(c => c.garmentCategory === g.key).length;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setSelectedGarmentFilter(g.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedGarmentFilter === g.key
                        ? 'bg-[#1A1A1A] text-[#D4AF37] font-black shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <span>{g.icon || '✂️'}</span>
                    <span>{name}</span>
                    <span className="px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-full text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add New Category Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
              <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.addCategory} (e.g. Collar Type / Collar / یخن، Pocket Flap, Cuff...)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                  {t.garmentType || 'نوع لباس'}
                </label>
                <select
                  value={newCatGarment}
                  onChange={e => setNewCatGarment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#D4AF37]"
                >
                  <option value="all">{language === 'fa' ? 'عمومی (تمام لباس‌ها)' : 'General (All Garments)'}</option>
                  {garmentTypes.map(g => (
                    <option key={g.key} value={g.key}>
                      {language === 'ps' ? g.namePs : language === 'fa' ? g.nameFa : g.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">دری (Dari)</label>
                <input
                  type="text"
                  value={newCatTitleFa}
                  onChange={e => setNewCatTitleFa(e.target.value)}
                  placeholder="مثال: نوعیت یخن / جیب / پاچه"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">پښتو (Pashto)</label>
                <input
                  type="text"
                  value={newCatTitlePs}
                  onChange={e => setNewCatTitlePs(e.target.value)}
                  placeholder="مثال: د یخن ډول / جیب / پاچه"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">English</label>
                <input
                  type="text"
                  value={newCatTitleEn}
                  onChange={e => setNewCatTitleEn(e.target.value)}
                  placeholder="e.g. Collar Type / Pocket"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-5 py-2 bg-[#1A1A1A] hover:bg-black text-[#D4AF37] text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addCategory}</span>
              </button>
            </div>
          </div>

          {/* Existing Categories & Options List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDesignCategories.map(category => {
              const catTitle = language === 'ps' 
                ? category.titlePs 
                : language === 'fa' 
                ? category.titleFa 
                : category.titleEn;

              const isEditingThisCategory = editingCategoryId === category.id;
              const garmentName = getGarmentName(category.garmentCategory || 'all');

              return (
                <div 
                  key={category.id}
                  className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xs p-5 space-y-3"
                >
                  {/* Category Header or Edit Form */}
                  {isEditingThisCategory ? (
                    <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#D4AF37]/50 space-y-2.5">
                      <div className="text-xs font-bold text-[#1A1A1A] flex items-center justify-between">
                        <span>{language === 'fa' ? 'ویرایش نام دسته دیزاین' : 'Edit Design Category'}</span>
                        <button
                          onClick={() => setEditingCategoryId(null)}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">لباس مربوطه</label>
                          <select
                            value={editCatGarment}
                            onChange={e => setEditCatGarment(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs font-bold"
                          >
                            <option value="all">عمومی (همه)</option>
                            {garmentTypes.map(g => (
                              <option key={g.key} value={g.key}>
                                {language === 'ps' ? g.namePs : language === 'fa' ? g.nameFa : g.nameEn}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">دری</label>
                          <input
                            type="text"
                            value={editCatTitleFa}
                            onChange={e => setEditCatTitleFa(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">پښتو</label>
                          <input
                            type="text"
                            value={editCatTitlePs}
                            onChange={e => setEditCatTitlePs(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">English</label>
                          <input
                            type="text"
                            value={editCatTitleEn}
                            onChange={e => setEditCatTitleEn(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingCategoryId(null)}
                          className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 rounded text-xs"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCategoryEdit}
                          className="px-3 py-1 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] font-bold rounded text-xs shadow-xs"
                        >
                          {t.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <h4 className="font-bold text-sm text-[#1A1A1A]">{catTitle}</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-[#B39025] border border-[#D4AF37]/30 rounded-md font-bold">
                          {garmentName}
                        </span>
                        <span className="text-[10px] text-[#706E6B] font-mono">({category.options.length})</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditCategory(category)}
                          className="p-1.5 text-stone-400 hover:text-[#D4AF37] hover:bg-stone-100 rounded-lg transition cursor-pointer"
                          title={t.edit}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Options Editing Modal/Row */}
                  {editingOption && editingOption.catId === category.id && (
                    <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#D4AF37]/50 space-y-2 text-xs">
                      <div className="text-[11px] font-bold text-[#1A1A1A] flex items-center justify-between">
                        <span>{language === 'fa' ? 'ویرایش گزینه دیزاین' : 'Edit Design Option'}</span>
                        <button
                          onClick={() => setEditingOption(null)}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">دری</label>
                          <input
                            type="text"
                            value={editingOption.nameFa}
                            onChange={e => setEditingOption({ ...editingOption, nameFa: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">پښتو</label>
                          <input
                            type="text"
                            value={editingOption.namePs}
                            onChange={e => setEditingOption({ ...editingOption, namePs: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 mb-0.5">English</label>
                          <input
                            type="text"
                            value={editingOption.nameEn}
                            onChange={e => setEditingOption({ ...editingOption, nameEn: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingOption(null)}
                          className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 rounded text-xs"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveOptionEdit}
                          className="px-3 py-1 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] font-bold rounded text-xs shadow-xs"
                        >
                          {t.save}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Options Chips List */}
                  <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                    {category.options.map(opt => {
                      const optName = language === 'ps' 
                        ? opt.namePs 
                        : language === 'fa' 
                        ? opt.nameFa 
                        : opt.nameEn;

                      return (
                        <span 
                          key={opt.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F9F7F2] hover:bg-stone-200/80 rounded-lg text-xs font-semibold text-[#1A1A1A] border border-[#E5E5E5] transition group/opt"
                        >
                          <span>{optName}</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => startEditOption(category.id, opt)}
                              className="text-stone-400 hover:text-[#D4AF37] transition cursor-pointer p-0.5"
                              title={t.edit}
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(category.id, opt.id)}
                              className="text-stone-400 hover:text-rose-600 transition cursor-pointer p-0.5"
                              title={t.delete}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </span>
                      );
                    })}
                  </div>

                  {/* Add Option Box */}
                  {addingOptionForCatId === category.id ? (
                    <div className="pt-2 border-t border-[#E5E5E5] space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={newOptionNameFa}
                          onChange={e => setNewOptionNameFa(e.target.value)}
                          placeholder="دری (مثال: یخن قاق)"
                          className="px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                        <input
                          type="text"
                          value={newOptionNamePs}
                          onChange={e => setNewOptionNamePs(e.target.value)}
                          placeholder="پښتو (مثال: قاق یخن)"
                          className="px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                        <input
                          type="text"
                          value={newOptionNameEn}
                          onChange={e => setNewOptionNameEn(e.target.value)}
                          placeholder="English (e.g. Straight)"
                          className="px-2 py-1 bg-[#F9F7F2] border border-[#E5E5E5] rounded text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAddingOptionForCatId(null)}
                          className="px-2.5 py-1 text-stone-500 hover:bg-stone-100 rounded text-xs"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddOptionToCategory(category.id)}
                          className="px-3 py-1 bg-[#1A1A1A] hover:bg-black text-[#D4AF37] font-bold rounded text-xs shadow-xs"
                        >
                          + {t.add}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-stone-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setAddingOptionForCatId(category.id)}
                        className="text-xs font-bold text-[#B39025] hover:text-[#D4AF37] flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addOption}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 4: SHOP PROFILE ================= */}
      {activeTab === 'shop' && (
        <form onSubmit={handleSaveShopSettings} className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-6">
          <div className="border-b border-[#E5E5E5] pb-3">
            <h3 className="font-bold text-sm text-[#1A1A1A]">
              {t.shopProfile}
            </h3>
            <p className="text-xs text-[#706E6B] mt-0.5">
              {language === 'fa' ? 'اطلاعاتی که در سربرگ بل و رسیدهای چاپ شده درج می‌شوند' : language === 'ps' ? 'هغه معلومات چې د چاپ شوي بِل او رسيد په سرليک کې ښکاري' : 'Details displayed on printed receipts and PDF slips'}
            </p>
          </div>

          {/* Shop Names in 3 Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.shopName} (دری / Dari) *
              </label>
              <input
                type="text"
                value={shop.shopNameFa}
                onChange={e => setShop({ ...shop, shopNameFa: e.target.value })}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.shopName} (پښتو / Pashto) *
              </label>
              <input
                type="text"
                value={shop.shopNamePs}
                onChange={e => setShop({ ...shop, shopNamePs: e.target.value })}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.shopName} (English) *
              </label>
              <input
                type="text"
                value={shop.shopNameEn}
                onChange={e => setShop({ ...shop, shopNameEn: e.target.value })}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          {/* Phone Numbers & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.contactNumber} 1 *
              </label>
              <input
                type="text"
                value={shop.phone1}
                onChange={e => setShop({ ...shop, phone1: e.target.value })}
                placeholder="0772559881"
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.contactNumber} 2 ({t.optional})
              </label>
              <input
                type="text"
                value={shop.phone2 || ''}
                onChange={e => setShop({ ...shop, phone2: e.target.value })}
                placeholder="0782220194"
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                WhatsApp *
              </label>
              <input
                type="text"
                value={shop.whatsapp}
                onChange={e => setShop({ ...shop, whatsapp: e.target.value })}
                placeholder="0782220194"
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Shop Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.shopAddress} (دری / Dari)
              </label>
              <input
                type="text"
                value={shop.addressFa}
                onChange={e => setShop({ ...shop, addressFa: e.target.value })}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.shopAddress} (پښتو / Pashto)
              </label>
              <input
                type="text"
                value={shop.addressPs}
                onChange={e => setShop({ ...shop, addressPs: e.target.value })}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.shopAddress} (English)
              </label>
              <input
                type="text"
                value={shop.addressEn}
                onChange={e => setShop({ ...shop, addressEn: e.target.value })}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Receipt Footer & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.receiptFooter} (دری / Dari)
              </label>
              <input
                type="text"
                value={shop.receiptFooterFa || ''}
                onChange={e => setShop({ ...shop, receiptFooterFa: e.target.value })}
                placeholder="لطفاً هنگام تحویل بل را همراه داشته باشید..."
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.receiptFooter} (پښتو / Pashto)
              </label>
              <input
                type="text"
                value={shop.receiptFooterPs || ''}
                onChange={e => setShop({ ...shop, receiptFooterPs: e.target.value })}
                placeholder="مهرباني وکړئ د فرمایش د اخیستلو پر مهال دا بِل له ځان سره ولرئ..."
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.receiptFooter} (English)
              </label>
              <input
                type="text"
                value={shop.receiptFooterEn || ''}
                onChange={e => setShop({ ...shop, receiptFooterEn: e.target.value })}
                placeholder="Please bring this receipt when collecting your order..."
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.currency} (دری / Dari)
              </label>
              <input
                type="text"
                value={shop.currencyFa}
                onChange={e => setShop({ ...shop, currencyFa: e.target.value })}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.currency} (پښتو / Pashto)
              </label>
              <input
                type="text"
                value={shop.currencyPs}
                onChange={e => setShop({ ...shop, currencyPs: e.target.value })}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.currency} (English)
              </label>
              <input
                type="text"
                value={shop.currencyEn}
                onChange={e => setShop({ ...shop, currencyEn: e.target.value })}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          {/* Quick Receipt Format Selector in Shop Profile */}
          <div className="p-4 bg-[#F9F7F2] rounded-xl border border-[#E5E5E5] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-xs font-bold text-[#1A1A1A]">
                  {language === 'fa' ? 'فرمت پیش‌فرض چاپ رسید و بل' : language === 'ps' ? 'د بِل د چاپ بڼه' : 'Default Receipt Format'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleTabClick('receipt')}
                className="text-[11px] font-bold text-[#B39025] hover:text-[#D4AF37] underline cursor-pointer"
              >
                {language === 'fa' ? 'مدیریت کامل تنظیمات رسید ←' : language === 'ps' ? 'د بِل بشپړ ترتیبات ←' : 'Open Detailed Receipt Settings →'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShop({ ...shop, receiptFormat: 'a6' })}
                className={`p-3 rounded-lg border text-right sm:text-center transition cursor-pointer ${
                  (shop.receiptFormat || 'a6') === 'a6'
                    ? 'border-[#D4AF37] bg-white text-[#1A1A1A] font-bold shadow-xs'
                    : 'border-[#E5E5E5] bg-white/60 text-[#706E6B]'
                }`}
              >
                <div className="font-bold">{language === 'fa' ? 'کاغذ A6' : 'A6 Standard'}</div>
                <div className="text-[10px] text-stone-500 font-normal">105 × 148 mm</div>
              </button>

              <button
                type="button"
                onClick={() => setShop({ ...shop, receiptFormat: 'a6' })}
                className={`hidden p-3 rounded-lg border text-right sm:text-center transition cursor-pointer ${
                  shop.receiptFormat === 'a6'
                    ? 'border-[#D4AF37] bg-white text-[#1A1A1A] font-bold shadow-xs'
                    : 'border-[#E5E5E5] bg-white/60 text-[#706E6B]'
                }`}
              >
                <div className="font-bold">{language === 'fa' ? 'حرارتی ۵۸ میلی‌متر (کوچک)' : 'Thermal 58mm Mini'}</div>
                <div className="text-[10px] text-stone-500 font-normal">پرینتر جیبی / بلوتوث</div>
              </button>

              <button
                type="button"
                onClick={() => setShop({ ...shop, receiptFormat: 'a5' })}
                className={`p-3 rounded-lg border text-right sm:text-center transition cursor-pointer ${
                  shop.receiptFormat === 'a5'
                    ? 'border-[#D4AF37] bg-white text-[#1A1A1A] font-bold shadow-xs'
                    : 'border-[#E5E5E5] bg-white/60 text-[#706E6B]'
                }`}
              >
                <div className="font-bold">{language === 'fa' ? 'کاغذ A5' : 'A5 Standard'}</div>
                <div className="text-[10px] text-stone-500 font-normal">148 × 210 mm</div>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] font-black rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 5: RECEIPT SETTINGS ================= */}
      {activeTab === 'receipt' && (
        <ReceiptSettingsPanel
          shopSettings={shop}
          language={language}
          onUpdateShopSettings={(updated) => {
            setShop(updated);
            if (onUpdateShopSettings) onUpdateShopSettings(updated);
            showNotification(language === 'fa' ? 'تنظیمات رسید ذخیره شد' : 'Receipt settings saved');
          }}
          onSettingsUpdated={onSettingsUpdated}
        />
      )}

      {/* ================= TAB 6: BACKUP & RESTORE ================= */}
      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-[#1A1A1A]">
              {t.backupAndRestore}
            </h3>
            <p className="text-xs text-[#706E6B] mt-0.5">
              {t.backupDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Backup */}
            <div className="p-5 bg-[#F9F7F2] rounded-2xl border border-[#E5E5E5] space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-[#1A1A1A] flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t.exportBackup}</span>
                </h4>
                <p className="text-[11px] text-[#706E6B] mt-1">
                  {language === 'fa' ? 'یک نسخه کامل از تمام سفارشات، مشتریان، رخت‌ها، محصولات و تنظیمات دانلود کنید.' : 'Download complete JSON database backup.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-[#1A1A1A] hover:bg-black text-[#D4AF37] text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>{t.exportBackup}</span>
              </button>
            </div>

            {/* Import Backup */}
            <div className="p-5 bg-[#F9F7F2] rounded-2xl border border-[#E5E5E5] space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-[#1A1A1A] flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t.importBackup}</span>
                </h4>
                <p className="text-[11px] text-[#706E6B] mt-1">
                  {language === 'fa' ? 'فایل نسخه پشتیبان قبلی (JSON) را بارگذاری نمایید.' : 'Restore previous JSON database backup.'}
                </p>
              </div>

              <label className="w-full py-2.5 bg-white border border-[#E5E5E5] hover:border-[#D4AF37] text-[#1A1A1A] text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs text-center">
                <Upload className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.importBackup}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset to Default Demo */}
            <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-rose-800 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>{t.resetDatabase}</span>
                </h4>
                <p className="text-[11px] text-rose-600 mt-1">
                  {language === 'fa' ? 'بازگردانی تمام اطلاعات، اندازه‌ها و تنظیمات به حالت اولیه نمایشی.' : 'Reset all data and demo configs to default.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetToDemo}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.resetDatabase}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
