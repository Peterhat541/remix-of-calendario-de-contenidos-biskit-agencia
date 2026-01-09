/**
 * Document Storage Service
 * Handles uploading PDFs and Word documents to Supabase Storage
 */

import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "seo-reports";

/**
 * Upload a PDF blob to Supabase Storage
 * @returns The public URL of the uploaded file
 */
export async function uploadPdfToStorage(
  blob: Blob,
  filename: string,
  caseKey: string
): Promise<string> {
  // Create unique path with case key
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${caseKey}/${timestamp}_${safeName}`;

  // Upload to storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, blob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("[pdfStorageService] Upload error:", error);
    throw new Error(`Error al subir el PDF: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Upload a Word document blob to Supabase Storage
 * @returns The public URL of the uploaded file
 */
export async function uploadWordToStorage(
  blob: Blob,
  filename: string,
  caseKey: string
): Promise<string> {
  // Create unique path with case key
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${caseKey}/${timestamp}_${safeName}`;

  // Upload to storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, blob, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    });

  if (error) {
    console.error("[pdfStorageService] Upload Word error:", error);
    throw new Error(`Error al subir el Word: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
