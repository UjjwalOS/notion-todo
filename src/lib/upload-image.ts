import { supabase } from './supabase';

// Image constraints
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Process and validate an image file
 * Returns a base64 data URL for now.
 * Can be extended to upload to Supabase Storage later.
 */
export async function processImageFile(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image must be smaller than 5MB');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read image'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image to Supabase Storage
 * Falls back to base64 if storage is not configured
 */
export async function uploadCommentImage(
  file: File,
  userId: string
): Promise<string | null> {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image must be smaller than 5MB');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  try {
    // Try to upload to Supabase Storage
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('comment-images')
      .upload(fileName, file);

    if (error) {
      // If storage bucket doesn't exist or other error, fall back to base64
      console.warn('Supabase Storage upload failed, using base64:', error.message);
      return processImageFile(file);
    }

    // Get the public URL
    const { data } = supabase.storage
      .from('comment-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch {
    // Fall back to base64 if storage fails
    return processImageFile(file);
  }
}
