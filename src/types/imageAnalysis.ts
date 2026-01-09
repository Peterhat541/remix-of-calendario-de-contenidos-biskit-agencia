// Types for the new structured image analysis response

export interface KeywordItem {
  keyword: string;
  volume: number | null;
  kd: number | null;
  position?: number | null;
}

export interface EvidenceItem {
  field: string;
  raw_text: string;
  confidence: number;
}

export interface ExtractedMetrics {
  organic_traffic: number | null;
  keywords_count: number | null;
  authority_score: number | null;
  ref_domains: number | null;
  backlinks: number | null;
  top_3: number | null;
  top_10: number | null;
  top_11_20: number | null;
  top_21_100: number | null;
  pagespeed_performance: number | null;
  pagespeed_accessibility: number | null;
  pagespeed_best_practices: number | null;
  pagespeed_seo: number | null;
  // Core Web Vitals
  lcp_ms: number | null;
  cls: number | null;
  inp_ms: number | null;
  keyword_list: KeywordItem[];
}

export interface ExtractedImageData {
  capture_type: CaptureType;
  source_tool: SourceTool | null;
  domain: string | null;
  date_or_range: string | null;
  metrics: ExtractedMetrics;
  evidence: EvidenceItem[];
  // Technical audit fields
  robots_ok: boolean | null;
  sitemap_ok: boolean | null;
  canonicals_ok: boolean | null;
  h1_count: number | null;
  h2_count: number | null;
  h3_count: number | null;
  alt_images_ok: boolean | null;
  internal_links: number | null;
  external_links: number | null;
  // Generated text from AI
  generated_text?: string;
}

export type CaptureType = 
  | "semrush_domain_overview"
  | "semrush_keyword_magic"
  | "semrush_organic_positions"
  | "semrush_backlinks"
  | "pagespeed"
  | "search_console"
  | "technical_audit"
  | "headings_analysis"
  | "other";

export type SourceTool = 
  | "SEMrush"
  | "Sistrix"
  | "Google Search Console"
  | "PageSpeed Insights"
  | "Ahrefs"
  | "Majestic"
  | "Screaming Frog"
  | "Other";

export interface AnalyzeImageResponse {
  success: boolean;
  data?: ExtractedImageData;
  error?: string;
  raw_response?: string;
  isTransient?: boolean;
}
