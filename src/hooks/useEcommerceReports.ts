/**
 * Hook for managing Ecommerce Reports in database
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EcommerceFormData, EcommerceReportData } from "@/types/ecommerceReport";
import { toast } from "sonner";

export interface EcommerceReportRecord {
  id: string;
  created_at: string;
  updated_at: string;
  beneficiary_name: string;
  nif: string | null;
  website_url: string;
  report_date: string;
  service_start: string | null;
  service_end: string | null;
  period_start: string | null;
  period_end: string | null;
  status: string;
  report_data: EcommerceReportData | null;
  pdf_path: string | null;
  word_path: string | null;
}

export function useEcommerceReports() {
  const [reports, setReports] = useState<EcommerceReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ecommerce_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports((data as unknown as EcommerceReportRecord[]) || []);
    } catch (err) {
      console.error("Error fetching ecommerce reports:", err);
      toast.error("Error al cargar los informes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveReport = useCallback(
    async (
      formData: EcommerceFormData,
      reportData: EcommerceReportData | null,
      status: "draft" | "completed" = "completed"
    ): Promise<string | null> => {
      setIsSaving(true);
      try {
        const period = reportData?.detectedPeriod;

        const { data, error } = await supabase
          .from("ecommerce_reports")
          .insert({
            beneficiary_name: formData.beneficiaryName,
            website_url: formData.websiteUrl,
            report_date: formData.reportDate,
            service_start: formData.serviceStart || null,
            service_end: formData.serviceEnd || null,
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
        console.error("Error saving ecommerce report:", err);
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
      updates: Partial<Pick<EcommerceReportRecord, "status" | "pdf_path" | "word_path">>
    ): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("ecommerce_reports")
          .update(updates)
          .eq("id", id);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Error updating ecommerce report:", err);
        return false;
      }
    },
    []
  );

  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("ecommerce_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Informe eliminado");
      return true;
    } catch (err) {
      console.error("Error deleting ecommerce report:", err);
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
