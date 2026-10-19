import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { LoginPage } from '../components/LoginPage.tsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'lawyer' | 'viewer';
}

/**
 * Route Protection Middleware / Guard:
 * Ensures only authenticated users can access internal application views.
 * If unauthenticated, immediately redirects and renders the custom Login Page.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { currentUser, isAdmin } = useAuth();

  // 1. Unauthenticated Guard -> Redirect to Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  // 2. Role-Based Access Control (RBAC) Guard if required
  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-2xl">
          🚫
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          غير مصرح بالوصول / Access Restricted
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          هذه الصفحة تتطلب صلاحيات إدارة كاملة (Admin). يرجى مراجعة مسؤول النظام.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
