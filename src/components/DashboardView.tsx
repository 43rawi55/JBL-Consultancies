import React from 'react';
import {
  Scale,
  Calendar,
  AlertTriangle,
  Gavel,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  FileText,
  UserCheck,
  Building,
  Plus,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CATEGORY_MAP } from '../data/categories.ts';
import { CaseItem } from '../types/schema.ts';

export const DashboardView: React.FC = () => {
  const {
    cases,
    setActiveTab,
    setSelectedCategory,
    setSelectedCaseId,
    setIsCreateModalOpen,
    isRtl,
    t,
  } = useApp();

  const { currentUser, users, canCreateCase } = useAuth();

  // Metrics computation
  const totalCases = cases.length;
  const activeLitigation = cases.filter(
    (c) => c.status === 'hearing_scheduled' || c.status === 'under_review'
  ).length;
  const expertReportsCount = cases.filter((c) => c.isExpertReport).length;
  const executionsCount = cases.filter((c) => c.categoryId === 'executions').length;
  const closedCount = cases.filter((c) => c.status === 'closed' || c.status === 'executed').length;

  // Urgent upcoming cases (within next 3 days)
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);

  const urgentCases = cases.filter((c) => {
    if (!c.sessionDate) return false;
    const sessionDate = new Date(c.sessionDate);
    return sessionDate >= today && sessionDate <= threeDaysLater;
  });

  // User's own assigned cases
  const myAssignedCases = currentUser
    ? cases.filter((c) => c.assigneeId === currentUser.id)
    : [];

  // Court distribution
  const courtCounts = cases.reduce((acc, curr) => {
    const courtName = curr.court ? curr.court.split('-')[0].trim() : (isRtl ? 'أخرى' : 'Other');
    acc[courtName] = (acc[courtName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCaseClick = (caseItem: CaseItem) => {
    setSelectedCaseId(caseItem.id);
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 p-6 rounded-2xl text-white shadow-sm border border-slate-700/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentUser ? (isRtl ? currentUser.title : currentUser.titleEn) : 'Law Firm Portal'}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-300 font-mono tabular-nums">
              {new Date().toLocaleDateString(isRtl ? 'ar-AE' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isRtl ? `أهلاً بك، ${currentUser?.name || 'زائر كريم'}` : `Welcome back, ${currentUser?.nameEn || 'Counsel'}`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            {isRtl
              ? `لديك ${myAssignedCases.length} قضية مسندة إليك مباشرة، من بينها ${
                  myAssignedCases.filter((c) => c.priority === 'urgent').length
                } قضايا عاجلة تتطلب اتخاذ إجراء.`
              : `You have ${myAssignedCases.length} cases assigned to you, with ${
                  myAssignedCases.filter((c) => c.priority === 'urgent').length
                } marked urgent.`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canCreateCase() && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newCase')}</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('calendar')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>{t('calendar')}</span>
          </button>
        </div>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Cases */}
        <div
          onClick={() => {
            setActiveTab('cases');
            setSelectedCategory(null);
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('metricTotalCases')}</span>
            <Scale className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalCases}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {isRtl ? 'كافة الأقسام والمحاكم' : 'All practice areas'}
          </div>
        </div>

        {/* Hearings Scheduled */}
        <div
          onClick={() => setActiveTab('calendar')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-sky-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('metricUnderLitigation')}</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {activeLitigation}
          </div>
          <div className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1 font-medium">
            <span>{isRtl ? 'جلسات مرافعة قائمة' : 'Active court hearings'}</span>
          </div>
        </div>

        {/* Expert Reports (Critical UAE Law Firm metric) */}
        <div
          onClick={() => setActiveTab('calendar')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs hover:border-amber-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold">{t('metricExpertReports')}</span>
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-900 dark:text-amber-300">
            {expertReportsCount}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            {isRtl ? 'مواعيد تسليم حاسمة' : 'Pending expert submissions'}
          </div>
        </div>

        {/* Executions */}
        <div
          onClick={() => {
            setActiveTab('cases');
            setSelectedCategory('executions');
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('metricExecutions')}</span>
            <Gavel className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {executionsCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {isRtl ? 'حجوزات واسترداد أموال' : 'Active asset attachments'}
          </div>
        </div>

        {/* Closed Cases */}
        <div
          onClick={() => {
            setActiveTab('cases');
            setSelectedCategory(null);
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('metricClosed')}</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {closedCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {isRtl ? 'أحكام منفذة ومحفوظة' : 'Archived & settled'}
          </div>
        </div>
      </div>

      {/* Urgent Hearings Banner / Alert */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="text-sm font-bold">{t('urgentHearingsAlert')}</h3>
          </div>
          <button
            onClick={() => setActiveTab('calendar')}
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{isRtl ? 'عرض بالتقويم' : 'Open in Calendar'}</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {urgentCases.length === 0 ? (
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
            {t('noUrgentAlerts')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentCases.map((c) => (
              <div
                key={c.id}
                onClick={() => handleCaseClick(c)}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-500/30 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {c.caseNumber}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {c.sessionDate}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {c.clientName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center justify-between">
                  <span className="truncate">{c.court}</span>
                  {(() => {
                    const u = users.find(
                      (usr) =>
                        usr.id === c.assigneeId ||
                        usr.email.toLowerCase() === String(c.assigneeId).toLowerCase() ||
                        usr.name === c.assigneeId
                    ) || users[0];
                    return u ? (
                      <span className="inline-flex items-center gap-1 shrink-0 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                          style={{ backgroundColor: u.color || '#4F46E5' }}
                        >
                          {u.initials}
                        </span>
                        <span className="truncate max-w-[85px]">{isRtl ? u.name : u.nameEn}</span>
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-amber-700 dark:text-amber-400 font-medium truncate">
                    {c.isExpertReport ? (isRtl ? '⚠️ تقرير خبرة' : '⚠️ Expert Report') : c.nextStep}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium text-[10px] flex items-center gap-0.5">
                    {isRtl ? 'التفاصيل' : 'Details'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Court Distribution & Practice Areas Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Court Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              <span>{t('courtDistribution')}</span>
            </h3>
            <span className="text-xs text-slate-400">{Object.keys(courtCounts).length} {isRtl ? 'محاكم' : 'Courts'}</span>
          </div>

          <div className="space-y-3">
            {Object.entries(courtCounts).map(([court, count]) => {
              const percent = Math.round((count / totalCases) * 100);
              return (
                <div key={court} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{court}</span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Practice Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              <span>{t('categoryDistribution')}</span>
            </h3>
            <button
              onClick={() => {
                setActiveTab('cases');
                setSelectedCategory(null);
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isRtl ? 'عرض الكل' : 'View all'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
            {Array.from(CATEGORY_MAP.values()).slice(0, 6).map((cat) => {
              const count = cases.filter((c) => c.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setActiveTab('cases');
                    setSelectedCategory(cat.id);
                  }}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {isRtl ? cat.nameAr : cat.nameEn}
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
