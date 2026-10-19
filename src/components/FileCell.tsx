import React, { useRef } from 'react';
import { Upload, Eye, Download, Trash2, FileText } from 'lucide-react';

export interface FileData {
  name: string;
  url: string;
  size?: number | string;
  type?: string;
  uploadedAt?: string;
}

export interface FileCellProps {
  /** File object or URL string or empty/null */
  value?: FileData | string | null;
  /** Callback when file is uploaded or updated */
  onChange?: (newValue: FileData | string | null) => void;
  /** Download filename fallback */
  defaultFileName?: string;
  /** Disabled state */
  disabled?: boolean;
  /** RTL support */
  isRtl?: boolean;
  /** Optional custom upload button label */
  uploadLabel?: string;
}

/**
 * Reusable File Management Cell Component
 * - If NO file: renders an "Upload" (رفع) button triggering a hidden file input.
 * - If HAS file: renders a container with 3 distinct buttons/actions:
 *   1. Preview (عرض): Opens file URL in a new window/tab (target="_blank").
 *   2. Download (تحميل): Triggers a download action.
 *   3. Delete (حذف): Clears the file from this cell.
 */
export const FileCell: React.FC<FileCellProps> = ({
  value,
  onChange,
  defaultFileName = 'document.pdf',
  disabled = false,
  isRtl = true,
  uploadLabel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize file info from string or object
  const fileData: FileData | null = React.useMemo(() => {
    if (!value) return null;
    if (typeof value === 'object' && value.url) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      return {
        name: value.split('/').pop() || defaultFileName,
        url: value,
      };
    }
    return null;
  }, [value, defaultFileName]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local object URL for instant preview & download
    const blobUrl = URL.createObjectURL(file);
    const newFile: FileData = {
      name: file.name,
      url: blobUrl,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'application/pdf',
      uploadedAt: new Date().toISOString(),
    };

    onChange?.(newFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileData?.url) return;
    window.open(fileData.url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileData?.url) return;
    const anchor = document.createElement('a');
    anchor.href = fileData.url;
    anchor.download = fileData.name || defaultFileName;
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  };

  // 1. If NO file: Render clear Upload button triggering file input
  if (!fileData) {
    return (
      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          className="hidden"
          disabled={disabled}
          onChange={handleFileSelect}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-dashed border-indigo-400 dark:border-indigo-500 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          title={isRtl ? 'رفع ملف' : 'Upload file'}
        >
          <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{uploadLabel || (isRtl ? 'رفع' : 'Upload')}</span>
        </button>
      </div>
    );
  }

  // 2. If HAS file: Render container with 3 distinct buttons: Preview, Download, Delete
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-[260px] shadow-2xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 min-w-0 mr-1 text-slate-700 dark:text-slate-300">
        <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span
          className="text-xs truncate max-w-[95px] font-medium"
          title={fileData.name}
        >
          {fileData.name}
        </span>
      </div>

      <div className="flex items-center gap-0.5 shrink-0 border-s border-slate-300 dark:border-slate-600 ps-1.5">
        {/* 1. Preview (عرض) */}
        <button
          type="button"
          onClick={handlePreview}
          className="p-1 rounded text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
          title={isRtl ? 'عرض (Preview)' : 'Preview File'}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* 2. Download (تحميل) */}
        <button
          type="button"
          onClick={handleDownload}
          className="p-1 rounded text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
          title={isRtl ? 'تحميل (Download)' : 'Download File'}
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* 3. Delete (حذف) */}
        {!disabled && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            title={isRtl ? 'حذف (Delete)' : 'Delete File'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
