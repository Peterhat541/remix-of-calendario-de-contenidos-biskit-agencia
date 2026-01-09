import { supabase } from "@/integrations/supabase/client";
import { AnalyzeImageResponse, ExtractedImageData } from "@/types/imageAnalysis";

// Retry configuration
const MAX_RETRIES = 3;
const BACKOFF_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Transient error codes that should trigger retry
const TRANSIENT_ERROR_CODES = [429, 500, 502, 503, 504];

interface RetryState {
  attempt: number;
  maxAttempts: number;
}

// Helper to check if error is transient
function isTransientError(error: any, status?: number): boolean {
  if (status && TRANSIENT_ERROR_CODES.includes(status)) {
    return true;
  }
  
  // Check for network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Check for Cloudflare errors in message
  const errorMessage = error?.message || String(error);
  if (
    errorMessage.includes('1101') ||
    errorMessage.includes('Cloudflare') ||
    errorMessage.includes('Worker threw exception') ||
    errorMessage.includes('gateway') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNRESET')
  ) {
    return true;
  }
  
  return false;
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate a simple hash for caching
export function generateImageHash(imageBase64: string): string {
  let hash = 0;
  const sample = imageBase64.slice(0, 1000) + imageBase64.slice(-1000);
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `img_${Math.abs(hash).toString(36)}`;
}

export interface AnalyzeImageOptions {
  onRetry?: (state: RetryState) => void;
  signal?: AbortSignal;
  skipCache?: boolean;
}

// Cache storage
const extractionCache = new Map<string, ExtractedImageData>();

export function getCachedResult(imageHash: string): ExtractedImageData | null {
  return extractionCache.get(imageHash) || null;
}

export function setCachedResult(imageHash: string, data: ExtractedImageData): void {
  extractionCache.set(imageHash, data);
}

export function clearCache(): void {
  extractionCache.clear();
}

export async function analyzeImage(
  imageBase64: string,
  options: AnalyzeImageOptions = {}
): Promise<AnalyzeImageResponse> {
  const { onRetry, signal, skipCache = false } = options;
  
  // Check cache first
  const imageHash = generateImageHash(imageBase64);
  if (!skipCache) {
    const cached = getCachedResult(imageHash);
    if (cached) {
      console.log(`Using cached result for ${imageHash}`);
      return { success: true, data: cached };
    }
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Check if aborted
    if (signal?.aborted) {
      return {
        success: false,
        error: "Operación cancelada por el usuario",
      };
    }

    try {
      // Notify about retry
      if (attempt > 0 && onRetry) {
        onRetry({ attempt: attempt + 1, maxAttempts: MAX_RETRIES });
      }

      // Create abort controller for timeout
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT);

      // Combine signals if external signal provided
      const combinedSignal = signal 
        ? new AbortController().signal // We'll handle this manually
        : timeoutController.signal;

      // Listen for external abort
      if (signal) {
        signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
      }

      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageBase64 },
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error(`Edge function error (attempt ${attempt + 1}):`, error);
        
        // Check if transient
        if (isTransientError(error)) {
          lastError = new Error(error.message || "Error transitorio");
          if (attempt < MAX_RETRIES - 1) {
            console.log(`Retrying in ${BACKOFF_DELAYS[attempt]}ms...`);
            await sleep(BACKOFF_DELAYS[attempt]);
            continue;
          }
        }
        
        return {
          success: false,
          error: error.message || "Error al llamar a la función de análisis",
          isTransient: isTransientError(error),
        };
      }

      if (!data.success) {
        // Check if the error response indicates a transient issue
        if (data.error && isTransientError({ message: data.error })) {
          lastError = new Error(data.error);
          if (attempt < MAX_RETRIES - 1) {
            console.log(`Retrying due to transient error in ${BACKOFF_DELAYS[attempt]}ms...`);
            await sleep(BACKOFF_DELAYS[attempt]);
            continue;
          }
        }
        
        return {
          success: false,
          error: data.error || "Error en el análisis",
          raw_response: data.raw_response,
          isTransient: isTransientError({ message: data.error }),
        };
      }

      const extractedData: ExtractedImageData = {
        capture_type: data.data.capture_type || "other",
        source_tool: data.data.source_tool || null,
        domain: data.data.domain || null,
        date_or_range: data.data.date_or_range || null,
        metrics: {
          organic_traffic: data.data.metrics?.organic_traffic ?? null,
          keywords_count: data.data.metrics?.keywords_count ?? null,
          authority_score: data.data.metrics?.authority_score ?? null,
          ref_domains: data.data.metrics?.ref_domains ?? null,
          backlinks: data.data.metrics?.backlinks ?? null,
          top_3: data.data.metrics?.top_3 ?? null,
          top_10: data.data.metrics?.top_10 ?? null,
          top_11_20: data.data.metrics?.top_11_20 ?? null,
          top_21_100: data.data.metrics?.top_21_100 ?? null,
          pagespeed_performance: data.data.metrics?.pagespeed_performance ?? null,
          pagespeed_accessibility: data.data.metrics?.pagespeed_accessibility ?? null,
          pagespeed_best_practices: data.data.metrics?.pagespeed_best_practices ?? null,
          pagespeed_seo: data.data.metrics?.pagespeed_seo ?? null,
          lcp_ms: data.data.metrics?.lcp_ms ?? null,
          cls: data.data.metrics?.cls ?? null,
          inp_ms: data.data.metrics?.inp_ms ?? null,
          keyword_list: data.data.metrics?.keyword_list || [],
        },
        evidence: data.data.evidence || [],
        robots_ok: data.data.robots_ok ?? null,
        sitemap_ok: data.data.sitemap_ok ?? null,
        canonicals_ok: data.data.canonicals_ok ?? null,
        h1_count: data.data.h1_count ?? null,
        h2_count: data.data.h2_count ?? null,
        h3_count: data.data.h3_count ?? null,
        alt_images_ok: data.data.alt_images_ok ?? null,
        internal_links: data.data.internal_links ?? null,
        external_links: data.data.external_links ?? null,
      };

      // Cache the successful result
      setCachedResult(imageHash, extractedData);

      return {
        success: true,
        data: extractedData,
      };
    } catch (error) {
      console.error(`Analysis service error (attempt ${attempt + 1}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check for timeout/abort
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (signal?.aborted) {
          return {
            success: false,
            error: "Operación cancelada por el usuario",
          };
        }
        // Timeout - treat as transient
        if (attempt < MAX_RETRIES - 1) {
          console.log(`Timeout, retrying in ${BACKOFF_DELAYS[attempt]}ms...`);
          await sleep(BACKOFF_DELAYS[attempt]);
          continue;
        }
        return {
          success: false,
          error: "Tiempo de espera agotado. El servidor no respondió a tiempo.",
          isTransient: true,
        };
      }
      
      // Check if transient
      if (isTransientError(error)) {
        if (attempt < MAX_RETRIES - 1) {
          console.log(`Transient error, retrying in ${BACKOFF_DELAYS[attempt]}ms...`);
          await sleep(BACKOFF_DELAYS[attempt]);
          continue;
        }
      }
      
      return {
        success: false,
        error: lastError.message || "Error desconocido",
        isTransient: isTransientError(error),
      };
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError?.message || "Error después de múltiples intentos",
    isTransient: true,
  };
}
