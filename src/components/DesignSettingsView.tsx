import React, { useState } from 'react';
import { 
  DesignCategory, 
  DesignOption, 
  MeasurementField, 
  ShopSettings, 
  Language 
} from '../types';
import { translations } from '../translations/i18n';
import { storageService } from '../services/storage';
import { 
  Sparkles, 
  Settings, 
  Scissors, 
  Plus, 
  Trash2, 
  Edit2, 
  Pencil,
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Building2, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  X,
  Database
} from 'lucide-react';

interface DesignSettingsViewProps {
  designCategories: DesignCategory[];
  measurementFields: MeasurementField[];
  shopSettings: ShopSettings;
  language: Language;
  activeSubTab?: 'design' | 'measurements' | 'shop' | 'backup';
  onSubTabChange?: (sub: 'design' | 'measurements' | 'shop' | 'backup') => void;
  onUpdateDesignCategories: (cats: DesignCategory[]) => void;
  onUpdateMeasurementFields: (fields: MeasurementField[]) => void;
  onUpdateShopSettings: (settings: ShopSettings) => void;
  onDataReset: () => void;
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
}) => {
  const t = translations[language];

  // Active Tab in Settings: 'design' | 'measurements' | 'shop' | 'backup'
  const [activeTab, setActiveTab] = useState<'design' | 'measurements' | 'shop' | 'backup'>(activeSubTab);

  // Sync when activeSubTab changes from sidebar
  React.useEffect(() => {
    if (activeSubTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabClick = (tab: 'design' | 'measurements' | 'shop' | 'backup') => {
    setActiveTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Categories Local State
  const [categories, setCategories] = useState<DesignCategory[]>(designCategories);
  const [newCatTitleFa, setNewCatTitleFa] = useState('');
  const [newCatTitlePs, setNewCatTitlePs] = useState('');
  const [newCatTitleEn, setNewCatTitleEn] = useState('');

  // Category editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatTitleFa, setEditCatTitleFa] = useState('');
  const [editCatTitlePs, setEditCatTitlePs] = useState('');
  const [editCatTitleEn, setEditCatTitleEn] = useState('');

  // Option adding state per category
  const [addingOptionForCatId, setAddingOptionForCatId] = useState<string | null>(null);
  const [newOptionNameFa, setNewOptionNameFa] = useState('');
  const [newOptionNamePs, setNewOptionNamePs] = useState('');
  const [newOptionNameEn, setNewOptionNameEn] = useState('');

  // Option editing state
  const [editingOption, setEditingOption] = useState<{
    catId: string;
    optId: string;
    nameFa: string;
    namePs: string;
    nameEn: string;
  } | null>(null);

  // Measurements Local State
  const [fields, setFields] = useState<MeasurementField[]>(measurementFields);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldFa, setNewFieldFa] = useState('');
  const [newFieldPs, setNewFieldPs] = useState('');
  const [newFieldEn, setNewFieldEn] = useState('');

  // Shop Settings Local State
  const [shop, setShop] = useState<ShopSettings>({ ...shopSettings });

  // Notifications
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // --- Category Actions ---
  const handleAddCategory = () => {
    if (!newCatTitleFa.trim() && !newCatTitlePs.trim() && !newCatTitleEn.trim()) {
      alert(language === 'fa' ? 'لطفاً نام دسته را وارد کنید' : 'Please enter category title');
      return;
    }

    const titleFa = newCatTitleFa.trim() || newCatTitlePs.trim() || newCatTitleEn.trim();
    const titlePs = newCatTitlePs.trim() || titleFa;
    const titleEn = newCatTitleEn.trim() || titleFa;
    const key = 'custom_' + Date.now();

    const newCat: DesignCategory = {
      id: 'cat_' + Date.now(),
      key,
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
    onUpdateDesignCategories(updated);

    setNewCatTitleFa('');
    setNewCatTitlePs('');
    setNewCatTitleEn('');
    showNotification(t.savedSuccessfully);
  };

  const startEditCategory = (cat: DesignCategory) => {
    setEditingCategoryId(cat.id);
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
          titleFa,
          titlePs,
          titleEn,
        };
      }
      return c;
    });

    setCategories(updated);
    storageService.saveDesignCategories(updated);
    onUpdateDesignCategories(updated);
    setEditingCategoryId(null);
    showNotification(t.savedSuccessfully);
  };

  const handleDeleteCategory = (catId: string) => {
    if (window.confirm(t.confirmDelete)) {
      const updated = categories.filter(c => c.id !== catId);
      setCategories(updated);
      storageService.saveDesignCategories(updated);
      onUpdateDesignCategories(updated);
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
        return { ...c, options: [...c.options, newOpt] };
      }
      return c;
    });

    setCategories(updated);
    storageService.saveDesignCategories(updated);
    onUpdateDesignCategories(updated);

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
    onUpdateDesignCategories(updated);
    setEditingOption(null);
    showNotification(t.savedSuccessfully);
  };

  const handleDeleteOption = (catId: string, optId: string) => {
    const updated = categories.map(c => {
      if (c.id === catId) {
        return { ...c, options: c.options.filter(o => o.id !== optId) };
      }
      return c;
    });

    setCategories(updated);
    storageService.saveDesignCategories(updated);
    onUpdateDesignCategories(updated);
    showNotification(t.deletedSuccessfully);
  };

  // --- Measurement Fields Actions ---
  const handleAddField = () => {
    if (!newFieldFa.trim() && !newFieldPs.trim() && !newFieldEn.trim()) {
      return;
    }

    const labelFa = newFieldFa.trim() || newFieldPs.trim() || newFieldEn.trim();
    const labelPs = newFieldPs.trim() || labelFa;
    const labelEn = newFieldEn.trim() || labelFa;
    const key = newFieldKey.trim() || 'meas_' + Date.now();

    const newF: MeasurementField = {
      id: 'mf_' + Date.now(),
      key,
      labelFa,
      labelPs,
      labelEn,
      unit: 'in',
      isStandard: false,
    };

    const updated = [...fields, newF];
    setFields(updated);
    storageService.saveMeasurementFields(updated);
    onUpdateMeasurementFields(updated);

    setNewFieldKey('');
    setNewFieldFa('');
    setNewFieldPs('');
    setNewFieldEn('');
    showNotification(t.savedSuccessfully);
  };

  const handleDeleteField = (fieldId: string) => {
    const updated = fields.filter(f => f.id !== fieldId);
    setFields(updated);
    storageService.saveMeasurementFields(updated);
    onUpdateMeasurementFields(updated);
    showNotification(t.deletedSuccessfully);
  };

  // --- Shop Settings Actions ---
  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveShopSettings(shop);
    onUpdateShopSettings(shop);
    showNotification(t.savedSuccessfully);
  };

  // --- Backup & Restore Actions ---
  const handleExportBackup = () => {
    const json = storageService.exportFullDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TailorShop_Backup_${new Date().toISOString().slice(0, 10)}.json`;
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
        onDataReset();
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
      onDataReset();
      showNotification(t.savedSuccessfully);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner - Bento Style */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
            <h1 className="text-xl font-black text-[#1A1A1A] tracking-tight">
              {t.designAndSettings}
            </h1>
          </div>
          <p className="text-xs text-[#706E6B] mt-0.5">
            {language === 'fa' ? 'تنظیم طرح‌های خیاطی، فیلدهای اندازه و اطلاعات هټۍ' : language === 'ps' ? 'د ډیزاینونو، اندازو او د هټۍ د معلوماتو تنظیمول' : 'Customize design styles, measurements & shop profile'}
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

      {/* Tabs Row - Bento Style Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5E5] pb-2">
        <button
          onClick={() => handleTabClick('design')}
          id="tab-design-templates"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'design'
              ? 'bg-[#D4AF37] text-[#1A1A1A] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.designTemplates}</span>
        </button>

        <button
          onClick={() => handleTabClick('measurements')}
          id="tab-measurement-settings"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'measurements'
              ? 'bg-[#D4AF37] text-[#1A1A1A] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>{t.measurementSettings}</span>
        </button>

        <button
          onClick={() => handleTabClick('shop')}
          id="tab-shop-profile"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'shop'
              ? 'bg-[#D4AF37] text-[#1A1A1A] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t.shopProfile}</span>
        </button>

        <button
          onClick={() => handleTabClick('backup')}
          id="tab-backup-restore"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-[#D4AF37] text-[#1A1A1A] font-black shadow-xs'
              : 'bg-white text-[#706E6B] hover:bg-[#F9F7F2] border border-[#E5E5E5]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{t.backupAndRestore}</span>
        </button>
      </div>

      {/* TAB 1: DESIGN TEMPLATES CUSTOMIZER */}
      {activeTab === 'design' && (
        <div className="space-y-6">
          {/* Add New Category Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
              <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.addCategory} (e.g. Embroidery / خامک، Pocket Flap...)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">دری (Dari)</label>
                <input
                  type="text"
                  value={newCatTitleFa}
                  onChange={e => setNewCatTitleFa(e.target.value)}
                  placeholder="مثال: نوعیت خامک / یخن بر"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">پښتو (Pashto)</label>
                <input
                  type="text"
                  value={newCatTitlePs}
                  onChange={e => setNewCatTitlePs(e.target.value)}
                  placeholder="مثال: د خامک ډول / د یخن پلنوالی"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#706E6B] uppercase tracking-wider mb-1">English</label>
                <input
                  type="text"
                  value={newCatTitleEn}
                  onChange={e => setNewCatTitleEn(e.target.value)}
                  placeholder="e.g. Embroidery Type"
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-[#D4AF37] text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                + {t.addCategory}
              </button>
            </div>
          </div>

          {/* Existing Categories & Options List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(category => {
              const catTitle = language === 'ps' 
                ? category.titlePs 
                : language === 'fa' 
                ? category.titleFa 
                : category.titleEn;

              const isEditingThisCategory = editingCategoryId === category.id;

              return (
                <div 
                  key={category.id}
                  className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xs p-5 space-y-3"
                >
                  {/* Category Header or Edit Form */}
                  {isEditingThisCategory ? (
                    <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#D4AF37]/50 space-y-2.5">
                      <div className="text-xs font-bold text-[#1A1A1A] flex items-center justify-between">
                        <span>{language === 'fa' ? 'ویرایش نام دسته' : language === 'ps' ? 'د کټګورۍ نوم سمول' : 'Edit Category Title'}</span>
                        <button
                          onClick={() => setEditingCategoryId(null)}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
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
                        <span>{language === 'fa' ? 'ویرایش طرح / نوعیت' : language === 'ps' ? 'د طرحې / ډول سمول' : 'Edit Design Option'}</span>
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

                  {/* Add Option to this Category */}
                  {addingOptionForCatId === category.id ? (
                    <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#E5E5E5] space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={newOptionNameFa}
                          onChange={e => setNewOptionNameFa(e.target.value)}
                          placeholder="دری (Dari)..."
                          className="px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs"
                        />
                        <input
                          type="text"
                          value={newOptionNamePs}
                          onChange={e => setNewOptionNamePs(e.target.value)}
                          placeholder="پښتو (Pashto)..."
                          className="px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs"
                        />
                        <input
                          type="text"
                          value={newOptionNameEn}
                          onChange={e => setNewOptionNameEn(e.target.value)}
                          placeholder="English..."
                          className="px-2 py-1 bg-white border border-[#E5E5E5] rounded text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAddingOptionForCatId(null)}
                          className="px-2.5 py-1 text-[#706E6B] hover:bg-stone-200 rounded"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddOptionToCategory(category.id)}
                          className="px-3 py-1 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] font-bold rounded"
                        >
                          {t.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingOptionForCatId(category.id)}
                      className="w-full py-1.5 bg-[#F9F7F2] hover:bg-stone-200 text-[#1A1A1A] font-bold rounded-xl text-xs border border-dashed border-[#E5E5E5] flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addOption}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MEASUREMENT FIELDS CUSTOMIZER */}
      {activeTab === 'measurements' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-[#1A1A1A]">
              {t.measurementSettings}
            </h3>
            <p className="text-xs text-[#706E6B] mt-0.5">
              {language === 'fa' ? 'فیلدهای اندازه‌گیری استاندارد و سفارشی خیاطی' : 'Standard and custom tailoring measurement fields'}
            </p>
          </div>

          {/* Add Field Box */}
          <div className="p-4 bg-[#F9F7F2] rounded-xl border border-[#E5E5E5] space-y-3">
            <h4 className="font-bold text-xs text-[#1A1A1A] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.addMeasurementField} (e.g. Wrist / مچ دست, Hip / باسن)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#706E6B] mb-1">Key (Code)</label>
                <input
                  type="text"
                  value={newFieldKey}
                  onChange={e => setNewFieldKey(e.target.value)}
                  placeholder="e.g. wrist, hip..."
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#706E6B] mb-1">دری (Dari)</label>
                <input
                  type="text"
                  value={newFieldFa}
                  onChange={e => setNewFieldFa(e.target.value)}
                  placeholder="مثال: مچ دست"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#706E6B] mb-1">پښتو (Pashto)</label>
                <input
                  type="text"
                  value={newFieldPs}
                  onChange={e => setNewFieldPs(e.target.value)}
                  placeholder="مثال: د لاس مچ"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#706E6B] mb-1">English</label>
                <input
                  type="text"
                  value={newFieldEn}
                  onChange={e => setNewFieldEn(e.target.value)}
                  placeholder="e.g. Wrist"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddField}
                className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-black text-[#D4AF37] text-xs font-bold rounded-lg transition cursor-pointer"
              >
                + {t.addMeasurementField}
              </button>
            </div>
          </div>

          {/* Current Measurement Fields List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {fields.map(f => (
              <div 
                key={f.id}
                className="p-3 bg-[#F9F7F2] rounded-xl border border-[#E5E5E5] flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[#1A1A1A] block">
                    {language === 'ps' ? f.labelPs : language === 'fa' ? f.labelFa : f.labelEn}
                  </span>
                  <span className="text-[10px] text-[#706E6B] font-mono">key: {f.key}</span>
                </div>
                {!f.isStandard && (
                  <button
                    onClick={() => handleDeleteField(f.id)}
                    className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SHOP PROFILE & RECEIPT SETTINGS */}
      {activeTab === 'shop' && (
        <form onSubmit={handleSaveShopSettings} className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-6">
          <div className="border-b border-[#E5E5E5] pb-3">
            <h3 className="font-bold text-sm text-[#1A1A1A]">
              {t.shopProfile}
            </h3>
            <p className="text-xs text-[#706E6B] mt-0.5">
              {language === 'fa' ? 'اطلاعاتی که در سربرگ بل و رسیدهای چاپ شده درج می‌شوند' : 'Details displayed on printed receipts and PDF slips'}
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
                placeholder="0793710008"
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-mono"
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
                placeholder="0780000000"
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
                placeholder="0782207308"
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {/* Shop Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Receipt Footer & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.receiptFooter}
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
                {t.currency}
              </label>
              <input
                type="text"
                value={shop.currencyFa}
                onChange={e => setShop({ ...shop, currencyFa: e.target.value, currencyPs: e.target.value })}
                placeholder="افغانی / AFN"
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold"
              />
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

      {/* TAB 4: BACKUP & RESTORE */}
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
                  {language === 'fa' ? 'یک نسخه کامل از تمام سفارشات، مشتریان و تنظیمات دانلود کنید.' : 'Download complete JSON database backup.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-[#1A1A1A] hover:bg-black text-[#D4AF37] font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {t.exportBackup}
              </button>
            </div>

            {/* Import Backup */}
            <div className="p-5 bg-[#F9F7F2] rounded-2xl border border-[#E5E5E5] space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-[#1A1A1A] flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>{t.importBackup}</span>
                </h4>
                <p className="text-[11px] text-[#706E6B] mt-1">
                  {language === 'fa' ? 'فایل پشتیبان قبلی را برای بازگردانی اطلاعات انتخاب کنید.' : 'Restore previous JSON database backup.'}
                </p>
              </div>

              <label className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition cursor-pointer text-center block">
                <span>{t.importBackup}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset to Demo */}
            <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-rose-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <span>{t.resetDemoData}</span>
                </h4>
                <p className="text-[11px] text-rose-700/80 mt-1">
                  {language === 'fa' ? 'بازگردانی اطلاعات به نمونه اولیه (فرهاد، شکیل خان، عطا الله).' : 'Reset to initial sample orders and receipts.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetToDemo}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {t.resetDemoData}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
