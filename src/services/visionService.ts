import { supabase } from "@/integrations/supabase/client";
import { VisionExtractResponse, VisionReportData, VisionReportRow } from "@/types/visionReport";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Call the vision-extract edge function to process images
 * Currently returns a mock response with all fields null and missing array filled
 */
export async function extractVisionReport(
  caseId: string,
  images: string[]
): Promise<VisionExtractResponse> {
  const response = await supabase.functions.invoke<VisionExtractResponse>("vision-extract", {
    body: { caseId, images },
  });

  if (response.error) {
    console.error("[visionService] Error calling vision-extract:", response.error);
    throw new Error(response.error.message || "Error al procesar las imágenes");
  }

  if (!response.data) {
    throw new Error("No se recibió respuesta del servidor");
  }

  return response.data;
}

/**
 * Fetch an existing vision report from the database
 */
export async function getVisionReport(caseId: string): Promise<VisionReportRow | null> {
  const { data, error } = await supabase
    .from("vision_reports")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();

  if (error) {
    console.error("[visionService] Error fetching vision report:", error);
    throw new Error(error.message);
  }

  if (!data) return null;

  // Cast the Json type to VisionReportData
  return {
    ...data,
    report_data: data.report_data as unknown as VisionReportData,
  } as VisionReportRow;
}

/**
 * Check if the report has any missing sections
 */
export function hasMissingSections(reportData: VisionReportData): boolean {
  return reportData.missing.length > 0;
}

/**
 * Get a formatted error message for missing sections
 */
export function getMissingErrorMessage(missing: string[]): string {
  const labels: Record<string, string> = {
    keywords: "Keywords con volúmenes",
    headings: "Encabezados (H1/H2/H3)",
    backlinks: "Backlinks y dominios de referencia",
    internalLinks: "Enlaces internos",
    pagespeed: "Rendimiento PageSpeed",
    technical: "Aspectos técnicos",
  };

  const missingLabels = missing.map((key) => labels[key] || key);
  return `Faltan datos por interpretar: ${missingLabels.join(", ")}`;
}
