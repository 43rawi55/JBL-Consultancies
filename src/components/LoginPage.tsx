import React, { useState } from 'react';
import {
  Scale,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Sun,
  Moon,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useApp } from '../context/AppContext.tsx';
import { loginSchema } from '../auth/authSchemas.ts';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { isRtl, lang, setLang, theme, toggleTheme, showToast, firmLogo, firmDetails } = useApp();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clean login states (strictly empty credentials by default - no hardcoded/demo accounts)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Field validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFormErrors({});

    // Zod Validation
    const validation = loginSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
      rememberMe,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(loginEmail, loginPassword, rememberMe);
      if (!res.success) {
        setErrorMessage(res.error || (isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid email or password'));
        showToast(res.error || (isRtl ? 'فشل تسجيل الدخول' : 'Sign in failed'), 'error');
      } else {
        showToast(
          isRtl ? 'تم تسجيل الدخول بنجاح! مرحباً بك' : 'Signed in successfully! Welcome',
          'success'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Floating Controls: Language & Theme */}
      <div className="absolute top-4 end-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>

      {/* Brand Hero Panel */}
      <div className="md:w-5/12 bg-linear-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-e border-slate-800">
        {/* Background glow effects */}
        <div className="absolute -top-24 -start-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -end-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Firm Logo & Header */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3.5">
            {firmLogo ? (
              <img
                src={firmLogo}
                alt="Firm Logo"
                className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-xl bg-white/5"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-indigo-600/15">
                <Scale className="w-7 h-7" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-serif">
                {isRtl ? (firmDetails?.nameAr || 'ذا ايليت للمحاماة') : (firmDetails?.nameEn || 'THE ELITE JURIST')}
              </h1>
              <p className="text-[11px] text-indigo-300 font-mono tracking-widest uppercase">
                {isRtl ? 'والاستشارات القانونية' : 'ADVOCATES & LEGAL CONSULTANTS'}
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {isRtl
                ? 'منظومة الإدارة القضائية والمرافعة المتكاملة'
                : 'Integrated Court & Legal Practice Management System'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isRtl
                ? 'نظام أمني متقدم لإدارة رول الجلسات، ملفات التنفيذ، مراجعة العقود، وحفظ وتخزين المستندات عبر السحابة بدقة واحترافية.'
                : 'Enterprise legal management for judicial court rolls, executions, contracts, and secure cloud case file integration.'}
            </p>
          </div>

          <div className="pt-4 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isRtl ? 'إدارة رول الجلسات ومواعيد المحاكم لحظياً' : 'Real-time Court Hearing Rolls & Deadlines'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isRtl ? 'تخزين المستندات والملفات سحابياً عبر Google Drive' : 'Cloud Attachment & File Storage with Google Drive'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isRtl ? 'تصدير الكشوفات حصرياً بصيغة جداول Excel (.xlsx)' : 'Strict Table Data Export via Excel (.xlsx)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isRtl ? 'صلاحيات وصول محكمة وإدارة المستخدمين للمدير فقط' : 'Strict Role-Based Access Control (Admin Only)'}</span>
            </div>
          </div>
        </div>

        {/* Security Seals */}
        <div className="relative z-10 pt-6 mt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'حماية مشفرة عبر خوارزمية bcrypt المعتمدة' : 'Bcrypt Encrypted Authentication'}</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">UAE Legal Standard</span>
        </div>
      </div>

      {/* Auth Form Panel: Strictly Clean Login Screen */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 border border-indigo-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>{isRtl ? 'بوابة الدخول الآمن للموظفين' : 'Staff Secure Access Portal'}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isRtl ? 'تسجيل الدخول' : 'Sign In'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl
                ? 'أدخل بريدك الإلكتروني المعتمد وكلمة المرور للوصول إلى النظام'
                : 'Enter your registered email and password to access the firm workspace'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Clean Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@firm.com"
                  autoComplete="username"
                  className={`w-full ps-10 pe-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    formErrors.email
                      ? 'border-rose-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="text-[11px] text-rose-500">{formErrors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full ps-10 pe-10 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    formErrors.password
                      ? 'border-rose-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-[11px] text-rose-500">{formErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Help */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span>{isRtl ? 'تذكر تسجيل دخولي' : 'Remember me'}</span>
              </label>

              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                {isRtl ? 'دخول محمي ومراقب' : 'Restricted Access'}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

          {/* Notice to Staff */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
            {isRtl
              ? 'إنشاء حسابات المستخدمين الجدد وتعيين الصلاحيات يتم حصرياً من الداخل بواسطة مدير النظام (Admin).'
              : 'User accounts and access roles are managed exclusively from within the portal by the System Administrator.'}
          </div>
        </div>
      </div>
    </div>
  );
};
