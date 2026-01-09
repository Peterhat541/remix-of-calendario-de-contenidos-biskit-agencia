import { useState, useCallback, useEffect } from "react";
import { extractVisionReport, getVisionReport, getMissingErrorMessage } from "@/services/visionService";
import { VisionReportData, VisionExtractResponse } from "@/types/visionReport";
import { ImageItem } from "@/types/report";

const CASE_ID_STORAGE_KEY = "seo_report_case_id";

interface UseVisionReportState {
  isProcessing: boolean;
  reportData: VisionReportData | null;
  error: string | null;
  missing: string[];
  imagesHash: string | null;
}

interface UseVisionReportReturn extends UseVisionReportState {
  caseId: string;
  processImages: (images: ImageItem[]) => Promise<VisionExtractResponse | null>;
  loadReport: () => Promise<VisionReportData | null>;
  canExportPdf: boolean;
  missingMessage: string | null;
  reset: () => void;
  hasValidCachedData: (images: ImageItem[]) => boolean;
}

/**
 * Generate a simple hash from image sources for change detection
 */
function generateImagesHash(images: ImageItem[]): string {
  const sources = images.map(img => img.src).sort().join("|");
  // Simple hash: length + first/last chars + count
  return `${sources.length}-${images.length}-${sources.slice(0, 50)}-${sources.slice(-50)}`;
}

/**
 * Get or create a persistent caseId
 */
function getOrCreateCaseId(): string {
  const existing = localStorage.getItem(CASE_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const newId = crypto.randomUUID();
  localStorage.setItem(CASE_ID_STORAGE_KEY, newId);
  return newId;
}

/**
 * Hook to manage vision-extract flow for SEO reports
 * - Persists caseId in localStorage
 * - Checks for existing valid data before re-analyzing
 * - Tracks image hash to detect changes
 */
export function useVisionReport(): UseVisionReportReturn {
  const [caseId] = useState<string>(() => getOrCreateCaseId());
  
  const [state, setState] = useState<UseVisionReportState>({
    isProcessing: false,
    reportData: null,
    error: null,
    missing: [],
    imagesHash: null,
  });

  // Sections that are OPTIONAL - their absence should NOT block export
  const OPTIONAL_MISSING_SECTIONS = ["pagespeed", "technical"];

  /**
   * Check if we have valid cached data for the given images
   * Allows caching even if optional sections (like pagespeed) are missing
   */
  const hasValidCachedData = useCallback((images: ImageItem[]): boolean => {
    if (!state.reportData) return false;
    
    // Filter out optional missing sections - only block on critical missing
    const criticalMissing = state.missing.filter(m => !OPTIONAL_MISSING_SECTIONS.includes(m));
    if (criticalMissing.length > 0) return false;
    
    // Check if images match the cached hash
    const currentHash = generateImagesHash(images);
    return state.imagesHash === currentHash;
  }, [state.reportData, state.missing, state.imagesHash]);

  /**
   * Load existing report from database on mount
   */
  useEffect(() => {
    const loadExistingReport = async () => {
      try {
        const report = await getVisionReport(caseId);
        if (report) {
          console.log("[useVisionReport] Loaded existing report for caseId:", caseId);
          setState(prev => ({
            ...prev,
            reportData: report.report_data,
            missing: report.missing || [],
          }));
        }
      } catch (error) {
        console.error("[useVisionReport] Error loading existing report:", error);
      }
    };
    
    loadExistingReport();
  }, [caseId]);

  /**
   * Process all images with vision-extract in a single call
   * Skips if valid cached data exists for these images
   */
  const processImages = useCallback(async (images: ImageItem[]): Promise<VisionExtractResponse | null> => {
    if (images.length === 0) {
      setState(prev => ({ ...prev, error: "No hay imágenes para procesar" }));
      return null;
    }

    const currentHash = generateImagesHash(images);

    // Check if we already have valid data for these exact images
    // Allow caching even with optional missing sections (pagespeed, technical)
    const criticalMissing = state.missing.filter(m => !OPTIONAL_MISSING_SECTIONS.includes(m));
    if (state.reportData && criticalMissing.length === 0 && state.imagesHash === currentHash) {
      console.log("[useVisionReport] Using cached reportData, skipping vision-extract");
      return {
        success: true,
        reportData: state.reportData,
      };
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Collect all image sources (URLs or base64)
      const imageSources = images.map(img => img.src);

      // Single call to vision-extract with all images
      const response = await extractVisionReport(caseId, imageSources);

      if (response.success && response.reportData) {
        setState({
          isProcessing: false,
          reportData: response.reportData,
          error: null,
          missing: response.reportData.missing || [],
          imagesHash: currentHash,
        });
        return response;
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: response.error || "Error al procesar las imágenes",
        }));
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [caseId, state.reportData, state.missing, state.imagesHash]);

  /**
   * Load existing report from database
   */
  const loadReport = useCallback(async (): Promise<VisionReportData | null> => {
    try {
      const report = await getVisionReport(caseId);
      if (report) {
        setState(prev => ({
          ...prev,
          reportData: report.report_data,
          missing: report.missing || [],
        }));
        return report.report_data;
      }
      return null;
    } catch (error) {
      console.error("[useVisionReport] Error loading report:", error);
      return null;
    }
  }, [caseId]);

  /**
   * Reset state and generate new caseId
   */
  const reset = useCallback(() => {
    const newId = crypto.randomUUID();
    localStorage.setItem(CASE_ID_STORAGE_KEY, newId);
    setState({
      isProcessing: false,
      reportData: null,
      error: null,
      missing: [],
      imagesHash: null,
    });
    // Force page reload to get new caseId
    window.location.reload();
  }, []);

  // Derived state - allow export even with optional missing sections
  const criticalMissingForExport = state.missing.filter(m => !OPTIONAL_MISSING_SECTIONS.includes(m));
  const canExportPdf = state.reportData !== null && criticalMissingForExport.length === 0;
  const missingMessage = state.missing.length > 0 ? getMissingErrorMessage(state.missing) : null;

  return {
    ...state,
    caseId,
    processImages,
    loadReport,
    canExportPdf,
    missingMessage,
    reset,
    hasValidCachedData,
  };
}
