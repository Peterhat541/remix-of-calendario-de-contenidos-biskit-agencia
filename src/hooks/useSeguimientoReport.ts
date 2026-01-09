/**
 * Hook for processing Informe de Seguimiento images with AI
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SeguimientoImage, SeguimientoReportData } from "@/types/seguimientoReport";

interface ProcessResult {
  success: boolean;
  reportData: SeguimientoReportData | null;
  error?: string;
}

export function useSeguimientoReport() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<SeguimientoReportData | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  const generateCaseId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `seg-${timestamp}-${random}`;
  };

  const processImages = useCallback(async (images: SeguimientoImage[]): Promise<ProcessResult> => {
    if (images.length === 0) {
      return { success: false, reportData: null, error: "No hay imágenes para procesar" };
    }

    setIsProcessing(true);
    setError(null);

    const newCaseId = generateCaseId();
    setCaseId(newCaseId);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("vision-extract-seguimiento", {
        body: {
          images: images.map((img) => ({ src: img.src, name: img.name })),
          caseId: newCaseId,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Error al procesar las imágenes");
      }

      if (!data?.success) {
        throw new Error(data?.error || "No se pudo extraer información de las capturas");
      }

      const extracted: SeguimientoReportData = {
        detectedPeriod: data.period || null,
        mainDomain: data.mainDomain || null,
        indexation: data.indexation || null,
        serp: data.serp || null,
        keywords: data.keywords || null,
        missing: data.missing || [],
      };

      setReportData(extracted);
      return { success: true, reportData: extracted };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      return { success: false, reportData: null, error: message };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearCase = useCallback(() => {
    setReportData(null);
    setCaseId(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    reportData,
    caseId,
    processImages,
    clearCase,
  };
}
