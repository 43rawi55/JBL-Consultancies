import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast, isRtl } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed bottom-4 ${
        isRtl ? 'left-4' : 'right-4'
      } z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none`}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-200 text-xs font-medium animate-in fade-in slide-in-from-bottom duration-200"
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && (
              <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-400 dark:text-rose-600 shrink-0" />
            )}
            {toast.type === 'info' && (
              <Info className="w-4 h-4 text-sky-400 dark:text-sky-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>

          <button
            onClick={() => dismissToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
