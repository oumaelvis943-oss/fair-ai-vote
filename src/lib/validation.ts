import { z } from 'zod';

// Email validation with common security checks
export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email must be less than 255 characters" })
  .refine(
    (email) => !email.includes('..'), 
    { message: "Email cannot contain consecutive dots" }
  )
  .refine(
    (email) => /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email),
    { message: "Invalid email format" }
  );

// Safe string validation (XSS prevention)
export const safeStringSchema = (maxLength: number = 1000, minLength: number = 0) => 
  z.string()
    .trim()
    .min(minLength, { message: `Must be at least ${minLength} characters` })
    .max(maxLength, { message: `Must be less than ${maxLength} characters` })
    .refine(
      (str) => !/<script[^>]*>.*?<\/script>/gi.test(str),
      { message: "Script tags are not allowed" }
    );

// UUID validation
export const uuidSchema = z.string().uuid({ message: "Invalid ID format" });

// Voter manual add form validation
export const manualVoterSchema = z.object({
  email: emailSchema,
  full_name: safeStringSchema(200).optional(),
  voter_id_number: safeStringSchema(100).optional(),
  house: safeStringSchema(100).optional(),
  residence: safeStringSchema(200).optional(),
  year_class: safeStringSchema(50).optional(),
  google_email: emailSchema.optional().or(z.literal('')),
});

// Election creation validation
export const createElectionSchema = z.object({
  title: safeStringSchema(200, 3),
  description: z.string().trim().max(5000, { message: "Description must be less than 5000 characters" }).nullable().optional().or(z.literal('')),
  start_date: z.string().datetime().or(z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: "Invalid start date" }
  )),
  end_date: z.string().datetime().or(z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: "Invalid end date" }
  )),
  voting_algorithm: z.enum(['fptp', 'borda_count', 'ranked_choice'], {
    message: "Invalid voting algorithm"
  }),
  max_candidates: z.number().int().min(1).max(1000),
  require_approval: z.boolean(),
  is_public: z.boolean(),
}).refine(
  (data) => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end > start;
  },
  {
    message: "End date must be after start date",
    path: ["end_date"],
  }
);

// Candidate application validation
export const candidateApplicationSchema = z.object({
  platform_statement: safeStringSchema(10000, 100),
  position: safeStringSchema(200, 1),
  form_responses: z.record(z.any()).optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  name: z.string().max(255),
  size: z.number().max(10 * 1024 * 1024, { message: "File size must be less than 10MB" }),
  type: z.string().refine(
    (type) => {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      return allowedTypes.includes(type);
    },
    { message: "Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX are allowed" }
  ),
});

// SMTP configuration validation
export const smtpConfigSchema = z.object({
  host: z.string().min(1, { message: "SMTP host is required" }),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  from_email: emailSchema,
  from_name: safeStringSchema(100).optional(),
});

// CSV row validation for voter upload
export const csvVoterRowSchema = z.object({
  email: emailSchema,
  full_name: safeStringSchema(200).optional(),
  voter_id_number: safeStringSchema(100).optional(),
});

// Validate CSV data
export function validateCSVData(rows: any[]): { valid: any[]; invalid: any[] } {
  const valid: any[] = [];
  const invalid: any[] = [];

  rows.forEach((row, index) => {
    try {
      const validated = csvVoterRowSchema.parse(row);
      valid.push({ ...validated, _rowIndex: index + 1 });
    } catch (error) {
      invalid.push({ row, rowIndex: index + 1, error });
    }
  });

  return { valid, invalid };
}

// Sanitize error messages for production
export function sanitizeError(error: any): string {
  // Never expose internal errors to users
  if (error?.code === 'PGRST' || error?.message?.includes('postgres')) {
    return "A database error occurred. Please try again.";
  }
  
  if (error?.message?.includes('JWT') || error?.message?.includes('token')) {
    return "Authentication error. Please sign in again.";
  }

  if (error?.message?.includes('permission') || error?.message?.includes('RLS')) {
    return "You don't have permission to perform this action.";
  }

  // Return safe error message
  return error?.message || "An unexpected error occurred. Please try again.";
}

// Generate CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Store CSRF token in session storage
export function setCSRFToken(token: string): void {
  sessionStorage.setItem('csrf_token', token);
}

// Get CSRF token from session storage
export function getCSRFToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

// Validate CSRF token
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();
  return storedToken !== null && storedToken === token;
}
