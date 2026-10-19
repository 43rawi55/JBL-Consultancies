import React, { useRef } from 'react';
import { Upload, Eye, Download, Trash2, FileCheck } from 'lucide-react';
import { CaseItem } from '../types/schema.ts';

interface AgencyFileCellProps {
  row: CaseItem;
  fileName?: string;
  fileUrl?: string;
  onUpdateFile: (fileName: string, fileUrl?: string) => void;
  onDeleteFile: () => void;
  isRtl?: boolean;
  canEdit?: boolean;
}

export const AgencyFileCell: React.FC<AgencyFileCellProps> = ({
  row,
  fileName,
  fileUrl,
  onUpdateFile,
  onDeleteFile,
  isRtl = true,
  canEdit = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveFileName =
    fileName ||
    row.customFields?.poaFile ||
    row.customFields?.['ملف الوكالة'] ||
    '';

  const effectiveFileUrl =
    fileUrl ||
    row.customFields?.poaFileUrl ||
    row.documents?.[0]?.url ||
    row.documents?.[0]?.driveUrl ||
    '';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a client-side Blob URL so Preview & Download work instantly
    const blobUrl = URL.createObjectURL(file);
    onUpdateFile(file.name, blobUrl);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveFileUrl) {
      window.open(effectiveFileUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Create a visual HTML preview blob if only filename exists
      const blob = new Blob(
        [
          `<!DOCTYPE html>
<html dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${effectiveFileName} - معاينة ملف الوكالة</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; text-align: center; }
    .card { background: #1e293b; border-radius: 16px; padding: 32px; max-width: 540px; margin: 40px auto; border: 1px solid #334155; }
    h1 { font-size: 20px; color: #38bdf8; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .badge { background: #0284c7; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">نظام إيليت للمحاماة - وثيقة رسمية</div>
    <h1>${effectiveFileName}</h1>
    <p><strong>رقم الملف:</strong> ${row.caseNumber}</p>
    <p><strong>الموكل:</strong> ${row.clientName || row.customFields?.principal || '-'}</p>
    <p><strong>الوكيل:</strong> ${row.customFields?.agent || '-'}</p>
    <p><strong>تاريخ الوكالة:</strong> ${row.customFields?.poaDate || row.sessionDate || '-'}</p>
    <p><strong>الغرض:</strong> ${row.customFields?.poaPurpose || 'وكالة قضائية عامة للترافع والتمثيل القانوني'}</p>
    <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
    <p style="color: #64748b; font-size: 12px;">تم توثيق هذا المستند عبر الكاتب العدل الإلكتروني.</p>
  </div>
</body>
</html>`,
        ],
        { type: 'text/html' }
      );
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl =
      effectiveFileUrl ||
      URL.createObjectURL(
        new Blob(
          [`ملف وكالة رسمية: ${effectiveFileName}\nرقم: ${row.caseNumber}\nالموكل: ${row.clientName}`],
          { type: 'text/plain;charset=utf-8' }
        )
      );
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = effectiveFileName || `POA_${row.caseNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteFile();
  };

  // 1. STATE: NO FILE -> Render Upload Button
  if (!effectiveFileName) {
    return (
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileSelect}
        />
        {canEdit ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title={isRtl ? 'رفع ملف الوكالة' : 'Upload Agency File'}
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{isRtl ? 'رفع الملف' : 'Upload'}</span>
          </button>
        ) : (
          <span className="text-slate-400 text-[11px] italic">
            {isRtl ? 'لا يوجد ملف' : 'No file'}
          </span>
        )}
      </div>
    );
  }

  // 2. STATE: HAS FILE -> Render Container with 3 distinct buttons: Preview, Download, Delete
  return (
    <div
      className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2 py-1 max-w-[240px]"
      onClick={(e) => e.stopPropagation()}
    >
      <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span
        className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0"
        title={effectiveFileName}
      >
        {effectiveFileName}
      </span>

      <div className="flex items-center gap-0.5 shrink-0 ms-1">
        {/* 1. Preview Button (عرض) */}
        <button
          type="button"
          onClick={handlePreview}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 transition-colors cursor-pointer"
          title={isRtl ? 'عرض ملف الوكالة في نافذة جديدة' : 'Preview Document'}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* 2. Download Button (تحميل) */}
        <button
          type="button"
          onClick={handleDownload}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
          title={isRtl ? 'تحميل ملف الوكالة' : 'Download Document'}
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* 3. Delete Button (حذف) */}
        {canEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            title={isRtl ? 'حذف هذا الملف' : 'Delete Document'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
