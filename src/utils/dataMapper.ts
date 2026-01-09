import { ExtractedImageData, CaptureType } from "@/types/imageAnalysis";
import {
  KeywordAnalysisData,
  PositioningEvolutionData,
  KeywordTableData,
  BacklinksData,
  HierarchyData,
  IndexingData,
  PageSpeedData,
} from "@/types/report";

// Map source tool to form tool value
function mapSourceTool(sourceTool: string | null): "semrush" | "sistrix" | "gsc" | "ahrefs" | "majestic" | "otra" | null {
  if (!sourceTool) return null;
  
  const lower = sourceTool.toLowerCase();
  if (lower.includes("semrush")) return "semrush";
  if (lower.includes("sistrix")) return "sistrix";
  if (lower.includes("search console") || lower.includes("gsc")) return "gsc";
  if (lower.includes("ahrefs")) return "ahrefs";
  if (lower.includes("majestic")) return "majestic";
  
  return "otra";
}

// Determine which section(s) this capture type maps to
export function getCaptureTypeSections(captureType: CaptureType): string[] {
  switch (captureType) {
    case "semrush_domain_overview":
      return ["intro", "keywords", "backlinks"];
    case "semrush_keyword_magic":
      return ["keywords"];
    case "semrush_organic_positions":
      return ["keywords", "positioning", "keywordTable"];
    case "semrush_backlinks":
      return ["backlinks"];
    case "pagespeed":
      return ["pagespeed"];
    case "search_console":
      return ["keywords", "positioning"];
    case "technical_audit":
      return ["indexing"];
    case "headings_analysis":
      return ["hierarchy"];
    default:
      return [];
  }
}

export function mapExtractedToKeywordAnalysis(
  extracted: ExtractedImageData,
  current: KeywordAnalysisData
): KeywordAnalysisData {
  const mappedTool = mapSourceTool(extracted.source_tool);
  const validKeywordTools: KeywordAnalysisData["tool"][] = ["semrush", "sistrix", "gsc", "otra"];
  const tool = mappedTool && validKeywordTools.includes(mappedTool as KeywordAnalysisData["tool"]) 
    ? (mappedTool as KeywordAnalysisData["tool"]) 
    : current.tool;
  
  const metrics = extracted.metrics;
  
  // Get main keyword from keyword_list if available
  const mainKeyword = metrics.keyword_list?.[0]?.keyword || current.mainKeyword;
  const volume = metrics.keyword_list?.[0]?.volume?.toString() || current.volume;
  const kd = metrics.keyword_list?.[0]?.kd?.toString() || current.kd;
  
  return {
    ...current,
    tool,
    activeKeywords: metrics.keywords_count?.toString() || current.activeKeywords,
    organicTraffic: metrics.organic_traffic?.toString() || current.organicTraffic,
    mainKeyword,
    volume,
    kd,
  };
}

export function mapExtractedToPositioning(
  extracted: ExtractedImageData,
  current: PositioningEvolutionData
): PositioningEvolutionData {
  return {
    ...current,
    peakValue: extracted.metrics.organic_traffic?.toString() || current.peakValue,
  };
}

export function mapExtractedToKeywordTable(
  extracted: ExtractedImageData,
  current: KeywordTableData
): KeywordTableData {
  const metrics = extracted.metrics;
  return {
    ...current,
    top3: metrics.top_3?.toString() || current.top3,
    top10: metrics.top_10?.toString() || current.top10,
    top11_20: metrics.top_11_20?.toString() || current.top11_20,
    top21_100: metrics.top_21_100?.toString() || current.top21_100,
  };
}

export function mapExtractedToBacklinks(
  extracted: ExtractedImageData,
  current: BacklinksData
): BacklinksData {
  const mappedTool = mapSourceTool(extracted.source_tool);
  const validBacklinkTools: BacklinksData["tool"][] = ["semrush", "ahrefs", "majestic", "otra"];
  const tool = mappedTool && validBacklinkTools.includes(mappedTool as BacklinksData["tool"])
    ? (mappedTool as BacklinksData["tool"])
    : current.tool;
  
  const metrics = extracted.metrics;
  
  return {
    ...current,
    referenceDomains: metrics.ref_domains?.toString() || current.referenceDomains,
    totalBacklinks: metrics.backlinks?.toString() || current.totalBacklinks,
    tool,
  };
}

export function mapExtractedToHierarchy(
  extracted: ExtractedImageData,
  current: HierarchyData
): HierarchyData {
  return {
    ...current,
    h1Count: extracted.h1_count ?? current.h1Count,
    h2Count: extracted.h2_count ?? current.h2Count,
    h3Count: extracted.h3_count ?? current.h3Count,
  };
}

export function mapExtractedToIndexing(
  extracted: ExtractedImageData,
  current: IndexingData
): IndexingData {
  return {
    ...current,
    robotsOk: extracted.robots_ok ?? current.robotsOk,
    sitemapOk: extracted.sitemap_ok ?? current.sitemapOk,
    canonicalsOk: extracted.canonicals_ok ?? current.canonicalsOk,
    headingsOk: (extracted.h1_count !== null && extracted.h1_count > 0) || current.headingsOk,
    linksOk: (extracted.internal_links !== null || extracted.external_links !== null) || current.linksOk,
  };
}

export function mapExtractedToPageSpeed(
  extracted: ExtractedImageData,
  current: PageSpeedData
): PageSpeedData {
  const metrics = extracted.metrics;
  return {
    ...current,
    performance: metrics.pagespeed_performance ?? current.performance,
    accessibility: metrics.pagespeed_accessibility ?? current.accessibility,
    bestPractices: metrics.pagespeed_best_practices ?? current.bestPractices,
    seo: metrics.pagespeed_seo ?? current.seo,
  };
}

// Auto-map extracted data to the appropriate section
export function autoMapExtractedData(
  sectionId: string,
  extracted: ExtractedImageData,
  currentData: unknown
): unknown {
  switch (sectionId) {
    case "keywords":
      return mapExtractedToKeywordAnalysis(
        extracted,
        currentData as KeywordAnalysisData
      );
    case "positioning":
      return mapExtractedToPositioning(
        extracted,
        currentData as PositioningEvolutionData
      );
    case "keywordTable":
      return mapExtractedToKeywordTable(
        extracted,
        currentData as KeywordTableData
      );
    case "backlinks":
      return mapExtractedToBacklinks(
        extracted,
        currentData as BacklinksData
      );
    case "hierarchy":
      return mapExtractedToHierarchy(
        extracted,
        currentData as HierarchyData
      );
    case "indexing":
      return mapExtractedToIndexing(
        extracted,
        currentData as IndexingData
      );
    case "pagespeed":
      return mapExtractedToPageSpeed(
        extracted,
        currentData as PageSpeedData
      );
    default:
      return currentData;
  }
}

// Check if a section has meaningful data (not just defaults)
export function sectionHasData(sectionId: string, data: unknown, images: { extractedData?: ExtractedImageData }[]): boolean {
  // If there are images with extracted data, the section has data
  if (images.some(img => img.extractedData)) {
    return true;
  }
  
  // Check section-specific data
  switch (sectionId) {
    case "intro":
      // Intro always has data if there's general form data
      return true;
    case "keywords": {
      const kw = data as KeywordAnalysisData | undefined;
      return !!(kw?.activeKeywords || kw?.organicTraffic || kw?.mainKeyword);
    }
    case "positioning": {
      const pos = data as PositioningEvolutionData | undefined;
      return !!(pos?.periodStart || pos?.periodEnd || pos?.peakValue);
    }
    case "keywordTable": {
      const kt = data as KeywordTableData | undefined;
      return !!(kt?.top3 || kt?.top10 || kt?.top11_20 || kt?.top21_100);
    }
    case "backlinks": {
      const bl = data as BacklinksData | undefined;
      return !!(bl?.referenceDomains || bl?.totalBacklinks);
    }
    case "hierarchy": {
      const hr = data as HierarchyData | undefined;
      return !!(hr?.h1Count || hr?.h2Count || hr?.h3Count);
    }
    case "indexing": {
      const idx = data as IndexingData | undefined;
      return !!(idx?.robotsOk || idx?.sitemapOk || idx?.canonicalsOk || idx?.headingsOk || idx?.metaOk || idx?.linksOk);
    }
    case "pagespeed": {
      const ps = data as PageSpeedData | undefined;
      return !!(ps?.performance || ps?.accessibility || ps?.bestPractices || ps?.seo);
    }
    default:
      return false;
  }
}
