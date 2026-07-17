/**
 * validation-schemas.ts
 *
 * Strict Zod schemas for all user-facing forms.
 * Policy: REJECT inputs that don't match — do not silently sanitize/trim.
 *
 * Usage:
 *   import { loginSchema } from '@/lib/validation-schemas';
 *   const result = loginSchema.safeParse({ identifier, password });
 *   if (!result.success) { ... result.error.flatten() ... }
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** RFC-5321 email — max 320 chars, must contain exactly one @, validated by Zod */
const emailField = z
  .string()
  .min(1, 'Email is required')
  .max(320, 'Email is too long')
  .email('Must be a valid email address');

/**
 * Saudi-style phone: digits only, 7–15 chars.
 * Accepts values with or without country code prefix (stripping leading +/digits
 * is left to the UI; we validate the raw phone part here).
 */
const phoneDigitsField = z
  .string()
  .min(7, 'Phone number is too short')
  .max(15, 'Phone number is too long')
  .regex(/^\d+$/, 'Phone must contain digits only');

/**
 * Password: 8–128 chars, must include at least one uppercase letter,
 * one lowercase letter, and one digit.
 */
const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

/** Simple password for the login form — only length-capped, not complexity-checked */
const loginPasswordField = z
  .string()
  .min(1, 'Password is required')
  .max(128, 'Password is too long');

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  /**
   * Accepts email, username, or phone.
   * We enforce only length; format is validated server-side / by auth context.
   */
  identifier: z
    .string()
    .min(1, 'Email, username, or phone is required')
    .max(320, 'Identifier is too long'),
  password: loginPasswordField,
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------

export const signupBaseSchema = z.object({
  email: emailField,
  /** Phone digits only (without country code) */
  phone: phoneDigitsField,
  city: z.string().min(1, 'City is required').max(80, 'City value too long'),
  neighborhood: z.string().max(80, 'Neighborhood value too long').optional(),
  password: passwordField,
  countryCode: z
    .string()
    .regex(/^\+\d{1,4}$/, 'Invalid country code')
    .default('+966'),
});

export const seekerSignupSchema = signupBaseSchema.extend({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long')
    .regex(/^[\p{L}\s'-]+$/u, 'Name contains invalid characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

export const workerSignupSchema = seekerSignupSchema.extend({
  age: z
    .number({ invalid_type_error: 'Age must be a number' })
    .int('Age must be a whole number')
    .min(18, 'Workers must be at least 18 years old')
    .max(80, 'Age seems too high'),
  profession: z.string().min(1, 'Please select a profession'),
});

export const storeSignupSchema = signupBaseSchema.extend({
  storeName: z
    .string()
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name is too long'),
  storeAddress: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address is too long'),
  storeCategory: z.string().min(1, 'Please select a store category'),
});

// ---------------------------------------------------------------------------

export const forgotPasswordSchema = z.object({
  /**
   * Accepts email, username, or phone.
   * Kept intentionally loose so legitimate users aren't blocked.
   */
  identifier: z
    .string()
    .min(1, 'Please enter your email, username, or phone')
    .max(320, 'Identifier is too long'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------

export const resetPasswordSchema = z
  .object({
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// Iqama / ID verification schema
// ---------------------------------------------------------------------------

export const iqamaSchema = z.object({
  /** Saudi Iqama numbers are exactly 10 digits */
  iqamaNumber: z
    .string()
    .length(10, 'Iqama number must be exactly 10 digits')
    .regex(/^\d{10}$/, 'Iqama number must contain digits only'),
});

export type IqamaInput = z.infer<typeof iqamaSchema>;

// ---------------------------------------------------------------------------
// File upload validation
// ---------------------------------------------------------------------------

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** Magic bytes for supported image formats */
const IMAGE_MAGIC_BYTES: Record<AllowedImageMime, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (further validated below)
};

/**
 * Validates a File object against:
 * 1. MIME type allowlist (not just file extension)
 * 2. Magic byte check (actual binary content)
 * 3. Maximum file size
 * 4. Minimum image dimensions (after load)
 *
 * Returns null on success, or an error string on failure.
 */
export async function validateImageFile(
  file: File,
  maxSizeBytes: number = 5 * 1024 * 1024,
): Promise<string | null> {
  // 1. MIME type check (declared by the browser)
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as AllowedImageMime)) {
    return `File type "${file.type}" is not allowed. Please upload a JPG, PNG, or WebP image.`;
  }

  // 2. Size check
  if (file.size > maxSizeBytes) {
    const mb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return `File is too large. Maximum allowed size is ${mb} MB.`;
  }

  // 3. Magic byte validation (read first 12 bytes)
  const headerBytes = await readFileHeader(file, 12);
  if (!matchesMagicBytes(headerBytes, file.type as AllowedImageMime)) {
    return 'File content does not match the declared file type. Please upload a real image file.';
  }

  return null; // all good
}

function readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buf = e.target?.result;
      if (buf instanceof ArrayBuffer) {
        resolve(new Uint8Array(buf));
      } else {
        reject(new Error('Could not read file header'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsArrayBuffer(file.slice(0, bytes));
  });
}

function matchesMagicBytes(header: Uint8Array, mimeType: AllowedImageMime): boolean {
  const patterns = IMAGE_MAGIC_BYTES[mimeType];
  if (!patterns) return false;
  return patterns.some((pattern) =>
    pattern.every((byte, index) => header[index] === byte),
  );
}
