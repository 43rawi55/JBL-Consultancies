export type UserRole = 'admin' | 'lawyer' | 'viewer';

export interface User {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  avatar: string;
  role: UserRole;
  title: string;
  titleEn: string;
  phone?: string;
  initials: string;
  color: string;
  passwordHash?: string;
  createdAt?: string;
}

export type ColumnType = 'text' | 'number' | 'date' | 'time' | 'datetime' | 'select' | 'computed' | 'file';

export interface ColumnDefinition {
  id: string;
  nameAr: string;
  nameEn: string;
  type: ColumnType;
  options?: string[]; // for 'select'
  isComputed?: boolean; // for calculated fields
  formula?: string; // e.g. 'executionAmount - transferredAmount'
  width?: number;
  required?: boolean;
  isSystem?: boolean;
  defaultValue?: any;
  hasEmailReminder?: boolean;
  reminderMinutesBefore?: number; // e.g. 15, 30, 60, 120, 1440
  reminderEmail?: string; // target email for alerts
  cell?: (info: { getValue: () => any; row: { original: any } }) => React.ReactNode;
}

export interface EmailReminderLog {
  id: string;
  caseId: string;
  caseNumber: string;
  clientName: string;
  columnName: string;
  targetTime: string;
  minutesBefore: number;
  recipientEmail: string;
  subject: string;
  status: 'sent' | 'scheduled';
  sentTimestamp: string;
}

export type CategoryKey = string;

export interface CategoryInfo {
  id: CategoryKey;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  descriptionAr: string;
  descriptionEn: string;
  isCustom?: boolean;
  layoutPreset?: 'standard' | 'court_roll' | 'contracts' | 'notices' | 'reports' | 'executions' | 'blank';
}

export type CaseStatus =
  | 'under_review'        // قيد الدراسة والتحضير
  | 'hearing_scheduled'   // جلسة مرافعة
  | 'expert_report'       // تقرير خبرة
  | 'reserved_judgment'   // محجوزة للحكم
  | 'executed'            // منفذة
  | 'closed';             // منتهية / محفوظة

export type CasePriority = 'urgent' | 'high' | 'normal' | 'low';

export interface CaseDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  url?: string;
  driveFileId?: string;
  driveUrl?: string;
  driveDownloadUrl?: string;
  uploadedBy?: string;
}

export interface CaseHistoryEvent {
  id: string;
  action: string;
  actionEn: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface CaseItem {
  id: string;
  caseNumber: string;            // رقم الدعوى أو الملف
  categoryId: CategoryKey;       // القسم
  clientName: string;            // الموكل / الطرف الأول
  clientRole?: string;           // صفة الموكل
  opponentName: string;          // الخصم / الطرف الثاني
  opponentRole?: string;         // صفة الخصم
  assigneeId: string;            // الشخص المسؤول (المحامي)
  caseType?: string;             // نوع الدعوى
  court?: string;                // المحكمة أو المركز
  courtBranch?: string;          // الدائرة القضائية
  sessionDate?: string;          // ميعاد الجلسة
  sessionTime?: string;          // وقت الجلسة
  sessionPurpose?: string;       // الغرض من الجلسة
  isExpertReport?: boolean;      // هل متعلق بتقرير خبرة؟
  expertReportDueDate?: string;  // موعد تسليم تقرير الخبرة
  lastAction?: string;           // اخر اجراء
  nextStep?: string;             // المطلوب
  status: CaseStatus;            // حالة الدعوى
  priority: CasePriority;        // الأهمية
  claimAmount?: number;          // المطالبة المالية (درهم)
  notes?: string;                // ملاحظات
  documents: CaseDocument[];     // المستندات والمرفقات
  history: CaseHistoryEvent[];   // سجل الإجراءات
  createdAt: string;
  updatedAt: string;

  // Dynamic custom fields for page-specific schemas (Contracts, Notices, Police Reports, Executions, etc.)
  customFields?: Record<string, any>;
}

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditFieldDiff {
  field: string;
  fieldLabelAr: string;
  fieldLabelEn: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO date-time string
  actionType: AuditActionType;
  userName: string;
  userEmail: string;
  userRole?: UserRole;
  targetRecordId: string;
  targetRecordIdentifier: string; // e.g. "2026/4915 - ذا ايليت كارز انترناشيونال"
  targetCategoryName?: string;
  changeSummaryAr: string;
  changeSummaryEn: string;
  diffs?: AuditFieldDiff[];
}

export interface GoogleSheetsSyncConfig {
  sheetId: string;
  sheetName: string;
  apiKey?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

export interface LawFirmSettings {
  firmNameAr: string;
  firmNameEn: string;
  registrationNumber: string;
  taxNumber: string;
  address: string;
  phone: string;
  email: string;
  defaultCourt: string;
  logoUrl?: string;
  googleClientId?: string;
  googleSheetsConfig?: GoogleSheetsSyncConfig;
}
