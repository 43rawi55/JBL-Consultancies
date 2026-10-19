import React, { useRef } from 'react';
import { Upload, Eye, Download, Trash2, FileText } from 'lucide-react';

export interface PoaFileData {
  name: string;
  url: string;
  size?: number | string;
  type?: string;
  uploadedAt?: string;
}

interface PoaFileCellProps {
  /** File object or URL string or empty/null */
  value: PoaFileData | string | null | undefined;
  onChange: (newValue: PoaFileData | string | null) => void;
  disabled?: boolean;
  isRtl?: boolean;
}

export const PoaFileCell: React.FC<PoaFileCellProps> = ({
  value,
  onChange,
  disabled = false,
  isRtl = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse file info from string or object
  const fileData: PoaFileData | null = React.useMemo(() => {
    if (!value) return null;
    if (typeof value === 'object' && value.url) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      return {
        name: value.split('/').pop() || (isRtl ? 'ملف_الوكالة.pdf' : 'POA_document.pdf'),
        url: value,
      };
    }
    return null;
  }, [value, isRtl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local blob URL for preview and download
    const blobUrl = URL.createObjectURL(file);
    const newFile: PoaFileData = {
      name: file.name,
      url: blobUrl,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'application/pdf',
      uploadedAt: new Date().toISOString(),
    };

    onChange(newFile);
    // Reset file input so user can re-upload if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileData?.url) return;
    const anchor = document.createElement('a');
    anchor.href = fileData.url;
    anchor.download = fileData.name || 'power_of_attorney.pdf';
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileData?.url) return;
    window.open(fileData.url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  // Case 1: No file uploaded yet -> Render Upload Button triggering hidden file input
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
          title={isRtl ? 'رفع ملف الوكالة' : 'Upload Power of Attorney file'}
        >
          <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{isRtl ? 'رفع' : 'Upload'}</span>
        </button>
      </div>
    );
  }

  // Case 2: File exists -> Render container with 3 distinct buttons/actions: Preview, Download, Delete
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-[260px] shadow-2xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 min-w-0 mr-1 text-slate-700 dark:text-slate-300">
        <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span
          className="text-xs truncate max-w-[90px] font-medium"
          title={fileData.name}
        >
          {fileData.name}
        </span>
      </div>

      <div className="flex items-center gap-0.5 shrink-0 border-s border-slate-300 dark:border-slate-600 ps-1">
        {/* 1. Preview Button (عرض) */}
        <button
          type="button"
          onClick={handlePreview}
          className="p-1 rounded text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
          title={isRtl ? 'عرض الملف (Preview)' : 'Preview File'}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* 2. Download Button (تحميل) */}
        <button
          type="button"
          onClick={handleDownload}
          className="p-1 rounded text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
          title={isRtl ? 'تحميل الملف (Download)' : 'Download File'}
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* 3. Delete Button (حذف) */}
        {!disabled && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            title={isRtl ? 'حذف الملف (Delete)' : 'Delete File'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
