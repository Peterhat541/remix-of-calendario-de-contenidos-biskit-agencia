/**
 * Hook for managing Competencia Reports in database
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompetenciaFormData, CompetenciaReportData } from '@/types/competenciaReport';
import { toast } from 'sonner';

export interface CompetenciaReportRecord {
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
  report_data: CompetenciaReportData | null;
  pdf_path: string | null;
  word_path: string | null;
}

export function useCompetenciaReports() {
  const [reports, setReports] = useState<CompetenciaReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('competencia_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast through unknown to handle Json type
      setReports((data as unknown as CompetenciaReportRecord[]) || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error('Error al cargar los informes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a new report
  const saveReport = useCallback(async (
    formData: CompetenciaFormData,
    reportData: CompetenciaReportData | null,
    status: 'draft' | 'completed' = 'completed'
  ): Promise<string | null> => {
    setIsSaving(true);
    try {
      const period = reportData?.detectedPeriod;
      
      const { data, error } = await supabase
        .from('competencia_reports')
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
        .select('id')
        .single();

      if (error) throw error;
      
      toast.success('Informe guardado correctamente');
      return data?.id || null;
    } catch (err) {
      console.error('Error saving report:', err);
      toast.error('Error al guardar el informe');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update report status or paths
  const updateReport = useCallback(async (
    id: string,
    updates: Partial<Pick<CompetenciaReportRecord, 'status' | 'pdf_path' | 'word_path'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('competencia_reports')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating report:', err);
      return false;
    }
  }, []);

  // Delete a report
  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('competencia_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setReports(prev => prev.filter(r => r.id !== id));
      toast.success('Informe eliminado');
      return true;
    } catch (err) {
      console.error('Error deleting report:', err);
      toast.error('Error al eliminar el informe');
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
