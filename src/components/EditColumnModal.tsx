import React, { useState, useEffect } from 'react';
import { X, Sliders, Trash2, Plus, Check, Tag, Clock, Mail, Bell, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ColumnDefinition, ColumnType } from '../types/schema.ts';
import { DEFAULT_USER_EMAIL } from '../utils/reminderService.ts';

interface EditColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  column: ColumnDefinition | null;
  categoryId: string;
  onDelete?: (columnId: string) => void;
}

export const EditColumnModal: React.FC<EditColumnModalProps> = ({
  isOpen,
  onClose,
  column,
  categoryId,
  onDelete,
}) => {
  const { updateColumn, deleteColumn, isRtl, showToast } = useApp();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<ColumnType>('text');
  const [width, setWidth] = useState<number>(180);
  const [optionInput, setOptionInput] = useState('');
  const [options, setOptions] = useState<string[]>([]);

  // Email Reminder State for Time/Date columns
  const [hasEmailReminder, setHasEmailReminder] = useState<boolean>(false);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(30);
  const [reminderEmail, setReminderEmail] = useState<string>(DEFAULT_USER_EMAIL);

  useEffect(() => {
    if (column) {
      setNameAr(column.nameAr || '');
      setNameEn(column.nameEn || column.nameAr || '');
      setType(column.type || 'text');
      setWidth(column.width || 180);
      setOptions(column.options && column.options.length > 0 ? [...column.options] : ['خيار 1', 'خيار 2']);
      setHasEmailReminder(!!column.hasEmailReminder);
      setReminderMinutesBefore(column.reminderMinutesBefore || 30);
      setReminderEmail(column.reminderEmail || DEFAULT_USER_EMAIL);
    }
  }, [column, isOpen]);

  if (!isOpen || !column) return null;

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

    const isTimeOrDate = type === 'time' || type === 'datetime' || type === 'date';

    updateColumn(categoryId, column.id, {
      nameAr: nameAr.trim(),
      nameEn: (nameEn || nameAr).trim(),
      type,
      width: Number(width) || 180,
      options: type === 'select' ? options : undefined,
      hasEmailReminder: isTimeOrDate ? hasEmailReminder : false,
      reminderMinutesBefore: isTimeOrDate && hasEmailReminder ? reminderMinutesBefore : undefined,
      reminderEmail: isTimeOrDate && hasEmailReminder ? reminderEmail.trim() : undefined,
    });

    onClose();
  };

  const isTimeOrDate = type === 'time' || type === 'datetime' || type === 'date';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {isRtl ? 'إعدادات وتعديل العمود' : 'Column Settings & Edit'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isRtl ? `تعديل الاسم أو تغيير نوع بيانات عمود: "${column.nameAr}"` : `Edit name or data type for: "${column.nameEn || column.nameAr}"`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
                placeholder={isRtl ? 'اسم العمود بالعربية' : 'Column Name (Arabic)'}
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
                placeholder="Column Name in English"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Column Data Type */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              {isRtl ? 'نوع بيانات العمود (تغيير نوع العمود على الفور)' : 'Column Data Type (Change on the fly)'}
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
              <option value="time">{isRtl ? '⏰ وقت فقط (Time)' : 'Time'}</option>
              <option value="datetime">{isRtl ? '📅⏰ تاريخ ووقت (Date & Time)' : 'Date & Time'}</option>
            </select>
          </div>

          {/* Width in Pixels */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span>{isRtl ? 'عرض العمود في الجدول' : 'Column Width'}</span>
              <span className="text-[11px] font-mono text-slate-500">{width}px</span>
            </label>
            <input
              type="range"
              min={80}
              max={400}
              step={10}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Options Builder (if type is select) */}
          {type === 'select' && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'خيارات القائمة المنسدلة (Dropdown Options)' : 'Dropdown Options'}
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
                  placeholder={isRtl ? 'أدخل اسم الخيار واضغط إضافة' : 'Enter option and add'}
                  className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إضافة' : 'Add'}</span>
                </button>
              </div>

              {/* Options Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {options.map((opt, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <Tag className="w-3 h-3 text-indigo-500" />
                    <span>{opt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
                        ? 'إرسال إشعار تنبيه مسبق إلى بريدك قبل حلول هذا الموعد'
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

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isRtl ? 'البريد الإلكتروني المستلم:' : 'Recipient Email:'}</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={reminderEmail}
                        onChange={(e) => setReminderEmail(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (onDelete) {
                  onDelete(column.id);
                } else {
                  deleteColumn(categoryId, column.id);
                }
                onClose();
              }}
              className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title={isRtl ? 'حذف هذا العمود نهائياً من الجدول' : 'Delete this column permanently'}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isRtl ? 'حذف هذا العامود' : 'Delete Column'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isRtl ? 'حفظ التغييرات' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
