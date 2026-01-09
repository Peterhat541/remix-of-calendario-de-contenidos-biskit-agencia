/**
 * Vision Report Data Contract
 * This is the schema returned by the vision-extract edge function
 * and stored in the vision_reports table.
 */

export interface VisionKeyword {
  keyword: string;
  volume: number | null;
  kd: number | null;
}

export interface VisionBacklinks {
  backlinksCount: number | null;
  refDomainsCount: number | null;
}

export interface VisionHeadings {
  h1Count: number | null;
  h2Count: number | null;
  h3Count: number | null;
  h1Text: string | null;
  h2Examples: string[];
  h3Examples: string[];
}

export interface VisionInternalLinks {
  total: number | null;
  internalPct: number | null;
}

export interface VisionTechnical {
  robotsOk?: boolean | null;
  sitemapOk?: boolean | null;
  canonicalsOk?: boolean | null;
  metaOk?: boolean | null;
  brokenLinks?: number | null;
  hreflang?: boolean | null;
}

export interface VisionPagespeed {
  performance?: number | null;
  accessibility?: number | null;
  bestPractices?: number | null;
  seo?: number | null;
}

export interface VisionReportData {
  siteUrl: string;
  servicePeriod: string;
  reportDate: string;
  beneficiary: string;
  keywords: VisionKeyword[];
  backlinks: VisionBacklinks;
  headings: VisionHeadings;
  internalLinks: VisionInternalLinks;
  technical: VisionTechnical;
  pagespeed: VisionPagespeed;
  missing: string[];
}

/**
 * Response from the vision-extract edge function
 */
export interface VisionExtractResponse {
  success: boolean;
  reportData: VisionReportData;
  savedId?: string;
  error?: string;
  details?: string;
}

/**
 * Row from the vision_reports table
 */
export interface VisionReportRow {
  id: string;
  case_id: string;
  report_data: VisionReportData;
  missing: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Human-readable labels for missing sections
 */
export const MISSING_SECTION_LABELS: Record<string, string> = {
  keywords: "Keywords con volúmenes",
  headings: "Encabezados (H1/H2/H3)",
  backlinks: "Backlinks y dominios de referencia",
  internalLinks: "Enlaces internos",
  pagespeed: "Rendimiento PageSpeed",
  technical: "Aspectos técnicos (robots, sitemap, etc.)",
};

/**
 * Get human-readable list of missing sections
 */
export function getMissingLabels(missing: string[]): string[] {
  return missing.map((key) => MISSING_SECTION_LABELS[key] || key);
}
