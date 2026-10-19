import React, { useState } from 'react';
import { X, Columns, Plus, Trash2, Check, Tag, Bell, Mail, Clock, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ColumnType } from '../types/schema.ts';
import { DEFAULT_USER_EMAIL } from '../utils/reminderService.ts';

export const AddColumnModal: React.FC = () => {
  const {
    isAddColumnModalOpen,
    setIsAddColumnModalOpen,
    selectedCategory,
    addColumn,
    showToast,
    isRtl,
    t,
  } = useApp();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<ColumnType>('text');
  const [optionInput, setOptionInput] = useState('');
  const [options, setOptions] = useState<string[]>(['خيار 1', 'خيار 2']);

  // Email Reminder State for Time/Date columns
  const [hasEmailReminder, setHasEmailReminder] = useState<boolean>(true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(30);
  const [reminderEmail, setReminderEmail] = useState<string>(DEFAULT_USER_EMAIL);

  if (!isAddColumnModalOpen) return null;

  const handleAddOption = () => {
    if (!optionInput.trim()) return;
    if (!options.includes(optionInput.trim())) {
      setOptions([...options, optionInput.trim()]);
    }
    setOptionInput('');
  };

  const handleRemoveOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;

    const colId = `col_${Date.now()}`;
    const targetCat = selectedCategory || 'all';

    const isTimeOrDate = type === 'time' || type === 'datetime' || type === 'date';

    addColumn(targetCat, {
      id: colId,
      nameAr,
      nameEn: nameEn || nameAr,
      type,
      options: type === 'select' ? options : undefined,
      width: type === 'time' ? 120 : type === 'datetime' ? 160 : type === 'date' ? 130 : 180,
      hasEmailReminder: isTimeOrDate ? hasEmailReminder : false,
      reminderMinutesBefore: isTimeOrDate && hasEmailReminder ? reminderMinutesBefore : undefined,
      reminderEmail: isTimeOrDate && hasEmailReminder ? reminderEmail.trim() : undefined,
    });

    showToast(
      isRtl
        ? `تمت إضافة عمود "${nameAr}"${isTimeOrDate && hasEmailReminder ? ' مع تفعيل تنبيهات البريد الإلكتروني' : ''} بنجاح`
        : `Column "${nameEn || nameAr}" added successfully`,
      'success'
    );

    setIsAddColumnModalOpen(false);
    setNameAr('');
    setNameEn('');
    setType('text');
    setOptions(['خيار 1', 'خيار 2']);
    setHasEmailReminder(true);
    setReminderMinutesBefore(30);
  };

  const isTimeOrDate = type === 'time' || type === 'datetime' || type === 'date';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {isRtl ? 'إضافة عمود جديد إلى الجدول' : 'Add New Column'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isRtl ? 'إمكانية إضافة وقت وتفعيل تنبيهات بريدية مسبقة' : 'Add custom time and email reminder options'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddColumnModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Column Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {isRtl ? 'اسم العمود (عربي) *' : 'Column Name (Arabic) *'}
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={isRtl ? 'مثلاً: موعد المرافعة' : 'e.g. Session Time'}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {isRtl ? 'اسم العمود (English)' : 'Column Name (English)'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Hearing Time"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Column Type */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {isRtl ? 'نوع بيانات العمود' : 'Column Data Type'}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ColumnType)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="text">{isRtl ? '📝 نص حر (Text)' : 'Text'}</option>
              <option value="number">{isRtl ? '🔢 رقم / مالي (Number)' : 'Number'}</option>
              <option value="date">{isRtl ? '📅 تاريخ (Date)' : 'Date'}</option>
              <option value="select">{isRtl ? '🔽 قائمة خيارات منسدلة (Dropdown / Select)' : 'Dropdown / Select'}</option>
              <option value="file">{isRtl ? '📁 ملف (File)' : 'File'}</option>
              <option value="time">{isRtl ? '⏰ وقت فقط (Time - ساعة ودقائق)' : 'Time (HH:MM)'}</option>
              <option value="datetime">{isRtl ? '📅⏰ تاريخ ووقت كامل (Date & Time)' : 'Date & Time'}</option>
            </select>
          </div>

          {/* EMAIL REMINDER CONFIGURATION (If Time / DateTime / Date is chosen) */}
          {isTimeOrDate && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      {isRtl ? 'التنبيه التلقائي عبر البريد الإلكتروني' : 'Automated Email Reminders'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isRtl
                        ? 'إرسال إشعار تنبيه مسبق إلى بريدك قبل حلول هذا الوقت'
                        : 'Dispatch automated email notification before scheduled time'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEmailReminder}
                    onChange={(e) => setHasEmailReminder(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {hasEmailReminder && (
                <div className="space-y-3 pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Minutes Before */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isRtl ? 'إرسال التنبيه قبل الموعد بـ:' : 'Send reminder before:'}</span>
                      </label>
                      <select
                        value={reminderMinutesBefore}
                        onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                      >
                        <option value={15}>{isRtl ? '15 دقيقة قبل الموعد' : '15 minutes before'}</option>
                        <option value={30}>{isRtl ? '30 دقيقة قبل الموعد' : '30 minutes before'}</option>
                        <option value={60}>{isRtl ? 'ساعة واحدة قبل الموعد' : '1 hour before'}</option>
                        <option value={120}>{isRtl ? 'ساعتان قبل الموعد' : '2 hours before'}</option>
                        <option value={720}>{isRtl ? '12 ساعة قبل الموعد' : '12 hours before'}</option>
                        <option value={1440}>{isRtl ? '24 ساعة (يوم قبل الموعد)' : '24 hours (1 day before)'}</option>
                        <option value={2880}>{isRtl ? '48 ساعة (يومان قبل الموعد)' : '48 hours (2 days before)'}</option>
                      </select>
                    </div>

                    {/* Email Recipient */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isRtl ? 'إرسال التنبيه إلى البريد:' : 'Recipient Email:'}</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={reminderEmail}
                        onChange={(e) => setReminderEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Visual confirmation badge */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isRtl
                        ? `سيتم إرسال إشعار تنبيه قضائي تلقائي إلى (${reminderEmail}) قبل حلول الموعد المسجل بـ ${
                            reminderMinutesBefore >= 1440
                              ? `${Math.round(reminderMinutesBefore / 1440)} يوم`
                              : reminderMinutesBefore >= 60
                              ? `${Math.round(reminderMinutesBefore / 60)} ساعة`
                              : `${reminderMinutesBefore} دقيقة`
                          }.`
                        : `Automated alert email will be sent to (${reminderEmail}) ${reminderMinutesBefore} min prior.`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Options Builder (if type is select) */}
          {type === 'select' && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'خيارات القائمة المنسدلة' : 'Dropdown Options'}
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder={isRtl ? 'أدخل خياراً ثم اضغط إضافة...' : 'Add choice and click +'}
                  className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {options.map((opt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <span>{opt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddColumnModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة العمود' : 'Add Column'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
