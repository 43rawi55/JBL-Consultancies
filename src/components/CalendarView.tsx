import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  AlertTriangle,
  Scale,
  MapPin,
  User,
  Filter,
  List,
  Grid3X3,
  Printer,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CaseItem } from '../types/schema.ts';

export const CalendarView: React.FC = () => {
  const { cases, setSelectedCaseId, setIsCreateModalOpen, isRtl, t } = useApp();
  const { users, canCreateCase } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterExpertOnly, setFilterExpertOnly] = useState(false);
  const [filterLawyer, setFilterLawyer] = useState('all');
  const [viewStyle, setViewStyle] = useState<'grid' | 'agenda'>('grid');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month and total days
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Filter cases for the current calendar view
  const calendarCases = cases.filter((c) => {
    if (!c.sessionDate) return false;
    if (filterExpertOnly && !c.isExpertReport) return false;
    if (filterLawyer !== 'all' && c.assigneeId !== filterLawyer) return false;
    return true;
  });

  // Map cases by day: YYYY-MM-DD -> CaseItem[]
  const casesByDate = calendarCases.reduce((acc, c) => {
    const d = c.sessionDate;
    if (d) {
      if (!acc[d]) acc[d] = [];
      acc[d].push(c);
    }
    return acc;
  }, {} as Record<string, CaseItem[]>);

  // Month name
  const monthName = currentDate.toLocaleDateString(isRtl ? 'ar-AE' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const weekDayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDayNames = isRtl ? weekDayNamesAr : weekDayNamesEn;

  // Build calendar matrix (42 cells: 6 weeks x 7 days)
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }
  while (daysArray.length % 7 !== 0) {
    daysArray.push(null);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col min-h-[85vh] h-full bg-white dark:bg-slate-950 p-3 sm:p-4 lg:p-6 space-y-4 w-full max-w-7xl mx-auto overflow-visible">
      {/* Calendar Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {monthName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('expertDeadlineBanner')}
            </p>
          </div>
        </div>

        {/* Controls: View Style, Prev/Next, Today, Filters, Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle: Grid / Agenda */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewStyle('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewStyle === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500'
              }`}
              title={isRtl ? 'عرض الشبكة الشهرية' : 'Month Grid'}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewStyle('agenda')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewStyle === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500'
              }`}
              title={isRtl ? 'عرض جدول المواعيد (الأجندة)' : 'Agenda List'}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lawyer Filter */}
          <select
            value={filterLawyer}
            onChange={(e) => setFilterLawyer(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">{t('allLawyers')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {isRtl ? u.name : u.nameEn}
              </option>
            ))}
          </select>

          {/* Expert Reports Only Toggle */}
          <button
            onClick={() => setFilterExpertOnly(!filterExpertOnly)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterExpertOnly
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-900/60 hover:bg-amber-50/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('expertOnly')}</span>
          </button>

          {/* Today Button */}
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            {t('today')}
          </button>

          {/* Month Steppers */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={isRtl ? nextMonth : prevMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={isRtl ? prevMonth : nextMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Print Court Schedule */}
          <button
            onClick={() => window.print()}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={isRtl ? 'طباعة جدول الجلسات' : 'Print Schedule'}
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Calendar View: Month Grid or Agenda List */}
      {viewStyle === 'grid' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col flex-1 overflow-x-auto min-w-0">
          <div className="min-w-[700px] flex flex-col flex-1">
            {/* Day Header Row */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-center py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              {weekDayNames.map((dayName, idx) => (
                <div key={idx} className="truncate">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Cells Grid */}
            <div className="grid grid-cols-7 auto-rows-fr flex-1 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
              {daysArray.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty_${idx}`}
                      className="bg-slate-50/40 dark:bg-slate-950/40 min-h-[120px] p-1.5"
                    />
                  );
                }

                const dayPadded = String(day).padStart(2, '0');
                const monthPadded = String(month + 1).padStart(2, '0');
                const formattedDate = `${year}-${monthPadded}-${dayPadded}`;
                const isToday = formattedDate === todayStr;
                const dayCases = casesByDate[formattedDate] || [];

                return (
                  <div
                    key={`day_${day}`}
                    className={`min-h-[120px] p-1.5 transition-colors flex flex-col group relative ${
                      isToday
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Date Number Header & Quick Add */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded-md font-semibold ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {day}
                      </span>

                      <div className="flex items-center gap-1">
                        {canCreateCase() && (
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 rounded transition-opacity cursor-pointer"
                            title={isRtl ? 'إضافة جلسة في هذا اليوم' : 'Add session on this date'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                        {dayCases.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {dayCases.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Event Markers for this Day */}
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[140px]">
                      {dayCases.map((c) => {
                        const isExpert = c.isExpertReport;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCaseId(c.id)}
                            className={`p-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer border truncate ${
                              isExpert
                                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 hover:bg-amber-200/80 shadow-2xs'
                                : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100/80'
                            }`}
                            title={`${c.caseNumber} - ${c.clientName} (${c.court})`}
                          >
                            <div className="flex items-center gap-1 font-mono font-bold truncate">
                              {isExpert && (
                                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                              )}
                              <span className="truncate">{c.caseNumber}</span>
                            </div>
                            <div className="text-[10px] truncate text-slate-600 dark:text-slate-300">
                              {c.clientName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Agenda List View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 flex-1 overflow-y-auto space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            {isRtl ? 'جدول جلسات المحاكم القادمة' : 'Court Hearings Agenda'}
          </h3>

          {Object.keys(casesByDate).length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {isRtl ? 'لا توجد جلسات مجدولة' : 'No scheduled sessions'}
            </div>
          ) : (
            Object.entries(casesByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateStr, sessionCases]) => (
                <div
                  key={dateStr}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="font-mono">{dateStr}</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      {sessionCases.length} {isRtl ? 'جلسات' : 'hearings'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {sessionCases.map((c) => {
                      const caseLawyer = users.find(
                        (u) =>
                          u.id === c.assigneeId ||
                          u.email.toLowerCase() === String(c.assigneeId).toLowerCase() ||
                          u.name === c.assigneeId
                      ) || users[0];

                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCaseId(c.id)}
                          className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-500/50 transition-colors cursor-pointer text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {c.caseNumber}
                              </span>
                              {c.isExpertReport && (
                                <span className="text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded font-semibold">
                                  {isRtl ? 'تقرير خبرة' : 'Expert Report'}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                              {c.clientName} vs {c.opponentName}
                            </div>
                            {caseLawyer && (
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <span
                                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                                  style={{ backgroundColor: caseLawyer.color || '#4F46E5' }}
                                >
                                  {caseLawyer.initials}
                                </span>
                                <span>{isRtl ? caseLawyer.name : caseLawyer.nameEn}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-end shrink-0">
                            <div className="text-slate-500 text-[11px]">{c.court}</div>
                            <div className="text-indigo-600 font-mono text-[10px]">
                              {c.sessionTime || '10:00 AM'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};
