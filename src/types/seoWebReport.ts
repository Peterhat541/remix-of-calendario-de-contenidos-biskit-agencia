/**
 * SEO Web Report types
 */

export type SeoReportStatus = 'draft' | 'ready' | 'exported' | 'error';

export interface SeoWebReport {
  id: string;
  created_at: string;
  updated_at: string;
  status: SeoReportStatus;
  site_url: string;
  service_period: string | null;
  report_date: string | null;
  beneficiary: string | null;
  case_key: string | null;
  vision_report_id: string | null;
  image_hash: string | null;
  missing: string[];
  pdf_path: string | null;
  word_path: string | null;
  meta: Record<string, unknown> | null;
}

export interface CreateSeoWebReportInput {
  site_url: string;
  service_period?: string;
  report_date?: string;
  beneficiary?: string;
  case_key?: string;
  vision_report_id?: string;
  image_hash?: string;
  missing?: string[];
  status?: SeoReportStatus;
  pdf_path?: string;
  word_path?: string;
  meta?: Record<string, unknown>;
}

export interface UpdateSeoWebReportInput {
  status?: SeoReportStatus;
  pdf_path?: string;
  word_path?: string;
  missing?: string[];
  meta?: Record<string, unknown>;
  beneficiary?: string | null;
  site_url?: string;
  service_period?: string | null;
  report_date?: string | null;
}
