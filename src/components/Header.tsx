import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Globe,
  UserCheck,
  LogOut,
  Shield,
  Briefcase,
  Eye,
  ChevronDown,
  Table,
  Columns3,
  LogIn,
  SlidersHorizontal,
  Bell,
  AlertTriangle,
  Calendar,
  FileSpreadsheet,
  Mail,
  Send,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CATEGORY_MAP } from '../data/categories.ts';
import { UserRole, CaseItem, EmailReminderLog, ColumnDefinition } from '../types/schema.ts';
import { getStoredEmailLogs, dispatchEmailAlert, DEFAULT_USER_EMAIL } from '../utils/reminderService.ts';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const {
    lang,
    setLang,
    isRtl,
    theme,
    toggleTheme,
    activeTab,
    selectedCategory,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterAssignedToMe,
    setFilterAssignedToMe,
    cases,
    setSelectedCaseId,
    setIsGoogleSheetsModalOpen,
    showToast,
    t,
  } = useApp();

  const {
    currentUser,
    logout,
    isAdmin,
    isLawyer,
    isViewer,
  } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'sessions' | 'email'>('sessions');
  const [emailLogs, setEmailLogs] = useState<EmailReminderLog[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNotificationsOpen) {
      setEmailLogs(getStoredEmailLogs());
    }
  }, [isNotificationsOpen]);

  const handleSendTestEmailNotification = () => {
    const targetCase = notifications[0] || cases[0];
    if (!targetCase) return;

    const dummyCol: ColumnDefinition = {
      id: 'hearing_time',
      nameAr: 'موعد الجلسة والمرافعة',
      nameEn: 'Hearing Time',
      type: 'time',
      hasEmailReminder: true,
      reminderMinutesBefore: 30,
      reminderEmail: DEFAULT_USER_EMAIL,
    };

    dispatchEmailAlert(
      targetCase,
      dummyCol,
      targetCase.sessionTime || targetCase.customFields?.hallAndTime || '09:30 ص',
      30,
      DEFAULT_USER_EMAIL
    );

    setEmailLogs(getStoredEmailLogs());
    showToast(
      isRtl
        ? `تم إرسال إشعار التنبيه التجريبي بنجاح إلى (${DEFAULT_USER_EMAIL})`
        : `Email alert sent to (${DEFAULT_USER_EMAIL})`,
      'success'
    );
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Upcoming notifications (cases with sessions in next 4 days or expert reports)
  const today = new Date();
  const next4Days = new Date();
  next4Days.setDate(today.getDate() + 4);

  const notifications = cases.filter((c) => {
    if (!c.sessionDate) return false;
    const sessionD = new Date(c.sessionDate);
    return sessionD >= today && sessionD <= next4Days;
  });

  // Compute breadcrumb label
  const getBreadcrumbTitle = () => {
    if (activeTab === 'dashboard') return t('dashboard');
    if (activeTab === 'calendar') return t('calendar');
    if (activeTab === 'users') return t('users');
    if (activeTab === 'audit_log') return isRtl ? 'سجل النشاطات وتدقيق النظام' : 'Activity & Audit Log';
    if (activeTab === 'settings') return t('settings');
    if (selectedCategory) {
      const cat = CATEGORY_MAP.get(selectedCategory);
      return cat ? (isRtl ? cat.nameAr : cat.nameEn) : t('allCases');
    }
    return t('allCases');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
            {t('role_admin')}
          </span>
        );
      case 'lawyer':
        return (
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
            {t('role_lawyer')}
          </span>
        );
      case 'viewer':
        return (
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            {t('role_viewer')}
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-4">
        {/* Zone 1: Mobile Hamburger + Breadcrumb Trail */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            aria-label="Open sidebar"
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs min-w-0">
            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
              {t('brandName')}
            </span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
            <h1 className="font-semibold text-slate-900 dark:text-white truncate text-sm">
              {getBreadcrumbTitle()}
            </h1>
          </nav>
        </div>

        {/* Zone 2: Search Bar & Views (when on Cases or Dashboard) */}
        <div className="flex-1 max-w-md hidden md:flex items-center gap-2">
          {activeTab === 'cases' && (
            <>
              <div className="relative flex-1">
                <Search
                  className={`w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                    isRtl ? 'right-3' : 'left-3'
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className={`w-full h-8 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all ${
                    isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'
                  }`}
                />
              </div>

              {/* View Switcher: Table / Board */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('table')}
                  title={t('tableView')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('board')}
                  title={t('boardView')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    viewMode === 'board'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  <Columns3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Assigned to me toggle */}
              <button
                onClick={() => setFilterAssignedToMe(!filterAssignedToMe)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                  filterAssignedToMe
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {t('assignedToMe')}
              </button>
            </>
          )}
        </div>

        {/* Zone 3: Actions (Notifications, Language, Theme, User Google Profile) */}
        <div className="flex items-center gap-2">
          {/* Google Sheets Sync shortcut */}
          <button
            onClick={() => setIsGoogleSheetsModalOpen(true)}
            title={isRtl ? 'إعدادات ومزامنة Google Sheets' : 'Google Sheets Sync Settings'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline font-mono">Google Sheets</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              aria-label="Court session notifications"
              className="relative p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div
                className={`absolute ${
                  isRtl ? 'left-0' : 'right-0'
                } mt-2 w-88 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
              >
                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setNotifTab('sessions')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      notifTab === 'sessions'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isRtl ? 'الجلسات القادمة' : 'Sessions'}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      {notifications.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotifTab('email')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      notifTab === 'email'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isRtl ? 'تنبيهات البريد' : 'Email Alerts'}</span>
                    {emailLogs.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                        {emailLogs.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab 1: Sessions */}
                {notifTab === 'sessions' ? (
                  <div className="py-1 max-h-72 overflow-y-auto space-y-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {isRtl ? 'لا توجد جلسات مجدولة قريباً' : 'No upcoming hearings'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setSelectedCaseId(n.id);
                            setIsNotificationsOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs space-y-1 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                              {n.caseNumber}
                            </span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                              {n.sessionDate}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-medium">
                            {n.clientName}
                          </div>
                          {n.isExpertReport && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{isRtl ? 'موعد تقرير خبرة' : 'Expert Report Due'}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Tab 2: Email Alerts & Live Test Trigger */
                  <div className="space-y-2 py-1">
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 text-[11px] space-y-2">
                      <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-200 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{DEFAULT_USER_EMAIL}</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 font-medium">
                          {isRtl ? 'نشط ومفعّل' : 'Active'}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-700 dark:text-indigo-300">
                        {isRtl
                          ? 'يتم إرسال إشعارات وتنبيهات أوتوماتيكية قبل مواعيد الجلسات والمهام المحددة.'
                          : 'Automated email alerts are dispatched before scheduled session dates and times.'}
                      </p>

                      <button
                        type="button"
                        onClick={handleSendTestEmailNotification}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isRtl ? 'إرسال تنبيه تجريبي إلى بريدي الآن' : 'Send Test Alert to Email'}</span>
                      </button>
                    </div>

                    {/* Sent Email History */}
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1">
                        {isRtl ? 'سجل التنبيهات المرسلة حديثاً' : 'Recent Dispatched Alerts'}
                      </span>

                      <div className="max-h-52 overflow-y-auto space-y-1.5">
                        {emailLogs.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            {isRtl ? 'لا توجد تنبيهات مرسلة بعد' : 'No alerts dispatched yet'}
                          </div>
                        ) : (
                          emailLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span className="truncate max-w-[170px]">{log.caseNumber || log.clientName}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {log.sentTimestamp}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {log.subject}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            title="Toggle Arabic / English"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={
              theme === 'dark'
                ? isRtl
                  ? 'التبديل إلى الثيم الأبيض (النهاري)'
                  : 'Switch to White (Light) Theme'
                : isRtl
                ? 'التبديل إلى الثيم الأسود (الليلي)'
                : 'Switch to Black (Dark) Theme'
            }
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden md:inline">{isRtl ? 'أبيض (نهاري)' : 'Light'}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200 shrink-0" />
                <span className="hidden md:inline">{isRtl ? 'أسود (ليلي)' : 'Dark'}</span>
              </>
            )}
          </button>

          {/* User Account Menu */}
          {currentUser && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-xs shrink-0"
                  style={{ backgroundColor: currentUser.color || '#2563EB' }}
                >
                  {currentUser.initials}
                </div>
                <div className="text-start">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[140px] sm:max-w-[180px]">
                    {isRtl ? currentUser.name : currentUser.nameEn}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                    {currentUser.role === 'admin'
                      ? t('role_admin')
                      : currentUser.role === 'lawyer'
                      ? t('role_lawyer')
                      : t('role_viewer')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div
                  className={`absolute ${
                    isRtl ? 'left-0' : 'right-0'
                  } mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50`}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {isRtl ? currentUser.name : currentUser.nameEn}
                      </div>
                      {getRoleBadge(currentUser.role)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {currentUser.email}
                    </div>
                  </div>

                  {/* Strict User Details & Log Out only - No account switching or impersonation */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer border border-rose-200/50 dark:border-rose-900/30"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('signOut')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};
