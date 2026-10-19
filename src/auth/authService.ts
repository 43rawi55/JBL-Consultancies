import bcrypt from 'bcryptjs';
import { User, UserRole } from '../types/schema.ts';

const SALT_ROUNDS = 10;
export const DEFAULT_DEMO_PASSWORD = 'Elite@2026';

/**
 * Hashes a plain-text password using bcrypt with 10 salt rounds.
 */
export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, SALT_ROUNDS);
};

/**
 * Compares a plain-text password with a bcrypt hashed password.
 */
export const verifyPassword = (password: string, hash?: string): boolean => {
  if (!hash) {
    // Fallback for demo users if hash was not yet generated
    return password === DEFAULT_DEMO_PASSWORD;
  }
  try {
    return bcrypt.compareSync(password, hash);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
};

/**
 * Pre-computed hash for DEFAULT_DEMO_PASSWORD ("Elite@2026")
 */
export const DEFAULT_PASSWORD_HASH = hashPassword(DEFAULT_DEMO_PASSWORD);

/**
 * Creates user object with secure initials, color, and bcrypt hash
 */
export const prepareNewUserRecord = (
  userData: {
    name: string;
    nameEn?: string;
    email: string;
    role: UserRole;
    title?: string;
    titleEn?: string;
    phone?: string;
    password?: string;
  }
): User => {
  const initials = userData.name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'EL';

  const roleColors: Record<UserRole, string> = {
    admin: '#0284C7',
    lawyer: '#7C3AED',
    viewer: '#D97706',
  };

  const defaultTitlesAr: Record<UserRole, string> = {
    admin: 'مدير النظام والشريك الإداري',
    lawyer: 'محامي مرافعة واستشارات قانونية',
    viewer: 'متابع قضايا ومنسق ملفات',
  };

  const defaultTitlesEn: Record<UserRole, string> = {
    admin: 'System Administrator & Partner',
    lawyer: 'Litigation & Legal Counsel',
    viewer: 'Case Coordinator & Viewer',
  };

  return {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: userData.name,
    nameEn: userData.nameEn || userData.name,
    email: userData.email.toLowerCase().trim(),
    role: userData.role,
    avatar: '',
    title: userData.title || defaultTitlesAr[userData.role],
    titleEn: userData.titleEn || defaultTitlesEn[userData.role],
    phone: userData.phone || '+971 50 000 0000',
    initials,
    color: roleColors[userData.role] || '#4F46E5',
    passwordHash: userData.password ? hashPassword(userData.password) : DEFAULT_PASSWORD_HASH,
    createdAt: new Date().toISOString().split('T')[0],
  };
};
