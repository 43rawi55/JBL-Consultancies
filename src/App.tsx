/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { ProtectedRoute } from './auth/ProtectedRoute.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CaseTableView } from './components/CaseTableView.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { UsersView } from './components/UsersView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { AuditLogView } from './components/AuditLogView.tsx';
import { CaseDetailsDrawer } from './components/CaseDetailsDrawer.tsx';
import { CaseFormModal } from './components/CaseFormModal.tsx';
import { NewPageModal } from './components/NewPageModal.tsx';
import { AddColumnModal } from './components/AddColumnModal.tsx';
import { GoogleSheetsModal } from './components/GoogleSheetsModal.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';

const AppContent: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { activeTab } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Route Protection Middleware:
  // If unauthenticated, immediately display custom Login & Registration screen
  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Workspace Sidebar */}
        <Sidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Header Bar */}
          <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

          {/* Viewport Router Protected Routes */}
          <main className="flex-1 overflow-y-auto">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'cases' && <CaseTableView />}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'users' && (isAdmin ? <UsersView /> : <DashboardView />)}
            {activeTab === 'audit_log' && (isAdmin ? <AuditLogView /> : <DashboardView />)}
            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>

        {/* Global Modals & Drawers */}
        <CaseDetailsDrawer />
        <CaseFormModal />
        <NewPageModal />
        <AddColumnModal />
        <GoogleSheetsModal />
        <ToastContainer />
      </div>
    </ProtectedRoute>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
