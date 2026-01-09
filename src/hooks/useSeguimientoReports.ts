/**
 * Hook for managing Seguimiento Reports in database
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SeguimientoFormData, SeguimientoReportData } from "@/types/seguimientoReport";
import { toast } from "sonner";

export interface SeguimientoReportRecord {
  id: string;
  created_at: string;
  updated_at: string;
  beneficiary_name: string;
  nif: string | null;
  website_url: string;
  report_date: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  report_data: SeguimientoReportData | null;
  pdf_path: string | null;
  word_path: string | null;
}

export function useSeguimientoReports() {
  const [reports, setReports] = useState<SeguimientoReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("seguimiento_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports((data as unknown as SeguimientoReportRecord[]) || []);
    } catch (err) {
      console.error("Error fetching seguimiento reports:", err);
      toast.error("Error al cargar los informes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveReport = useCallback(
    async (
      formData: SeguimientoFormData,
      reportData: SeguimientoReportData | null,
      status: "draft" | "completed" = "completed"
    ): Promise<string | null> => {
      setIsSaving(true);
      try {
        const period = reportData?.detectedPeriod;

        const { data, error } = await supabase
          .from("seguimiento_reports")
          .insert({
            beneficiary_name: formData.beneficiaryName,
            nif: formData.nif || null,
            website_url: formData.websiteUrl,
            report_date: formData.reportDate,
            period_start: period?.start || null,
            period_end: period?.end || null,
            status,
            report_data: reportData as any,
          })
          .select("id")
          .single();

        if (error) throw error;

        toast.success("Informe guardado correctamente");
        return data?.id || null;
      } catch (err) {
        console.error("Error saving seguimiento report:", err);
        toast.error("Error al guardar el informe");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const updateReport = useCallback(
    async (
      id: string,
      updates: Partial<Pick<SeguimientoReportRecord, "status" | "pdf_path" | "word_path">>
    ): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("seguimiento_reports")
          .update(updates)
          .eq("id", id);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Error updating seguimiento report:", err);
        return false;
      }
    },
    []
  );

  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("seguimiento_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Informe eliminado");
      return true;
    } catch (err) {
      console.error("Error deleting seguimiento report:", err);
      toast.error("Error al eliminar el informe");
      return false;
    }
  }, []);

  return {
    reports,
    isLoading,
    isSaving,
    fetchReports,
    saveReport,
    updateReport,
    deleteReport,
  };
}
