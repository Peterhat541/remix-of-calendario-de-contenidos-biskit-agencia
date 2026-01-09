/**
 * Hook for managing Competencia Report state and vision processing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompetenciaReportData, CompetenciaImage } from '@/types/competenciaReport';

// Generate a stable caseId for this session
function generateCaseId(): string {
  return `comp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useCompetenciaReport() {
  const [caseId] = useState<string>(() => {
    const stored = localStorage.getItem('competencia_report_case_id');
    if (stored) return stored;
    const newId = generateCaseId();
    localStorage.setItem('competencia_report_case_id', newId);
    return newId;
  });

  const [reportData, setReportData] = useState<CompetenciaReportData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  
  const lastImageHashRef = useRef<string | null>(null);

  // Clear case for new report
  const clearCase = useCallback(() => {
    const newId = generateCaseId();
    localStorage.setItem('competencia_report_case_id', newId);
    setReportData(null);
    setError(null);
    setMissing([]);
    lastImageHashRef.current = null;
  }, []);

  // Check if we have valid cached data
  const hasValidCachedData = useCallback((images: CompetenciaImage[]): boolean => {
    if (!reportData) return false;
    
    const currentHash = images.map(img => img.id).sort().join('|');
    return lastImageHashRef.current === currentHash;
  }, [reportData]);

  // Process images through vision-extract-competencia
  const processImages = useCallback(async (images: CompetenciaImage[]): Promise<{
    success: boolean;
    reportData: CompetenciaReportData | null;
  }> => {
    if (images.length === 0) {
      setError('No hay imágenes para procesar');
      return { success: false, reportData: null };
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Convert images to base64 array
      const imageBase64Array = images.map(img => img.src);

      const { data, error: fnError } = await supabase.functions.invoke(
        'vision-extract-competencia',
        {
          body: {
            caseId,
            images: imageBase64Array,
          },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Error al procesar las imágenes');
      }

      if (!data?.reportData) {
        throw new Error('No se recibieron datos del análisis');
      }

      const result = data.reportData as CompetenciaReportData;
      setReportData(result);
      setMissing(result.missing || []);
      
      // Cache the image hash
      lastImageHashRef.current = images.map(img => img.id).sort().join('|');

      return { success: true, reportData: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return { success: false, reportData: null };
    } finally {
      setIsProcessing(false);
    }
  }, [caseId]);

  return {
    caseId,
    reportData,
    isProcessing,
    error,
    missing,
    processImages,
    hasValidCachedData,
    clearCase,
  };
}
