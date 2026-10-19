import React, { useState } from 'react';
import {
  X,
  Layers,
  FileText,
  Gavel,
  Shield,
  Briefcase,
  Building,
  Scale,
  Sparkles,
  Palette,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ColumnDefinition } from '../types/schema.ts';
import {
  CONTRACTS_COLUMNS,
  NOTICES_COLUMNS,
  POLICE_REPORTS_COLUMNS,
  EXECUTIONS_COLUMNS,
  COURT_ROLL_COLUMNS,
  STANDARD_CASE_COLUMNS,
} from '../data/pageSchemas.tsx';

const ICON_OPTIONS = [
  { name: 'FolderKanban', label: 'مجلد / قسم' },
  { name: 'Scale', label: 'ميزان العدالة' },
  { name: 'FileText', label: 'عقود ومستندات' },
  { name: 'Gavel', label: 'تنفيذ وقضاء' },
  { name: 'ShieldAlert', label: 'بلاغات وأمن' },
  { name: 'MailWarning', label: 'إنذارات وإخطارات' },
  { name: 'Building2', label: 'عقارات وإيجارات' },
  { name: 'BadgeCheck', label: 'تراخيص وامتثال' },
  { name: 'FileSignature', label: 'وكالات وتصديقات' },
];

const COLOR_OPTIONS = [
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#D97706', // Amber
  '#8B5CF6', // Purple
  '#DC2626', // Red
  '#059669', // Emerald
  '#EA580C', // Orange
  '#0284C7', // Sky
  '#64748B', // Slate
];

export const NewPageModal: React.FC = () => {
  const { isNewPageModalOpen, setIsNewPageModalOpen, createCategory, isRtl, t } = useApp();
  const { isAdmin } = useAuth();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('FolderKanban');
  const [selectedColor, setSelectedColor] = useState('#2563EB');
  const [layoutPreset, setLayoutPreset] = useState<
    'standard' | 'court_roll' | 'contracts' | 'notices' | 'reports' | 'executions' | 'blank'
  >('court_roll');

  if (!isNewPageModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;

    const id = `cat_custom_${Date.now()}`;

    let initialCols: ColumnDefinition[] = [];
    if (layoutPreset === 'court_roll') initialCols = [...COURT_ROLL_COLUMNS];
    else if (layoutPreset === 'contracts') initialCols = [...CONTRACTS_COLUMNS];
    else if (layoutPreset === 'notices') initialCols = [...NOTICES_COLUMNS];
    else if (layoutPreset === 'reports') initialCols = [...POLICE_REPORTS_COLUMNS];
    else if (layoutPreset === 'executions') initialCols = [...EXECUTIONS_COLUMNS];
    else if (layoutPreset === 'standard') initialCols = [...STANDARD_CASE_COLUMNS];
    else if (layoutPreset === 'blank') {
      initialCols = [
        { id: 'title', nameAr: 'العنوان / الاسم', nameEn: 'Title', type: 'text', width: 220, required: true },
        { id: 'status', nameAr: 'الحالة', nameEn: 'Status', type: 'select', options: ['جديد', 'قيد الإجراء', 'مكتمل'], width: 140 },
        { id: 'createdAt', nameAr: 'تاريخ الإضافة', nameEn: 'Date Added', type: 'date', width: 130 },
      ];
    }

    createCategory(
      {
        id,
        nameAr,
        nameEn: nameEn || nameAr,
        icon: selectedIcon,
        color: selectedColor,
        descriptionAr: descriptionAr || `قسم ${nameAr} المخصص`,
        descriptionEn: nameEn || nameAr,
        isCustom: true,
        layoutPreset,
      },
      initialCols
    );

    setIsNewPageModalOpen(false);
    setNameAr('');
    setNameEn('');
    setDescriptionAr('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              {isRtl ? 'إنشاء قسم / صفحة عمل جديدة' : 'Create New Workspace Page'}
            </h3>
          </div>
          <button
            onClick={() => setIsNewPageModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {isRtl ? 'اسم القسم (عربي) *' : 'Page Name (Arabic) *'}
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثلاً: دعاوي التحكيم والوساطة"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {isRtl ? 'اسم القسم (English)' : 'Page Name (English)'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Arbitration Cases"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {isRtl ? 'الوصف والغرض' : 'Description'}
            </label>
            <input
              type="text"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              placeholder={isRtl ? 'متابعة قضايا التحكيم التجاري لدى مراكز فض النزاعات' : 'Arbitration and mediation tracking'}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Initial Layout & Feature Preset */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
              {isRtl ? 'المخطط الأولي ومجموعة الأعمدة المطلوبة' : 'Initial Layout & Columns Preset'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'court_roll',
                  title: isRtl ? 'رول وجدول الجلسات' : 'Court Hearing Roll',
                  desc: isRtl ? 'تاريخ الجلسة، الطلبات، القرار السابق، الدائرة، القاعة' : 'Hearing date, requests, circuit, court hall',
                },
                {
                  id: 'standard',
                  title: isRtl ? 'قضايا ومرافعات قضائية' : 'Standard Litigation',
                  desc: isRtl ? 'رقم الدعوى، المحكمة، الجلسات، الموكل' : 'Court, hearings, client, session dates',
                },
                {
                  id: 'contracts',
                  title: isRtl ? 'إدارة ومراجعة العقود' : 'Contracts Management',
                  desc: isRtl ? 'الأطراف، الصفحات، الإجراء، حالة العقد' : 'Parties, pages, review status',
                },
                {
                  id: 'notices',
                  title: isRtl ? 'الإنذارات والإعلانات العدلية' : 'Notarial Notices',
                  desc: isRtl ? 'تاريخ الإنذار، المنذر، نتيجة الإعلان' : 'Notice date, sender, service result',
                },
                {
                  id: 'reports',
                  title: isRtl ? 'البلاغات والشكاوى الجزائية' : 'Police & Criminal Reports',
                  desc: isRtl ? 'رقم الشكوى، المركز، البلاغ، القرار' : 'Complaint no, police station, decision',
                },
                {
                  id: 'executions',
                  title: isRtl ? 'التنفيذات المالية والحجوزات' : 'Executions & Attachments',
                  desc: isRtl ? 'مبلغ التنفيذ، المحول، المتبقي التلقائي' : 'Execution amount, transfers, balance',
                },
                {
                  id: 'blank',
                  title: isRtl ? 'جدول بيانات فارغ مخصص' : 'Blank Custom Table',
                  desc: isRtl ? 'إضافة الأعمدة بحرية حسب رغبتك' : 'Build your own custom column schema',
                },
              ].map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => setLayoutPreset(preset.id as any)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    layoutPreset === preset.id
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{preset.title}</span>
                    {layoutPreset === preset.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {preset.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
              {isRtl ? 'اللون المميز للقسم' : 'Theme Color'}
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: col }}
                >
                  {selectedColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewPageModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {isRtl ? 'إنشاء القسم والبدء' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
