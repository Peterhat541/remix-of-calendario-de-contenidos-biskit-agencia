import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'content-calendars';

/**
 * Convert a base64 data URL to a Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Get file extension from MIME type
 */
function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };
  return map[mime] || 'png';
}

/**
 * Upload an image (base64 data URL or File) to Supabase Storage
 * and return the public URL.
 */
export async function uploadImageToStorage(
  input: string | File,
  calendarId?: string
): Promise<string> {
  let blob: Blob;
  let ext: string;

  if (typeof input === 'string') {
    // base64 data URL
    blob = dataUrlToBlob(input);
    ext = extFromMime(blob.type);
  } else {
    // File object
    blob = input;
    ext = input.name.split('.').pop()?.toLowerCase() || 'png';
  }

  const folder = calendarId || 'general';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, blob, {
      contentType: blob.type,
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Check if a string is a base64 data URL
 */
export function isBase64DataUrl(url: string): boolean {
  return url.startsWith('data:image/');
}
