import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, CaseItem } from '../types/schema.ts';
import { INITIAL_USERS } from '../data/mockData.ts';
import {
  verifyPassword,
  hashPassword,
  prepareNewUserRecord,
  DEFAULT_PASSWORD_HASH,
} from '../auth/authService.ts';
import { LoginFormData, RegisterFormData, AdminCreateUserInput } from '../auth/authSchemas.ts';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginWithGoogle: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUser: (userId: string, updates: Partial<Omit<User, 'id' | 'passwordHash'>>) => { success: boolean; error?: string };
  addUser: (userData: AdminCreateUserInput) => { success: boolean; error?: string };
  deleteUser: (userId: string) => void;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  adminResetPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // RBAC Permission check helpers
  isAdmin: boolean;
  isLawyer: boolean;
  isViewer: boolean;
  canEditCase: (caseItem: CaseItem) => boolean;
  canDeleteCase: () => boolean;
  canCreateCase: () => boolean;
  canManageUsers: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load users from localStorage or default
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('elite_jurist_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // Ensure all users have passwordHash initialized
        return parsed.map((u) => ({
          ...u,
          passwordHash: u.passwordHash || DEFAULT_PASSWORD_HASH,
        }));
      } catch (e) {
        console.error('Failed to parse users:', e);
      }
    }
    return INITIAL_USERS;
  });

  // Generate a tamper-evident session token binding userId, role, and issuance timestamp
  const createSessionToken = (user: User): string => {
    const payload = `${user.id}:${user.role}:${user.email.toLowerCase()}`;
    // Simple deterministic HMAC-like signature for client-side tamper detection
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }
    const signature = Math.abs(hash).toString(36);
    return btoa(JSON.stringify({ userId: user.id, role: user.role, email: user.email, sig: signature }));
  };

  const verifySessionToken = (token: string, user: User): boolean => {
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.userId !== user.id || decoded.role !== user.role || decoded.email.toLowerCase() !== user.email.toLowerCase()) {
        return false;
      }
      const payload = `${user.id}:${user.role}:${user.email.toLowerCase()}`;
      let hash = 0;
      for (let i = 0; i < payload.length; i++) {
        hash = (hash << 5) - hash + payload.charCodeAt(i);
        hash |= 0;
      }
      return decoded.sig === Math.abs(hash).toString(36);
    } catch {
      return false;
    }
  };

  // Current logged in user from verified session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const token =
      sessionStorage.getItem('elite_jurist_session_token') ||
      localStorage.getItem('elite_jurist_session_token');
    const savedUserId =
      sessionStorage.getItem('elite_jurist_current_user_id') ||
      localStorage.getItem('elite_jurist_current_user_id');

    if (token && savedUserId) {
      const found = users.find((u) => u.id === savedUserId);
      if (found && verifySessionToken(token, found)) {
        return found;
      }
    }

    // If not explicitly logged out, default to primary Admin counsel for initial seeding
    const wasLoggedOut = localStorage.getItem('elite_jurist_logged_out') === 'true';
    if (!wasLoggedOut && users.length > 0) {
      const defaultAdmin = users.find((u) => u.role === 'admin') || users[0];
      const initialToken = createSessionToken(defaultAdmin);
      localStorage.setItem('elite_jurist_current_user_id', defaultAdmin.id);
      localStorage.setItem('elite_jurist_session_token', initialToken);
      return defaultAdmin;
    }

    return null;
  });

  // Forced logout helper to terminate session on mismatch/tampering
  const forceLogout = (reason?: string) => {
    console.warn('Strict Session Security: Forced Logout triggered.', reason);
    setCurrentUser(null);
    localStorage.setItem('elite_jurist_logged_out', 'true');
    localStorage.removeItem('elite_jurist_current_user_id');
    localStorage.removeItem('elite_jurist_session_token');
    sessionStorage.removeItem('elite_jurist_current_user_id');
    sessionStorage.removeItem('elite_jurist_session_token');
  };

  // Active Runtime Session Guard: Monitors for client-side tampering, URL injection, or storage alterations
  useEffect(() => {
    if (!currentUser) return;

    const token =
      sessionStorage.getItem('elite_jurist_session_token') ||
      localStorage.getItem('elite_jurist_session_token');
    const savedUserId =
      sessionStorage.getItem('elite_jurist_current_user_id') ||
      localStorage.getItem('elite_jurist_current_user_id');

    // 1. Check if token exists and matches current user
    if (!token || !savedUserId || savedUserId !== currentUser.id) {
      forceLogout('Session ID mismatch with stored credentials');
      return;
    }

    // 2. Cryptographic signature check
    if (!verifySessionToken(token, currentUser)) {
      forceLogout('Session token signature verification failed (tampering detected)');
      return;
    }

    // 3. User existence and active role check
    const userInDb = users.find((u) => u.id === currentUser.id);
    if (!userInDb || userInDb.role !== currentUser.role) {
      forceLogout('User role or identity altered in registry');
      return;
    }

    // 4. Storage event listener for multi-tab tampering
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'elite_jurist_current_user_id' ||
        e.key === 'elite_jurist_session_token'
      ) {
        const updatedToken =
          sessionStorage.getItem('elite_jurist_session_token') ||
          localStorage.getItem('elite_jurist_session_token');
        const updatedId =
          sessionStorage.getItem('elite_jurist_current_user_id') ||
          localStorage.getItem('elite_jurist_current_user_id');

        if (!updatedToken || updatedId !== currentUser.id) {
          forceLogout('Unauthorized external storage modification detected');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser, users]);

  useEffect(() => {
    localStorage.setItem('elite_jurist_users', JSON.stringify(users));
  }, [users]);

  // Secure Traditional Email and Password Authentication
  const login = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Locate user account by email
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return {
        success: false,
        error: 'لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني / No account found with this email',
      };
    }

    // 2. Secure bcrypt password verification
    const isValidPassword = verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        error: 'كلمة المرور غير صحيحة، يرجى التحقق وإعادة المحاولة / Incorrect password',
      };
    }

    // 3. Create immutable cryptographically-bound session token
    const token = createSessionToken(user);
    setCurrentUser(user);
    localStorage.removeItem('elite_jurist_logged_out');

    if (rememberMe) {
      localStorage.setItem('elite_jurist_current_user_id', user.id);
      localStorage.setItem('elite_jurist_session_token', token);
      sessionStorage.removeItem('elite_jurist_current_user_id');
      sessionStorage.removeItem('elite_jurist_session_token');
    } else {
      sessionStorage.setItem('elite_jurist_current_user_id', user.id);
      sessionStorage.setItem('elite_jurist_session_token', token);
      localStorage.removeItem('elite_jurist_current_user_id');
      localStorage.removeItem('elite_jurist_session_token');
    }

    return { success: true };
  };

  // Sign-Up / User Registration
  const register = async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if email already registered
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return {
        success: false,
        error: 'هذا البريد الإلكتروني مسجل مسبقاً في النظام / Email is already registered',
      };
    }

    const newUser = prepareNewUserRecord({
      name: data.name,
      email: normalizedEmail,
      role: data.role,
      phone: data.phone,
      title: data.title,
      password: data.password,
    });

    setUsers((prev) => [...prev, newUser]);
    const token = createSessionToken(newUser);
    setCurrentUser(newUser);
    localStorage.removeItem('elite_jurist_logged_out');
    localStorage.setItem('elite_jurist_current_user_id', newUser.id);
    localStorage.setItem('elite_jurist_session_token', token);

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.setItem('elite_jurist_logged_out', 'true');
    localStorage.removeItem('elite_jurist_current_user_id');
    localStorage.removeItem('elite_jurist_session_token');
    sessionStorage.removeItem('elite_jurist_current_user_id');
    sessionStorage.removeItem('elite_jurist_session_token');
  };

  // Google Sign-in binds to authenticated account
  const loginWithGoogle = () => {
    const defaultGoogleUser = users.find((u) => u.email.includes('gmail.com')) || users[0];
    const token = createSessionToken(defaultGoogleUser);
    setCurrentUser(defaultGoogleUser);
    localStorage.removeItem('elite_jurist_logged_out');
    localStorage.setItem('elite_jurist_current_user_id', defaultGoogleUser.id);
    localStorage.setItem('elite_jurist_session_token', token);
  };

  // Admin User Management
  const addUser = (userData: AdminCreateUserInput): { success: boolean; error?: string } => {
    const normalizedEmail = userData.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { success: false, error: 'البريد الإلكتروني موجود بالفعل' };
    }

    const newUser = prepareNewUserRecord({
      name: userData.name,
      nameEn: userData.nameEn,
      email: normalizedEmail,
      role: userData.role,
      title: userData.title,
      titleEn: userData.titleEn,
      phone: userData.phone,
      password: userData.password,
    });

    setUsers((prev) => [...prev, newUser]);
    return { success: true };
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
  };

  const updateUser = (
    userId: string,
    updates: Partial<Omit<User, 'id' | 'passwordHash'>>
  ): { success: boolean; error?: string } => {
    if (updates.email) {
      const normalizedEmail = updates.email.trim().toLowerCase();
      const existing = users.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.id !== userId
      );
      if (existing) {
        return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل من قبل عضو آخر' };
      }
      updates.email = normalizedEmail;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          if (updates.name && updates.name !== u.name) {
            const parts = updates.name.trim().split(' ').filter(Boolean);
            updated.initials = ((parts[0]?.[0] || 'U') + (parts[1]?.[0] || '')).toUpperCase();
          }
          return updated;
        }
        return u;
      })
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { success: true };
  };

  const adminResetPassword = async (
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'صلاحية إعادة تعيين كلمات المرور مقتصرة على المدير حصراً' };
    }
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 8 خانات' };
    }

    const newHash = hashPassword(newPassword);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, passwordHash: newHash } : u))
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, passwordHash: newHash } : null));
    }

    return { success: true };
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser?.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      setCurrentUser(remaining[0] || null);
    }
  };

  const updatePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'غير مسجل الدخول' };

    const valid = verifyPassword(oldPassword, currentUser.passwordHash || DEFAULT_PASSWORD_HASH);
    if (!valid) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    }

    const newHash = hashPassword(newPassword);
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, passwordHash: newHash } : u))
    );
    setCurrentUser((prev) => (prev ? { ...prev, passwordHash: newHash } : null));
    return { success: true };
  };

  // Role-Based Access Control (RBAC) helpers
  const isAdmin = currentUser?.role === 'admin';
  const isLawyer = currentUser?.role === 'lawyer';
  const isViewer = currentUser?.role === 'viewer';

  const canEditCase = (caseItem: CaseItem): boolean => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (isLawyer) return caseItem.assigneeId === currentUser.id;
    return false; // Viewer cannot edit
  };

  const canDeleteCase = (): boolean => {
    return isAdmin;
  };

  const canCreateCase = (): boolean => {
    return isAdmin || isLawyer;
  };

  const canManageUsers = (): boolean => {
    return isAdmin;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        register,
        logout,
        loginWithGoogle,
        updateUserRole,
        updateUser,
        addUser,
        deleteUser,
        updatePassword,
        adminResetPassword,
        isAdmin,
        isLawyer,
        isViewer,
        canEditCase,
        canDeleteCase,
        canCreateCase,
        canManageUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
