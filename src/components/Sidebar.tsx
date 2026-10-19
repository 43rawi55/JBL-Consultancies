import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Users,
  Settings,
  Plus,
  Scale,
  Briefcase,
  Gavel,
  Building2,
  ShieldAlert,
  MailWarning,
  FileText,
  BadgeCheck,
  Home,
  FileSignature,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  Trash2,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CategoryKey } from '../types/schema.ts';

// Map icon string to component
const categoryIcons: Record<string, React.ElementType> = {
  Scale,
  Briefcase,
  Gavel,
  Building2,
  FolderKanban,
  ShieldAlert,
  MailWarning,
  FileText,
  BadgeCheck,
  Home,
  FileSignature,
  Layers,
  Sparkles,
};

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    categories,
    selectedCategory,
    setSelectedCategory,
    deleteCategory,
    cases,
    isRtl,
    t,
    setIsCreateModalOpen,
    setIsNewPageModalOpen,
    firmLogo,
    firmDetails,
  } = useApp();
  const { canCreateCase, isAdmin } = useAuth();

  const [isFoldersOpen, setIsFoldersOpen] = useState(true);

  // Calculate count per category
  const getCategoryCount = (catId: CategoryKey) => {
    return cases.filter((c) => c.categoryId === catId).length;
  };

  const handleSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab !== 'cases') {
      setSelectedCategory(null);
    }
    onCloseMobile();
  };

  const handleSelectCategory = (catId: CategoryKey | null) => {
    setActiveTab('cases');
    setSelectedCategory(catId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 ${
          isRtl ? 'right-0' : 'left-0'
        } z-50 w-72 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile
            ? 'translate-x-0'
            : isRtl
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Workspace Brand Lockup */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            {firmLogo ? (
              <img
                src={firmLogo}
                alt="Firm Logo"
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-slate-800 dark:to-slate-950 flex items-center justify-center text-amber-400 shadow-sm border border-slate-700/50 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  {isRtl ? (firmDetails?.nameAr || t('brandName')) : (firmDetails?.nameEn || t('brandName'))}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t('workspaceTitle')}
              </p>
            </div>
          </div>

          {/* Quick "+ New Case" Action Button */}
          {canCreateCase() && (
            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                onCloseMobile();
              }}
              className="mt-3.5 w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newCase')}</span>
            </button>
          )}
        </div>

        {/* Primary Navigation & ClickUp Spaces Tree */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          {/* Main App Modules */}
          <div className="space-y-1">
            <button
              onClick={() => handleSelectTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800/90 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-500" />
              <span className="flex-1 text-start truncate">{t('dashboard')}</span>
            </button>

            <button
              onClick={() => handleSelectCategory(null)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'cases' && selectedCategory === null
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800/90 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Layers className="w-4 h-4 text-sky-500" />
                <span className="truncate">{t('allCases')}</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {cases.length}
              </span>
            </button>

            {/* Independent Top-Level Module: عقود الايجار (Lease Contracts / Tenancy Contracts) */}
            <button
              onClick={() => handleSelectCategory('tenancy_contracts')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'cases' && selectedCategory === 'tenancy_contracts'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800/90 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Home className="w-4 h-4 text-emerald-500" />
                <span className="truncate font-semibold">{isRtl ? 'عقود الايجار' : 'Lease Contracts'}</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                {getCategoryCount('tenancy_contracts')}
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('calendar')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800/90 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="truncate">{t('calendar')}</span>
              </div>
              {cases.filter((c) => c.isExpertReport).length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                  {cases.filter((c) => c.isExpertReport).length}
                </span>
              )}
            </button>

            {/* User Management & Permissions (Strictly Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => handleSelectTab('users')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800/90 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="flex-1 text-start truncate">{t('users')}</span>
              </button>
            )}

            {/* Global Activity & Audit Log (Strictly Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => handleSelectTab('audit_log')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'audit_log'
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800/90 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4 text-purple-500" />
                <span className="flex-1 text-start truncate">{isRtl ? 'سجل النشاطات' : 'Activity Log'}</span>
              </button>
            )}

            <button
              onClick={() => handleSelectTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800/90 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="flex-1 text-start truncate">{t('settings')}</span>
            </button>
          </div>

          {/* ClickUp Hierarchy: Practice Folders & Dynamic Pages */}
          <div>
            <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              <div
                onClick={() => setIsFoldersOpen(!isFoldersOpen)}
                className="flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <span>{t('folders')}</span>
                {isFoldersOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Admin "+ Create New Page" Button */}
              {isAdmin && (
                <button
                  onClick={() => setIsNewPageModalOpen(true)}
                  className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 transition-colors cursor-pointer flex items-center gap-0.5 font-bold"
                  title={isRtl ? 'إنشاء قسم / صفحة جديدة' : 'Create New Page'}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[10px] lowercase">{isRtl ? 'قسم' : 'page'}</span>
                </button>
              )}
            </div>

            {isFoldersOpen && (
              <div className="mt-1 space-y-0.5">
                {categories
                  .filter((cat) => cat.id !== 'tenancy_contracts')
                  .map((cat) => {
                  const count = getCategoryCount(cat.id);
                  const isSelected = activeTab === 'cases' && selectedCategory === cat.id;
                  const Icon = categoryIcons[cat.icon] || FolderKanban;

                  return (
                    <div
                      key={cat.id}
                      className="group/item flex items-center justify-between rounded-lg"
                    >
                      <button
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`flex-1 flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer group ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
                          <span className="truncate text-start">
                            {isRtl ? cat.nameAr : cat.nameEn}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                          {count}
                        </span>
                      </button>

                      {/* Custom Category Delete Button (for Admin) */}
                      {isAdmin && cat.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(cat.id);
                          }}
                          className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                          title={isRtl ? 'حذف القسم' : 'Delete Page'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Prominent Admin Create Page Button */}
                {isAdmin && (
                  <button
                    onClick={() => setIsNewPageModalOpen(true)}
                    className="w-full mt-1.5 flex items-center gap-2 px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-dashed border-indigo-200 dark:border-indigo-800/60 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRtl ? '+ إنشاء صفحة / قسم جديد' : '+ Create New Page'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Firm Status & Version footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{isRtl ? 'نظام إيليت للمحاماة' : 'Elite Jurist Pro'}</span>
            <span className="font-mono tabular-nums text-[10px]">ClickUp Workspace Engine</span>
          </div>
        </div>
      </aside>
    </>
  );
};
