import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  CaseItem,
  CategoryKey,
  CategoryInfo,
  CaseStatus,
  CaseDocument,
  ColumnDefinition,
  GoogleSheetsSyncConfig,
  AuditLogEntry,
  AuditFieldDiff,
} from '../types/schema.ts';
import { INITIAL_CASES } from '../data/mockData.ts';
import { CATEGORIES, CATEGORY_MAP } from '../data/categories.ts';
import {
  getInitialColumnsForCategory,
  getDefaultPageColumns,
  CONTRACTS_COLUMNS,
  NOTICES_COLUMNS,
  POLICE_REPORTS_COLUMNS,
  EXECUTIONS_COLUMNS,
  COURT_ROLL_COLUMNS,
  STANDARD_CASE_COLUMNS,
} from '../data/pageSchemas.tsx';
import { COURT_ROLL_CASES } from '../data/courtRollData.ts';
import { Language, translations, TranslationKey } from '../i18n/translations.ts';
import {
  INITIAL_AUDIT_LOGS,
  computeRecordDiffs,
  buildDiffSummary,
  getFieldLabel,
  exportAuditLogsToExcel,
} from '../utils/auditLogger.ts';
import { useAuth } from './AuthContext.tsx';

export type ActiveTab = 'dashboard' | 'cases' | 'calendar' | 'users' | 'settings' | 'audit_log';
export type ViewMode = 'table' | 'board';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface FirmDetails {
  nameAr: string;
  nameEn: string;
  regNo: string;
  taxNo: string;
  phone: string;
  address: string;
}

interface AppContextType {
  // Localization & Theme
  lang: Language;
  setLang: (lang: Language) => void;
  isRtl: boolean;
  t: (key: TranslationKey) => string;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Firm Details & Logo
  firmLogo: string | null;
  setFirmLogo: (logo: string | null) => void;
  firmDetails: FirmDetails;
  updateFirmDetails: (details: Partial<FirmDetails>) => void;

  // Navigation & Workspace Categories (Dynamic Pages)
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  categories: CategoryInfo[];
  selectedCategory: CategoryKey | null;
  setSelectedCategory: (cat: CategoryKey | null) => void;
  createCategory: (newCategory: CategoryInfo, initialCols?: ColumnDefinition[]) => void;
  deleteCategory: (catId: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Dynamic Column Engine
  pageColumns: Record<string, ColumnDefinition[]>;
  getActiveColumns: () => ColumnDefinition[];
  reorderColumns: (categoryId: string, fromIndex: number, toIndex: number) => void;
  renameColumn: (categoryId: string, columnId: string, nameAr: string, nameEn: string) => void;
  addColumn: (categoryId: string, column: ColumnDefinition) => void;
  updateColumn: (categoryId: string, columnId: string, updates: Partial<ColumnDefinition>) => void;
  deleteColumn: (categoryId: string, columnId: string) => void;
  revertToDefaultColumns: (categoryId?: string) => void;
  copiedColumn: ColumnDefinition | null;
  copyColumn: (column: ColumnDefinition) => void;
  pasteColumn: (targetCategoryId?: string) => void;

  // Dynamic Cases State & Rows CRUD
  cases: CaseItem[];
  addCase: (caseData: Omit<CaseItem, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void;
  bulkAddCases: (newRows: Partial<CaseItem>[]) => Promise<void>;
  insertRow: (categoryId?: string, initialData?: Partial<CaseItem>) => string;
  updateCase: (id: string, updates: Partial<CaseItem>) => void;
  updateCaseField: (id: string, field: string, value: any) => void;
  deleteCase: (id: string) => void;
  clearAllCases: () => void;
  addDocumentToCase: (caseId: string, doc: Omit<CaseDocument, 'id' | 'uploadedAt'>) => void;
  resetToInitialData: () => void;

  // Google Sheets Integration
  googleSheetsConfig: GoogleSheetsSyncConfig;
  updateGoogleSheetsConfig: (cfg: Partial<GoogleSheetsSyncConfig>) => void;
  syncToGoogleSheets: (targetCategoryId?: string) => Promise<boolean>;

  // Filters & Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: CaseStatus | 'all';
  setStatusFilter: (status: CaseStatus | 'all') => void;
  courtFilter: string;
  setCourtFilter: (court: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (assigneeId: string) => void;
  filterAssignedToMe: boolean;
  setFilterAssignedToMe: (val: boolean) => void;
  filterUrgentOnly: boolean;
  setFilterUrgentOnly: (val: boolean) => void;
  filterExpertOnly: boolean;
  setFilterExpertOnly: (val: boolean) => void;
  resetAllFilters: () => void;

  // Modal / Drawer state
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  isNewPageModalOpen: boolean;
  setIsNewPageModalOpen: (open: boolean) => void;
  isAddColumnModalOpen: boolean;
  setIsAddColumnModalOpen: (open: boolean) => void;
  isGoogleSheetsModalOpen: boolean;
  setIsGoogleSheetsModalOpen: (open: boolean) => void;

  // Toast notifications
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // Centralized Audit Log & Activity Tracking
  auditLogs: AuditLogEntry[];
  recordAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  clearAuditLogs: () => void;
  exportAuditLogs: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language state
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('elite_jurist_lang') as Language) || 'ar';
  });

  const isRtl = lang === 'ar';

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('elite_jurist_lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || key;
  };

  // 2. Theme state (Light / Dark)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('elite_jurist_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  const applyThemeToDOM = (tMode: 'light' | 'dark') => {
    localStorage.setItem('elite_jurist_theme', tMode);
    if (tMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
      if (document.body) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      }
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
      if (document.body) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      }
      document.documentElement.style.colorScheme = 'light';
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      applyThemeToDOM(nextTheme);
      return nextTheme;
    });
  };

  // Firm Logo State
  const [firmLogo, setFirmLogoState] = useState<string | null>(() => {
    return localStorage.getItem('elite_jurist_firm_logo') || null;
  });

  const setFirmLogo = (logo: string | null) => {
    setFirmLogoState(logo);
    if (logo) {
      localStorage.setItem('elite_jurist_firm_logo', logo);
    } else {
      localStorage.removeItem('elite_jurist_firm_logo');
    }
  };

  // Firm Details State
  const [firmDetails, setFirmDetails] = useState<FirmDetails>(() => {
    const saved = localStorage.getItem('elite_jurist_firm_details');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      nameAr: 'مكتب النخبة للمحاماة والاستشارات القانونية',
      nameEn: 'Elite Jurist Advocates & Legal Consultants',
      regNo: 'CN-1094829',
      taxNo: '100294819200003',
      phone: '+971 4 234 5678',
      address: 'دبي، الخليج التجاري، برج أوبال، الطابق 14',
    };
  });

  const updateFirmDetails = (details: Partial<FirmDetails>) => {
    setFirmDetails((prev) => {
      const next = { ...prev, ...details };
      localStorage.setItem('elite_jurist_firm_details', JSON.stringify(next));
      return next;
    });
  };

  // Auth User context for audit tracking
  const { currentUser } = useAuth();

  // Centralized Audit Log & Activity Tracking
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('elite_jurist_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse audit logs:', e);
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    localStorage.setItem('elite_jurist_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const recordAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    localStorage.removeItem('elite_jurist_audit_logs');
    showToast(isRtl ? 'تم تفريغ سجل النشاطات بنجاح' : 'Audit log cleared successfully', 'info');
  };

  const exportAuditLogs = () => {
    exportAuditLogsToExcel(auditLogs, isRtl);
    showToast(isRtl ? 'تم تصدير سجل النشاطات إلى Excel بنجاح' : 'Audit log exported to Excel', 'success');
  };

  // 3. Dynamic Categories / Workspaces State
  const [categories, setCategories] = useState<CategoryInfo[]>(() => {
    const saved = localStorage.getItem('elite_jurist_categories');
    if (saved) {
      try {
        const parsed: CategoryInfo[] = JSON.parse(saved);
        if (!parsed.some((c) => c.id === 'court_roll')) {
          const courtRollCat = CATEGORIES.find((c) => c.id === 'court_roll');
          if (courtRollCat) parsed.unshift(courtRollCat);
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('elite_jurist_categories', JSON.stringify(categories));
  }, [categories]);

  // 4. Dynamic Column Definitions per Page/Category - strictly enforced schemas
  const [pageColumns, setPageColumns] = useState<Record<string, ColumnDefinition[]>>(() => {
    const isEnforced = localStorage.getItem('elite_jurist_columns_enforced_v12') === 'true';
    if (!isEnforced) {
      localStorage.setItem('elite_jurist_columns_enforced_v12', 'true');
      const defaults = getDefaultPageColumns();
      localStorage.setItem('elite_jurist_page_columns', JSON.stringify(defaults));
      return defaults;
    }
    const saved = localStorage.getItem('elite_jurist_page_columns');
    if (saved) {
      try {
        const parsed: Record<string, ColumnDefinition[]> = JSON.parse(saved);
        const defaults = getDefaultPageColumns();
        return { ...defaults, ...parsed };
      } catch (e) {
        console.error(e);
      }
    }
    return getDefaultPageColumns();
  });

  useEffect(() => {
    localStorage.setItem('elite_jurist_page_columns', JSON.stringify(pageColumns));
  }, [pageColumns]);

  // 5. Navigation & Workspace View
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // 6. Cases Persistent Store (Restored with all case records across all categories)
  const [cases, setCases] = useState<CaseItem[]>(() => {
    const isRestored = localStorage.getItem('elite_jurist_data_restored_v11') === 'true';
    if (!isRestored) {
      localStorage.setItem('elite_jurist_data_restored_v11', 'true');
      localStorage.removeItem('elite_jurist_cleared_all_records_v1');
      localStorage.setItem('elite_jurist_cases', JSON.stringify(INITIAL_CASES));
      return INITIAL_CASES;
    }
    const saved = localStorage.getItem('elite_jurist_cases');
    if (saved) {
      try {
        const parsed: CaseItem[] = JSON.parse(saved);
        if (parsed.length === 0) {
          localStorage.setItem('elite_jurist_cases', JSON.stringify(INITIAL_CASES));
          return INITIAL_CASES;
        }
        return parsed.map((c) => ({
          ...c,
          assigneeId: c.assigneeId || c.customFields?.assigneeId || 'user_admin',
        }));
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CASES;
  });

  useEffect(() => {
    localStorage.setItem('elite_jurist_cases', JSON.stringify(cases));
  }, [cases]);

  // 7. Google Sheets Sync State
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsSyncConfig>(() => {
    const saved = localStorage.getItem('elite_jurist_sheets_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      sheetName: 'Elite_LawFirm_Sync',
      autoSync: true,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };
  });

  useEffect(() => {
    localStorage.setItem('elite_jurist_sheets_config', JSON.stringify(googleSheetsConfig));
  }, [googleSheetsConfig]);

  const updateGoogleSheetsConfig = (cfg: Partial<GoogleSheetsSyncConfig>) => {
    setGoogleSheetsConfig((prev) => ({ ...prev, ...cfg }));
    showToast(isRtl ? 'تم تحديث إعدادات Google Sheets' : 'Google Sheets configuration updated', 'success');
  };

  // 8. Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  // Helper to get active columns for current page
  const getActiveColumns = (): ColumnDefinition[] => {
    const key = selectedCategory || 'all';
    if (pageColumns[key]) {
      return pageColumns[key];
    }
    return getInitialColumnsForCategory(key);
  };

  // Reorder columns (available to all users)
  const reorderColumns = (catId: string, fromIndex: number, toIndex: number) => {
    const key = catId || selectedCategory || 'all';
    const current = pageColumns[key] ? [...pageColumns[key]] : [...getInitialColumnsForCategory(key)];
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);

    setPageColumns((prev) => {
      const next = { ...prev, [key]: current };
      localStorage.setItem('elite_jurist_page_columns', JSON.stringify(next));
      return next;
    });
    showToast(isRtl ? 'تم إعادة ترتيب الأعمدة بنجاح' : 'Columns reordered successfully', 'info');
  };

  // Rename column (Admin editable headers)
  const renameColumn = (catId: string, columnId: string, nameAr: string, nameEn: string) => {
    const key = catId || selectedCategory || 'all';
    const current = pageColumns[key] ? [...pageColumns[key]] : [...getInitialColumnsForCategory(key)];
    const updated = current.map((c) =>
      c.id === columnId ? { ...c, nameAr, nameEn } : c
    );

    setPageColumns((prev) => {
      const next = { ...prev, [key]: updated };
      localStorage.setItem('elite_jurist_page_columns', JSON.stringify(next));
      return next;
    });
    showToast(isRtl ? 'تم تعديل اسم العمود بنجاح' : 'Column renamed successfully', 'success');
  };

  // Add new dynamic column
  const addColumn = (catId: string, column: ColumnDefinition) => {
    const key = catId || selectedCategory || 'all';
    const current = pageColumns[key] ? [...pageColumns[key]] : [...getInitialColumnsForCategory(key)];
    const finalId = column.id || `col_${Date.now()}`;
    const newCol: ColumnDefinition = {
      ...column,
      id: finalId,
    };

    setPageColumns((prev) => {
      const next = { ...prev, [key]: [...current, newCol] };
      localStorage.setItem('elite_jurist_page_columns', JSON.stringify(next));
      return next;
    });
    showToast(isRtl ? 'تم إضافة العمود الجديد بنجاح' : 'New column added successfully', 'success');
  };

  // Update dynamic column properties (name, type, options, etc.)
  const updateColumn = (catId: string, columnId: string, updates: Partial<ColumnDefinition>) => {
    const key = catId || selectedCategory || 'all';
    const current = pageColumns[key] ? [...pageColumns[key]] : [...getInitialColumnsForCategory(key)];
    const updated = current.map((c) => (c.id === columnId ? { ...c, ...updates } : c));
    setPageColumns((prev) => {
      const next = { ...prev, [key]: updated };
      localStorage.setItem('elite_jurist_page_columns', JSON.stringify(next));
      return next;
    });
    showToast(isRtl ? 'تم حفظ تعديلات العمود بنجاح' : 'Column settings updated successfully', 'success');
  };

  // Copied Column State for Cross-Page Column Cloning (Copy/Paste Columns)
  const [copiedColumn, setCopiedColumn] = useState<ColumnDefinition | null>(() => {
    const saved = localStorage.getItem('elite_jurist_copied_column');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse copied column:', e);
      }
    }
    return null;
  });

  const copyColumn = (column: ColumnDefinition) => {
    setCopiedColumn(column);
    localStorage.setItem('elite_jurist_copied_column', JSON.stringify(column));
    showToast(
      isRtl
        ? `تم نسخ إعدادات عامود "${column.nameAr}" بنجاح! يمكنك الآن لصقه في أي صفحة`
        : `Copied column "${column.nameEn || column.nameAr}" to clipboard`,
      'info'
    );
  };

  const pasteColumn = (targetCatId?: string) => {
    if (!copiedColumn) {
      showToast(isRtl ? 'لا يوجد عامود منسوخ للصقه، يرجى نسخ عامود أولاً' : 'No column in clipboard to paste', 'error');
      return;
    }
    const key = targetCatId || selectedCategory || 'all';
    const current = pageColumns[key] ? [...pageColumns[key]] : [...getInitialColumnsForCategory(key)];
    const newColId = `col_${Date.now()}`;
    const newCol: ColumnDefinition = {
      ...copiedColumn,
      id: newColId,
      isSystem: false,
    };
    setPageColumns((prev) => {
      const next = { ...prev, [key]: [...current, newCol] };
      localStorage.setItem('elite_jurist_page_columns', JSON.stringify(next));
      return next;
    });
    showToast(
      isRtl
        ? `تم لصق وإضافة عامود "${newCol.nameAr}" بنجاح إلى هذا الجدول`
        : `Pasted column "${newCol.nameEn || newCol.nameAr}" successfully`,
      'success'
    );
  };

  // Delete dynamic column
  const deleteColumn = (catId: string, columnId: string) => {
    const key = catId || selectedCategory || 'all';
    const current = pageColumns[key] ? [...pageColumns[key]] : [...getInitialColumnsForCategory(key)];
    const updated = current.filter(
      (c) => c.id !== columnId && (c as any).accessorKey !== columnId
    );

    setPageColumns((prev) => {
      const next = {
        ...prev,
        [key]: updated,
      };
      localStorage.setItem('elite_jurist_page_columns', JSON.stringify(next));
      return next;
    });

    recordAuditLog({
      actionType: 'DELETE',
      userName: currentUser?.name || (isRtl ? 'المدير' : 'Admin'),
      userEmail: currentUser?.email || 'admin@elitejurist.ae',
      userRole: currentUser?.role || 'admin',
      targetRecordId: columnId,
      targetRecordIdentifier: columnId,
      targetCategoryName: key,
      changeSummaryAr: `تم حذف عامود "${columnId}" من جدول ${key}`,
      changeSummaryEn: `Deleted column "${columnId}" from table ${key}`,
      diffs: [],
    });

    showToast(isRtl ? 'تم حذف العامود بنجاح' : 'Column deleted successfully', 'info');
  };

  // Revert column headers to enforced default schemas
  const revertToDefaultColumns = (catId?: string) => {
    if (catId && catId !== 'all') {
      const defaultCols = getInitialColumnsForCategory(catId);
      setPageColumns((prev) => ({
        ...prev,
        [catId]: defaultCols,
      }));
      showToast(
        isRtl
          ? 'تمت استعادة الأعمدة الافتراضية المعتمدة لهذا القسم بنجاح'
          : 'Default headers restored for this section',
        'success'
      );
    } else {
      const defaults = getDefaultPageColumns();
      setPageColumns(defaults);
      showToast(
        isRtl
          ? 'تمت استعادة كافة الأعمدة الافتراضية للنظام بنجاح'
          : 'All default table headers restored',
        'success'
      );
    }
  };

  // Create New Page / Category
  const createCategory = (newCat: CategoryInfo, initialCols?: ColumnDefinition[]) => {
    setCategories((prev) => [...prev, newCat]);
    if (initialCols && initialCols.length > 0) {
      setPageColumns((prev) => ({
        ...prev,
        [newCat.id]: initialCols,
      }));
    }
    setActiveTab('cases');
    setSelectedCategory(newCat.id);
    showToast(
      isRtl ? `تم إنشاء قسم "${newCat.nameAr}" بنجاح` : `Page "${newCat.nameEn}" created successfully`,
      'success'
    );
  };

  const deleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    if (selectedCategory === catId) {
      setSelectedCategory(null);
    }
    showToast(isRtl ? 'تم حذف القسم' : 'Page deleted', 'info');
  };

  // Dynamic Row Insertion
  const insertRow = (targetCatId?: string, initialData?: Partial<CaseItem>): string => {
    const catId = targetCatId || selectedCategory || 'elite_opposition';
    const newId = `case_${Date.now()}`;
    const now = new Date().toISOString().split('T')[0];

    // Build default fields matching category schema
    const defaultCustomFields: Record<string, any> = {};
    if (catId === 'contracts') {
      defaultCustomFields.contractName = 'عقد تجاري جديد';
      defaultCustomFields.partyOne = 'الطرف الأول';
      defaultCustomFields.partyTwo = 'الطرف الثاني';
      defaultCustomFields.pageCount = 10;
      defaultCustomFields.action = 'صياغة المسودة';
      defaultCustomFields.contractStatus = 'قيد المراجعة';
      defaultCustomFields.notes = '';
    } else if (catId === 'legal_notices') {
      defaultCustomFields.noticeDate = now;
      defaultCustomFields.sender = 'الموكل (المنذر)';
      defaultCustomFields.recipient = 'المنذر إليه';
      defaultCustomFields.servedDate = '';
      defaultCustomFields.servedResult = 'قيد المتابعة لدى الكاتب العدل';
      defaultCustomFields.notes = '';
    } else if (catId === 'criminal_reports') {
      defaultCustomFields.complaintNumber = `2024/${Math.floor(1000 + Math.random() * 9000)}`;
      defaultCustomFields.complaintStatus = 'قيد التحقيق بالمركز';
      defaultCustomFields.reportNumber = '';
      defaultCustomFields.reportStatus = 'قيد البحث والتحري';
      defaultCustomFields.parties = 'الشاكي ضد المشكو في حقه';
      defaultCustomFields.policeStation = 'مركز شرطة بر دبي';
      defaultCustomFields.criminalCaseNumber = '';
      defaultCustomFields.caseStatus = 'مفتوح';
      defaultCustomFields.sessionDate = '';
      defaultCustomFields.courtDecision = '';
      defaultCustomFields.requiredAction = 'استيفاء الأقوال';
      defaultCustomFields.notes = '';
    } else if (catId === 'executions') {
      defaultCustomFields.lastActionDate = now;
      defaultCustomFields.executionAmount = 100000;
      defaultCustomFields.depositStatus = 'لم يتم الإيداع بعد';
      defaultCustomFields.transferredAmount = 0;
      defaultCustomFields.notes = '';
    } else if (catId === 'court_roll') {
      const rollCount = cases.filter((c) => c.categoryId === 'court_roll').length;
      defaultCustomFields.serialNumber = rollCount + 1;
      defaultCustomFields.caseNumberAndType = `2026/${Math.floor(1000 + Math.random() * 9000)} تجاري`;
      defaultCustomFields.judicialCircuit = isRtl ? 'الدائرة الكلية التجارية' : 'Commercial Circuit';
      defaultCustomFields.hallAndTime = isRtl ? 'الساعة 09:30 ص' : '09:30 AM';
      defaultCustomFields.clientAndCapacity = isRtl ? 'ذا ايليت كارز انترناشيونال' : 'The Elite Cars';
      defaultCustomFields.opponentAndCapacity = isRtl ? 'الطرف الخصم' : 'Opponent Party';
      defaultCustomFields.previousDecision = isRtl ? 'اول جلسة' : 'First hearing';
      defaultCustomFields.sessionRequests = '';
      defaultCustomFields.sessionDate = now;
    } else if (catId === 'commercial_licenses') {
      defaultCustomFields.tradeName = isRtl ? 'شركة تجارية جديدة' : 'New Commercial Company';
      defaultCustomFields.tradeName2 = 'New Commercial Co. LLC';
      defaultCustomFields.legalForm = 'ذ.م.م (شركة ذات مسؤولية محدودة)';
      defaultCustomFields.licenseNumber = `CN-${Math.floor(100000 + Math.random() * 900000)}`;
      defaultCustomFields.establishmentDate = now;
      defaultCustomFields.issueDate = now;
      defaultCustomFields.expiryDate = `${new Date().getFullYear() + 1}-${now.split('-')[1]}-${now.split('-')[2]}`;
      defaultCustomFields.emirate = 'دبي';
      defaultCustomFields.notes = '';
    } else if (catId === 'tenancy_contracts') {
      defaultCustomFields.unit = isRtl ? 'مكتب تجاري رقم 102' : 'Commercial Office 102';
      defaultCustomFields.phone = '+971 50 123 4567';
      defaultCustomFields.lessor = isRtl ? 'شركة العقارات العالمية' : 'Global Real Estate LLC';
      defaultCustomFields.contractStart = now;
      defaultCustomFields.contractEnd = `${new Date().getFullYear() + 1}-${now.split('-')[1]}-${now.split('-')[2]}`;
      defaultCustomFields.contractRemaining = isRtl ? 'سنة واحدة' : '1 Year';
      defaultCustomFields.rentAmount = 120000;
      defaultCustomFields.email = 'info@estate.ae';
      defaultCustomFields.contractNumber = `EJARI-${Date.now().toString().slice(-6)}`;
      defaultCustomFields.dewaNumber = '0291827364';
      defaultCustomFields.plotNumber = '102-450';
      defaultCustomFields.municipalityNumber = 'MUN-DXB-102';
      defaultCustomFields.sqMeters = 150;
      defaultCustomFields.sqFeet = 1614;
      defaultCustomFields.unitType = 'مكتبي';
      defaultCustomFields.area = isRtl ? 'الخليج التجاري' : 'Business Bay';
      defaultCustomFields.emirate = 'دبي';
      defaultCustomFields.license = 'CN-890123';
      defaultCustomFields.notes = '';
    } else if (catId === 'powers_of_attorney') {
      defaultCustomFields.agent = currentUser ? (isRtl ? currentUser.name : currentUser.nameEn) : 'المستشار / محمد العتيبي';
      defaultCustomFields.principal = isRtl ? 'الموكل الجديد' : 'New Client';
      defaultCustomFields.poaPurpose = isRtl ? 'وكالة قضائية عامة للترافع والتمثيل' : 'General Litigation POA';
      defaultCustomFields.poaDate = now;
      defaultCustomFields.poaFile = `POA-${Date.now().toString().slice(-4)}.pdf`;
      defaultCustomFields.notes = '';
    }

    // Populate any custom columns added by user/admin to this page
    const currentCols = pageColumns[catId] || [];
    currentCols.forEach((col) => {
      if (defaultCustomFields[col.id] === undefined) {
        defaultCustomFields[col.id] = col.defaultValue ?? (col.type === 'number' ? 0 : '');
      }
    });

    const newCase: CaseItem = {
      id: newId,
      caseNumber: `2024/${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: catId,
      clientName: isRtl ? 'موكل جديد' : 'New Client',
      opponentName: isRtl ? 'الطرف الخصم' : 'Opponent Party',
      assigneeId: 'user_admin',
      caseType: isRtl ? 'دعوى / إجراء' : 'Procedure',
      court: 'محاكم دبي',
      sessionDate: now,
      lastAction: isRtl ? 'تم إدراج الصف حديثاً' : 'Row newly inserted',
      nextStep: isRtl ? 'استكمال البيانات والمستندات' : 'Complete details',
      status: 'under_review',
      priority: 'normal',
      documents: [],
      history: [
        {
          id: `h_${Date.now()}`,
          action: 'تم إدراج السجل في جدول البيانات',
          actionEn: 'Row inserted in dynamic table',
          performedBy: currentUser?.name || 'النظام',
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      customFields: { ...defaultCustomFields, ...(initialData?.customFields || {}) },
      ...initialData,
    };

    setCases((prev) => [newCase, ...prev]);

    // Record Centralized Audit Log
    const userDisplay = currentUser?.name || (isRtl ? 'المستشار / محمد المهيري' : 'Mohamed Al-Muhairi');
    const userEmail = currentUser?.email || 'bodemohamed5544@gmail.com';
    const userRole = currentUser?.role || 'admin';
    const catName = CATEGORY_MAP.get(catId)?.nameAr || (isRtl ? 'عام' : 'General');
    recordAuditLog({
      actionType: 'CREATE',
      userName: userDisplay,
      userEmail,
      userRole,
      targetRecordId: newId,
      targetRecordIdentifier: `${newCase.caseNumber} - ${newCase.clientName}`,
      targetCategoryName: catName,
      changeSummaryAr: `تم إدراج سطر جديد في جدول "${catName}": (${newCase.caseNumber} - ${newCase.clientName})`,
      changeSummaryEn: `Inserted new row in "${CATEGORY_MAP.get(catId)?.nameEn || 'General'}": (${newCase.caseNumber} - ${newCase.clientName})`,
      diffs: [],
    });

    showToast(isRtl ? 'تم إدراج سطر جديد في الجدول بنجاح' : 'New row successfully inserted', 'success');
    return newId;
  };

  const addCase = (caseData: Omit<CaseItem, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => {
    const now = new Date().toISOString().split('T')[0];
    const userDisplay = currentUser?.name || (isRtl ? 'المستشار / محمد المهيري' : 'Mohamed Al-Muhairi');
    const userEmail = currentUser?.email || 'bodemohamed5544@gmail.com';
    const userRole = currentUser?.role || 'admin';

    const newCase: CaseItem = {
      ...caseData,
      id: `case_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `h_${Date.now()}`,
          action: 'تم قيد ملف الدعوى في النظام',
          actionEn: 'Case registered into the system',
          performedBy: `${userDisplay} (${userEmail})`,
          timestamp: now,
        },
      ],
    };

    setCases((prev) => [newCase, ...prev]);

    // Record Centralized Audit Log
    const catName = CATEGORY_MAP.get(newCase.categoryId)?.nameAr || (isRtl ? 'عام' : 'General');
    recordAuditLog({
      actionType: 'CREATE',
      userName: userDisplay,
      userEmail,
      userRole,
      targetRecordId: newCase.id,
      targetRecordIdentifier: `${newCase.caseNumber} - ${newCase.clientName}`,
      targetCategoryName: catName,
      changeSummaryAr: `تم قيد ملف دعوى جديد في النظام: (${newCase.caseNumber} - ${newCase.clientName})`,
      changeSummaryEn: `Registered new case in system: (${newCase.caseNumber} - ${newCase.clientName})`,
      diffs: [],
    });

    showToast(isRtl ? 'تم إضافة ملف القضية بنجاح' : 'Case successfully created', 'success');
  };

  const bulkAddCases = async (newRows: Partial<CaseItem>[]) => {
    const now = new Date().toISOString().split('T')[0];
    const userDisplay = currentUser?.name || (isRtl ? 'المستشار / محمد المهيري' : 'Mohamed Al-Muhairi');
    const userEmail = currentUser?.email || 'bodemohamed5544@gmail.com';
    const userRole = currentUser?.role || 'admin';

    const createdCases: CaseItem[] = newRows.map((row, idx) => {
      const newId = `case_import_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: newId,
        caseNumber: row.caseNumber || `2024/${Math.floor(1000 + Math.random() * 9000)}`,
        categoryId: row.categoryId || selectedCategory || 'all',
        clientName: row.clientName || (isRtl ? 'موكل جديد' : 'New Client'),
        opponentName: row.opponentName || (isRtl ? 'الخصم' : 'Opponent'),
        assigneeId: row.assigneeId || 'user_admin',
        caseType: row.caseType || 'تجاري كلي',
        court: row.court || 'محاكم دبي',
        sessionDate: row.sessionDate || now,
        lastAction: row.lastAction || (isRtl ? 'تم الاستيراد من ملف Excel' : 'Imported from Excel file'),
        nextStep: row.nextStep || (isRtl ? 'متابعة الإجراء' : 'Follow up'),
        status: row.status || 'under_review',
        priority: row.priority || 'normal',
        claimAmount: row.claimAmount,
        notes: row.notes || '',
        documents: [],
        history: [
          {
            id: `h_${Date.now()}_${idx}`,
            action: 'تم استيراد السجل مجمّعاً من ملف Excel',
            actionEn: 'Batch imported from Excel workbook',
            performedBy: `${userDisplay} (${userEmail})`,
            timestamp: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
        customFields: row.customFields || {},
      };
    });

    setCases((prev) => [...createdCases, ...prev]);

    // Record Centralized Audit Log
    recordAuditLog({
      actionType: 'CREATE',
      userName: userDisplay,
      userEmail,
      userRole,
      targetRecordId: `bulk_import_${Date.now()}`,
      targetRecordIdentifier: `${createdCases.length} سجلات (استيراد مجمّع Excel)`,
      targetCategoryName: isRtl ? 'استيراد بيانات' : 'Bulk Import',
      changeSummaryAr: `تم استيراد ${createdCases.length} سجل بنجاح من ملف Excel دفعة واحدة`,
      changeSummaryEn: `Imported ${createdCases.length} records in bulk from Excel`,
      diffs: [],
    });
  };

  const updateCase = (id: string, updates: Partial<CaseItem>) => {
    const now = new Date().toISOString().split('T')[0];
    const userDisplay = currentUser?.name || (isRtl ? 'المستشار / محمد المهيري' : 'Mohamed Al-Muhairi');
    const userEmail = currentUser?.email || 'bodemohamed5544@gmail.com';
    const userRole = currentUser?.role || 'admin';

    setCases((prev) => {
      const existingCase = prev.find((c) => c.id === id);
      if (existingCase) {
        const diffs = computeRecordDiffs(existingCase, updates, pageColumns);
        if (diffs.length > 0) {
          const summaries = buildDiffSummary(diffs, isRtl);
          recordAuditLog({
            actionType: 'UPDATE',
            userName: userDisplay,
            userEmail,
            userRole,
            targetRecordId: id,
            targetRecordIdentifier: `${existingCase.caseNumber} - ${existingCase.clientName}`,
            targetCategoryName: CATEGORY_MAP.get(existingCase.categoryId)?.nameAr || (isRtl ? 'عام' : 'General'),
            changeSummaryAr: summaries.ar,
            changeSummaryEn: summaries.en,
            diffs,
          });
        }
      }

      return prev.map((c) => {
        if (c.id === id) {
          const updatedHistory = [...(c.history || [])];
          const diffs = computeRecordDiffs(c, updates, pageColumns);
          if (diffs.length > 0) {
            const summaries = buildDiffSummary(diffs, isRtl);
            updatedHistory.unshift({
              id: `h_${Date.now()}`,
              action: summaries.ar,
              actionEn: summaries.en,
              performedBy: `${userDisplay} (${userEmail})`,
              timestamp: new Date().toLocaleString(isRtl ? 'ar-AE' : 'en-GB'),
            });
          }

          return {
            ...c,
            ...updates,
            customFields: {
              ...(c.customFields || {}),
              ...(updates.customFields || {}),
            },
            updatedAt: now,
            history: updatedHistory,
          };
        }
        return c;
      });
    });
  };

  // Quick field update for inline cell edits
  const updateCaseField = (id: string, field: string, value: any) => {
    const now = new Date().toISOString().split('T')[0];
    const userDisplay = currentUser?.name || (isRtl ? 'المستشار / محمد المهيري' : 'Mohamed Al-Muhairi');
    const userEmail = currentUser?.email || 'bodemohamed5544@gmail.com';
    const userRole = currentUser?.role || 'admin';

    setCases((prev) => {
      const existingCase = prev.find((c) => c.id === id);
      if (existingCase) {
        const oldVal = (existingCase as any)[field] ?? existingCase.customFields?.[field];
        if (oldVal !== value) {
          const label = getFieldLabel(field, existingCase.categoryId, pageColumns);
          const diff: AuditFieldDiff = {
            field,
            fieldLabelAr: label.ar,
            fieldLabelEn: label.en,
            oldValue: oldVal,
            newValue: value,
          };
          const summaries = buildDiffSummary([diff], isRtl);
          recordAuditLog({
            actionType: 'UPDATE',
            userName: userDisplay,
            userEmail,
            userRole,
            targetRecordId: id,
            targetRecordIdentifier: `${existingCase.caseNumber} - ${existingCase.clientName}`,
            targetCategoryName: CATEGORY_MAP.get(existingCase.categoryId)?.nameAr || (isRtl ? 'عام' : 'General'),
            changeSummaryAr: summaries.ar,
            changeSummaryEn: summaries.en,
            diffs: [diff],
          });
        }
      }

      return prev.map((c) => {
        if (c.id === id) {
          const isAssignee =
            field === 'assigneeId' ||
            field === 'assignee' ||
            field === 'الشخص المسؤول';

          const label = getFieldLabel(field, c.categoryId, pageColumns);
          const oldVal = (c as any)[field] ?? c.customFields?.[field];
          const updatedHistory = [...(c.history || [])];

          if (oldVal !== value) {
            const diff: AuditFieldDiff = {
              field,
              fieldLabelAr: label.ar,
              fieldLabelEn: label.en,
              oldValue: oldVal,
              newValue: value,
            };
            const summaries = buildDiffSummary([diff], isRtl);
            updatedHistory.unshift({
              id: `h_${Date.now()}`,
              action: summaries.ar,
              actionEn: summaries.en,
              performedBy: `${userDisplay} (${userEmail})`,
              timestamp: new Date().toLocaleString(isRtl ? 'ar-AE' : 'en-GB'),
            });
          }

          if (isAssignee) {
            return {
              ...c,
              assigneeId: value,
              customFields: {
                ...(c.customFields || {}),
                assigneeId: value,
                'الشخص المسؤول': value,
              },
              updatedAt: now,
              history: updatedHistory,
            };
          }

          // If field exists on top level, update it, else update customFields
          if (field in c) {
            return { ...c, [field]: value, updatedAt: now, history: updatedHistory };
          } else {
            return {
              ...c,
              customFields: {
                ...(c.customFields || {}),
                [field]: value,
              },
              updatedAt: now,
              history: updatedHistory,
            };
          }
        }
        return c;
      });
    });
  };

  const deleteCase = (id: string) => {
    const targetCase = cases.find((c) => c.id === id);
    const userDisplay = currentUser?.name || (isRtl ? 'المستشار / محمد المهيري' : 'Mohamed Al-Muhairi');
    const userEmail = currentUser?.email || 'bodemohamed5544@gmail.com';
    const userRole = currentUser?.role || 'admin';

    if (targetCase) {
      recordAuditLog({
        actionType: 'DELETE',
        userName: userDisplay,
        userEmail,
        userRole,
        targetRecordId: id,
        targetRecordIdentifier: `${targetCase.caseNumber} - ${targetCase.clientName}`,
        targetCategoryName: CATEGORY_MAP.get(targetCase.categoryId)?.nameAr || (isRtl ? 'عام' : 'General'),
        changeSummaryAr: `تم حذف السجل نهائياً من النظام: (${targetCase.caseNumber} - ${targetCase.clientName})`,
        changeSummaryEn: `Permanently deleted record from system: (${targetCase.caseNumber} - ${targetCase.clientName})`,
        diffs: [],
      });
    }

    setCases((prev) => prev.filter((c) => c.id !== id));
    if (selectedCaseId === id) setSelectedCaseId(null);
    showToast(isRtl ? 'تم حذف السجل بنجاح' : 'Row deleted successfully', 'info');
  };

  const addDocumentToCase = (caseId: string, doc: Omit<CaseDocument, 'id' | 'uploadedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const userDisplay = currentUser?.name || (isRtl ? 'المستشار / محمد المهيري' : 'Mohamed Al-Muhairi');
    const userEmail = currentUser?.email || 'bodemohamed5544@gmail.com';
    const userRole = currentUser?.role || 'admin';

    const targetCase = cases.find((c) => c.id === caseId);
    if (targetCase) {
      recordAuditLog({
        actionType: 'UPDATE',
        userName: userDisplay,
        userEmail,
        userRole,
        targetRecordId: caseId,
        targetRecordIdentifier: `${targetCase.caseNumber} - ${targetCase.clientName}`,
        targetCategoryName: CATEGORY_MAP.get(targetCase.categoryId)?.nameAr || (isRtl ? 'عام' : 'General'),
        changeSummaryAr: `تم إرفاق مستند قضائي جديد: ${doc.name}`,
        changeSummaryEn: `Attached new case document: ${doc.name}`,
        diffs: [],
      });
    }

    const newDoc: CaseDocument = {
      ...doc,
      id: `doc_${Date.now()}`,
      uploadedAt: now,
      uploadedBy: userDisplay,
    };

    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const updatedHistory = [...(c.history || [])];
          updatedHistory.unshift({
            id: `h_${Date.now()}`,
            action: `تم إرفاق مستند جديد: ${doc.name}`,
            actionEn: `Attached document: ${doc.name}`,
            performedBy: `${userDisplay} (${userEmail})`,
            timestamp: new Date().toLocaleString(isRtl ? 'ar-AE' : 'en-GB'),
          });

          return {
            ...c,
            documents: [...c.documents, newDoc],
            updatedAt: now,
            history: updatedHistory,
          };
        }
        return c;
      })
    );
    showToast(isRtl ? 'تم إرفاق المستند بنجاح' : 'Document attached successfully', 'success');
  };

  const clearAllCases = () => {
    setCases([]);
    localStorage.setItem('elite_jurist_cases', '[]');
    showToast(isRtl ? 'تم تفريغ كافة البيانات والدعاوي بنجاح مع الحفاظ على الجداول والأعمدة' : 'All case data emptied, tables preserved', 'success');
  };

  const resetToInitialData = () => {
    setCases(INITIAL_CASES);
    localStorage.setItem('elite_jurist_cases', JSON.stringify(INITIAL_CASES));
    localStorage.removeItem('elite_jurist_cleared_all_records_v1');
    const defaults = getDefaultPageColumns();
    setPageColumns(defaults);
    localStorage.setItem('elite_jurist_page_columns', JSON.stringify(defaults));
    showToast(
      isRtl
        ? 'تمت استعادة كافة البيانات وسجلات القضايا الافتراضية بنجاح'
        : 'All initial case records and table schemas restored successfully',
      'success'
    );
  };

  // Google Sheets 2D Matrix Sync Logic
  const syncToGoogleSheets = async (targetCategoryId?: string): Promise<boolean> => {
    setGoogleSheetsConfig((prev) => ({ ...prev, syncStatus: 'syncing' }));

    const catId = targetCategoryId || selectedCategory || 'all';
    const cols = catId === 'all' ? pageColumns['all'] || STANDARD_CASE_COLUMNS : pageColumns[catId] || getActiveColumns();
    const rows = cases.filter((c) => (catId === 'all' ? true : c.categoryId === catId));

    // Construct 2D array matching Google Sheets format: [headers, ...rows]
    const headers = cols.map((col) => (isRtl ? col.nameAr : col.nameEn));
    const sheetData = [
      headers,
      ...rows.map((row) =>
        cols.map((col) => {
          if (col.type === 'computed') {
            if (col.id === 'remainingAmount') {
              const exec = Number(row.customFields?.executionAmount ?? row.claimAmount ?? 0);
              const trans = Number(row.customFields?.transferredAmount ?? 0);
              return exec - trans;
            }
          }
          if (col.id in row) {
            return (row as any)[col.id] ?? '';
          }
          return row.customFields?.[col.id] ?? '';
        })
      ),
    ];

    // Simulate network delay / Google Sheets API sync
    await new Promise((resolve) => setTimeout(resolve, 800));

    const now = new Date().toLocaleTimeString(isRtl ? 'ar-AE' : 'en-US');
    setGoogleSheetsConfig((prev) => ({
      ...prev,
      lastSyncedAt: now,
      syncStatus: 'synced',
    }));

    showToast(
      isRtl
        ? `تمت المزامنة بنجاح مع Google Sheets (${rows.length} سجل)`
        : `Successfully synced ${rows.length} rows to Google Sheets`,
      'success'
    );
    return true;
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [courtFilter, setCourtFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
  const [filterExpertOnly, setFilterExpertOnly] = useState(false);

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCourtFilter('all');
    setAssigneeFilter('all');
    setFilterAssignedToMe(false);
    setFilterUrgentOnly(false);
    setFilterExpertOnly(false);
    setSelectedCategory(null);
  };

  // Modals & Selection
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        isRtl,
        t,
        theme,
        setTheme,
        toggleTheme,
        firmLogo,
        setFirmLogo,
        firmDetails,
        updateFirmDetails,
        activeTab,
        setActiveTab,
        categories,
        selectedCategory,
        setSelectedCategory,
        createCategory,
        deleteCategory,
        viewMode,
        setViewMode,
        pageColumns,
        getActiveColumns,
        reorderColumns,
        renameColumn,
        addColumn,
        updateColumn,
        deleteColumn,
        revertToDefaultColumns,
        copiedColumn,
        copyColumn,
        pasteColumn,
        cases,
        addCase,
        bulkAddCases,
        insertRow,
        updateCase,
        updateCaseField,
        deleteCase,
        clearAllCases,
        addDocumentToCase,
        resetToInitialData,
        googleSheetsConfig,
        updateGoogleSheetsConfig,
        syncToGoogleSheets,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        courtFilter,
        setCourtFilter,
        assigneeFilter,
        setAssigneeFilter,
        filterAssignedToMe,
        setFilterAssignedToMe,
        filterUrgentOnly,
        setFilterUrgentOnly,
        filterExpertOnly,
        setFilterExpertOnly,
        resetAllFilters,
        selectedCaseId,
        setSelectedCaseId,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isNewPageModalOpen,
        setIsNewPageModalOpen,
        isAddColumnModalOpen,
        setIsAddColumnModalOpen,
        isGoogleSheetsModalOpen,
        setIsGoogleSheetsModalOpen,
        toasts,
        showToast,
        dismissToast,
        auditLogs,
        recordAuditLog,
        clearAuditLogs,
        exportAuditLogs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
