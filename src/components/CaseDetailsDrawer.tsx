import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Building,
  User,
  Paperclip,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Shield,
  Edit2,
  Trash2,
  Upload,
  ExternalLink,
  CheckCircle2,
  History,
  PlusCircle,
  Edit3,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CATEGORY_MAP } from '../data/categories.ts';
import { CaseStatus, AuditActionType } from '../types/schema.ts';

export const CaseDetailsDrawer: React.FC = () => {
  const {
    selectedCaseId,
    setSelectedCaseId,
    cases,
    pageColumns,
    updateCase,
    deleteCase,
    addDocumentToCase,
    setIsEditModalOpen,
    auditLogs,
    isRtl,
    t,
  } = useApp();

  const { users, currentUser, canEditCase, canDeleteCase } = useAuth();

  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'documents' | 'history'>('details');
  const [isUploading, setIsUploading] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const currentCase = useMemo(() => {
    return selectedCaseId ? cases.find((c) => c.id === selectedCaseId) || null : null;
  }, [selectedCaseId, cases]);

  // Filter audit logs specifically belonging to this record
  const recordAuditLogs = useMemo(() => {
    if (!currentCase) return [];
    return auditLogs.filter(
      (log) =>
        log.targetRecordId === currentCase.id ||
        (log.targetRecordIdentifier &&
          currentCase.caseNumber &&
          log.targetRecordIdentifier.includes(currentCase.caseNumber))
    );
  }, [auditLogs, currentCase]);

  if (!selectedCaseId || !currentCase) return null;

  const category = CATEGORY_MAP.get(currentCase.categoryId);
  const rawAssignee =
    currentCase.customFields?.assigneeId ||
    currentCase.assigneeId ||
    currentCase.customFields?.['الشخص المسؤول'] ||
    currentCase.customFields?.['المحامي المسؤول'] ||
    currentCase.customFields?.['المحامي'] ||
    currentCase.customFields?.assignee;

  const targetAssignee = String(rawAssignee || '').trim().toLowerCase();
  const assignee = users.find((u) => {
    if (!targetAssignee) return false;
    if (u.id.toLowerCase() === targetAssignee) return true;
    if (u.email.toLowerCase() === targetAssignee) return true;
    if (u.name.toLowerCase() === targetAssignee) return true;
    if (u.nameEn?.toLowerCase() === targetAssignee) return true;
    const cleanName = u.name.replace(/^(المستشار|أستاذ|أ\.|\/|\s)+/g, '').trim().toLowerCase();
    const cleanTarget = targetAssignee.replace(/^(المستشار|أستاذ|أ\.|\/|\s)+/g, '').trim().toLowerCase();
    if (cleanName && cleanTarget && (cleanName === cleanTarget || cleanName.includes(cleanTarget) || cleanTarget.includes(cleanName))) return true;
    return false;
  }) || users[0];

  const canEdit = canEditCase(currentCase);
  const canDelete = canDeleteCase();

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    addDocumentToCase(currentCase.id, {
      name: newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`,
      size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
      type: 'application/pdf',
      url: '#',
    });

    setNewDocName('');
    setIsUploading(false);
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (!canEdit) return;
    updateCase(currentCase.id, { status: newStatus });
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <PlusCircle className="w-3 h-3" />
            <span>{isRtl ? 'إضافة / قيد' : 'CREATE'}</span>
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Edit3 className="w-3 h-3" />
            <span>{isRtl ? 'تعديل' : 'UPDATE'}</span>
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3 h-3" />
            <span>{isRtl ? 'حذف' : 'DELETE'}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden border-l dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: category?.color || '#2563EB' }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-mono tabular-nums text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {currentCase.caseNumber}
                </h3>
                {currentCase.priority === 'urgent' && (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                    {t('priority_urgent')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {isRtl ? category?.nameAr : category?.nameEn} · {currentCase.caseType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('editCase')}</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => {
                  deleteCase(currentCase.id);
                  setSelectedCaseId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title={t('deleteCase')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setSelectedCaseId(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs Bar: Details | Documents | History */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-xs shrink-0">
          <button
            onClick={() => setActiveDrawerTab('details')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeDrawerTab === 'details'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isRtl ? 'بيانات الملف' : 'Dossier Details'}</span>
          </button>

          <button
            onClick={() => setActiveDrawerTab('documents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeDrawerTab === 'documents'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>{isRtl ? 'المستندات' : 'Documents'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
              {currentCase.documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveDrawerTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeDrawerTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{isRtl ? 'سجل التعديلات والنشاط' : 'Record History'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold font-mono">
              {recordAuditLogs.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Dossier Details */}
        {activeDrawerTab === 'details' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {/* Status Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {t('colStatus')}
              </span>
              {canEdit ? (
                <select
                  value={currentCase.status}
                  onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                  className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white cursor-pointer focus:outline-none"
                >
                  <option value="under_review">{t('status_under_review')}</option>
                  <option value="hearing_scheduled">{t('status_hearing_scheduled')}</option>
                  <option value="expert_report">{t('status_expert_report')}</option>
                  <option value="reserved_judgment">{t('status_reserved_judgment')}</option>
                  <option value="executed">{t('status_executed')}</option>
                  <option value="closed">{t('status_closed')}</option>
                </select>
              ) : (
                <span className="font-semibold text-slate-900 dark:text-white">
                  {t(`status_${currentCase.status}` as any)}
                </span>
              )}
            </div>

            {/* Expert Report Critical Banner */}
            {currentCase.isExpertReport && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{isRtl ? '⚠️ ملف مرتبط بموعد تقرير خبير قضائي' : '⚠️ Linked to Expert Report Deadline'}</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {currentCase.expertReportDueDate
                    ? `${isRtl ? 'الموعد النهائي لإيداع التقرير والتعقيب عليه:' : 'Submission Deadline:'} ${currentCase.expertReportDueDate}`
                    : (isRtl ? 'يجب متابعة الخبير الحسابي/الهندسي وسداد الأمانة المقررة.' : 'Follow up with court-appointed expert.')}
                </p>
              </div>
            )}

            {/* Litigants Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="text-[11px] text-slate-400 font-semibold">{t('colClient')}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentCase.clientName}
                </div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {currentCase.clientRole}
                </div>
              </div>

              {/* Opponent */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="text-[11px] text-slate-400 font-semibold">{t('colOpponent')}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentCase.opponentName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentCase.opponentRole || (isRtl ? 'الطرف الخصم' : 'Opposing Party')}
                </div>
              </div>
            </div>

            {/* Details Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assignee / Responsible Person */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="text-[11px] text-slate-400 font-semibold">{t('colAssignee')}</div>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                    style={{ backgroundColor: assignee?.color || '#4F46E5' }}
                  >
                    {assignee?.initials || 'EL'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {isRtl ? assignee?.name : (assignee?.nameEn || assignee?.name)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isRtl ? assignee?.title : (assignee?.titleEn || assignee?.title)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Court / Branch */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="text-[11px] text-slate-400 font-semibold">{t('colCourt')}</div>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{currentCase.court}</span>
                </div>
                {currentCase.courtBranch && (
                  <div className="text-[11px] text-slate-500">
                    {currentCase.courtBranch}
                  </div>
                )}
              </div>

              {/* Hearing Date & Time */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="text-[11px] text-slate-400 font-semibold">{t('colSessionDate')}</div>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{currentCase.sessionDate || '—'}</span>
                </div>
                {currentCase.sessionTime && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{currentCase.sessionTime}</span>
                  </div>
                )}
              </div>

              {/* Claim Amount */}
              {currentCase.claimAmount && (
                <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <div className="text-[11px] text-slate-400 font-semibold">{t('claimAmountLabel')}</div>
                  <div className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                    {currentCase.claimAmount.toLocaleString()} {t('aed')}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Dynamic Fields for page-specific schemas */}
            {currentCase.customFields && Object.keys(currentCase.customFields).length > 0 && (
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  {isRtl ? 'حقول وتفاصيل النموذج المخصص' : 'Custom Schema Attributes'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(currentCase.customFields).map(([k, v]) => {
                    if (
                      k === 'assigneeId' ||
                      k === 'assignee' ||
                      k === 'الشخص المسؤول' ||
                      v === undefined ||
                      v === null ||
                      v === ''
                    )
                      return null;
                    return (
                      <div
                        key={k}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                      >
                        <span className="text-[10px] text-slate-400 block font-medium truncate">
                          {k}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                          {typeof v === 'boolean'
                            ? v
                              ? isRtl
                                ? 'نعم'
                                : 'Yes'
                              : isRtl
                              ? 'لا'
                              : 'No'
                            : String(v)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Session Purpose & Next Step */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">
                  {t('purposeOfSession')}
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentCase.sessionPurpose || (isRtl ? 'جلسة مرافعة واستكمال المستندات' : 'Hearing session')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">
                  {t('colLastAction')}
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentCase.lastAction}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-1">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                  {t('colNextStep')}
                </span>
                <p className="text-indigo-950 dark:text-indigo-100 font-medium leading-relaxed">
                  {currentCase.nextStep}
                </p>
              </div>
            </div>

            {/* Quick Record History Banner to jump to History Tab */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                    {isRtl ? 'سجل التدقيق والتعديلات' : 'Audit Trail & Edits'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isRtl
                      ? `تم تسجيل ${recordAuditLogs.length} عملية تعديل لهذا الملف`
                      : `${recordAuditLogs.length} logged modifications`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveDrawerTab('history')}
                className="px-3 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                {isRtl ? 'عرض سجل التعديلات' : 'View History'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Documents */}
        {activeDrawerTab === 'documents' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-indigo-500" />
                <span>{t('documentsList')} ({currentCase.documents.length})</span>
              </span>

              {canEdit && (
                <button
                  onClick={() => setIsUploading(!isUploading)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t('uploadDocument')}</span>
                </button>
              )}
            </div>

            {/* Document Upload Form */}
            {isUploading && (
              <form onSubmit={handleAddDocument} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2.5 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                  {isRtl ? 'إرفاق مستند رسمي بالملف' : 'Attach Official Case Document'}
                </span>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder={isRtl ? 'اسم المستند (مثال: مذكرة_دفاع_ختامية.pdf)' : 'File Name (e.g. Defense_Brief.pdf)'}
                  className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsUploading(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg cursor-pointer shadow-xs"
                  >
                    {isRtl ? 'إرفاق المستند' : 'Attach File'}
                  </button>
                </div>
              </form>
            )}

            {/* Documents List */}
            <div className="space-y-2">
              {currentCase.documents.length === 0 ? (
                <div className="text-slate-400 text-xs italic p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  {isRtl ? 'لا توجد مستندات مرفقة حتى الآن.' : 'No attached documents.'}
                </div>
              ) : (
                currentCase.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block text-xs">
                          {doc.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {doc.size} · {doc.uploadedAt} {doc.uploadedBy ? `· ${doc.uploadedBy}` : ''}
                        </span>
                      </div>
                    </div>

                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(isRtl ? `فتح المستند: ${doc.name}` : `Opening document: ${doc.name}`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Download"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Record-Specific History (سجل التعديلات والنشاط للملف) */}
        {activeDrawerTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isRtl ? 'سجل التعديلات الزمني للملف' : 'Individual Record Activity Timeline'}
                  </h4>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {recordAuditLogs.length} {isRtl ? 'تعديل مسجل' : 'edits'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isRtl
                  ? `تتبع تفصيلي لكافة التعديلات التي تمت على هذا الملف حصراً (${currentCase.caseNumber}) مع هوية القائم بالتعديل وتاريخه وقيمه السابقة والجديدة.`
                  : `Detailed chronological log of modifications made ONLY to this record (${currentCase.caseNumber}).`}
              </p>
            </div>

            {/* Timeline View */}
            {recordAuditLogs.length === 0 && (!currentCase.history || currentCase.history.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400">
                <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {isRtl ? 'لا توجد تعديلات مسجلة بعد لهذا الملف.' : 'No modifications recorded yet.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isRtl
                    ? 'أي تعديل في الحقول أو الحالة أو إرفاق مستند سيتم تسجيله تلقائياً هنا بالتفصيل.'
                    : 'Any updates to fields, status, or documents will automatically appear here.'}
                </p>
              </div>
            ) : (
              <div className="relative pl-6 pr-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 before:start-8">
                {recordAuditLogs.map((log) => {
                  const d = new Date(log.timestamp);
                  const isExpanded = expandedLogId === log.id;
                  const hasDiffs = log.diffs && log.diffs.length > 0;

                  return (
                    <div key={log.id} className="relative flex items-start gap-4">
                      {/* Timeline Node Dot */}
                      <div className="absolute -start-6.5 mt-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 dark:bg-indigo-400 shrink-0 shadow-xs" />

                      {/* Content Card */}
                      <div className="flex-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 space-y-2 shadow-xs">
                        {/* Top row: Action & Timestamp */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {getActionBadge(log.actionType)}
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {log.userName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {log.userRole || 'Admin'}
                            </span>
                          </div>

                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {d.toLocaleDateString(isRtl ? 'ar-AE' : 'en-GB')} {d.toLocaleTimeString(isRtl ? 'ar-AE' : 'en-GB')}
                            </span>
                          </div>
                        </div>

                        {/* User Email */}
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.userEmail}
                        </div>

                        {/* Summary of change */}
                        <div className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {isRtl ? log.changeSummaryAr : log.changeSummaryEn}
                        </div>

                        {/* Field Diffs if available */}
                        {hasDiffs && (
                          <div className="pt-1">
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              <span>
                                {isExpanded
                                  ? (isRtl ? 'إخفاء تفاصيل الحقول' : 'Hide Field Details')
                                  : (isRtl ? `عرض تفاصيل الحقول (${log.diffs?.length})` : `Show Field Details (${log.diffs?.length})`)}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                                {log.diffs?.map((diff, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] py-1 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                  >
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {isRtl ? diff.fieldLabelAr : diff.fieldLabelEn}:
                                    </span>
                                    <div className="flex items-center gap-1.5 font-mono">
                                      <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 line-through">
                                        {String(diff.oldValue ?? '—')}
                                      </span>
                                      <span className="text-slate-400">→</span>
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold">
                                        {String(diff.newValue ?? '—')}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Legacy Record History Events from currentCase.history */}
                {currentCase.history?.map((h) => (
                  <div key={h.id} className="relative flex items-start gap-4 opacity-80">
                    <div className="absolute -start-6.5 mt-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-400 shrink-0" />
                    <div className="flex-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {isRtl ? h.action : h.actionEn}
                        </span>
                        <span className="text-slate-400 mx-1.5 text-[10px]">({h.performedBy})</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">{h.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
