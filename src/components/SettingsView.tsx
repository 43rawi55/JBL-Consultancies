import React, { useState, useRef } from 'react';
import {
  Settings,
  Globe,
  Sun,
  Moon,
  Building,
  Shield,
  Database,
  Download,
  RotateCcw,
  Code2,
  Copy,
  Check,
  FileSignature,
  Printer,
  Upload,
  Image as ImageIcon,
  Trash2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  User,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const SettingsView: React.FC = () => {
  const {
    lang,
    setLang,
    theme,
    setTheme,
    toggleTheme,
    resetToInitialData,
    clearAllCases,
    cases,
    isRtl,
    t,
    showToast,
    firmLogo,
    setFirmLogo,
    firmDetails,
    updateFirmDetails,
  } = useApp();

  const { isAdmin, currentUser, updatePassword } = useAuth();

  // Tabs: If admin, default to 'firm'. If non-admin, default to 'profile'.
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'firm' | 'system' | 'database' | 'templates' | 'profile'
  >(() => (isAdmin ? 'firm' : 'profile'));

  const [copiedPrisma, setCopiedPrisma] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firm Details Form State
  const [nameAr, setNameAr] = useState(firmDetails?.nameAr || 'مكتب النخبة للمحاماة والاستشارات القانونية');
  const [nameEn, setNameEn] = useState(firmDetails?.nameEn || 'Elite Jurist Advocates & Legal Consultants');
  const [regNo, setRegNo] = useState(firmDetails?.regNo || 'CN-1094829');
  const [taxNo, setTaxNo] = useState(firmDetails?.taxNo || '100294819200003');
  const [phone, setPhone] = useState(firmDetails?.phone || '+971 4 234 5678');
  const [address, setAddress] = useState(firmDetails?.address || 'دبي، الخليج التجاري، برج أوبال، الطابق 14');

  // Password change state for staff
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Template generator state
  const [templateType, setTemplateType] = useState<'notice' | 'memo'>('notice');
  const [clientInput, setClientInput] = useState('شركة النخبة العالمية للمقاولات');
  const [opponentInput, setOpponentInput] = useState('مؤسسة الأفق لتوريد مواد البناء');
  const [claimInput, setClaimInput] = useState('2,450,000');
  const [detailsInput, setDetailsInput] = useState('عدم الالتزام بتوريد الكميات المتفق عليها وفق العقد المبرم وتأخير إنجاز المشروع');

  // Handle Logo Upload (Base64 file reader)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(isRtl ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)' : 'Please select a valid image file', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast(isRtl ? 'حجم الصورة يجب ألا يتجاوز 2 ميجابايت' : 'Image size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFirmLogo(result);
      showToast(isRtl ? 'تم تحديث لوجو المكتب بنجاح وعكسه في كامل النظام' : 'Firm logo updated across system', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFirmLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast(isRtl ? 'تمت إزالة اللوجو واستعادة الشعار الافتراضي' : 'Logo removed, reverted to default', 'info');
  };

  const handleSaveFirmDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateFirmDetails({
      nameAr,
      nameEn,
      regNo,
      taxNo,
      phone,
      address,
    });
    showToast(isRtl ? 'تم حفظ بيانات المكتب الرسمية بنجاح' : 'Firm details updated successfully', 'success');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd || !newPwd || !confirmPwd) {
      showToast(isRtl ? 'يرجى ملء كافة حقول كلمة المرور' : 'Please fill all password fields', 'error');
      return;
    }
    if (newPwd !== confirmPwd) {
      showToast(isRtl ? 'كلمة المرور الجديدة غير متطابقة' : 'New passwords do not match', 'error');
      return;
    }
    if (newPwd.length < 8) {
      showToast(isRtl ? 'كلمة المرور يجب أن لا تقل عن 8 أحرف' : 'Password must be at least 8 characters', 'error');
      return;
    }

    const res = await updatePassword(currentPwd, newPwd);
    if (res.success) {
      showToast(isRtl ? 'تم تحديث كلمة المرور بنجاح' : 'Password changed successfully', 'success');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } else {
      showToast(res.error || (isRtl ? 'فشل تغيير كلمة المرور' : 'Failed to change password'), 'error');
    }
  };

  const handleExportBackup = () => {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      firm: { nameAr, nameEn, regNo, taxNo, phone, address, logo: firmLogo },
      cases,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Elite_Jurist_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast(isRtl ? 'تم تصدير النسخة الاحتياطية بنجاح' : 'Backup downloaded successfully', 'success');
  };

  const prismaSchemaCode = `// Prisma Database Schema for Law Firm Management System
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  ADMIN   // مدير: Full access & Firm details & Users
  LAWYER  // محامي: View and edit cases assigned to them
  VIEWER  // متابع: Read-only access
}

enum CaseStatus {
  UNDER_REVIEW       // قيد النظر والدراسة
  HEARING_SCHEDULED  // جلسة مرافعة مجدولة
  EXPERT_REPORT      // تقرير خبرة
  RESERVED_JUDGMENT  // محجوزة للحكم
  EXECUTED           // منفذة
  CLOSED             // منتهية ومؤرشفة
}

model FirmProfile {
  id        String   @id @default("firm_main")
  nameAr    String
  nameEn    String
  logoUrl   String?
  regNo     String
  taxNo     String?
  phone     String?
  address   String?
  updatedAt DateTime @updatedAt
}

model User {
  id            String        @id @default(uuid())
  email         String        @unique
  nameAr        String
  nameEn        String
  role          UserRole      @default(LAWYER)
  assignedCases Case[]        @relation("AssignedLawyer")
  createdAt     DateTime      @default(now())
}

model Case {
  id                  String        @id @default(uuid())
  caseNumber          String        @unique
  categoryId          String
  clientName          String
  opponentName        String
  assigneeId          String
  assignee            User          @relation("AssignedLawyer", fields: [assigneeId], references: [id])
  court               String
  sessionDate         DateTime?
  status              CaseStatus    @default(HEARING_SCHEDULED)
  customFields        Json?
  createdAt           DateTime      @default(now())
}`;

  const copyPrismaToClipboard = () => {
    navigator.clipboard.writeText(prismaSchemaCode);
    setCopiedPrisma(true);
    showToast(isRtl ? 'تم نسخ المخطط إلى الحافظة' : 'Prisma schema copied to clipboard', 'success');
    setTimeout(() => setCopiedPrisma(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Settings className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t('settingsTitle')}</span>
              {isAdmin && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {isRtl ? 'لوحة تحكم المدير (Admin)' : 'Admin Console'}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAdmin
                ? isRtl
                  ? 'إدارة بيانات المكتب، اللوجو، إعدادات النظام، والنسخ الاحتياطي'
                  : 'Manage firm details, logo, system UI, and database settings'
                : isRtl
                ? 'الملف الشخصي، بيانات الاعتماد، والاشتراك في النماذج القانونية'
                : 'Personal profile, credentials, and legal templates'}
            </p>
          </div>
        </div>

        {/* Dynamic RBAC Navigation Tabs */}
        <div className="flex items-center flex-wrap bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto gap-1">
          {isAdmin && (
            <>
              {/* Tab 1: Firm Details & Logo (Strictly Admin Only) */}
              <button
                onClick={() => setActiveSettingsTab('firm')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSettingsTab === 'firm'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isRtl ? 'بيانات المكتب واللوجو' : 'Firm Details & Logo'}</span>
              </button>

              {/* Tab 2: System & UI Settings (Strictly Admin Only) */}
              <button
                onClick={() => setActiveSettingsTab('system')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSettingsTab === 'system'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>{isRtl ? 'إعدادات النظام والواجهة' : 'System & UI Settings'}</span>
              </button>

              {/* Tab 3: Database & Backup */}
              <button
                onClick={() => setActiveSettingsTab('database')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSettingsTab === 'database'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isRtl ? 'النسخ الاحتياطي والمخطط' : 'Database & Backup'}</span>
              </button>
            </>
          )}

          {/* Tab: Profile & Credentials (Accessible to ALL Users including Admin) */}
          <button
            onClick={() => setActiveSettingsTab('profile')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSettingsTab === 'profile'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isRtl ? 'الملف الشخصي وكلمة المرور' : 'Profile & Password'}</span>
          </button>

          {/* Tab: Legal Templates (Accessible to All) */}
          <button
            onClick={() => setActiveSettingsTab('templates')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSettingsTab === 'templates'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5 text-amber-500" />
            <span>{isRtl ? 'نماذج ومذكرات' : 'Legal Templates'}</span>
          </button>
        </div>
      </div>

      {/* Non-Admin Informative Security Banner */}
      {!isAdmin && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isRtl
              ? 'ملاحظة أمنية: إعدادات بيانات المكتب واللوجو وإعدادات النظام والواجهة وإدارة المستخدمين محمية ومقتصرة حصرياً على مدير النظام (Admin).'
              : 'Security Notice: Firm details, firm logo, system UI settings, and user management are strictly restricted to System Administrators (Admin).'}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: FIRM DETAILS & LOGO (STRICTLY ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isAdmin && activeSettingsTab === 'firm' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1.1 Firm Logo Upload Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>{isRtl ? 'لوجو المكتب والشعار الرسمي' : 'Firm Logo & Official Branding'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRtl
                  ? 'رفع لوجو المكتب الرسمي ليظهر في أعلى القائمة الجانبية وصفحة تسجيل الدخول والتقارير'
                  : 'Upload official firm logo to reflect across the sidebar, login page, and documents'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              {/* Logo Preview */}
              <div className="relative group shrink-0">
                {firmLogo ? (
                  <img
                    src={firmLogo}
                    alt="Firm Logo"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-md bg-white dark:bg-slate-900"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-dashed border-indigo-400/40 flex flex-col items-center justify-center text-amber-400 shadow-md gap-1">
                    <Scale className="w-8 h-8" />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isRtl ? 'شعار افتراضي' : 'Default'}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3 text-center sm:text-start">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {firmLogo
                      ? isRtl
                        ? 'تم تعيين اللوجو المخصص للمكتب'
                        : 'Custom Firm Logo Active'
                      : isRtl
                      ? 'لم يتم رفع لوجو مخصص بعد'
                      : 'No custom logo uploaded'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isRtl
                      ? 'الصيغ المدعومة: PNG, JPG, SVG, WebP. الحجم الأقصى 2 ميجابايت.'
                      : 'Supported formats: PNG, JPG, SVG, WebP. Maximum size 2MB.'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{firmLogo ? (isRtl ? 'تغيير اللوجو' : 'Replace Logo') : (isRtl ? 'رفع لوجو المكتب' : 'Upload Firm Logo')}</span>
                  </button>

                  {firmLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إزالة اللوجو' : 'Remove Logo'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 1.2 Firm Official Profile Form */}
          <form
            onSubmit={handleSaveFirmDetails}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? 'بيانات المكتب الرسمية (Firm Details)' : 'Official Firm Details'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRtl
                  ? 'المعلومات القانونية المعتمدة للمكتب المسجلة لدى وزارة العدل والمحاكم'
                  : 'Official firm registration, commercial license, and court credentials'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'اسم المكتب (بالعربية)' : 'Firm Name (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'اسم المكتب (بالإنجليزية)' : 'Firm Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'رقم القيد / الترخيص التجاري' : 'Registration / License No.'}
                </label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'الرقم الضريبي (TRN)' : 'Tax Registration Number (TRN)'}
                </label>
                <input
                  type="text"
                  value={taxNo}
                  onChange={(e) => setTaxNo(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'رقم الهاتف الرسمي' : 'Office Telephone'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'المقر والعنوان' : 'Office Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isRtl ? 'حفظ بيانات المكتب' : 'Save Firm Details'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: SYSTEM & UI SETTINGS (STRICTLY ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isAdmin && activeSettingsTab === 'system' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span>{isRtl ? 'إعدادات النظام والواجهة (System & UI Settings)' : 'System & UI Settings'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl
                ? 'تخصيص الثيم اللوني، اللغة الافتراضية، ومظهر جداول القضايا للنظام'
                : 'Configure workspace theme, system language, and display layout'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Language Setting */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {isRtl ? 'اللغة الافتراضية واتجاه الواجهة' : 'System Language & Direction'}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLang('ar')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    lang === 'ar'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  العربية (RTL)
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  English (LTR)
                </button>
              </div>
            </div>

            {/* Theme Setting */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {isRtl ? 'نمط الثيم والمظهر' : 'Color Theme Mode'}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? 'أبيض (نهاري)' : 'Light'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>{isRtl ? 'أسود (ليلي)' : 'Dark'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: DATABASE & BACKUP (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isAdmin && activeSettingsTab === 'database' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-500" />
              <span>{isRtl ? 'النسخ الاحتياطي وإدارة البيانات' : 'Data Backup & Restore'}</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isRtl ? 'تصدير نسخة احتياطية لكافة بيانات القضايا' : 'Export Full Cases JSON Backup'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {isRtl
                    ? 'ملف JSON يحتوي على جميع بيانات الدعاوى والمحاكم وسجلات الجلسات'
                    : 'Contains all dossiers, courts, proceedings, and timestamps'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('exportJson')}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/20">
              <div>
                <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  {isRtl ? 'تفريغ كافة البيانات والدعاوي من الأقسام' : 'Clear All Records from Sections'}
                </div>
                <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
                  {isRtl
                    ? 'مسح كافة القضايا والصفوف والبيانات الداخلية مع بقاء كافة الجداول والأعمدة والأقسام مهيأة وثابتة تماماً'
                    : 'Wipe all case rows and entered data while keeping all table schemas, columns, and categories intact'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      isRtl
                        ? 'هل أنت متأكد من تفريغ كافة البيانات والدعاوي مع الحفاظ على الجداول؟'
                        : 'Are you sure you want to clear all data while preserving table structures?'
                    )
                  ) {
                    clearAllCases();
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 hover:bg-rose-200 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تفريغ البيانات الآن' : 'Clear All Data'}</span>
              </button>
            </div>
          </div>

          {/* Prisma Schema Viewer */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-500" />
                  <span>Prisma Relational Database Schema (`schema.prisma`)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isRtl
                    ? 'المخطط العلائقي الكامل المصمم لقواعد بيانات PostgreSQL / Supabase'
                    : 'Production-ready database schema for PostgreSQL, Supabase, and Node.js backend'}
                </p>
              </div>

              <button
                type="button"
                onClick={copyPrismaToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {copiedPrisma ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrisma ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ المخطط' : 'Copy Schema')}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 p-4 text-xs font-mono max-h-[380px] overflow-y-auto">
              <pre className="whitespace-pre">{prismaSchemaCode}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: PERSONAL PROFILE & CREDENTIALS (NON-ADMIN VIEW) */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'profile' && currentUser && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              <span>{isRtl ? 'الملف الشخصي للموظف' : 'Staff Profile & Credentials'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl ? 'بيانات حسابك المسجل وصلاحياتك وتغيير كلمة المرور' : 'Your registered account details and password change'}
            </p>
          </div>

          {/* User Info Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-md shrink-0"
              style={{ backgroundColor: currentUser.color || '#4F46E5' }}
            >
              {currentUser.initials}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {isRtl ? currentUser.name : currentUser.nameEn}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentUser.role === 'admin'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : currentUser.role === 'lawyer'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {currentUser.role === 'admin' ? t('role_admin') : currentUser.role === 'lawyer' ? t('role_lawyer') : t('role_viewer')}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {currentUser.email}
              </div>
              {currentUser.title && (
                <div className="text-[11px] text-slate-400">
                  {isRtl ? currentUser.title : currentUser.titleEn}
                </div>
              )}
            </div>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isRtl ? 'تغيير كلمة المرور وتحديثها' : 'Change & Update Password'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'كلمة المرور الحالية *' : 'Current Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    required
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pe-9 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute inset-y-0 end-0 pe-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'كلمة المرور الجديدة *' : 'New Password (min 8) *'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pe-9 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute inset-y-0 end-0 pe-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pe-9 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute inset-y-0 end-0 pe-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-400">
                {isRtl
                  ? 'يتم تشفير كلمة المرور وتأمينها عبر bcrypt لحماية حسابك'
                  : 'Passwords are encrypted with bcrypt salt rounds for security'}
              </span>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                {isRtl ? 'تحديث كلمة المرور' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: LEGAL TEMPLATES & NOTICES (ACCESSIBLE TO ALL) */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'templates' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'منشئ المذكرات والإنذارات القانونية' : 'Legal Memo & Notice Generator'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRtl
                  ? 'صياغة وطباعة سريعة للإنذارات العدلية والمذكرات الجوابية المعتمدة'
                  : 'Instantly generate formatted court briefs and legal notices'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRtl ? 'طباعة المستند' : 'Print Document'}</span>
            </button>
          </div>

          {/* Template Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                {isRtl ? 'نوع النموذج' : 'Template Type'}
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
              >
                <option value="notice">{isRtl ? 'إنذار عدلي رسمي (الكاتب العدل)' : 'Notary Public Legal Notice'}</option>
                <option value="memo">{isRtl ? 'مذكرة جوابية ودفاع ختامي' : 'Defense Memorandum'}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                {isRtl ? 'اسم الموكل' : 'Client Name'}
              </label>
              <input
                type="text"
                value={clientInput}
                onChange={(e) => setClientInput(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                {isRtl ? 'اسم الخصم المنذر إليه' : 'Opponent Name'}
              </label>
              <input
                type="text"
                value={opponentInput}
                onChange={(e) => setOpponentInput(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Formatted Legal Document Preview */}
          <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-6 bg-slate-50/70 dark:bg-slate-950 font-serif leading-relaxed text-slate-900 dark:text-slate-100 space-y-4">
            <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3 space-y-1">
              <div className="flex items-center justify-center gap-2">
                {firmLogo && (
                  <img src={firmLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain inline-block" />
                )}
                <span className="font-bold text-sm tracking-wide">{isRtl ? nameAr : nameEn}</span>
              </div>
              <div className="text-xs text-slate-500 font-sans">{regNo} · {address}</div>
              <div className="text-base font-bold underline pt-2">
                {templateType === 'notice'
                  ? (isRtl ? 'إخطار وإنذار قانوني رسمي على يد كاتب عدل' : 'OFFICIAL LEGAL NOTICE THROUGH NOTARY PUBLIC')
                  : (isRtl ? 'مذكرة بدفاع الموكل أمام المحكمة الموقرة' : 'DEFENSE MEMORANDUM BEFORE THE HONORABLE COURT')}
              </div>
            </div>

            <div className="text-xs space-y-3">
              <p>
                <strong>{isRtl ? 'بناءً على طلب المنذر / الموكل:' : 'At the request of:'}</strong> {clientInput}، ومحله المختار {isRtl ? nameAr : nameEn}.
              </p>
              <p>
                <strong>{isRtl ? 'نوجه هذا الإنذار إلى المنذر إليه / الخصم:' : 'Addressed to:'}</strong> {opponentInput}.
              </p>
              <p>
                <strong>{isRtl ? 'الموضوع والوقائع:' : 'Subject & Grounds:'}</strong> {detailsInput}. ونظراً لترتب مبالغ مالية قدرها ({claimInput} درهم إماراتي)، فإننا ننذركم بضرورة السداد أو التسوية الودية خلال مهلة 15 يوماً من تاريخ استلامكم هذا الإشعار.
              </p>
              <p className="italic text-slate-600 dark:text-slate-400">
                {isRtl
                  ? 'وإلا فإن موكلنا سيتخذ كافة الإجراءات القضائية والقانونية، بما فيها المطالبة بالتعويضات والفوائد والمصاريف.'
                  : 'Failing which, our client reserves all legal rights to initiate legal action and claim damages.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs font-sans">
              <div>
                <span className="text-slate-500 block">{isRtl ? 'المحامي المسؤول:' : 'Counsel:'}</span>
                <span className="font-bold">{currentUser ? (isRtl ? currentUser.name : currentUser.nameEn) : 'محامي المكتب'}</span>
              </div>
              <div className="text-end">
                <span className="text-slate-500 block">{isRtl ? 'التاريخ:' : 'Date:'}</span>
                <span className="font-mono">{new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
