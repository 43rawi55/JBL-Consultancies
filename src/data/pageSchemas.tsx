import React from 'react';
import { ColumnDefinition } from '../types/schema.ts';
import { FileCell } from '../components/FileCell.tsx';

// 1. العقود (Contracts)
// Specific Schema: اسم العقد, الطرف الأول, الطرف الثاني, عدد الصفحات, الاجراء, حالة العقد, ملاحظات.
export const CONTRACTS_COLUMNS: ColumnDefinition[] = [
  { id: 'contractName', nameAr: 'اسم العقد', nameEn: 'Contract Title', type: 'text', width: 220, required: true },
  { id: 'partyOne', nameAr: 'الطرف الأول', nameEn: 'First Party', type: 'text', width: 180, required: true },
  { id: 'partyTwo', nameAr: 'الطرف الثاني', nameEn: 'Second Party', type: 'text', width: 180, required: true },
  { id: 'pageCount', nameAr: 'عدد الصفحات', nameEn: 'Page Count', type: 'number', width: 110 },
  { id: 'action', nameAr: 'الاجراء', nameEn: 'Action / Procedure', type: 'text', width: 200 },
  {
    id: 'contractStatus',
    nameAr: 'حالة العقد',
    nameEn: 'Contract Status',
    type: 'select',
    options: ['قيد المراجعة', 'مراجعة وتعديل', 'صياغة'],
    width: 140,
    required: true,
  },
  { id: 'notes', nameAr: 'ملاحظات', nameEn: 'Notes', type: 'text', width: 220 },
];

// 2. الإنذارات (Legal Notices)
// Specific Schema: تاريخ الإنذار, المنذر, المنذر اليه, تاريخ الإعلان بالانذار, نتيجة الإعلان, ملاحظات.
export const NOTICES_COLUMNS: ColumnDefinition[] = [
  { id: 'noticeDate', nameAr: 'تاريخ الإنذار', nameEn: 'Notice Date', type: 'date', width: 130, required: true },
  { id: 'sender', nameAr: 'المنذر', nameEn: 'Sender', type: 'text', width: 180, required: true },
  { id: 'recipient', nameAr: 'المنذر اليه', nameEn: 'Recipient', type: 'text', width: 180, required: true },
  { id: 'servedDate', nameAr: 'تاريخ الإعلان بالانذار', nameEn: 'Service Date', type: 'date', width: 150 },
  {
    id: 'servedResult',
    nameAr: 'نتيجة الإعلان',
    nameEn: 'Service Result',
    type: 'select',
    options: ['تم الإعلان شخصياً', 'أعلن باللصق لغلق المنشأة', 'تعذر الإعلان لعدم الاستدلال', 'قيد المتابعة لدى الكاتب العدل'],
    width: 170,
  },
  { id: 'notes', nameAr: 'ملاحظات', nameEn: 'Notes', type: 'text', width: 220 },
];

// 3. البلاغات (Police Reports / criminal_reports)
// Specific Schema: رقم الشكوي, حالة الشكوي, رقم البلاغ, حالة البلاغ, الأطراف, مركز الشرطة, رقم القضية الجزائية, حالة القضية, تاريخ الجلسة, القرار, الاجراء المطلوب, ملاحظات.
export const POLICE_REPORTS_COLUMNS: ColumnDefinition[] = [
  { id: 'complaintNumber', nameAr: 'رقم الشكوي', nameEn: 'Complaint No.', type: 'text', width: 130, required: true },
  {
    id: 'complaintStatus',
    nameAr: 'حالة الشكوي',
    nameEn: 'Complaint Status',
    type: 'select',
    options: ['قيد التحقيق بالمركز', 'محالة للنيابة العامة', 'محفوظة إدارياً', 'تم الصلح والتنازل'],
    width: 150,
  },
  { id: 'reportNumber', nameAr: 'رقم البلاغ', nameEn: 'Police Report No.', type: 'text', width: 130 },
  {
    id: 'reportStatus',
    nameAr: 'حالة البلاغ',
    nameEn: 'Report Status',
    type: 'select',
    options: ['قيد البحث والتحري', 'تم ضبط المشكو في حقه', 'أحيل للمحكمة المختصة'],
    width: 160,
  },
  { id: 'parties', nameAr: 'الأطراف', nameEn: 'Parties', type: 'text', width: 200, required: true },
  { id: 'policeStation', nameAr: 'مركز الشرطة', nameEn: 'Police Station', type: 'text', width: 160 },
  { id: 'criminalCaseNumber', nameAr: 'رقم القضية الجزائية', nameEn: 'Criminal Case No.', type: 'text', width: 150 },
  { id: 'caseStatus', nameAr: 'حالة القضية', nameEn: 'Case Status', type: 'text', width: 130 },
  { id: 'sessionDate', nameAr: 'تاريخ الجلسة', nameEn: 'Hearing Date', type: 'date', width: 130 },
  { id: 'courtDecision', nameAr: 'القرار', nameEn: 'Court Decision', type: 'text', width: 180 },
  { id: 'requiredAction', nameAr: 'الاجراء المطلوب', nameEn: 'Required Action', type: 'text', width: 180 },
  { id: 'notes', nameAr: 'ملاحظات', nameEn: 'Notes', type: 'text', width: 200 },
];

// 4. التنفيذات (Executions)
// Specific Schema: تاريخ اخر اجراء, مبلغ التنفيذ, حالة الإيداع, المبالغ المحولة, المتبقي, الملاحظات.
export const EXECUTIONS_COLUMNS: ColumnDefinition[] = [
  { id: 'lastActionDate', nameAr: 'تاريخ اخر اجراء', nameEn: 'Last Action Date', type: 'date', width: 130, required: true },
  { id: 'executionAmount', nameAr: 'مبلغ التنفيذ', nameEn: 'Execution Amount', type: 'number', width: 140, required: true },
  {
    id: 'depositStatus',
    nameAr: 'حالة الإيداع',
    nameEn: 'Deposit Status',
    type: 'select',
    options: ['تم الإيداع بالكامل', 'إيداع جزئي', 'لم يتم الإيداع بعد', 'حجز مصرفي قائم', 'حجز مركبات وعقارات'],
    width: 160,
  },
  { id: 'transferredAmount', nameAr: 'المبالغ المحولة', nameEn: 'Transferred Amount', type: 'number', width: 140 },
  {
    id: 'remainingAmount',
    nameAr: 'المتبقي',
    nameEn: 'Remaining Balance',
    type: 'computed',
    formula: 'executionAmount - transferredAmount',
    isComputed: true,
    width: 140,
  },
  { id: 'notes', nameAr: 'الملاحظات', nameEn: 'Notes', type: 'text', width: 220 },
];

// 5. Default/General Case Pages (دعاوي المحاكم / القضايا العامة)
// Specific Schema: الموكل, الخصم, الشخص المسؤول, رقم الدعوى, نوع الدعوى, المحكمة, ميعاد الجلسة, اخر اجراء والمستندات, المطلوب.
export const STANDARD_CASE_COLUMNS: ColumnDefinition[] = [
  { id: 'clientName', nameAr: 'الموكل', nameEn: 'Client', type: 'text', width: 180, required: true },
  { id: 'opponentName', nameAr: 'الخصم', nameEn: 'Opponent', type: 'text', width: 170, required: true },
  { id: 'assigneeId', nameAr: 'الشخص المسؤول', nameEn: 'Assignee', type: 'text', width: 150 },
  { id: 'caseNumber', nameAr: 'رقم الدعوى', nameEn: 'Case Number', type: 'text', width: 140, required: true },
  { id: 'caseType', nameAr: 'نوع الدعوى', nameEn: 'Case Type', type: 'text', width: 150 },
  { id: 'court', nameAr: 'المحكمة', nameEn: 'Court', type: 'text', width: 150 },
  { id: 'sessionDate', nameAr: 'ميعاد الجلسة', nameEn: 'Session Date', type: 'date', width: 130 },
  { id: 'lastAction', nameAr: 'اخر اجراء والمستندات', nameEn: 'Last Action & Docs', type: 'text', width: 200 },
  { id: 'nextStep', nameAr: 'المطلوب', nameEn: 'Required Next Step', type: 'text', width: 180 },
];

// 6. رول الجلسات (Court Hearing Roll)
export const COURT_ROLL_COLUMNS: ColumnDefinition[] = [
  { id: 'serialNumber', nameAr: 'م', nameEn: '#', type: 'number', width: 60 },
  { id: 'caseNumberAndType', nameAr: 'رقم القضية ونوعها', nameEn: 'Case No. & Type', type: 'text', width: 180, required: true },
  { id: 'assigneeId', nameAr: 'الشخص المسؤول', nameEn: 'Assignee', type: 'text', width: 150 },
  { id: 'judicialCircuit', nameAr: 'الدائرة القضائية', nameEn: 'Judicial Circuit', type: 'text', width: 190 },
  { id: 'hallAndTime', nameAr: 'القاعة والوقت', nameEn: 'Hall & Time', type: 'text', width: 130 },
  { id: 'clientAndCapacity', nameAr: 'الموكل وصفته', nameEn: 'Client & Capacity', type: 'text', width: 220, required: true },
  { id: 'opponentAndCapacity', nameAr: 'الخصم وصفته', nameEn: 'Opponent & Capacity', type: 'text', width: 220, required: true },
  { id: 'previousDecision', nameAr: 'قرار الجلسة السابقة', nameEn: 'Previous Decision', type: 'text', width: 180 },
  { id: 'sessionRequests', nameAr: 'الطلبات في الجلسة', nameEn: 'Session Requests', type: 'text', width: 240 },
  { id: 'sessionDate', nameAr: 'تاريخ الجلسة', nameEn: 'Hearing Date', type: 'date', width: 120, required: true },
];

// 7. الرخص التجارية (Commercial Licenses)
// Specific Schema: الاسم التجاري, الاسم التجاري 2, الشكل القانوني, رقم الرخصة, ملف الرخصة, تاريخ التأسيس, تاريخ الإصدار, تاريخ الانتهاء, الامارة, ملاحظات
export const COMMERCIAL_LICENSES_COLUMNS: ColumnDefinition[] = [
  { id: 'tradeName', nameAr: 'الاسم التجاري', nameEn: 'Trade Name', type: 'text', width: 200, required: true },
  { id: 'tradeName2', nameAr: 'الاسم التجاري 2', nameEn: 'Trade Name 2', type: 'text', width: 200 },
  {
    id: 'legalForm',
    nameAr: 'الشكل القانوني',
    nameEn: 'Legal Form',
    type: 'select',
    options: [
      'ذ.م.م (شركة ذات مسؤولية محدودة)',
      'مؤسسة فردية',
      'شركة مساهمة عامة',
      'شركة مساهمة خاصة',
      'فرع شركة أجنبية',
      'فرع شركة محلية',
      'شركة تضامن',
      'شركة الشخص الواحد ذ.م.م',
    ],
    width: 190,
  },
  { id: 'licenseNumber', nameAr: 'رقم الرخصة', nameEn: 'License Number', type: 'text', width: 140, required: true },
  {
    id: 'licenseFile',
    nameAr: 'ملف الرخصة',
    nameEn: 'License File',
    type: 'file',
    width: 180,
    cell: ({ getValue, row }: any) => (
      <FileCell
        value={getValue()}
        defaultFileName="commercial_license.pdf"
        onChange={(newFile) => {
          if (row.original) {
            row.original.licenseFile = newFile;
            if (!row.original.customFields) row.original.customFields = {};
            row.original.customFields.licenseFile = newFile;
          }
        }}
      />
    ),
  },
  { id: 'establishmentDate', nameAr: 'تاريخ التأسيس', nameEn: 'Establishment Date', type: 'date', width: 130 },
  { id: 'issueDate', nameAr: 'تاريخ الإصدار', nameEn: 'Issue Date', type: 'date', width: 130 },
  { id: 'expiryDate', nameAr: 'تاريخ الانتهاء', nameEn: 'Expiry Date', type: 'date', width: 130 },
  {
    id: 'emirate',
    nameAr: 'الامارة',
    nameEn: 'Emirate',
    type: 'select',
    options: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'أم القيوين', 'رأس الخيمة', 'الفجيرة'],
    width: 120,
  },
  { id: 'notes', nameAr: 'ملاحظات', nameEn: 'Notes', type: 'text', width: 220 },
];

// 8. عقود الايجار (Lease Contracts / Tenancy Contracts)
// Specific Schema: الوحدة, رقم الهاتف, المؤجر, بداية العقد, نهاية العقد, المتبقي من العقد, القيمة الايجارية, الايميل, رقم العقد, رقم ديوا, رقم الأرض, رقم البلدية, متر/مربع, قدم/مربع, نوع الوحدة, المنطقة, الامارة, الرخصة, ملاحظات
export const LEASE_CONTRACTS_COLUMNS: ColumnDefinition[] = [
  { id: 'unit', nameAr: 'الوحدة', nameEn: 'Unit', type: 'text', width: 150, required: true },
  { id: 'phone', nameAr: 'رقم الهاتف', nameEn: 'Phone Number', type: 'text', width: 140 },
  { id: 'lessor', nameAr: 'المؤجر', nameEn: 'Lessor / Landlord', type: 'text', width: 180, required: true },
  { id: 'contractStart', nameAr: 'بداية العقد', nameEn: 'Contract Start', type: 'date', width: 130, required: true },
  { id: 'contractEnd', nameAr: 'نهاية العقد', nameEn: 'Contract End', type: 'date', width: 130, required: true },
  { id: 'contractRemaining', nameAr: 'المتبقي من العقد', nameEn: 'Remaining Duration', type: 'text', width: 140 },
  { id: 'rentAmount', nameAr: 'القيمة الايجارية', nameEn: 'Rental Value', type: 'number', width: 140 },
  { id: 'email', nameAr: 'الايميل', nameEn: 'Email', type: 'text', width: 180 },
  { id: 'contractNumber', nameAr: 'رقم العقد', nameEn: 'Contract Number', type: 'text', width: 150, required: true },
  { id: 'dewaNumber', nameAr: 'رقم ديوا', nameEn: 'DEWA Premise No.', type: 'text', width: 140 },
  { id: 'plotNumber', nameAr: 'رقم الأرض', nameEn: 'Plot Number', type: 'text', width: 130 },
  { id: 'municipalityNumber', nameAr: 'رقم البلدية', nameEn: 'Municipality No.', type: 'text', width: 140 },
  { id: 'sqMeters', nameAr: 'متر/مربع', nameEn: 'Sq. Meters', type: 'number', width: 110 },
  { id: 'sqFeet', nameAr: 'قدم/مربع', nameEn: 'Sq. Feet', type: 'number', width: 110 },
  {
    id: 'unitType',
    nameAr: 'نوع الوحدة',
    nameEn: 'Unit Type',
    type: 'select',
    options: ['سكني', 'تجاري', 'مكتبي', 'مستودع / مخزن', 'صناعي', 'معرض تجاري', 'فيلا', 'شقة فندقية'],
    width: 140,
  },
  { id: 'area', nameAr: 'المنطقة', nameEn: 'Area / Community', type: 'text', width: 160 },
  {
    id: 'emirate',
    nameAr: 'الامارة',
    nameEn: 'Emirate',
    type: 'select',
    options: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'أم القيوين', 'رأس الخيمة', 'الفجيرة'],
    width: 120,
  },
  { id: 'license', nameAr: 'الرخصة', nameEn: 'License', type: 'text', width: 140 },
  { id: 'notes', nameAr: 'ملاحظات', nameEn: 'Notes', type: 'text', width: 220 },
];

// 9. الوكالات (Agencies / Powers of Attorney)
// Specific Schema: الوكيل, الموكل, سبب الوكالة, تاريخ الوكالة, ملف الوكالة, ملاحظات
export const AGENCIES_COLUMNS: ColumnDefinition[] = [
  { id: 'agent', nameAr: 'الوكيل', nameEn: 'Agent / Attorney', type: 'text', width: 180, required: true },
  { id: 'principal', nameAr: 'الموكل', nameEn: 'Principal / Client', type: 'text', width: 180, required: true },
  { id: 'poaPurpose', nameAr: 'سبب الوكالة', nameEn: 'POA Purpose', type: 'text', width: 220 },
  { id: 'poaDate', nameAr: 'تاريخ الوكالة', nameEn: 'POA Date', type: 'date', width: 130, required: true },
  {
    id: 'poaFile',
    nameAr: 'ملف الوكالة',
    nameEn: 'POA Document / File',
    type: 'file',
    width: 180,
    cell: ({ getValue, row }: any) => (
      <FileCell
        value={getValue()}
        defaultFileName="poa_document.pdf"
        onChange={(newFile) => {
          if (row.original) {
            row.original.poaFile = newFile;
            if (!row.original.customFields) row.original.customFields = {};
            row.original.customFields.poaFile = newFile;
          }
        }}
      />
    ),
  },
  { id: 'notes', nameAr: 'ملاحظات', nameEn: 'Notes', type: 'text', width: 220 },
];

// Helper to get initial columns for any category
export const getInitialColumnsForCategory = (categoryId: string): ColumnDefinition[] => {
  if (categoryId === 'court_roll') return [...COURT_ROLL_COLUMNS];
  if (categoryId === 'contracts') return [...CONTRACTS_COLUMNS];
  if (categoryId === 'legal_notices') return [...NOTICES_COLUMNS];
  if (categoryId === 'criminal_reports') return [...POLICE_REPORTS_COLUMNS];
  if (categoryId === 'executions') return [...EXECUTIONS_COLUMNS];
  if (categoryId === 'commercial_licenses') return [...COMMERCIAL_LICENSES_COLUMNS];
  if (categoryId === 'tenancy_contracts') return [...LEASE_CONTRACTS_COLUMNS];
  if (categoryId === 'powers_of_attorney') return [...AGENCIES_COLUMNS];
  return [...STANDARD_CASE_COLUMNS];
};

// Default schemas for all pages
export const getDefaultPageColumns = (): Record<string, ColumnDefinition[]> => ({
  all: [...STANDARD_CASE_COLUMNS],
  court_roll: [...COURT_ROLL_COLUMNS],
  contracts: [...CONTRACTS_COLUMNS],
  legal_notices: [...NOTICES_COLUMNS],
  criminal_reports: [...POLICE_REPORTS_COLUMNS],
  executions: [...EXECUTIONS_COLUMNS],
  elite_opposition: [...STANDARD_CASE_COLUMNS],
  elite_non_opposition: [...STANDARD_CASE_COLUMNS],
  rental_disputes: [...STANDARD_CASE_COLUMNS],
  misc_cases: [...STANDARD_CASE_COLUMNS],
  commercial_licenses: [...COMMERCIAL_LICENSES_COLUMNS],
  tenancy_contracts: [...LEASE_CONTRACTS_COLUMNS],
  powers_of_attorney: [...AGENCIES_COLUMNS],
});

