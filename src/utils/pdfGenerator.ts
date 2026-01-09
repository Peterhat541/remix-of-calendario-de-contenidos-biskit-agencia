import html2pdf from "html2pdf.js";
import { FormData, ReportSection } from "@/types/report";
import { validateSeoSolucionWebReport, buildSeoSolucionWebPdfBodyHtml } from "@/utils/seoSolucionWebReport";

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

function createCoverPage(formData: FormData): string {
  return `
    <div style="
      min-height: 100vh;
      padding: 50px 45px;
      page-break-after: always;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #111827;
    ">
      

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

      <p style="font-size: 12px; margin: 0 0 10px 0;"><strong>SITIO WEB:</strong> ${formData.websiteUrl || ""}</p>
      <p style="font-size: 12px; margin: 0 0 10px 0;"><strong>Periodo de prestación del servicio:</strong> ${formatDateSpanish(formData.startDate)} / ${formatDateSpanish(formData.endDate)}</p>
      <p style="font-size: 12px; margin: 0 0 10px 0;"><strong>Fecha de elaboración del presente informe:</strong> ${formatDateSpanish(formData.reportDate)}</p>
      <p style="font-size: 12px; margin: 0;"><strong>Beneficiario:</strong> ${formData.beneficiaryName || ""}</p>
    </div>
  `;
}

// Legacy helper functions kept for backward compatibility with other parts of the app
function filterSectionsWithData(sections: ReportSection[], _formData?: FormData): ReportSection[] {
  return sections.filter((section) => section.images.length > 0 || section.editedContent);
}

function renumberSections(sections: ReportSection[]): ReportSection[] {
  const MAIN_SECTIONS = ["keywords", "hierarchy"];
  let sectionNumber = 0;

  return sections.map((section) => {
    const cleanTitle = section.title.replace(/^(\d+\.\s*)?/, "");

    if (section.id === "intro") {
      return { ...section, title: "Introducción" };
    }

    if (MAIN_SECTIONS.includes(section.id)) {
      sectionNumber++;
      return { ...section, title: `${sectionNumber}. ${cleanTitle}` };
    }

    return { ...section, title: cleanTitle };
  });
}

export async function generatePDF(formData: FormData, sections: ReportSection[]): Promise<void> {
  // Generación del HTML canónico (texto fijo + datos reales)
  const coverHTML = createCoverPage(formData);
  const bodyHTML = buildSeoSolucionWebPdfBodyHtml(formData, sections);

  const container = document.createElement("div");
  container.style.cssText = `
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #111827;
    background: white;
    font-size: 12px;
    line-height: 1.6;
  `;

  container.innerHTML = `${coverHTML}${bodyHTML}`;

  const filename = `Justificacion-FaseII-${sanitizeFilename(formData.beneficiaryName || "borrador")}.pdf`;

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

  await html2pdf().set(opt).from(container).save();
}

export { filterSectionsWithData, renumberSections };
