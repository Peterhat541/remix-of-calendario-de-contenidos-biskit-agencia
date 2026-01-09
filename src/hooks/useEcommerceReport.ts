/**
 * Hook for managing Ecommerce Report state and vision processing
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EcommerceReportData, EcommerceImage } from '@/types/ecommerceReport';

function generateCaseId(): string {
  return `ecom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useEcommerceReport() {
  const [caseId] = useState<string>(() => {
    const stored = localStorage.getItem('ecommerce_report_case_id');
    if (stored) return stored;
    const newId = generateCaseId();
    localStorage.setItem('ecommerce_report_case_id', newId);
    return newId;
  });

  const [reportData, setReportData] = useState<EcommerceReportData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  const lastImageHashRef = useRef<string | null>(null);

  const clearCase = useCallback(() => {
    const newId = generateCaseId();
    localStorage.setItem('ecommerce_report_case_id', newId);
    setReportData(null);
    setError(null);
    setMissing([]);
    lastImageHashRef.current = null;
  }, []);

  const hasValidCachedData = useCallback((images: EcommerceImage[]): boolean => {
    if (!reportData) return false;
    const currentHash = images.map(img => img.id).sort().join('|');
    return lastImageHashRef.current === currentHash;
  }, [reportData]);

  const processImages = useCallback(async (images: EcommerceImage[]): Promise<{
    success: boolean;
    reportData: EcommerceReportData | null;
  }> => {
    if (images.length === 0) {
      setError('No hay imágenes para procesar');
      return { success: false, reportData: null };
    }

    setIsProcessing(true);
    setError(null);

    try {
      const imageBase64Array = images.map(img => img.src);

      const { data, error: fnError } = await supabase.functions.invoke(
        'vision-extract-ecommerce',
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

      const result = data.reportData as EcommerceReportData;
      setReportData(result);
      setMissing(result.missing || []);

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
