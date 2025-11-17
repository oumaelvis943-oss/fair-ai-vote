import { supabase } from '@/integrations/supabase/client';
import { fileUploadSchema } from './validation';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): FileValidationResult {
  try {
    // Validate file object
    fileUploadSchema.parse({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `File extension "${extension}" is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    // Additional MIME type check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type detected.',
      };
    }

    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.errors?.[0]?.message || 'Invalid file',
    };
  }
}

/**
 * Generate safe filename
 */
export function generateSafeFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const safeName = originalName
    .substring(0, originalName.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  
  return `${userId}/${timestamp}_${randomStr}_${safeName}${extension}`;
}

/**
 * Upload file to Supabase Storage with security checks
 */
export async function uploadFileSecurely(
  file: File,
  bucket: string,
  userId: string
): Promise<{ path?: string; error?: string }> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return { error: validation.error };
  }

  try {
    // Generate safe filename
    const safePath = generateSafeFilename(file.name, userId);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(safePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: 'Failed to upload file. Please try again.' };
    }

    return { path: data.path };
  } catch (error) {
    console.error('Upload exception:', error);
    return { error: 'An unexpected error occurred during upload.' };
  }
}

/**
 * Get signed URL for secure file download
 */
export async function getSignedDownloadURL(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return { error: 'Failed to generate download link.' };
    }

    return { url: data.signedUrl };
  } catch (error) {
    console.error('Signed URL exception:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: 'Failed to delete file.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete exception:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * List files for a user
 */
export async function listUserFiles(
  bucket: string,
  userId: string
): Promise<{ files?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('List files error:', error);
      return { error: 'Failed to list files.' };
    }

    return { files: data };
  } catch (error) {
    console.error('List files exception:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
