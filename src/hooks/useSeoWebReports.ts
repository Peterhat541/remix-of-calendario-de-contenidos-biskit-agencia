/**
 * Hook for managing SEO Web Reports
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllSeoWebReports,
  fetchSeoWebReportById,
  fetchSeoWebReportByCaseKey,
  createSeoWebReport,
  updateSeoWebReport,
  deleteSeoWebReport,
  upsertSeoWebReportByCaseKey,
} from "@/services/seoWebReportService";
import { CreateSeoWebReportInput, UpdateSeoWebReportInput } from "@/types/seoWebReport";

const QUERY_KEY = "seo_web_reports";

/**
 * Hook to fetch all SEO web reports
 */
export function useSeoWebReports() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchAllSeoWebReports,
  });
}

/**
 * Hook to fetch a single report by ID
 */
export function useSeoWebReportById(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => (id ? fetchSeoWebReportById(id) : null),
    enabled: !!id,
  });
}

/**
 * Hook to fetch a single report by case_key
 */
export function useSeoWebReportByCaseKey(caseKey: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, "case_key", caseKey],
    queryFn: () => (caseKey ? fetchSeoWebReportByCaseKey(caseKey) : null),
    enabled: !!caseKey,
  });
}

/**
 * Hook to create a new report
 */
export function useCreateSeoWebReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSeoWebReportInput) => createSeoWebReport(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook to update a report
 */
export function useUpdateSeoWebReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSeoWebReportInput }) =>
      updateSeoWebReport(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook to upsert a report by case_key
 */
export function useUpsertSeoWebReportByCaseKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseKey, input }: { caseKey: string; input: CreateSeoWebReportInput }) =>
      upsertSeoWebReportByCaseKey(caseKey, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook to delete a report
 */
export function useDeleteSeoWebReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSeoWebReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
