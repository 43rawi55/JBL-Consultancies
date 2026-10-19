import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  Briefcase,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle,
  Mail,
  Phone,
  Lock,
  KeyRound,
  Edit2,
  UserCheck,
  Search,
  Filter,
  AlertTriangle,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { User, UserRole } from '../types/schema.ts';

export const UsersView: React.FC = () => {
  const { cases, isRtl, t, showToast, recordAuditLog, setActiveTab } = useApp();
  const {
    users,
    currentUser,
    isAdmin,
    updateUserRole,
    addUser,
    updateUser,
    deleteUser,
    adminResetPassword,
  } = useAuth();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Add User Form State
  const [newName, setNewName] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('lawyer');
  const [newTitle, setNewTitle] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('lawyer');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Admin Reset Password State
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.nameEn && u.nameEn.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        (u.title && u.title.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q));
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchQuery]);

  // Count active cases for each user
  const getUserCaseCount = (userId: string) => {
    return cases.filter((c) => c.assigneeId === userId).length;
  };

  // KPIs
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const lawyerCount = users.filter((u) => u.role === 'lawyer').length;
  const viewerCount = users.filter((u) => u.role === 'viewer').length;

  // Security Check: Visible only to Admins
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {isRtl ? 'صلاحية الوصول مقتصرة على المدير' : 'Access Restricted to Administrators'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {isRtl
            ? 'لوحة إدارة المستخدمين والتحكم بكلمات المرور والصلاحيات مخصصة حصرياً للمدير الإداري (Admin).'
            : 'User Management and password control dashboard is strictly restricted to System Administrators.'}
        </p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
        >
          {isRtl ? 'العودة للوحة الرئيسية' : 'Return to Dashboard'}
        </button>
      </div>
    );
  }

  // 1. Handle Role Change
  const handleRoleChange = (userId: string, role: UserRole) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (userId === currentUser?.id && role !== 'admin') {
      showToast(
        isRtl
          ? 'لا يمكنك تخفيض صلاحيات حسابك الإداري الحالي'
          : 'You cannot downgrade your own admin account',
        'error'
      );
      return;
    }

    updateUserRole(userId, role);
    recordAuditLog?.({
      userName: currentUser ? (isRtl ? currentUser.name : currentUser.nameEn) : 'Admin',
      userEmail: currentUser?.email || 'admin@elitejurist.ae',
      userRole: 'admin',
      actionType: 'UPDATE',
      targetRecordId: userId,
      targetRecordIdentifier: targetUser.name,
      targetCategoryName: isRtl ? 'إدارة المستخدمين' : 'User Management',
      changeSummaryAr: `تغيير صلاحيات العضو "${targetUser.name}" إلى دور (${role === 'admin' ? 'مدير' : role === 'lawyer' ? 'محامي' : 'متابع'})`,
      changeSummaryEn: `Updated role for "${targetUser.nameEn || targetUser.name}" to ${role}`,
    });
    showToast(t('roleUpdatedSuccess'), 'success');
  };

  // 2. Handle Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    if (!newPassword || newPassword.length < 8) {
      showToast(
        isRtl
          ? 'كلمة المرور يجب أن لا تقل عن 8 خانات'
          : 'Password must be at least 8 characters',
        'error'
      );
      return;
    }

    const res = addUser({
      name: newName.trim(),
      nameEn: newNameEn.trim() || newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      title: newTitle.trim() || (newRole === 'admin' ? 'مدير' : newRole === 'lawyer' ? 'محامي مرافعة' : 'متابع قضايا'),
      titleEn: newTitle.trim() || (newRole === 'admin' ? 'Director' : newRole === 'lawyer' ? 'Litigation Associate' : 'Case Coordinator'),
      phone: newPhone.trim(),
      password: newPassword,
    });

    if (!res.success) {
      showToast(res.error || (isRtl ? 'حدث خطأ في إضافة العضو' : 'Failed to add user'), 'error');
      return;
    }

    recordAuditLog?.({
      userName: currentUser ? (isRtl ? currentUser.name : currentUser.nameEn) : 'Admin',
      userEmail: currentUser?.email || 'admin@elitejurist.ae',
      userRole: 'admin',
      actionType: 'CREATE',
      targetRecordId: `user_new`,
      targetRecordIdentifier: newName.trim(),
      targetCategoryName: isRtl ? 'إدارة المستخدمين' : 'User Management',
      changeSummaryAr: `إضافة مستخدم جديد "${newName}" بدور (${newRole}) وتشفير كلمة المرور عبر bcrypt`,
      changeSummaryEn: `Created user account for "${newName}" (${newRole}) with bcrypt password`,
    });

    setIsAddUserModalOpen(false);
    setNewName('');
    setNewNameEn('');
    setNewEmail('');
    setNewTitle('');
    setNewPhone('');
    setNewPassword('');
    showToast(
      isRtl
        ? 'تمت إضافة عضو الفريق بنجاح مع تشفير كلمة المرور عبر bcrypt'
        : 'Team member added with bcrypt encrypted password',
      'success'
    );
  };

  // 3. Open Edit Modal
  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditNameEn(u.nameEn || u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditTitle(u.title || '');
    setEditPhone(u.phone || '');
  };

  // 4. Save Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim() || !editEmail.trim()) {
      showToast(isRtl ? 'يرجى إدخال الاسم والبريد الإلكتروني' : 'Please provide name and email', 'error');
      return;
    }

    if (editingUser.id === currentUser?.id && editRole !== 'admin') {
      showToast(isRtl ? 'لا يمكنك إزالة دور المدير عن حسابك الحالي' : 'Cannot remove admin role from yourself', 'error');
      return;
    }

    const res = updateUser(editingUser.id, {
      name: editName.trim(),
      nameEn: editNameEn.trim() || editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      title: editTitle.trim(),
      titleEn: editTitle.trim(),
      phone: editPhone.trim(),
    });

    if (!res.success) {
      showToast(res.error || (isRtl ? 'فشل تحديث بيانات المستخدم' : 'Failed to update user'), 'error');
      return;
    }

    recordAuditLog?.({
      userName: currentUser ? (isRtl ? currentUser.name : currentUser.nameEn) : 'Admin',
      userEmail: currentUser?.email || 'admin@elitejurist.ae',
      userRole: 'admin',
      actionType: 'UPDATE',
      targetRecordId: editingUser.id,
      targetRecordIdentifier: editName.trim(),
      targetCategoryName: isRtl ? 'إدارة المستخدمين' : 'User Management',
      changeSummaryAr: `تحديث بيانات العضو "${editName}" (${editRole})`,
      changeSummaryEn: `Updated user profile for "${editName}" (${editRole})`,
    });

    setEditingUser(null);
    showToast(isRtl ? 'تم تحديث بيانات العضو بنجاح' : 'User profile updated successfully', 'success');
  };

  // 5. Open Admin Password Reset Modal
  const openResetPasswordModal = (u: User) => {
    setResetPwdUser(u);
    setAdminNewPassword('');
    setAdminConfirmPassword('');
    setShowAdminPassword(false);
  };

  // 6. Execute Admin Password Reset
  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdUser) return;

    if (!adminNewPassword || adminNewPassword.length < 8) {
      showToast(
        isRtl ? 'كلمة المرور يجب أن لا تقل عن 8 خانات' : 'Password must be at least 8 characters',
        'error'
      );
      return;
    }

    if (adminNewPassword !== adminConfirmPassword) {
      showToast(
        isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match',
        'error'
      );
      return;
    }

    setIsResetting(true);
    const res = await adminResetPassword(resetPwdUser.id, adminNewPassword);
    setIsResetting(false);

    if (!res.success) {
      showToast(res.error || (isRtl ? 'فشل إعادة تعيين كلمة المرور' : 'Failed to reset password'), 'error');
      return;
    }

    recordAuditLog?.({
      userName: currentUser ? (isRtl ? currentUser.name : currentUser.nameEn) : 'Admin',
      userEmail: currentUser?.email || 'admin@elitejurist.ae',
      userRole: 'admin',
      actionType: 'UPDATE',
      targetRecordId: resetPwdUser.id,
      targetRecordIdentifier: resetPwdUser.name,
      targetCategoryName: isRtl ? 'إدارة المستخدمين' : 'User Management',
      changeSummaryAr: `قام المدير بإعادة تعيين كلمة المرور للعضو "${resetPwdUser.name}" وتشفيرها عبر bcrypt`,
      changeSummaryEn: `Admin force-reset password for "${resetPwdUser.nameEn || resetPwdUser.name}" (bcrypt hashed)`,
    });

    setResetPwdUser(null);
    showToast(
      isRtl
        ? `تم تعيين كلمة المرور الجديدة للعضو "${resetPwdUser.name}" بنجاح وتشفيرها في قاعدة البيانات`
        : `Password for "${resetPwdUser.nameEn || resetPwdUser.name}" reset and encrypted successfully`,
      'success'
    );
  };

  // 7. Delete User confirmation
  const handleDeleteUser = () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser?.id) {
      showToast(isRtl ? 'لا يمكنك حذف حسابك الإداري الحالي' : 'Cannot delete your own account', 'error');
      setDeletingUser(null);
      return;
    }

    deleteUser(deletingUser.id);

    recordAuditLog?.({
      userName: currentUser ? (isRtl ? currentUser.name : currentUser.nameEn) : 'Admin',
      userEmail: currentUser?.email || 'admin@elitejurist.ae',
      userRole: 'admin',
      actionType: 'DELETE',
      targetRecordId: deletingUser.id,
      targetRecordIdentifier: deletingUser.name,
      targetCategoryName: isRtl ? 'إدارة المستخدمين' : 'User Management',
      changeSummaryAr: `حذف حساب العضو "${deletingUser.name}" (${deletingUser.email})`,
      changeSummaryEn: `Deleted user account "${deletingUser.nameEn || deletingUser.name}" (${deletingUser.email})`,
    });

    showToast(
      isRtl ? `تم حذف حساب "${deletingUser.name}" من النظام` : `User "${deletingUser.name}" removed`,
      'info'
    );
    setDeletingUser(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRtl ? 'إدارة المستخدمين والصلاحيات والتحكم بكلمات المرور' : 'User Management & Password Control'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {isRtl ? 'حصري للمدير (Admin)' : 'Admin Only'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl
                ? 'إنشاء وتعديل وحذف حسابات الفريق، التحكم بالأدوار والصلاحيات، وإعادة تعيين كلمات المرور المشفرة عبر bcrypt'
                : 'Create, update, delete team accounts, manage roles, and force-reset bcrypt hashed passwords'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? 'إضافة عضو فريق جديد' : 'Add New Member'}</span>
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{isRtl ? 'إجمالي الأعضاء' : 'Total Members'}</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalUsers}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{isRtl ? 'المدراء (Admin)' : 'Admins'}</span>
            <Shield className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {adminCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{isRtl ? 'المحامون والمستشارون' : 'Lawyers'}</span>
            <Briefcase className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {lawyerCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{isRtl ? 'المتابعون والمنسقون' : 'Viewers'}</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {viewerCount}
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'البحث بالاسم، البريد الإلكتروني، المسمى، أو الهاتف...' : 'Search by name, email, title, or phone...'}
            className="w-full ps-9 pe-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? 'الكل' : 'All'} ({totalUsers})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                roleFilter === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              {t('role_admin')} ({adminCount})
            </button>
            <button
              onClick={() => setRoleFilter('lawyer')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                roleFilter === 'lawyer'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              {t('role_lawyer')} ({lawyerCount})
            </button>
            <button
              onClick={() => setRoleFilter('viewer')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                roleFilter === 'viewer'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              {t('role_viewer')} ({viewerCount})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold select-none">
                <th className="py-3.5 px-4 text-start">{t('colUser')}</th>
                <th className="py-3.5 px-4 text-start">{t('colEmail')}</th>
                <th className="py-3.5 px-4 text-start">{t('colRole')}</th>
                <th className="py-3.5 px-4 text-start">{t('colAssignedCasesCount')}</th>
                <th className="py-3.5 px-4 text-start">{t('colPhone')}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'حالة التشفير' : 'Security'}</th>
                <th className="py-3.5 px-4 text-center">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {isRtl ? 'لا يوجد أعضاء مطابقين للبحث' : 'No members found matching search'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const caseCount = getUserCaseCount(u.id);
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* User Avatar & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 shadow-2xs"
                            style={{ backgroundColor: u.color }}
                          >
                            {u.initials}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{isRtl ? u.name : (u.nameEn || u.name)}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                                  {isRtl ? 'حسابك الحالي' : 'You'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isRtl ? u.title : (u.titleEn || u.title)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[11px]">{u.email}</span>
                        </div>
                      </td>

                      {/* Role Selector with inline Admin update */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="admin">{t('role_admin')}</option>
                          <option value="lawyer">{t('role_lawyer')}</option>
                          <option value="viewer">{t('role_viewer')}</option>
                        </select>
                      </td>

                      {/* Active Caseload */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono tabular-nums text-xs font-bold text-slate-800 dark:text-slate-200">
                          {caseCount}
                        </span>
                        <span className="text-[11px] text-slate-400 mx-1">
                          {isRtl ? 'قضايا' : 'cases'}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {u.phone || '—'}
                      </td>

                      {/* Security Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                          <Lock className="w-2.5 h-2.5" />
                          <span>bcrypt (10 rounds)</span>
                        </span>
                      </td>

                      {/* Actions: Edit, Reset Password, Delete */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit User Button */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                            title={isRtl ? 'تعديل بيانات العضو والصلاحيات' : 'Edit Member & Role'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Admin Reset Password Button */}
                          <button
                            onClick={() => openResetPasswordModal(u)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                            title={isRtl ? 'إعادة تعيين كلمة المرور كمدير' : 'Force Reset Password'}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button (disabled for current user) */}
                          {!isCurrent ? (
                            <button
                              onClick={() => setDeletingUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={isRtl ? 'حذف العضو من النظام' : 'Remove Member'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="w-7 h-7" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW USER */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isRtl ? 'إضافة عضو جديد إلى طاقم العمل' : 'Add New Team Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'الاسم بالعربية *' : 'Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={isRtl ? 'المستشار / أحمد المهيري' : 'Adv. Ahmed Al-Mheiri'}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'الاسم بالإنجليزية' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={newNameEn}
                    onChange={(e) => setNewNameEn(e.target.value)}
                    placeholder="Adv. Ahmed Al-Mheiri"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'البريد الإلكتروني المهني *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ahmed.lawyer@elitejurist.ae"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'الصلاحية / الدور *' : 'Role & Permissions *'}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="admin">{t('role_admin')} (صلاحيات إدارية كاملة)</option>
                    <option value="lawyer">{t('role_lawyer')} (إدارة وتعديل القضايا والمستندات)</option>
                    <option value="viewer">{t('role_viewer')} (عرض ومتابعة الملفات فقط)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'المسمى الوظيفي' : 'Job Title'}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={isRtl ? 'محامي استئناف ومستشار قانوني' : 'Senior Litigation Associate'}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'كلمة المرور المشفرة (8 خانات كحد أدنى) *' : 'Password (min 8 chars) *'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pe-10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isRtl
                    ? 'سيتم تشفير كلمة المرور فوراً عبر دالة bcrypt بـ 10 Salt Rounds.'
                    : 'Password will be securely hashed with bcrypt (10 rounds).'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {isRtl ? 'حفظ وإضافة العضو' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER & ROLES */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Edit2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isRtl ? 'تعديل بيانات العضو والصلاحيات' : 'Edit Member Profile & Roles'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'الاسم بالعربية *' : 'Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'الاسم بالإنجليزية' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={editNameEn}
                    onChange={(e) => setEditNameEn(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'البريد الإلكتروني *' : 'Email *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'الدور والصلاحية *' : 'Role & Permissions *'}
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="admin">{t('role_admin')}</option>
                    <option value="lawyer">{t('role_lawyer')}</option>
                    <option value="viewer">{t('role_viewer')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'المسمى الوظيفي' : 'Job Title'}
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADMIN FORCE RESET PASSWORD */}
      {/* ========================================================================= */}
      {resetPwdUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isRtl ? 'إعادة تعيين كلمة المرور كمدير' : 'Admin Force Password Reset'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetPwdUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Info */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0"
                style={{ backgroundColor: resetPwdUser.color }}
              >
                {resetPwdUser.initials}
              </span>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {isRtl ? resetPwdUser.name : (resetPwdUser.nameEn || resetPwdUser.name)}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {resetPwdUser.email}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isRtl
                ? 'بصفتك مدير النظام، يمكنك تعيين كلمة مرور جديدة للعضو مباشرة. سيتم تشفيرها بأمان عبر خوارزمية bcrypt.'
                : 'As an Administrator, you can force-set a new password for this user. It will be securely hashed with bcrypt.'}
            </p>

            <form onSubmit={handleAdminResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'كلمة المرور الجديدة (8 خانات كحد أدنى) *' : 'New Password (min 8 chars) *'}
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pe-10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
                </label>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isResetting ? (isRtl ? 'جاري التشفير والحفظ...' : 'Hashing...') : (isRtl ? 'إعادة التعيين والتشفير' : 'Reset & Encrypt')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE USER CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isRtl ? 'تأكيد حذف الحساب' : 'Confirm Delete User'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isRtl
                  ? `هل أنت متأكد من حذف حساب "${deletingUser.name}"؟ لن يتمكن العضو من تسجيل الدخول بعد الآن.`
                  : `Are you sure you want to remove "${deletingUser.name}"? They will no longer have access to the system.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                {isRtl ? 'نعم، حذف الحساب' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
