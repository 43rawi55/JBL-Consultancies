import * as XLSX from 'xlsx';
import { AuditLogEntry, AuditFieldDiff, AuditActionType, CaseItem, ColumnDefinition, UserRole } from '../types/schema.ts';

// Standard field label mapping
const STANDARD_FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  caseNumber: { ar: 'رقم الدعوى / الملف', en: 'Case / File Number' },
  clientName: { ar: 'الموكل / الطرف الأول', en: 'Client / First Party' },
  clientRole: { ar: 'صفة الموكل', en: 'Client Capacity' },
  opponentName: { ar: 'الخصم / الطرف الثاني', en: 'Opponent / Second Party' },
  opponentRole: { ar: 'صفة الخصم', en: 'Opponent Capacity' },
  assigneeId: { ar: 'المحامي المسؤول', en: 'Assigned Lawyer' },
  caseType: { ar: 'نوع الدعوى', en: 'Case Type' },
  court: { ar: 'المحكمة / الجهة', en: 'Court / Authority' },
  courtBranch: { ar: 'الدائرة القضائية', en: 'Judicial Circuit' },
  sessionDate: { ar: 'ميعاد الجلسة', en: 'Session Date' },
  sessionTime: { ar: 'وقت الجلسة', en: 'Session Time' },
  sessionPurpose: { ar: 'الغرض من الجلسة', en: 'Session Purpose' },
  lastAction: { ar: 'آخر إجراء', en: 'Last Action' },
  nextStep: { ar: 'المطلوب / الإجراء القادم', en: 'Next Step' },
  status: { ar: 'حالة الملف / الدعوى', en: 'Status' },
  priority: { ar: 'درجة الأولوية', en: 'Priority' },
  claimAmount: { ar: 'المطالبة المالية', en: 'Claim Amount' },
  notes: { ar: 'الملاحظات', en: 'Notes' },
  isExpertReport: { ar: 'مرتبط بتقرير خبرة', en: 'Expert Report Flag' },
  expertReportDueDate: { ar: 'موعد تسليم تقرير الخبرة', en: 'Expert Report Due Date' },

  // Contracts
  contractTitle: { ar: 'موضوع العقد', en: 'Contract Subject' },
  contractType: { ar: 'نوع العقد', en: 'Contract Type' },
  contractValue: { ar: 'قيمة العقد', en: 'Contract Value' },
  contractStatus: { ar: 'حالة العقد', en: 'Contract Status' },
  startDate: { ar: 'تاريخ السريان', en: 'Effective Date' },
  expiryDate: { ar: 'تاريخ الانتهاء', en: 'Expiry Date' },
  secondParty: { ar: 'الطرف الثاني', en: 'Second Party' },

  // Legal Notices
  noticeNumber: { ar: 'رقم الإنذار', en: 'Notice Number' },
  noticeSubject: { ar: 'موضوع الإنذار', en: 'Notice Subject' },
  noticeDate: { ar: 'تاريخ التوجيه', en: 'Filing Date' },
  sender: { ar: 'المنذر', en: 'Sender' },
  recipient: { ar: 'المنذر إليه', en: 'Recipient' },
  servedDate: { ar: 'تاريخ الإعلان', en: 'Service Date' },
  servedResult: { ar: 'مآل الإعلان', en: 'Service Outcome' },

  // Criminal / Police Reports
  complaintNumber: { ar: 'رقم الشكوى', en: 'Complaint No.' },
  complaintStatus: { ar: 'حالة الشكوى', en: 'Complaint Status' },
  reportNumber: { ar: 'رقم البلاغ', en: 'Report No.' },
  reportStatus: { ar: 'حالة البلاغ', en: 'Report Status' },
  policeStation: { ar: 'المركز الشرطي', en: 'Police Station' },
  criminalCaseNumber: { ar: 'رقم القضية الجزائية', en: 'Criminal Case No.' },

  // Executions
  executionNumber: { ar: 'رقم ملف التنفيذ', en: 'Execution No.' },
  executionAmount: { ar: 'مبلغ السند التنفيذي', en: 'Execution Amount' },
  depositStatus: { ar: 'حالة الإيداع', en: 'Deposit Status' },
  transferredAmount: { ar: 'المبالغ المحولة', en: 'Transferred Amount' },
  lastActionDate: { ar: 'تاريخ الإجراء الأخير', en: 'Last Action Date' },
};

// Value formatter for readable logs
export const formatValueForLog = (val: any): string => {
  if (val === null || val === undefined || val === '') {
    return '— (فارغ)';
  }
  if (typeof val === 'boolean') {
    return val ? 'نعم (Yes)' : 'لا (No)';
  }
  if (typeof val === 'number') {
    return val.toLocaleString('en-US');
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  const s = String(val).trim();
  return s.length > 50 ? s.slice(0, 50) + '...' : s;
};

// Value translation for standard enum statuses
export const translateStatusValue = (val: string): { ar: string; en: string } => {
  const map: Record<string, { ar: string; en: string }> = {
    under_review: { ar: 'قيد الدراسة والتحضير', en: 'Under Review' },
    hearing_scheduled: { ar: 'جلسة مرافعة', en: 'Hearing Scheduled' },
    expert_report: { ar: 'تقرير خبرة مطلوب', en: 'Expert Report' },
    reserved_judgment: { ar: 'محجوزة للحكم', en: 'Reserved Judgment' },
    executed: { ar: 'منفذة', en: 'Executed' },
    closed: { ar: 'منتهية ومؤرشفة', en: 'Closed' },
    urgent: { ar: 'عاجل جداً', en: 'Urgent' },
    high: { ar: 'أولوية قصوى', en: 'High' },
    normal: { ar: 'عادي', en: 'Normal' },
    low: { ar: 'منخفض', en: 'Low' },
  };
  return map[val] || { ar: val, en: val };
};

// Look up column label in standard map or dynamic page columns
export const getFieldLabel = (
  fieldKey: string,
  categoryId?: string,
  pageColumns?: Record<string, ColumnDefinition[]>
): { ar: string; en: string } => {
  if (STANDARD_FIELD_LABELS[fieldKey]) {
    return STANDARD_FIELD_LABELS[fieldKey];
  }

  if (pageColumns && categoryId && pageColumns[categoryId]) {
    const col = pageColumns[categoryId].find((c) => c.id === fieldKey);
    if (col) {
      return { ar: col.nameAr, en: col.nameEn };
    }
  }

  // Check across all page columns
  if (pageColumns) {
    for (const catId of Object.keys(pageColumns)) {
      const col = pageColumns[catId].find((c) => c.id === fieldKey);
      if (col) {
        return { ar: col.nameAr, en: col.nameEn };
      }
    }
  }

  return { ar: fieldKey, en: fieldKey };
};

// Compute difference between old record and new updates
export const computeRecordDiffs = (
  oldCase: CaseItem,
  updates: Partial<CaseItem>,
  pageColumns?: Record<string, ColumnDefinition[]>
): AuditFieldDiff[] => {
  const diffs: AuditFieldDiff[] = [];
  const ignoredKeys = new Set(['id', 'createdAt', 'updatedAt', 'history', 'documents']);

  // 1. Check top-level properties
  for (const key of Object.keys(updates) as (keyof CaseItem)[]) {
    if (ignoredKeys.has(key)) continue;
    if (key === 'customFields') continue;

    const oldVal = (oldCase as any)[key];
    const newVal = (updates as any)[key];

    if (newVal !== undefined && newVal !== oldVal) {
      const label = getFieldLabel(key, oldCase.categoryId, pageColumns);
      diffs.push({
        field: key,
        fieldLabelAr: label.ar,
        fieldLabelEn: label.en,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  // 2. Check customFields
  if (updates.customFields) {
    const oldCustom = oldCase.customFields || {};
    const newCustom = updates.customFields;

    for (const key of Object.keys(newCustom)) {
      const oldVal = oldCustom[key];
      const newVal = newCustom[key];

      if (newVal !== undefined && newVal !== oldVal) {
        // avoid duplicating if already tracked under top-level (like assigneeId)
        if (diffs.some((d) => d.field === key)) continue;

        const label = getFieldLabel(key, oldCase.categoryId, pageColumns);
        diffs.push({
          field: key,
          fieldLabelAr: label.ar,
          fieldLabelEn: label.en,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }
  }

  return diffs;
};

// Build human-readable summary for diffs
export const buildDiffSummary = (
  diffs: AuditFieldDiff[],
  isRtl: boolean = true
): { ar: string; en: string } => {
  if (diffs.length === 0) {
    return {
      ar: 'تم حفظ تعديلات على الملف دون تغييرات جوهرية',
      en: 'Record updated without major field modifications',
    };
  }

  if (diffs.length === 1) {
    const d = diffs[0];
    const oldFormatted = d.field === 'status' ? translateStatusValue(String(d.oldValue)).ar : formatValueForLog(d.oldValue);
    const newFormatted = d.field === 'status' ? translateStatusValue(String(d.newValue)).ar : formatValueForLog(d.newValue);
    const oldFormattedEn = d.field === 'status' ? translateStatusValue(String(d.oldValue)).en : formatValueForLog(d.oldValue);
    const newFormattedEn = d.field === 'status' ? translateStatusValue(String(d.newValue)).en : formatValueForLog(d.newValue);

    return {
      ar: `تم تغيير "${d.fieldLabelAr}" من "${oldFormatted}" إلى "${newFormatted}"`,
      en: `Changed "${d.fieldLabelEn}" from "${oldFormattedEn}" to "${newFormattedEn}"`,
    };
  }

  const fieldsAr = diffs.map((d) => `"${d.fieldLabelAr}"`).join('، ');
  const fieldsEn = diffs.map((d) => `"${d.fieldLabelEn}"`).join(', ');

  return {
    ar: `تم تعديل ${diffs.length} حقول: (${fieldsAr})`,
    en: `Updated ${diffs.length} fields: (${fieldsEn})`,
  };
};

// Seed realistic audit logs so initial page has rich chronological history
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_seed_101',
    timestamp: '2026-10-03T08:15:20.000Z',
    actionType: 'UPDATE',
    userName: 'المستشار / محمد المهيري',
    userEmail: 'bodemohamed5544@gmail.com',
    userRole: 'admin',
    targetRecordId: 'case_1',
    targetRecordIdentifier: '2024/4915 - شركة إعمار العقارية',
    targetCategoryName: 'قضايا المحاكم',
    changeSummaryAr: 'تم تغيير "حالة الملف / الدعوى" من "قيد الدراسة والتحضير" إلى "جلسة مرافعة"',
    changeSummaryEn: 'Changed "Status" from "Under Review" to "Hearing Scheduled"',
    diffs: [
      {
        field: 'status',
        fieldLabelAr: 'حالة الملف / الدعوى',
        fieldLabelEn: 'Status',
        oldValue: 'under_review',
        newValue: 'hearing_scheduled',
      },
      {
        field: 'sessionDate',
        fieldLabelAr: 'ميعاد الجلسة',
        fieldLabelEn: 'Session Date',
        oldValue: '2026-10-01',
        newValue: '2026-10-05',
      },
    ],
  },
  {
    id: 'log_seed_102',
    timestamp: '2026-10-02T14:40:10.000Z',
    actionType: 'UPDATE',
    userName: 'أ. سارة المنصوري',
    userEmail: 'sarah.mansoori@elitejurist.ae',
    userRole: 'lawyer',
    targetRecordId: 'case_2',
    targetRecordIdentifier: '2024/1102 - بنك الإمارات دبي الوطني',
    targetCategoryName: 'قضايا المحاكم',
    changeSummaryAr: 'تم تغيير "الغرض من الجلسة" من "جلسة أولى" إلى "سداد الرسوم واستيفاء الإعلان"',
    changeSummaryEn: 'Changed "Session Purpose" from "First session" to "Fee payment & service"',
    diffs: [
      {
        field: 'sessionPurpose',
        fieldLabelAr: 'الغرض من الجلسة',
        fieldLabelEn: 'Session Purpose',
        oldValue: 'جلسة أولى',
        newValue: 'سداد الرسوم واستيفاء الإعلان',
      },
    ],
  },
  {
    id: 'log_seed_103',
    timestamp: '2026-10-02T11:20:00.000Z',
    actionType: 'CREATE',
    userName: 'المستشار / محمد المهيري',
    userEmail: 'bodemohamed5544@gmail.com',
    userRole: 'admin',
    targetRecordId: 'case_contract_1',
    targetRecordIdentifier: 'CNT-2024-089 - شركة دبي للتطوير العقاري',
    targetCategoryName: 'العقود والاتفاقيات',
    changeSummaryAr: 'تم إنشاء سجل عقد جديد وتحديد الطرف الأول: شركة دبي للتطوير العقاري',
    changeSummaryEn: 'Created new contract record for Dubai Real Estate Development',
    diffs: [],
  },
  {
    id: 'log_seed_104',
    timestamp: '2026-10-01T16:05:44.000Z',
    actionType: 'UPDATE',
    userName: 'أ. طارق الهاشمي',
    userEmail: 'tariq.hashemi@elitejurist.ae',
    userRole: 'lawyer',
    targetRecordId: 'case_execution_1',
    targetRecordIdentifier: '2024/771 - شركة الخليج للإنشاءات',
    targetCategoryName: 'ملفات التنفيذ',
    changeSummaryAr: 'تم تعديل "المبالغ المحولة" من "0" إلى "150,000"',
    changeSummaryEn: 'Updated "Transferred Amount" from "0" to "150,000"',
    diffs: [
      {
        field: 'transferredAmount',
        fieldLabelAr: 'المبالغ المحولة',
        fieldLabelEn: 'Transferred Amount',
        oldValue: 0,
        newValue: 150000,
      },
    ],
  },
  {
    id: 'log_seed_105',
    timestamp: '2026-09-30T09:12:15.000Z',
    actionType: 'DELETE',
    userName: 'المستشار / محمد المهيري',
    userEmail: 'bodemohamed5544@gmail.com',
    userRole: 'admin',
    targetRecordId: 'case_old_99',
    targetRecordIdentifier: '2023/104 - ملف قديم ملغي',
    targetCategoryName: 'قضايا المحاكم',
    changeSummaryAr: 'تم حذف السجل نهائياً من قاعدة البيانات بواسطة المدير الإداري',
    changeSummaryEn: 'Permanently deleted record from system by Admin',
    diffs: [],
  },
];

// Export audit logs directly to Excel (.xlsx) using SheetJS
export const exportAuditLogsToExcel = (logs: AuditLogEntry[], isRtl: boolean = true) => {
  const exportRows = logs.map((log, index) => {
    const d = new Date(log.timestamp);
    const dateFormatted = d.toLocaleDateString(isRtl ? 'ar-AE' : 'en-GB');
    const timeFormatted = d.toLocaleTimeString(isRtl ? 'ar-AE' : 'en-GB');

    const actionLabel =
      log.actionType === 'CREATE'
        ? (isRtl ? 'إضافة / إنشاء (CREATE)' : 'CREATE')
        : log.actionType === 'UPDATE'
        ? (isRtl ? 'تعديل / تحديث (UPDATE)' : 'UPDATE')
        : (isRtl ? 'حذف (DELETE)' : 'DELETE');

    return {
      [isRtl ? 'م' : '#']: index + 1,
      [isRtl ? 'نوع الإجراء' : 'Action Type']: actionLabel,
      [isRtl ? 'تاريخ وساعة الإجراء' : 'Date & Time']: `${dateFormatted} ${timeFormatted}`,
      [isRtl ? 'المستخدم' : 'User']: log.userName,
      [isRtl ? 'البريد الإلكتروني' : 'User Email']: log.userEmail,
      [isRtl ? 'الدور والصلاحية' : 'Role']: log.userRole || 'Admin',
      [isRtl ? 'السجل المستهدف' : 'Target Record']: log.targetRecordIdentifier,
      [isRtl ? 'القسم / التصنيف' : 'Category']: log.targetCategoryName || 'عام',
      [isRtl ? 'تفاصيل التغيير' : 'Change Details']: isRtl ? log.changeSummaryAr : log.changeSummaryEn,
      [isRtl ? 'معرف السجل' : 'Record ID']: log.targetRecordId,
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportRows);

  // Set RTL on sheet if Arabic
  if (isRtl) {
    if (!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ rightToLeft: true });
  }

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // #
    { wch: 18 }, // Action
    { wch: 22 }, // Date & Time
    { wch: 24 }, // User
    { wch: 28 }, // Email
    { wch: 14 }, // Role
    { wch: 32 }, // Target Record
    { wch: 18 }, // Category
    { wch: 50 }, // Change Details
    { wch: 20 }, // Record ID
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isRtl ? 'سجل النشاطات' : 'Audit Log');

  const nowStr = new Date().toISOString().split('T')[0];
  const fileName = `Audit_Log_Law_Firm_${nowStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
