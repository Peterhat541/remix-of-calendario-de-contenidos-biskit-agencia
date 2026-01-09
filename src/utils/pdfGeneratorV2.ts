/**
 * PDF Generator V2 for SEO Solución Web
 * Uses VisionReportData from vision-extract
 */

import html2pdf from "html2pdf.js";
import { FormData, ReportSection } from "@/types/report";
import { VisionReportData } from "@/types/visionReport";
import { validateSeoReportV2, buildSeoSolucionWebPdfBodyHtmlV2 } from "@/utils/seoSolucionWebReportV2";

function formatDateSpanish(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
}

function createCoverPage(formData: FormData | null | undefined): string {
  // Defensive guard for formData
  const safeFormData = formData ?? {} as FormData;
  
  return `
    <div style="
      min-height: 100vh;
      padding: 50px 45px;
      page-break-after: always;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #111827;
    ">
      <p style="font-size: 12px; font-weight: 800; margin: 0 0 10px 0; text-transform: uppercase;">TÍTULO</p>

      <h1 style="
        font-size: 18px;
        font-weight: 800;
        margin: 0 0 24px 0;
        line-height: 1.35;
        text-transform: uppercase;
        text-align: center;
      ">
        INFORME DE RESULTADO DEL SERVICIO DE MEJORA DEL POSICIONAMIENTO SEO
      </h1>

      <p style="font-size: 12px; font-weight: 800; margin: 0 0 12px 0; text-transform: uppercase;">INFORMACIÓN DE CABECERA</p>

      <p style="font-size: 12px; margin: 0 0 10px 0;"><strong>SITIO WEB:</strong> ${safeFormData.websiteUrl ?? ""}</p>
      <p style="font-size: 12px; margin: 0 0 10px 0;"><strong>Periodo de prestación del servicio:</strong> ${formatDateSpanish(safeFormData.startDate ?? "")} / ${formatDateSpanish(safeFormData.endDate ?? "")}</p>
      <p style="font-size: 12px; margin: 0 0 10px 0;"><strong>Fecha de elaboración del presente informe:</strong> ${formatDateSpanish(safeFormData.reportDate ?? "")}</p>
      <p style="font-size: 12px; margin: 0;"><strong>Beneficiario:</strong> ${safeFormData.beneficiaryName ?? ""}</p>
    </div>
  `;
}

/**
 * Check HTML for placeholder patterns that should not appear in final PDF
 */
function containsPlaceholders(html: string): { hasPlaceholders: boolean; found: string[] } {
  const patterns = [
    /\[.*?\]/g, // [placeholder]
    /N\/D%/g, // N/D%
    /\bnull\b/gi, // null
    /\bundefined\b/gi, // undefined
    /\(periodo detectado\)/gi, // (periodo detectado)
  ];

  const found: string[] = [];
  for (const pattern of patterns) {
    const matches = html.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  }

  return { hasPlaceholders: found.length > 0, found: [...new Set(found)] };
}

/**
 * Generate PDF blob for upload
 */
async function generatePDFBlob(
  formData: FormData | null | undefined,
  reportData: VisionReportData | null | undefined,
  sections: ReportSection[] | null | undefined,
  options?: { skipValidation?: boolean }
): Promise<{ blob: Blob; filename: string; validationErrors: string[] }> {
  // Defensive guards
  const safeFormData = formData ?? {} as FormData;
  const safeReportData = reportData ?? {} as VisionReportData;
  const safeSections = sections ?? [];

  // Validate before export (but don't block if skipValidation is true)
  const validation = validateSeoReportV2(safeFormData, safeReportData, safeSections);
  if (!validation.ok && !options?.skipValidation) {
    throw new Error(
      `Faltan datos para generar el PDF:\n${validation.errors.join("\n")}`
    );
  }

  // Generate HTML with safe data
  const coverHTML = createCoverPage(safeFormData);
  const bodyHTML = buildSeoSolucionWebPdfBodyHtmlV2(safeFormData, safeReportData, safeSections);

  // Check for placeholders in final HTML - only warn, don't block
  const placeholderCheck = containsPlaceholders(bodyHTML);
  if (placeholderCheck.hasPlaceholders) {
    console.warn("[pdfGeneratorV2] Placeholders found in HTML:", placeholderCheck.found);
  }

  const container = document.createElement("div");
  container.style.cssText = `
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #111827;
    background: white;
    font-size: 12px;
    line-height: 1.6;
  `;

  container.innerHTML = `${coverHTML}${bodyHTML}`;

  const filename = `Justificacion-FaseII-${sanitizeFilename(safeFormData.beneficiaryName ?? "borrador")}.pdf`;

  const opt = {
    margin: [8, 0, 12, 0] as [number, number, number, number],
    filename,
    image: { type: "jpeg" as const, quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
    },
    jsPDF: {
      unit: "mm" as const,
      format: "a4" as const,
      orientation: "portrait" as const,
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"] as ("avoid-all" | "css" | "legacy")[],
    },
  };

  const blob = await html2pdf().set(opt).from(container).outputPdf('blob');
  return { blob, filename, validationErrors: validation.errors };
}

/**
 * Get validation errors without generating PDF
 */
export function getValidationErrors(
  formData: FormData | null | undefined,
  reportData: VisionReportData | null | undefined,
  sections: ReportSection[] | null | undefined
): string[] {
  const safeFormData = formData ?? {} as FormData;
  const safeReportData = reportData ?? {} as VisionReportData;
  const safeSections = sections ?? [];
  const validation = validateSeoReportV2(safeFormData, safeReportData, safeSections);
  return validation.errors;
}

/**
 * Generate PDF using VisionReportData - downloads locally
 */
export async function generatePDFV2(
  formData: FormData | null | undefined,
  reportData: VisionReportData | null | undefined,
  sections: ReportSection[] | null | undefined,
  options?: { skipValidation?: boolean }
): Promise<void> {
  const { blob, filename } = await generatePDFBlob(formData, reportData, sections, options);
  
  // Download locally
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate PDF and return blob + filename for upload
 */
export async function generatePDFV2WithBlob(
  formData: FormData | null | undefined,
  reportData: VisionReportData | null | undefined,
  sections: ReportSection[] | null | undefined,
  options?: { skipValidation?: boolean }
): Promise<{ blob: Blob; filename: string }> {
  const { blob, filename } = await generatePDFBlob(formData, reportData, sections, options);
  return { blob, filename };
}
