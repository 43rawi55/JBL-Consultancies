import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'البريد الإلكتروني مطلوب / Email is required' })
    .email({ message: 'صيغة البريد الإلكتروني غير صحيحة / Invalid email format' }),
  password: z
    .string()
    .min(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف / Password must be at least 6 characters' }),
  rememberMe: z.boolean().optional().default(true),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, { message: 'الاسم الكامل مطلوب (3 أحرف على الأقل) / Full name required (min 3 chars)' }),
    email: z
      .string()
      .trim()
      .min(1, { message: 'البريد الإلكتروني مطلوب / Email is required' })
      .email({ message: 'صيغة البريد الإلكتروني غير صحيحة / Invalid email format' }),
    role: z.enum(['admin', 'lawyer', 'viewer'], {
      message: 'يرجى اختيار الصلاحية / Please select a role',
    }),
    password: z
      .string()
      .min(8, { message: 'كلمة المرور يجب أن لا تقل عن 8 أحرف / Password must be at least 8 chars' })
      .regex(/[A-Z]/, { message: 'يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)' })
      .regex(/[a-z]/, { message: 'يجب أن تحتوي على حرف صغير واحد على الأقل (a-z)' })
      .regex(/[0-9]/, { message: 'يجب أن تحتوي على رقم واحد على الأقل (0-9)' }),
    confirmPassword: z.string().min(1, { message: 'تأكيد كلمة المرور مطلوب / Confirm password is required' }),
    phone: z.string().optional(),
    title: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين / Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(3, { message: 'الاسم بالعربية مطلوب' }),
  nameEn: z.string().trim().optional(),
  email: z.string().trim().email({ message: 'بريد إلكتروني غير صالح' }),
  role: z.enum(['admin', 'lawyer', 'viewer']),
  title: z.string().optional(),
  titleEn: z.string().optional(),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, { message: 'كلمة المرور يجب أن لا تقل عن 8 خانات' })
    .regex(/[A-Z]/, { message: 'يجب تضمين حرف كبير واحد على الأقل' })
    .regex(/[0-9]/, { message: 'يجب تضمين رقم واحد على الأقل' }),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
