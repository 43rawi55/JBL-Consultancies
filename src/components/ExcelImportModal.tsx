import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  UploadCloud,
  Layers,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ColumnDefinition, CaseItem } from '../types/schema.ts';
import { autoMapColumns, ParsedExcelResult } from '../utils/excelUtils.ts';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedResult: ParsedExcelResult | null;
  fileName: string;
  targetCategoryId: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  parsedResult,
  fileName,
  targetCategoryId,
}) => {
  const {
    categories,
    getActiveColumns,
    pageColumns,
    bulkAddCases,
    syncToGoogleSheets,
    showToast,
    isRtl,
    t,
  } = useApp();

  const { currentUser } = useAuth();

  // Columns for the target category
  const targetColumns = useMemo(() => {
    if (targetCategoryId && pageColumns[targetCategoryId]) {
      return pageColumns[targetCategoryId];
    }
    return getActiveColumns();
  }, [targetCategoryId, pageColumns, getActiveColumns]);

  // Target category info
  const targetCategoryInfo = useMemo(() => {
    return categories.find((c) => c.id === targetCategoryId);
  }, [categories, targetCategoryId]);

  // Mapping state: sysColId -> excelHeaderName
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'mapping' | 'preview'>('mapping');

  // Auto-map columns when parsedResult or targetColumns change
  useEffect(() => {
    if (parsedResult && targetColumns.length > 0) {
      const initialMap = autoMapColumns(parsedResult.headers, targetColumns);
      setColumnMapping(initialMap);
    }
  }, [parsedResult, targetColumns]);

  // Build preview items (first 5 rows)
  const previewData = useMemo(() => {
    if (!parsedResult) return [];
    const excelHeaders = parsedResult.headers || [];
    const rows = parsedResult.rows || [];
    const previewRows = rows.slice(0, 5);
    return previewRows.map((row) => {
      const rowObj: Record<string, any> = {};
      targetColumns.forEach((col) => {
        const mappedExcelHeader = columnMapping[col.id];
        if (mappedExcelHeader) {
          const headerIdx = excelHeaders.indexOf(mappedExcelHeader);
          if (headerIdx !== -1) {
            let val = row[headerIdx];
            if (val !== undefined && val !== null) {
              if (col.type === 'number') {
                const num = Number(String(val).replace(/[^0-9.-]/g, ''));
                val = isNaN(num) ? 0 : num;
              } else if (col.type === 'date') {
                // Try formatting date
                if (val instanceof Date) {
                  val = val.toISOString().split('T')[0];
                } else {
                  val = String(val).trim();
                }
              }
              rowObj[col.id] = val;
            }
          }
        }
      });
      return rowObj;
    });
  }, [parsedResult, targetColumns, columnMapping]);

  if (!isOpen || !parsedResult) return null;

  const excelHeaders = parsedResult.headers;
  const rows = parsedResult.rows;

  const handleMappingChange = (sysColId: string, excelHeader: string) => {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (!excelHeader) {
        delete next[sysColId];
      } else {
        next[sysColId] = excelHeader;
      }
      return next;
    });
  };

  const handleResetMapping = () => {
    const initialMap = autoMapColumns(excelHeaders, targetColumns);
    setColumnMapping(initialMap);
    showToast(isRtl ? 'تمت إعادة المطابقة التلقائية للأعمدة' : 'Columns auto-mapped successfully', 'info');
  };

  // Handle final import
  const handleConfirmImport = async () => {
    if (Object.keys(columnMapping).length === 0) {
      showToast(isRtl ? 'يرجى مطابقة عمود واحد على الأقل قبل الاستيراد' : 'Please map at least one column', 'error');
      return;
    }

    setIsImporting(true);

    try {
      const newItems: Partial<CaseItem>[] = rows.map((row, index) => {
        const customFields: Record<string, any> = {};
        let caseNumber = `2024/${Math.floor(1000 + Math.random() * 9000)}`;
        let clientName = isRtl ? 'موكل جديد' : 'New Client';
        let opponentName = isRtl ? 'الخصم' : 'Opponent';
        let sessionDate = new Date().toISOString().split('T')[0];
        let court = 'محاكم دبي';
        let caseType = 'تجاري كلي';
        let lastAction = isRtl ? 'تم الاستيراد من ملف Excel' : 'Imported from Excel file';
        let nextStep = isRtl ? 'متابعة الإجراءات' : 'Follow up procedure';
        let status = 'under_review';
        let priority = 'normal';
        let notes = '';

        targetColumns.forEach((col) => {
          const mappedHeader = columnMapping[col.id];
          if (!mappedHeader) return;

          const headerIdx = excelHeaders.indexOf(mappedHeader);
          if (headerIdx === -1) return;

          let rawVal = row[headerIdx];
          if (rawVal === undefined || rawVal === null) return;

          if (col.type === 'number') {
            const num = Number(String(rawVal).replace(/[^0-9.-]/g, ''));
            rawVal = isNaN(num) ? 0 : num;
          } else if (col.type === 'date') {
            if (rawVal instanceof Date) {
              rawVal = rawVal.toISOString().split('T')[0];
            } else {
              rawVal = String(rawVal).trim();
            }
          } else {
            rawVal = String(rawVal).trim();
          }

          // Map to standard fields if matching ID
          if (col.id === 'caseNumber' && rawVal) caseNumber = String(rawVal);
          else if (col.id === 'clientName' && rawVal) clientName = String(rawVal);
          else if (col.id === 'opponentName' && rawVal) opponentName = String(rawVal);
          else if (col.id === 'sessionDate' && rawVal) sessionDate = String(rawVal);
          else if (col.id === 'court' && rawVal) court = String(rawVal);
          else if (col.id === 'caseType' && rawVal) caseType = String(rawVal);
          else if (col.id === 'lastAction' && rawVal) lastAction = String(rawVal);
          else if (col.id === 'nextStep' && rawVal) nextStep = String(rawVal);
          else if (col.id === 'notes' && rawVal) notes = String(rawVal);
          else {
            // Put in customFields (e.g. contractName, partyOne, executionAmount, etc.)
            customFields[col.id] = rawVal;
          }
        });

        // For Contracts, if clientName wasn't set, use partyOne or contractName
        if (customFields.partyOne && clientName === (isRtl ? 'موكل جديد' : 'New Client')) {
          clientName = String(customFields.partyOne);
        }
        if (customFields.partyTwo && opponentName === (isRtl ? 'الخصم' : 'Opponent')) {
          opponentName = String(customFields.partyTwo);
        }
        if (customFields.contractName && !caseNumber) {
          caseNumber = `CNT-${index + 101}`;
        }

        // For Notices, if sender/recipient exist
        if (customFields.sender) clientName = String(customFields.sender);
        if (customFields.recipient) opponentName = String(customFields.recipient);

        return {
          caseNumber,
          categoryId: targetCategoryId || 'all',
          clientName,
          opponentName,
          assigneeId: currentUser?.id || 'user_admin',
          caseType,
          court,
          sessionDate,
          lastAction,
          nextStep,
          status: (status as any),
          priority: (priority as any),
          notes,
          customFields,
        };
      });

      // 1. Bulk append to table state
      await bulkAddCases(newItems);

      // 2. Automatically sync to Google Sheets backend
      await syncToGoogleSheets(targetCategoryId);

      showToast(
        isRtl
          ? `تم استيراد ${rows.length} سطر بنجاح ومزامنتها مع Google Sheets`
          : `Successfully imported ${rows.length} rows and synced to Google Sheets`,
        'success'
      );

      onClose();
    } catch (err) {
      console.error(err);
      showToast(isRtl ? 'حدث خطأ أثناء استيراد البيانات' : 'Error importing data', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const mappedCount = Object.keys(columnMapping).length;
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isRtl ? 'استيراد البيانات ومطابقة الأعمدة' : 'Import Excel Data & Column Mapping'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {rows.length} {isRtl ? 'سطر' : 'rows'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{fileName}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: targetCategoryInfo?.color || '#2563EB' }}
                  />
                  {targetCategoryInfo
                    ? isRtl
                      ? targetCategoryInfo.nameAr
                      : targetCategoryInfo.nameEn
                    : t('allCases')}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs: Mapping vs Data Preview */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('mapping')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'mapping'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isRtl ? 'مطابقة الأعمدة' : 'Column Mapping'}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                {mappedCount} / {targetColumns.filter((c) => c.type !== 'computed').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>{isRtl ? 'معاينة أول 5 أسطر' : 'Live Data Preview'}</span>
            </button>
          </div>

          {activeTab === 'mapping' && (
            <button
              onClick={handleResetMapping}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'إعادة المطابقة الذكية' : 'Auto-Match Columns'}</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'mapping' ? (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl p-3.5 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {isRtl ? 'كيف تعمل المطابقة؟' : 'How does mapping work?'}
                  </span>{' '}
                  {isRtl
                    ? 'يقوم النظام تلقائياً بربط أسماء الأعمدة المتطابقة في ملف Excel. يمكنك تعديل أو تغيير أي عمود من القائمة المنسدلة ليتوافق مع حقول الجدول.'
                    : 'The system automatically matches columns from your Excel file. You can adjust mappings using the dropdowns.'}
                </div>
              </div>

              {/* Column Mapping Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-start border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3.5 text-start w-1/3">
                        {isRtl ? 'أعمدة النظام (الوجهة)' : 'System Column'}
                      </th>
                      <th className="py-2.5 px-3.5 text-center w-12">
                        {isRtl ? 'الربط' : 'Map'}
                      </th>
                      <th className="py-2.5 px-3.5 text-start w-1/2">
                        {isRtl ? 'أعمدة ملف Excel المستورد' : 'Excel File Column'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {targetColumns.map((col) => {
                      const isComputed = col.type === 'computed' || col.isComputed;
                      const mappedValue = columnMapping[col.id] || '';
                      const isMapped = Boolean(mappedValue);

                      return (
                        <tr
                          key={col.id}
                          className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                            isComputed ? 'opacity-60 bg-slate-50/30 dark:bg-slate-900/30' : ''
                          }`}
                        >
                          {/* System Column Name & Type Badge */}
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {isRtl ? col.nameAr : col.nameEn}
                              </span>
                              {col.required && (
                                <span className="text-rose-500 font-bold" title="مطلوب">*</span>
                              )}
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {col.type}
                              </span>
                            </div>
                            {col.nameEn !== col.nameAr && (
                              <div className="text-[11px] text-slate-400 font-mono">
                                {isRtl ? col.nameEn : col.nameAr}
                              </div>
                            )}
                          </td>

                          {/* Arrow Icon */}
                          <td className="py-2.5 px-3.5 text-center text-slate-400">
                            <ArrowIcon className="w-3.5 h-3.5 mx-auto" />
                          </td>

                          {/* Excel Column Selector */}
                          <td className="py-2.5 px-3.5">
                            {isComputed ? (
                              <span className="text-amber-600 dark:text-amber-400 text-xs italic">
                                {isRtl ? 'حقل محسوب تلقائياً (لا يحتاج استيراد)' : 'Computed field (auto-calculated)'}
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select
                                  value={mappedValue}
                                  onChange={(e) => handleMappingChange(col.id, e.target.value)}
                                  className={`flex-1 p-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                                    isMapped
                                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                  }`}
                                >
                                  <option value="">
                                    {isRtl ? '-- تجاهل هذا العمود (عدم الاستيراد) --' : '-- Ignore / Do not import --'}
                                  </option>
                                  {excelHeaders.map((excelCol) => (
                                    <option key={excelCol} value={excelCol}>
                                      {excelCol}
                                    </option>
                                  ))}
                                </select>
                                {isMapped && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Live Data Preview Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {isRtl
                    ? 'معاينة شكل البيانات كما ستظهر في جدول النظام (أول 5 أسطر):'
                    : 'Preview of how data will appear in system table (first 5 rows):'}
                </span>
                <span className="font-mono text-emerald-600 font-semibold">
                  {rows.length} {isRtl ? 'إجمالي الأسطر الجاهزة للاستيراد' : 'total rows ready'}
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-start border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      {targetColumns.map((col) => {
                        const isMapped = Boolean(columnMapping[col.id]);
                        return (
                          <th
                            key={col.id}
                            className={`py-2.5 px-3 text-start whitespace-nowrap ${
                              isMapped ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <span>{isRtl ? col.nameAr : col.nameEn}</span>
                              {col.type === 'computed' && (
                                <span className="text-[10px] text-amber-500">(Auto)</span>
                              )}
                            </div>
                            {columnMapping[col.id] && (
                              <div className="text-[10px] text-emerald-600 font-mono font-normal">
                                ← {columnMapping[col.id]}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        {targetColumns.map((col) => {
                          const val = row[col.id];
                          return (
                            <td key={col.id} className="py-2.5 px-3 truncate max-w-[200px]">
                              {col.type === 'computed' ? (
                                <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                                  (محسوب)
                                </span>
                              ) : val !== undefined && val !== '' ? (
                                <span className="text-slate-900 dark:text-white font-medium">
                                  {String(val)}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {isRtl
                ? 'سيتم حفظ السجلات محلياً ومزامنتها مباشرة مع Google Sheets'
                : 'Rows will be saved and synced directly to Google Sheets backend'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={isImporting || mappedCount === 0}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isRtl ? 'جاري الاستيراد والمزامنة...' : 'Importing & Syncing...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>
                    {isRtl
                      ? `تأكيد استيراد ${rows.length} سطر`
                      : `Confirm & Import ${rows.length} Rows`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
