import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Scale,
  Calendar,
  User,
  Building,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Bell,
  Mail,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CaseItem, CategoryKey, CaseStatus, CasePriority, ColumnDefinition } from '../types/schema.ts';
import { dispatchEmailAlert, DEFAULT_USER_EMAIL } from '../utils/reminderService.ts';

export const CaseFormModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedCaseId,
    cases,
    categories,
    selectedCategory,
    pageColumns,
    addCase,
    updateCase,
    showToast,
    isRtl,
    t,
  } = useApp();

  const { users, currentUser } = useAuth();

  const isEditing = isEditModalOpen && Boolean(selectedCaseId);
  const currentCase = useMemo(() => {
    return isEditing ? cases.find((c) => c.id === selectedCaseId) || null : null;
  }, [isEditing, selectedCaseId, cases]);

  // Selected Category for the case
  const [categoryId, setCategoryId] = useState<CategoryKey>('court_roll');

  // Dynamic values dictionary: columnId -> value (handles all columns, existing and newly added)
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});

  // Workflow & Administrative state
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState<CaseStatus>('hearing_scheduled');
  const [priority, setPriority] = useState<CasePriority>('normal');
  const [claimAmount, setClaimAmount] = useState<string>('');
  const [isExpertReport, setIsExpertReport] = useState(false);
  const [expertReportDueDate, setExpertReportDueDate] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Active columns for the currently selected category in the form
  const activeCategoryColumns = useMemo<ColumnDefinition[]>(() => {
    const cols = pageColumns[categoryId] || pageColumns['all'] || [];
    return cols;
  }, [pageColumns, categoryId]);

  // Active Category metadata
  const activeCategoryInfo = useMemo(() => {
    return categories.find((c) => c.id === categoryId);
  }, [categories, categoryId]);

  // Populate form on open or switch between edit/create
  useEffect(() => {
    if (isEditing && currentCase) {
      setCategoryId(currentCase.categoryId);
      setAssigneeId(currentCase.assigneeId || currentUser?.id || users[0]?.id || '');
      setStatus(currentCase.status || 'hearing_scheduled');
      setPriority(currentCase.priority || 'normal');
      setClaimAmount(currentCase.claimAmount !== undefined ? String(currentCase.claimAmount) : '');
      setIsExpertReport(Boolean(currentCase.isExpertReport));
      setExpertReportDueDate(currentCase.expertReportDueDate || '');
      setGeneralNotes(currentCase.notes || currentCase.customFields?.notes || '');

      // Load all column values from customFields or top-level properties
      const cols = pageColumns[currentCase.categoryId] || pageColumns['all'] || [];
      const loadedValues: Record<string, any> = { ...(currentCase.customFields || {}) };

      cols.forEach((col) => {
        if (loadedValues[col.id] === undefined) {
          if (col.id in currentCase) {
            loadedValues[col.id] = (currentCase as any)[col.id];
          } else {
            loadedValues[col.id] = col.defaultValue ?? '';
          }
        }
      });

      setDynamicValues(loadedValues);
    } else if (isCreateModalOpen) {
      // Default reset for new case
      const targetCat = selectedCategory || 'court_roll';
      setCategoryId(targetCat);
      setAssigneeId(currentUser?.id || users[0]?.id || '');
      setStatus('hearing_scheduled');
      setPriority('normal');
      setClaimAmount('');
      setIsExpertReport(false);
      setExpertReportDueDate('');
      setGeneralNotes('');

      const d = new Date();
      d.setDate(d.getDate() + 7);
      const defaultDate = d.toISOString().split('T')[0];

      const cols = pageColumns[targetCat] || pageColumns['all'] || [];
      const initialValues: Record<string, any> = {};

      cols.forEach((col) => {
        if (col.id === 'serialNumber') {
          const count = cases.filter((c) => c.categoryId === targetCat).length;
          initialValues[col.id] = count + 1;
        } else if (col.id === 'caseNumber' || col.id === 'caseNumberAndType') {
          initialValues[col.id] = `2026/${Math.floor(1000 + Math.random() * 9000)} تجاري`;
        } else if (col.id === 'sessionDate' || col.id === 'noticeDate' || col.id === 'lastActionDate') {
          initialValues[col.id] = defaultDate;
        } else if (col.id === 'clientName' || col.id === 'clientAndCapacity' || col.id === 'partyOne') {
          initialValues[col.id] = isRtl ? 'ذا ايليت كارز انترناشيونال' : 'The Elite Cars International';
        } else if (col.id === 'opponentName' || col.id === 'opponentAndCapacity' || col.id === 'partyTwo') {
          initialValues[col.id] = isRtl ? 'الطرف الخصم' : 'Opponent Party';
        } else if (col.id === 'previousDecision') {
          initialValues[col.id] = isRtl ? 'اول جلسة' : 'First hearing';
        } else if (col.id === 'judicialCircuit') {
          initialValues[col.id] = isRtl ? 'الدائرة الكلية التجارية الأولى' : 'Commercial Circuit 1';
        } else if (col.id === 'hallAndTime') {
          initialValues[col.id] = isRtl ? 'الساعة 09:30 ص' : '09:30 AM';
        } else if (col.type === 'number') {
          initialValues[col.id] = col.defaultValue ?? 0;
        } else {
          initialValues[col.id] = col.defaultValue ?? '';
        }
      });

      setDynamicValues(initialValues);
    }
  }, [isEditing, currentCase, isCreateModalOpen, isEditModalOpen, selectedCategory, pageColumns, isRtl]);

  // When user changes category in the modal dropdown, refresh active column defaults if needed
  const handleCategoryChange = (newCat: CategoryKey) => {
    setCategoryId(newCat);
    const cols = pageColumns[newCat] || pageColumns['all'] || [];
    setDynamicValues((prev) => {
      const next = { ...prev };
      cols.forEach((col) => {
        if (next[col.id] === undefined) {
          next[col.id] = col.defaultValue ?? '';
        }
      });
      return next;
    });
  };

  const handleFieldChange = (colId: string, val: any) => {
    setDynamicValues((prev) => ({
      ...prev,
      [colId]: val,
    }));
  };

  const handleClose = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleTestEmail = (col: ColumnDefinition, val: any) => {
    const dummyCase: CaseItem = {
      id: currentCase?.id || 'temp',
      caseNumber: dynamicValues.caseNumber || dynamicValues.caseNumberAndType || '2026/1105 تجاري',
      clientName: dynamicValues.clientName || dynamicValues.clientAndCapacity || 'ذا ايليت كارز انترناشيونال',
      opponentName: dynamicValues.opponentName || dynamicValues.opponentAndCapacity || 'الطرف الخصم',
      categoryId,
      assigneeId: assigneeId || users[0].id,
      sessionDate: dynamicValues.sessionDate || new Date().toISOString().split('T')[0],
      court: dynamicValues.court || dynamicValues.judicialCircuit || 'محاكم دبي',
      courtBranch: dynamicValues.hallAndTime || '',
      nextStep: dynamicValues.nextStep || dynamicValues.sessionRequests || '',
      status,
      priority,
      documents: [],
      history: [],
      createdAt: '',
      updatedAt: '',
      customFields: dynamicValues,
    };

    dispatchEmailAlert(
      dummyCase,
      col,
      String(val || '09:00 ص'),
      col.reminderMinutesBefore || 30,
      col.reminderEmail || DEFAULT_USER_EMAIL
    );

    showToast(
      isRtl
        ? `تم إرسال إشعار التنبيه التجريبي بنجاح إلى (${col.reminderEmail || DEFAULT_USER_EMAIL})`
        : `Email alert reminder dispatched to (${col.reminderEmail || DEFAULT_USER_EMAIL})`,
      'success'
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate required fields
    for (const col of activeCategoryColumns) {
      if (col.required && !col.isComputed && col.type !== 'computed') {
        const val = dynamicValues[col.id];
        if (val === undefined || val === null || String(val).trim() === '') {
          showToast(
            isRtl
              ? `يرجى تعبئة الحقل الإلزامي: ${col.nameAr}`
              : `Please fill required field: ${col.nameEn}`,
            'error'
          );
          return;
        }
      }
    }

    // 2. Prepare customFields with ALL dynamic column values
    const customFields: Record<string, any> = {
      ...(currentCase?.customFields || {}),
      ...dynamicValues,
      notes: generalNotes || dynamicValues.notes || '',
    };

    // If executions remainingAmount is present, ensure numeric calculation
    if (dynamicValues.executionAmount !== undefined) {
      const exec = Number(dynamicValues.executionAmount || 0);
      const trans = Number(dynamicValues.transferredAmount || 0);
      customFields.remainingAmount = exec - trans;
    }

    // 3. Resolve primary properties for table search, calendar, and quick cards
    const resolvedCaseNumber =
      String(
        dynamicValues.caseNumber ||
        dynamicValues.caseNumberAndType ||
        dynamicValues.contractName ||
        dynamicValues.complaintNumber ||
        `2026/${Math.floor(1000 + Math.random() * 9000)}`
      ).trim();

    const resolvedClient =
      String(
        dynamicValues.clientName ||
        dynamicValues.clientAndCapacity ||
        dynamicValues.partyOne ||
        dynamicValues.sender ||
        (isRtl ? 'موكل جديد' : 'Client')
      ).trim();

    const resolvedOpponent =
      String(
        dynamicValues.opponentName ||
        dynamicValues.opponentAndCapacity ||
        dynamicValues.partyTwo ||
        dynamicValues.recipient ||
        (isRtl ? 'الطرف الخصم' : 'Opponent')
      ).trim();

    const resolvedSessionDate =
      dynamicValues.sessionDate ||
      dynamicValues.noticeDate ||
      dynamicValues.lastActionDate ||
      new Date().toISOString().split('T')[0];

    const resolvedCourt =
      dynamicValues.court ||
      dynamicValues.judicialCircuit ||
      dynamicValues.policeStation ||
      'محاكم دبي';

    const resolvedLastAction =
      dynamicValues.lastAction ||
      dynamicValues.previousDecision ||
      dynamicValues.action ||
      (isRtl ? 'قيد التحديث' : 'In progress');

    const resolvedNextStep =
      dynamicValues.nextStep ||
      dynamicValues.sessionRequests ||
      dynamicValues.requiredAction ||
      '';

    const resolvedAssigneeId =
      assigneeId ||
      dynamicValues.assigneeId ||
      dynamicValues.assignee ||
      dynamicValues['الشخص المسؤول'] ||
      currentUser?.id ||
      users[0]?.id;

    const parsedAmount = claimAmount ? parseFloat(claimAmount) : undefined;

    if (isEditing && currentCase) {
      updateCase(currentCase.id, {
        caseNumber: resolvedCaseNumber,
        categoryId,
        clientName: resolvedClient,
        clientRole: isRtl ? 'الموكل' : 'Client',
        opponentName: resolvedOpponent,
        opponentRole: isRtl ? 'الخصم' : 'Opponent',
        assigneeId: resolvedAssigneeId,
        caseType: dynamicValues.caseType || (isRtl ? 'تجاري' : 'Commercial'),
        court: resolvedCourt,
        courtBranch: dynamicValues.hallAndTime || dynamicValues.judicialCircuit || '',
        sessionDate: resolvedSessionDate,
        sessionTime: dynamicValues.sessionTime || dynamicValues.hallAndTime || '09:00 ص',
        sessionPurpose: resolvedNextStep,
        isExpertReport,
        expertReportDueDate: isExpertReport ? expertReportDueDate : undefined,
        lastAction: resolvedLastAction,
        nextStep: resolvedNextStep,
        status,
        priority,
        claimAmount: parsedAmount,
        notes: generalNotes,
        customFields: {
          ...customFields,
          assigneeId: resolvedAssigneeId,
        },
      });

      showToast(
        isRtl ? 'تم تحديث بيانات القضية وجميع الحقول بنجاح' : 'Case and all dynamic fields updated',
        'success'
      );
    } else {
      addCase({
        caseNumber: resolvedCaseNumber,
        categoryId,
        clientName: resolvedClient,
        clientRole: isRtl ? 'الموكل' : 'Client',
        opponentName: resolvedOpponent,
        opponentRole: isRtl ? 'الخصم' : 'Opponent',
        assigneeId: resolvedAssigneeId,
        caseType: dynamicValues.caseType || (isRtl ? 'تجاري' : 'Commercial'),
        court: resolvedCourt,
        courtBranch: dynamicValues.hallAndTime || dynamicValues.judicialCircuit || '',
        sessionDate: resolvedSessionDate,
        sessionTime: dynamicValues.sessionTime || dynamicValues.hallAndTime || '09:00 ص',
        sessionPurpose: resolvedNextStep,
        isExpertReport,
        expertReportDueDate: isExpertReport ? expertReportDueDate : undefined,
        lastAction: resolvedLastAction,
        nextStep: resolvedNextStep,
        status,
        priority,
        claimAmount: parsedAmount,
        notes: generalNotes,
        documents: [],
        customFields: {
          ...customFields,
          assigneeId: resolvedAssigneeId,
        },
      });

      showToast(
        isRtl ? 'تمت إضافة القضية بنجاح وحفظ كافة الأعمدة' : 'New case added with all dynamic columns',
        'success'
      );
    }

    handleClose();
  };

  if (!isCreateModalOpen && !isEditModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: `${activeCategoryInfo?.color || '#4F46E5'}15`,
                color: activeCategoryInfo?.color || '#4F46E5',
              }}
            >
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isEditing ? t('editCase') : t('newCase')}
                </h3>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${activeCategoryInfo?.color || '#4F46E5'}20`,
                    color: activeCategoryInfo?.color || '#4F46E5',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: activeCategoryInfo?.color || '#4F46E5' }}
                  />
                  {activeCategoryInfo
                    ? isRtl
                      ? activeCategoryInfo.nameAr
                      : activeCategoryInfo.nameEn
                    : t('allCases')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRtl
                  ? 'نموذج ديناميكي يعرض جميع أعمدة القسم الحالية وأي أعمدة جديدة تتم إضافتها'
                  : 'Dynamic schema form reflecting all current and newly added columns'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* Section 1: Category Selector */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>{isRtl ? 'قسم النظام المستهدف (نوع الصفحة / الجدول):' : 'Target Workspace Section:'}</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeCategoryColumns.length} {isRtl ? 'حقول نشطة' : 'active fields'}
              </span>
            </div>

            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value as CategoryKey)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {isRtl ? cat.nameAr : cat.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Section 2: DYNAMIC SCHEMA COLUMNS (Reflects all columns of this page + any newly added) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>
                  {isRtl
                    ? `أعمدة وبيانات قسم: ${activeCategoryInfo ? activeCategoryInfo.nameAr : ''}`
                    : `Columns for: ${activeCategoryInfo ? activeCategoryInfo.nameEn : ''}`}
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isRtl ? 'يتم حفظ القيم وتحديثها في الجدول مباشرة' : 'Values sync directly to table'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {activeCategoryColumns.map((col) => {
                const isComputed = col.type === 'computed' || col.isComputed;
                const value = dynamicValues[col.id] ?? '';
                const isLongText =
                  col.id === 'sessionRequests' ||
                  col.id === 'action' ||
                  col.id === 'notes' ||
                  col.id === 'courtDecision' ||
                  String(col.nameAr).includes('طلبات') ||
                  String(col.nameAr).includes('قرار');

                // Special handling for computed columns (e.g. remainingAmount in executions)
                if (isComputed) {
                  let computedVal: any = '-';
                  if (col.id === 'remainingAmount') {
                    const exec = Number(dynamicValues.executionAmount || 0);
                    const trans = Number(dynamicValues.transferredAmount || 0);
                    computedVal = `${(exec - trans).toLocaleString()} ${t('aed')}`;
                  }

                  return (
                    <div
                      key={col.id}
                      className="sm:col-span-2 p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <div>
                          <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">
                            {isRtl ? col.nameAr : col.nameEn}
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">
                            {isRtl ? 'حقل محسوب تلقائياً في الوقت الحقيقي' : 'Auto-calculated in real time'}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-amber-900 dark:text-amber-100">
                        {computedVal}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={col.id}
                    className={isLongText ? 'sm:col-span-2 space-y-1' : 'space-y-1'}
                  >
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>{isRtl ? col.nameAr : col.nameEn}</span>
                        {col.required && <span className="text-rose-500 font-bold">*</span>}
                      </label>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {col.type}
                      </span>
                    </div>

                    {/* Render input based on column type */}
                    {col.id === 'assigneeId' ||
                    col.id === 'assignee' ||
                    col.nameAr.includes('المسؤول') ||
                    col.nameAr.includes('المحامي') ||
                    col.nameAr.includes('المكلف') ||
                    col.nameEn.toLowerCase().includes('assignee') ||
                    col.nameEn.toLowerCase().includes('lawyer') ? (
                      <select
                        value={value || assigneeId || users[0]?.id || ''}
                        onChange={(e) => {
                          handleFieldChange(col.id, e.target.value);
                          setAssigneeId(e.target.value);
                        }}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">{isRtl ? '-- اختر الشخص المسؤول --' : '-- Select Assignee --'}</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {isRtl ? u.name : u.nameEn} ({u.role})
                          </option>
                        ))}
                      </select>
                    ) : col.type === 'select' ? (
                      <select
                        value={value}
                        onChange={(e) => handleFieldChange(col.id, e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">
                          {isRtl ? '-- اختر خياراً --' : '-- Select an option --'}
                        </option>
                        {(col.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : col.type === 'time' ? (
                      <input
                        type="time"
                        value={value}
                        onChange={(e) => handleFieldChange(col.id, e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      />
                    ) : col.type === 'datetime' ? (
                      <input
                        type="datetime-local"
                        value={value}
                        onChange={(e) => handleFieldChange(col.id, e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      />
                    ) : col.type === 'date' ? (
                      <input
                        type="date"
                        value={value}
                        onChange={(e) => handleFieldChange(col.id, e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      />
                    ) : col.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) =>
                          handleFieldChange(
                            col.id,
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        placeholder="0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : isLongText ? (
                      <textarea
                        rows={2}
                        value={value}
                        onChange={(e) => handleFieldChange(col.id, e.target.value)}
                        placeholder={`${isRtl ? 'أدخل' : 'Enter'} ${isRtl ? col.nameAr : col.nameEn}...`}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleFieldChange(col.id, e.target.value)}
                        placeholder={`${isRtl ? 'أدخل' : 'Enter'} ${isRtl ? col.nameAr : col.nameEn}...`}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}

                    {/* Email Reminder Active Banner */}
                    {col.hasEmailReminder && (
                      <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 mt-1">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Bell className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">
                            {isRtl
                              ? `تنبيه بريدي نشط: قبل ${col.reminderMinutesBefore || 30} دقيقة إلى ${col.reminderEmail || DEFAULT_USER_EMAIL}`
                              : `Email alert: ${col.reminderMinutesBefore || 30}m before to ${col.reminderEmail || DEFAULT_USER_EMAIL}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTestEmail(col, value)}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                        >
                          {isRtl ? 'تجربة إرسال التنبيه' : 'Test Alert'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Administrative & Workflow Details */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-900 dark:text-white text-xs block">
              {isRtl ? 'المسؤولية وحالة الإجراء' : 'Workflow & Assignment'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t('colAssignee')} *
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setAssigneeId(newId);
                    activeCategoryColumns.forEach((c) => {
                      if (c.id === 'assigneeId' || c.nameAr.includes('المسؤول')) {
                        handleFieldChange(c.id, newId);
                      }
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {isRtl ? u.name : u.nameEn} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t('colStatus')}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CaseStatus)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="under_review">{t('status_under_review')}</option>
                  <option value="hearing_scheduled">{t('status_hearing_scheduled')}</option>
                  <option value="expert_report">{t('status_expert_report')}</option>
                  <option value="reserved_judgment">{t('status_reserved_judgment')}</option>
                  <option value="executed">{t('status_executed')}</option>
                  <option value="closed">{t('status_closed')}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {isRtl ? 'درجة الأولوية' : 'Priority'}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CasePriority)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="normal">{isRtl ? 'عادي' : 'Normal'}</option>
                  <option value="high">{isRtl ? 'هام' : 'High'}</option>
                  <option value="urgent">{isRtl ? 'عاجل جداً' : 'Urgent'}</option>
                </select>
              </div>
            </div>

            {/* Expert Report Checkbox & Due Date */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={isExpertReport}
                  onChange={(e) => setIsExpertReport(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>{isRtl ? 'ملف مرتبط بمأمورية خبير قضائي' : 'Linked to Expert Report Deadline'}</span>
              </label>

              {isExpertReport && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">{isRtl ? 'تاريخ إيداع التقرير:' : 'Due Date:'}</span>
                  <input
                    type="date"
                    value={expertReportDueDate}
                    onChange={(e) => setExpertReportDueDate(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* General Notes */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {isRtl ? 'ملاحظات عامة وتوجيهات' : 'General Notes'}
              </label>
              <textarea
                rows={2}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder={isRtl ? 'أي ملاحظات إضافية عن الملف...' : 'Any additional notes...'}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? t('saveChanges') : t('confirm')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
