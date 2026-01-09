/**
 * Service for managing SEO Web Reports in Supabase
 */

import { supabase } from "@/integrations/supabase/client";
import { SeoWebReport, CreateSeoWebReportInput, UpdateSeoWebReportInput } from "@/types/seoWebReport";

/**
 * Fetch all SEO web reports
 */
export async function fetchAllSeoWebReports(): Promise<SeoWebReport[]> {
  const { data, error } = await supabase
    .from("seo_web_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[seoWebReportService] Error fetching reports:", error);
    throw error;
  }

  return (data ?? []) as SeoWebReport[];
}

/**
 * Fetch a single report by ID
 */
export async function fetchSeoWebReportById(id: string): Promise<SeoWebReport | null> {
  const { data, error } = await supabase
    .from("seo_web_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[seoWebReportService] Error fetching report by ID:", error);
    throw error;
  }

  return data as SeoWebReport | null;
}

/**
 * Fetch a single report by case_key
 */
export async function fetchSeoWebReportByCaseKey(caseKey: string): Promise<SeoWebReport | null> {
  const { data, error } = await supabase
    .from("seo_web_reports")
    .select("*")
    .eq("case_key", caseKey)
    .maybeSingle();

  if (error) {
    console.error("[seoWebReportService] Error fetching report by case_key:", error);
    throw error;
  }

  return data as SeoWebReport | null;
}

/**
 * Create a new SEO web report
 */
export async function createSeoWebReport(input: CreateSeoWebReportInput): Promise<SeoWebReport> {
  const { data, error } = await supabase
    .from("seo_web_reports")
    .insert([{
      site_url: input.site_url,
      service_period: input.service_period ?? null,
      report_date: input.report_date ?? null,
      beneficiary: input.beneficiary ?? null,
      case_key: input.case_key ?? null,
      vision_report_id: input.vision_report_id ?? null,
      image_hash: input.image_hash ?? null,
      missing: input.missing ?? [],
      status: input.status ?? "draft",
      meta: input.meta ? JSON.parse(JSON.stringify(input.meta)) : {},
    }])
    .select()
    .single();

  if (error) {
    console.error("[seoWebReportService] Error creating report:", error);
    throw error;
  }

  return data as SeoWebReport;
}

/**
 * Update an existing SEO web report
 */
export async function updateSeoWebReport(
  id: string,
  input: UpdateSeoWebReportInput
): Promise<SeoWebReport> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (input.status !== undefined) updateData.status = input.status;
  if (input.pdf_path !== undefined) updateData.pdf_path = input.pdf_path;
  if (input.word_path !== undefined) updateData.word_path = input.word_path;
  if (input.missing !== undefined) updateData.missing = input.missing;
  if (input.meta !== undefined) updateData.meta = JSON.parse(JSON.stringify(input.meta));
  if (input.beneficiary !== undefined) updateData.beneficiary = input.beneficiary;
  if (input.site_url !== undefined) updateData.site_url = input.site_url;
  if (input.service_period !== undefined) updateData.service_period = input.service_period;
  if (input.report_date !== undefined) updateData.report_date = input.report_date;

  const { data, error } = await supabase
    .from("seo_web_reports")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[seoWebReportService] Error updating report:", error);
    throw error;
  }

  return data as SeoWebReport;
}

/**
 * Update report by case_key (upsert-like behavior)
 */
export async function upsertSeoWebReportByCaseKey(
  caseKey: string,
  input: CreateSeoWebReportInput
): Promise<SeoWebReport> {
  // Check if exists
  const existing = await fetchSeoWebReportByCaseKey(caseKey);

  if (existing) {
    // Update existing with all provided fields
    return updateSeoWebReport(existing.id, {
      status: input.status,
      missing: input.missing,
      meta: input.meta,
      beneficiary: input.beneficiary,
      site_url: input.site_url,
      service_period: input.service_period,
      report_date: input.report_date,
      pdf_path: input.pdf_path,
      word_path: input.word_path,
    });
  } else {
    // Create new
    return createSeoWebReport({
      ...input,
      case_key: caseKey,
    });
  }
}

/**
 * Delete a SEO web report
 */
export async function deleteSeoWebReport(id: string): Promise<void> {
  const { error } = await supabase
    .from("seo_web_reports")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[seoWebReportService] Error deleting report:", error);
    throw error;
  }
}

/**
 * Update PDF path after export
 */
export async function updateSeoWebReportPdfPath(
  id: string,
  pdfPath: string
): Promise<SeoWebReport> {
  return updateSeoWebReport(id, {
    pdf_path: pdfPath,
    status: "exported",
  });
}

/**
 * Mark report as ready
 */
export async function markSeoWebReportReady(id: string): Promise<SeoWebReport> {
  return updateSeoWebReport(id, { status: "ready" });
}

/**
 * Mark report as error
 */
export async function markSeoWebReportError(
  id: string,
  errorMessage?: string
): Promise<SeoWebReport> {
  return updateSeoWebReport(id, {
    status: "error",
    meta: { lastError: errorMessage },
  });
}
