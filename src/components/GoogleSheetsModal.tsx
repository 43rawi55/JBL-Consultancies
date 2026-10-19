import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const GoogleSheetsModal: React.FC = () => {
  const {
    isGoogleSheetsModalOpen,
    setIsGoogleSheetsModalOpen,
    googleSheetsConfig,
    updateGoogleSheetsConfig,
    syncToGoogleSheets,
    selectedCategory,
    getActiveColumns,
    cases,
    isRtl,
    t,
    showToast,
  } = useApp();

  const [sheetId, setSheetId] = useState(googleSheetsConfig.sheetId);
  const [sheetName, setSheetName] = useState(googleSheetsConfig.sheetName);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isGoogleSheetsModalOpen) return null;

  const cols = getActiveColumns();
  const currentCases = cases.filter((c) =>
    selectedCategory ? c.categoryId === selectedCategory : true
  );

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoogleSheetsConfig({
      sheetId,
      sheetName,
    });
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncToGoogleSheets(selectedCategory || undefined);
    setIsSyncing(false);
  };

  // Build TSV (Tab Separated Values) for instant direct paste into Google Sheets
  const handleCopyTSV = () => {
    const headers = cols.map((c) => (isRtl ? c.nameAr : c.nameEn)).join('\t');
    const rows = currentCases
      .map((c) =>
        cols
          .map((col) => {
            if (col.type === 'computed' && col.id === 'remainingAmount') {
              const exec = Number(c.customFields?.executionAmount ?? c.claimAmount ?? 0);
              const trans = Number(c.customFields?.transferredAmount ?? 0);
              return exec - trans;
            }
            if (col.id in c) return (c as any)[col.id] ?? '';
            return c.customFields?.[col.id] ?? '';
          })
          .join('\t')
      )
      .join('\n');

    const fullTSV = `${headers}\n${rows}`;
    navigator.clipboard.writeText(fullTSV);
    setCopied(true);
    showToast(
      isRtl
        ? 'تم نسخ البيانات بتنسيق متوافق بنسبة 100% مع Google Sheets'
        : 'Copied data ready to paste into Google Sheets',
      'success'
    );
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {isRtl ? 'المزامنة والتكامل مع Google Sheets' : 'Google Sheets Backend Sync'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRtl
                  ? 'مزامنة ديناميكية للأعمدة، الصفوف، والمعادلات الحسابية'
                  : 'Real-time schema & rows synchronization with Google Sheets'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGoogleSheetsModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Status Alert Banner */}
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {isRtl ? 'حالة التكامل: متصل وجاهز للمزامنة' : 'Status: Connected & Ready'}
                </span>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>
                    {isRtl ? 'آخر مزامنة ناجحة:' : 'Last Synced:'}{' '}
                    {googleSheetsConfig.lastSyncedAt || 'الآن'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (isRtl ? 'جاري المزامنة...' : 'Syncing...') : (isRtl ? 'مزامنة فورية' : 'Sync Now')}</span>
              </button>

              <button
                onClick={handleCopyTSV}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ لـ Sheets' : 'Copy for Sheets')}</span>
              </button>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveSettings} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white">
              {isRtl ? 'بيانات جدول البيانات المستهدف' : 'Target Spreadsheet Parameters'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Google Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Sheet Tab Name (اسم ورقة العمل)
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 cursor-pointer"
              >
                {t('saveChanges')}
              </button>
            </div>
          </form>

          {/* Live Data Grid Preview (First 4 rows & columns) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isRtl ? 'معاينة هيكل البيانات الموجهة لـ Google Sheets' : 'Payload Matrix Preview'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {cols.length} cols × {currentCases.length} rows
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto bg-white dark:bg-slate-950 max-h-48 text-[11px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-emerald-500/10 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {cols.slice(0, 6).map((c) => (
                      <th key={c.id} className="p-2 text-start font-semibold border-r border-slate-200 dark:border-slate-800 truncate">
                        {isRtl ? c.nameAr : c.nameEn}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {currentCases.slice(0, 4).map((r) => (
                    <tr key={r.id}>
                      {cols.slice(0, 6).map((col) => {
                        let val = col.id in r ? (r as any)[col.id] : r.customFields?.[col.id] ?? '';
                        if (col.type === 'computed' && col.id === 'remainingAmount') {
                          val = Number(r.customFields?.executionAmount ?? 0) - Number(r.customFields?.transferredAmount ?? 0);
                        }
                        return (
                          <td key={col.id} className="p-2 border-r border-slate-100 dark:border-slate-800 truncate max-w-[120px]">
                            {String(val || '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
