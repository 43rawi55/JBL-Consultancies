import React, { useState, useMemo } from 'react';
import {
  History,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  User,
  PlusCircle,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { AuditActionType, AuditLogEntry } from '../types/schema.ts';

export const AuditLogView: React.FC = () => {
  const {
    auditLogs,
    clearAuditLogs,
    exportAuditLogs,
    setSelectedCaseId,
    cases,
    setActiveTab,
    isRtl,
    t,
  } = useApp();

  const { users, currentUser, isAdmin } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditActionType | 'all'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // 1. Action filter
      if (actionFilter !== 'all' && log.actionType !== actionFilter) {
        return false;
      }

      // 2. User filter (matches name, email, or role)
      if (userFilter !== 'all') {
        const matchUser =
          log.userEmail.toLowerCase() === userFilter.toLowerCase() ||
          log.userName.toLowerCase() === userFilter.toLowerCase();
        if (!matchUser) return false;
      }

      // 3. Date preset filter
      if (dateFilter !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - logDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (dateFilter === 'today' && diffDays > 1) return false;
        if (dateFilter === '7days' && diffDays > 7) return false;
        if (dateFilter === '30days' && diffDays > 30) return false;
      }

      // 4. Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTarget = log.targetRecordIdentifier.toLowerCase().includes(query);
        const inSummary =
          log.changeSummaryAr.toLowerCase().includes(query) ||
          log.changeSummaryEn.toLowerCase().includes(query);
        const inUser =
          log.userName.toLowerCase().includes(query) ||
          log.userEmail.toLowerCase().includes(query);
        const inCat = log.targetCategoryName?.toLowerCase().includes(query);
        const inDiffs = log.diffs?.some(
          (d) =>
            d.fieldLabelAr.toLowerCase().includes(query) ||
            d.fieldLabelEn.toLowerCase().includes(query) ||
            String(d.oldValue).toLowerCase().includes(query) ||
            String(d.newValue).toLowerCase().includes(query)
        );

        if (!inTarget && !inSummary && !inUser && !inCat && !inDiffs) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, actionFilter, userFilter, dateFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const updates = auditLogs.filter((l) => l.actionType === 'UPDATE').length;
    const creates = auditLogs.filter((l) => l.actionType === 'CREATE').length;
    const deletes = auditLogs.filter((l) => l.actionType === 'DELETE').length;
    const uniqueUsers = new Set(auditLogs.map((l) => l.userEmail)).size;
    return { total, updates, creates, deletes, uniqueUsers };
  }, [auditLogs]);

  // Strict Admin Guard
  if (!isAdmin) {
    return (
      <div className="p-6 md:p-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {isRtl ? 'صلاحية الدخول مرفوضة' : 'Access Restricted'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          {isRtl
            ? 'سجل النشاطات والتدقيق الداخلي (Audit Log) مخصص حصرياً للمدير الإداري والشريك (Admin) لضمان سرية البيانات والرقابة على تعديلات القضايا.'
            : 'The System Audit Log is strictly restricted to Administrators to maintain data integrity and regulatory compliance.'}
        </p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isRtl ? 'العودة للوحة القيادة' : 'Return to Dashboard'}</span>
        </button>
      </div>
    );
  }

  // Format relative timestamp
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      let relative = '';
      if (diffMinutes < 1) {
        relative = isRtl ? 'الآن' : 'Just now';
      } else if (diffMinutes < 60) {
        relative = isRtl ? `منذ ${diffMinutes} دقيقة` : `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        relative = isRtl ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
      } else {
        relative = isRtl ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
      }

      const fullDate = d.toLocaleDateString(isRtl ? 'ar-AE' : 'en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const fullTime = d.toLocaleTimeString(isRtl ? 'ar-AE' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      return { full: `${fullDate} · ${fullTime}`, relative };
    } catch {
      return { full: isoString, relative: '' };
    }
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{isRtl ? 'إضافة / إنشاء' : 'CREATE'}</span>
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Edit3 className="w-3.5 h-3.5 shrink-0" />
            <span>{isRtl ? 'تعديل / تحديث' : 'UPDATE'}</span>
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>{isRtl ? 'حذف نهائي' : 'DELETE'}</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isRtl ? 'سجل النشاطات وتدقيق النظام' : 'System Activity & Audit Log'}
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {isRtl ? 'صلاحية المدير حصراً' : 'Admin Only'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRtl
                ? 'سجل مركزي غير قابل للتلاعب يرصد تاريخ وتفاصيل كافة عمليات الإضافة والتعديل والحذف المنفذة في النظام'
                : 'Centralized audit trail tracking all data modifications, updates, creations, and deletions'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportAuditLogs}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            title={isRtl ? 'تصدير كامل السجل إلى ملف Excel' : 'Export audit log to Excel'}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isRtl ? 'تصدير إلى Excel (.xlsx)' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => setIsConfirmClearOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title={isRtl ? 'تفريغ السجل' : 'Clear log'}
          >
            <Trash2 className="w-4 h-4" />
            <span>{isRtl ? 'تفريغ السجل' : 'Clear Log'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isRtl ? 'إجمالي الأنشطة' : 'Total Events'}
            </span>
            <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <History className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {stats.total.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {stats.uniqueUsers} {isRtl ? 'مستخدمين فاعلين' : 'Active users'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isRtl ? 'عمليات التعديل' : 'Updates'}
            </span>
            <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Edit3 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {stats.updates.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isRtl ? 'تعديل حقول وحالات ومستندات' : 'Field & status updates'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isRtl ? 'سجلات جديدة' : 'Created Records'}
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {stats.creates.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isRtl ? 'قيد قضايا وإدراج سطور' : 'New cases & rows'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isRtl ? 'عمليات الحذف' : 'Deletions'}
            </span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {stats.deletes.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isRtl ? 'ملفات محذوفة نهائياً' : 'Deleted from database'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث في السجل برقم الدعوى، الموكل، المستخدم، أو تفاصيل التغيير...' : 'Search by case no., client, user, or change details...'}
              className={`w-full text-xs py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 ${
                isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          {/* Action Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as any)}
              className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">{isRtl ? 'كافة الإجراءات (Actions)' : 'All Actions'}</option>
              <option value="CREATE">{isRtl ? 'إضافة / إنشاء (CREATE)' : 'Create'}</option>
              <option value="UPDATE">{isRtl ? 'تعديل / تحديث (UPDATE)' : 'Update'}</option>
              <option value="DELETE">{isRtl ? 'حذف (DELETE)' : 'Delete'}</option>
            </select>

            {/* User Filter */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">{isRtl ? 'كافة المستخدمين (Users)' : 'All Users'}</option>
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            {/* Date Preset Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">{isRtl ? 'كافة الفترات' : 'All Time'}</option>
              <option value="today">{isRtl ? 'اليوم (Today)' : 'Today'}</option>
              <option value="7days">{isRtl ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
              <option value="30days">{isRtl ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
            </select>

            {/* Reset Filters */}
            {(searchQuery || actionFilter !== 'all' || userFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActionFilter('all');
                  setUserFilter('all');
                  setDateFilter('all');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title={isRtl ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter results info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            {isRtl
              ? `عرض ${filteredLogs.length} سجل من إجمالي ${auditLogs.length} نشاط مسجل`
              : `Showing ${filteredLogs.length} of ${auditLogs.length} total events`}
          </span>
          {filteredLogs.length !== auditLogs.length && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {isRtl ? 'تم تطبيق عوامل التصفية' : 'Filters active'}
            </span>
          )}
        </div>
      </div>

      {/* Audit Log Chronological Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isRtl ? 'لا توجد أنشطة مطابقة' : 'No Activity Logs Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {isRtl
                ? 'لم يتم العثور على سجلات تطابق شروط البحث أو الفلاتر المحددة أعلاه.'
                : 'No log entries match the selected filters or search terms.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 text-start w-32">{isRtl ? 'نوع الإجراء' : 'Action'}</th>
                  <th className="py-3 px-4 text-start w-48">{isRtl ? 'التاريخ والساعة' : 'Timestamp'}</th>
                  <th className="py-3 px-4 text-start w-56">{isRtl ? 'المستخدم المسؤول' : 'User'}</th>
                  <th className="py-3 px-4 text-start w-64">{isRtl ? 'السجل والقسم' : 'Target Record'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'تفاصيل التغيير' : 'Change Summary'}</th>
                  <th className="py-3 px-4 text-center w-20">{isRtl ? 'الملف' : 'View'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  const time = formatTime(log.timestamp);
                  const isExpanded = expandedLogId === log.id;
                  const hasDiffs = log.diffs && log.diffs.length > 0;
                  const targetCaseExists = cases.some((c) => c.id === log.targetRecordId);

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isExpanded ? 'bg-slate-50/60 dark:bg-slate-800/30' : ''
                        }`}
                      >
                        {/* Action Badge */}
                        <td className="py-3.5 px-4 align-top">
                          {getActionBadge(log.actionType)}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="font-mono text-slate-800 dark:text-slate-200 text-xs">
                            {time.full}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{time.relative}</span>
                          </div>
                        </td>

                        {/* User */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {log.userName.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {log.userName}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {log.userEmail}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Target Record */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {log.targetRecordIdentifier}
                          </div>
                          {log.targetCategoryName && (
                            <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {log.targetCategoryName}
                            </span>
                          )}
                        </td>

                        {/* Change Details */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {isRtl ? log.changeSummaryAr : log.changeSummaryEn}
                          </div>

                          {/* Expandable Field Diffs Button */}
                          {hasDiffs && (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              <span>
                                {isExpanded
                                  ? (isRtl ? 'إخفاء الفروقات التفصيلية' : 'Hide Field Diffs')
                                  : (isRtl ? `عرض تفاصيل الحقول المعدلة (${log.diffs?.length})` : `View Modified Fields (${log.diffs?.length})`)}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </td>

                        {/* Target Link */}
                        <td className="py-3.5 px-4 align-top text-center">
                          {targetCaseExists ? (
                            <button
                              onClick={() => setSelectedCaseId(log.targetRecordId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title={isRtl ? 'عرض ملف الدعوى' : 'Open dossier'}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              className="text-slate-300 dark:text-slate-600 cursor-not-allowed"
                              title={isRtl ? 'السجل محذوف' : 'Record deleted'}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Diffs Row */}
                      {isExpanded && hasDiffs && (
                        <tr className="bg-indigo-50/30 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40">
                          <td colSpan={6} className="p-4">
                            <div className="space-y-2 rounded-xl bg-white dark:bg-slate-900/90 p-3.5 border border-indigo-100 dark:border-indigo-900/50">
                              <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider block">
                                {isRtl ? 'الحقول المعدلة وقيمها قبل وبعد:' : 'Field-by-Field Modification Diffs:'}
                              </span>
                              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {log.diffs?.map((diff, idx) => (
                                  <div
                                    key={idx}
                                    className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                  >
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {isRtl ? diff.fieldLabelAr : diff.fieldLabelEn}:
                                    </span>
                                    <div className="flex items-center gap-2 font-mono text-[11px]">
                                      {/* Old Value */}
                                      <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 line-through">
                                        {String(diff.oldValue ?? '— (فارغ)')}
                                      </span>
                                      <span className="text-slate-400">→</span>
                                      {/* New Value */}
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 font-bold">
                                        {String(diff.newValue ?? '— (فارغ)')}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal to Clear Logs */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isRtl ? 'تأكيد تفريغ سجل النشاطات بالكامل؟' : 'Confirm Clearing Audit Log?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isRtl
                  ? 'سيتم حذف جميع سجلات التدقيق والأنشطة السابقة نهائياً من الذاكرة المحلية. لا يمكن التراجع عن هذا الإجراء.'
                  : 'All historical activity events will be permanently deleted from local storage. This action cannot be undone.'}
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAuditLogs();
                  setIsConfirmClearOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer shadow-xs"
              >
                {isRtl ? 'نعم، تفريغ السجل' : 'Yes, Clear All Logs'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
