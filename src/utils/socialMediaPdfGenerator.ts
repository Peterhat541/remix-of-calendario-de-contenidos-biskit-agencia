import html2pdf from "html2pdf.js";
import { SocialMediaFormData, MonthlyPublications, ImageItem } from "@/types/socialMediaReport";
import { generateSocialMediaMetricsText, extractMetricsFromImages } from "./socialMediaTextGenerator";

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

function createCoverPage(formData: SocialMediaFormData): string {
  return `
    <div style="
      min-height: 100vh;
      padding: 50px 45px;
      page-break-after: always;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    ">
      <div style="text-align: center; margin-bottom: 40px; padding-top: 30px;">
        <h1 style="
          font-size: 20px;
          font-weight: 700;
          color: #000000;
          margin: 0;
          line-height: 1.4;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          INFORME DE PUBLICIDAD Y GESTIÓN DE REDES SOCIALES
        </h1>
      </div>

      <div style="
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 25px 30px;
        margin-bottom: 30px;
      ">
        <div style="margin-bottom: 14px;">
          <span style="font-size: 13px; font-weight: 700; color: #000000;">RED SOCIAL:</span>
          <span style="font-size: 13px; color: #333333; margin-left: 8px;">
            ${formData.socialNetwork || "—"}
          </span>
        </div>
        <div style="margin-bottom: 14px;">
          <span style="font-size: 13px; font-weight: 700; color: #000000;">ENLACE:</span>
          <span style="font-size: 13px; color: #0066cc; margin-left: 8px; word-break: break-all;">
            ${formData.socialNetworkUrl || "—"}
          </span>
        </div>
        <div style="margin-bottom: 14px;">
          <span style="font-size: 13px; color: #333333;">Periodo de prestación del servicio:</span>
          <span style="font-size: 13px; font-weight: 600; color: #000000; margin-left: 8px;">
            ${formatDateSpanish(formData.startDate)} / ${formatDateSpanish(formData.endDate)}
          </span>
        </div>
        <div style="margin-bottom: 14px;">
          <span style="font-size: 13px; color: #333333;">Fecha de elaboración del presente informe:</span>
          <span style="font-size: 13px; font-weight: 600; color: #000000; margin-left: 8px;">
            ${formatDateSpanish(formData.reportDate)}
          </span>
        </div>
        <div style="margin-bottom: 0;">
          <span style="font-size: 13px; color: #333333;">Beneficiario:</span>
          <span style="font-size: 13px; font-weight: 600; color: #000000; margin-left: 8px;">
            ${formData.beneficiaryName || "—"}
          </span>
          <span style="font-size: 13px; color: #666666; margin-left: 8px;">|</span>
          <span style="font-size: 13px; font-weight: 600; color: #000000; margin-left: 8px;">
            ${formData.nif || "—"}
          </span>
        </div>
      </div>

      <div style="
        position: absolute;
        bottom: 30px;
        left: 45px;
        right: 45px;
        text-align: center;
        font-size: 10px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
        padding-top: 15px;
      ">
        Kit Digital · Gestión de Redes Sociales
      </div>
    </div>
  `;
}

function createPublicationsSection(publications: MonthlyPublications[]): string {
  const monthsWithImages = publications.filter(p => p.images.length > 0);
  
  if (monthsWithImages.length === 0) {
    return "";
  }

  const monthsHTML = monthsWithImages.map((publication, monthIndex) => {
    const imagesHTML = publication.images.map((img, imgIndex) => `
      <div style="margin: 15px 0; page-break-inside: avoid;">
        <img 
          src="${img.src}" 
          style="
            max-width: 100%;
            max-height: 300px;
            width: auto;
            height: auto;
            border: 1px solid #d1d5db;
            border-radius: 2px;
            display: block;
            margin: 0 auto;
          " 
          alt="Publicación ${imgIndex + 1} - ${publication.monthName}"
        />
        <div style="
          font-size: 9px;
          color: #6b7280;
          margin-top: 6px;
          font-style: italic;
          text-align: center;
        ">
          Publicación ${imgIndex + 1} - ${publication.monthName}
        </div>
      </div>
    `).join("");

    return `
      <div style="margin-bottom: 30px; ${monthIndex > 0 ? "page-break-before: always;" : ""}">
        <h3 style="
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        ">
          ${publication.monthName}
        </h3>
        ${imagesHTML}
      </div>
    `;
  }).join("");

  return `
    <div style="
      padding: 35px 45px;
      page-break-before: always;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    ">
      <h2 style="
        font-size: 16px;
        font-weight: 700;
        color: #000000;
        margin: 0 0 18px 0;
        padding-bottom: 10px;
        border-bottom: 2px solid #000000;
      ">
        Publicaciones de los últimos meses
      </h2>
      
      <p style="
        font-size: 12px;
        line-height: 1.7;
        color: #1f2937;
        text-align: justify;
        margin-bottom: 20px;
      ">
        A continuación se muestran las publicaciones realizadas durante el periodo de prestación del servicio, organizadas por mes. Estas publicaciones forman parte de la estrategia de contenidos implementada para aumentar la visibilidad y el engagement del perfil en redes sociales.
      </p>
      
      ${monthsHTML}
    </div>
  `;
}

function createMetricsSection(
  formData: SocialMediaFormData,
  metricsImages: ImageItem[],
  monthNames: string[],
  editedContent?: string
): string {
  const metricsData = extractMetricsFromImages(metricsImages);
  const contentHtml = editedContent || generateSocialMediaMetricsText(formData, metricsData, monthNames);

  const imagesHTML = metricsImages.map((img, idx) => `
    <div style="margin: 20px 0; page-break-inside: avoid;">
      <img 
        src="${img.src}" 
        style="
          max-width: 100%;
          max-height: 350px;
          width: auto;
          height: auto;
          border: 1px solid #d1d5db;
          border-radius: 2px;
          display: block;
          margin: 0 auto;
        " 
        alt="Métricas ${idx + 1}"
      />
      <div style="
        font-size: 9px;
        color: #6b7280;
        margin-top: 6px;
        font-style: italic;
        text-align: center;
      ">
        Figura ${idx + 1}
      </div>
    </div>
  `).join("");

  return `
    <div style="
      padding: 35px 45px;
      page-break-before: always;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    ">
      <h2 style="
        font-size: 16px;
        font-weight: 700;
        color: #000000;
        margin: 0 0 18px 0;
        padding-bottom: 10px;
        border-bottom: 2px solid #000000;
      ">
        Monitorización y control periódico: estadísticas y métricas de visitas
      </h2>
      
      ${imagesHTML}
      
      <div style="
        font-size: 12px;
        line-height: 1.7;
        color: #1f2937;
        text-align: justify;
        margin-top: 20px;
      ">
        ${contentHtml}
      </div>
    </div>
  `;
}

export async function generateSocialMediaPDF(
  formData: SocialMediaFormData,
  publications: MonthlyPublications[],
  metricsImages: ImageItem[],
  editedContent?: string
): Promise<void> {
  const monthNames = publications.map(p => p.monthName);
  
  const container = document.createElement("div");
  container.style.cssText = `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    color: #1f2937;
    background: white;
    font-size: 12px;
    line-height: 1.6;
  `;

  const coverHTML = createCoverPage(formData);
  const publicationsHTML = createPublicationsSection(publications);
  const metricsHTML = createMetricsSection(formData, metricsImages, monthNames, editedContent);

  container.innerHTML = `${coverHTML}${publicationsHTML}${metricsHTML}`;

  const filename = `INF_PUBLI_RRSS-${sanitizeFilename(formData.beneficiaryName || "borrador")}.pdf`;

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
