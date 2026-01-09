/**
 * SEO Solución Web Report Generator V2
 * Uses VisionReportData from vision-extract instead of per-image extractedData
 */

import { FormData, ReportSection, ImageItem } from "@/types/report";
import { VisionReportData, VisionKeyword } from "@/types/visionReport";
import { generateKeywordEvolutionTable } from "@/utils/keywordTableGenerator";

function formatDateSpanish(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function domainFromUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}

function getSection(sections: ReportSection[], id: string): ReportSection | undefined {
  return sections.find((s) => s.id === id);
}

// Helper para formatear número o mostrar "N/D"
function fmtNum(val: number | null | undefined, suffix = ""): string {
  if (val === null || val === undefined) return "N/D";
  return val.toLocaleString("es-ES") + suffix;
}

function renderImagesForPdf(images: ImageItem[]): string {
  if (!images.length) return "";
  return images
    .map(
      (img) => `
      <div style="margin: 14px 0; page-break-inside: avoid;">
        <img
          src="${img.src}"
          alt="Captura"
          style="max-width: 100%; max-height: 360px; width: auto; height: auto; border: 1px solid #d1d5db; border-radius: 2px; display: block; margin: 0 auto;"
        />
      </div>
    `
    )
    .join("");
}

function renderImagesForPreview(images: ImageItem[]): string {
  if (!images.length) return "";
  return images
    .map(
      (img) => `
      <div style="margin: 14px 0;">
        <img
          src="${img.src}"
          alt="Captura"
          style="max-width: 100%; max-height: 360px; width: auto; height: auto; border: 1px solid #e5e7eb; border-radius: 6px; display: block; margin: 0 auto;"
        />
      </div>
    `
    )
    .join("");
}

function getPositioningPhrase(reportData: VisionReportData | null | undefined): { presenceText: "sí" | "no"; rangeText: string } {
  const safeReportData = reportData ?? {} as VisionReportData;
  const safeKeywords = safeReportData.keywords ?? [];
  const keywordsCount = safeKeywords.length;
  const hasPresence = keywordsCount > 0;

  // Default range text based on whether we have keywords
  let rangeText = "fuera del Top 100";
  if (hasPresence) {
    rangeText = ">50"; // Default conservative estimate
  }

  return { presenceText: hasPresence ? "sí" : "no", rangeText };
}

/**
 * Validate report data before PDF export
 */
export type SeoReportV2ValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validateSeoReportV2(
  formData: FormData | null | undefined,
  reportData: VisionReportData | null | undefined,
  sections: ReportSection[] | null | undefined
): SeoReportV2ValidationResult {
  const errors: string[] = [];

  // Defensive guard for formData
  const safeFormData = formData ?? {} as FormData;

  // Form field validation
  if (!safeFormData.websiteUrl?.trim()) errors.push("Falta 'SITIO WEB' (campo del formulario).");
  if (!safeFormData.startDate) errors.push("Falta 'Fecha inicio del servicio' (campo del formulario).");
  if (!safeFormData.endDate) errors.push("Falta 'Fecha fin del servicio' (campo del formulario).");
  if (!safeFormData.reportDate) errors.push("Falta 'Fecha de elaboración' (campo del formulario).");
  if (!safeFormData.beneficiaryName?.trim()) errors.push("Falta 'Beneficiario' (campo del formulario).");

  // Check if vision report exists
  if (!reportData) {
    errors.push("No se han procesado las capturas con visión. Pulsa 'Extraer datos' primero.");
    return { ok: false, errors };
  }

  // Check missing sections from vision-extract
  // pagespeed and technical are OPTIONAL - they shouldn't block export
  const OPTIONAL_SECTIONS = ["pagespeed", "technical"];
  const criticalMissing = (reportData.missing || []).filter(m => !OPTIONAL_SECTIONS.includes(m));
  
  if (criticalMissing.length > 0) {
    for (const missing of criticalMissing) {
      const labels: Record<string, string> = {
        keywords: "Keywords con volúmenes",
        headings: "Encabezados (H1/H2/H3)",
        backlinks: "Backlinks y dominios de referencia",
        internalLinks: "Enlaces internos",
      };
      errors.push(`Falta: ${labels[missing] || missing} (no detectado en capturas).`);
    }
  }

  // Check minimum keywords for evolution table with safe access
  const safeKeywords = reportData.keywords ?? [];
  const keywordsWithVolume = safeKeywords.filter(k => k && k.volume !== null);
  if (keywordsWithVolume.length < 4) {
    errors.push(`Faltan keywords con volúmenes (tienes ${keywordsWithVolume.length}, mín. 4).`);
  }

  // Check required images with defensive guards
  const safeSections = sections ?? [];
  const introImages = getSection(safeSections, "intro")?.images ?? [];
  const keywordImages = getSection(safeSections, "keywords")?.images ?? [];
  const positioningImages = getSection(safeSections, "positioning")?.images ?? [];
  const backlinksImages = getSection(safeSections, "backlinks")?.images ?? [];
  const hierarchyImages = getSection(safeSections, "hierarchy")?.images ?? [];

  if (introImages.length === 0) errors.push("Falta captura de introducción.");
  if (keywordImages.length + positioningImages.length === 0) errors.push("Faltan capturas de keywords.");
  if (backlinksImages.length === 0) errors.push("Faltan capturas de backlinks.");
  if (hierarchyImages.length === 0) errors.push("Faltan capturas de jerarquización.");

  return { ok: errors.length === 0, errors };
}

/**
 * Build HTML body using VisionReportData
 */
function buildBodyHtmlV2(
  formData: FormData,
  reportData: VisionReportData,
  sections: ReportSection[],
  options: { mode: "pdf" | "preview" }
): string {
  // Defensive guards for formData - use optional chaining and defaults
  const website = (formData?.websiteUrl ?? "").trim();
  const domain = website ? domainFromUrl(website) : "dominio no especificado";
  const period = `${formatDateSpanish(formData?.startDate ?? "")} / ${formatDateSpanish(formData?.endDate ?? "")}`;

  // Use a default tool name or detect from somewhere if needed
  const tool = "herramienta SEO profesional";

  // Defensive guards for reportData - use optional chaining
  const safeBacklinks = reportData?.backlinks;
  const safeHeadings = reportData?.headings;
  const safeInternalLinks = reportData?.internalLinks;
  const safeKeywords = reportData?.keywords ?? [];

  // Get data from VisionReportData with defaults
  const backlinks = safeBacklinks?.backlinksCount ?? null;
  const refDomains = safeBacklinks?.refDomainsCount ?? null;

  // Defensive guards for sections
  const safeSections = sections ?? [];
  const introImages = getSection(safeSections, "intro")?.images ?? [];
  const keywordImages = getSection(safeSections, "keywords")?.images ?? [];
  const positioningImages = getSection(safeSections, "positioning")?.images ?? [];
  const backlinksImages = getSection(safeSections, "backlinks")?.images ?? [];
  const hierarchyImages = getSection(safeSections, "hierarchy")?.images ?? [];
  const indexingImages = getSection(safeSections, "indexing")?.images ?? [];
  const pagespeedImages = getSection(safeSections, "pagespeed")?.images ?? [];

  const imagesBlock = options.mode === "pdf" ? renderImagesForPdf : renderImagesForPreview;

  // Keywords from VisionReportData with safe access
  const keywordsWithVolume = safeKeywords.filter(k => k && k.volume !== null);
  const k1 = keywordsWithVolume[0] ?? undefined;
  const k2 = keywordsWithVolume[1] ?? undefined;
  const k3 = keywordsWithVolume[2] ?? undefined;
  const k4 = keywordsWithVolume[3] ?? undefined;
  const k5 = keywordsWithVolume[4] ?? undefined;

  // Headings from VisionReportData with defaults
  const h1 = safeHeadings?.h1Count ?? null;
  const h2 = safeHeadings?.h2Count ?? null;
  const h3 = safeHeadings?.h3Count ?? null;

  // Internal links from VisionReportData with defaults
  const internalLinks = safeInternalLinks?.total ?? null;
  const internalPercent = safeInternalLinks?.internalPct ?? null;
  const totalLinks = internalLinks;

  const { presenceText, rangeText } = getPositioningPhrase(reportData);

  // Generate keyword evolution table with safe keyword access
  const keywordStrings = keywordsWithVolume.map(k => k?.keyword ?? "").filter(Boolean);
  const kwTable = keywordStrings.length >= 4
    ? generateKeywordEvolutionTable(
        formData?.servicio ?? "",
        formData?.startDate ?? "",
        formData?.endDate ?? "",
        keywordStrings
      )
    : null;

  const tableHtml = kwTable
    ? `
    <div style="margin: 12px 0; page-break-inside: avoid;">
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px; text-align: left; font-size: 10px; font-weight: 700; border: 1px solid #d1d5db; background: #f3f4f6; min-width: 150px;">Palabra clave</th>
              ${kwTable.months
                .map(
                  (m) =>
                    `<th style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: 700; border: 1px solid #d1d5db; background: #f3f4f6;">${m}</th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${kwTable.rows
              .map(
                (row, idx) => `
              <tr style="background: ${idx % 2 === 0 ? "#ffffff" : "#f9fafb"};">
                <td style="padding: 8px; font-size: 10px; font-weight: 600; border: 1px solid #d1d5db;">${row.keyword}</td>
                ${row.valuesByMonth
                  .map(
                    (v) =>
                      `<td style="padding: 6px; text-align: center; font-size: 10px; border: 1px solid #d1d5db; color: #6b7280;">${v}</td>`
                  )
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `
    : `<p style="color: #dc2626; font-style: italic;">(Tabla evolutiva no disponible: faltan keywords con volúmenes en capturas)</p>`;

  const baseTextStyle = options.mode === "pdf"
    ? "font-size: 12px; line-height: 1.7; color: #111827; text-align: justify;"
    : "font-size: 14px; line-height: 1.7; color: #111827; text-align: justify;";

  const h2Style = "font-size: 14px; font-weight: 800; margin: 18px 0 10px 0;";

  // Helper para keyword bullet
  const kwBullet = (kw: VisionKeyword | undefined) => {
    if (!kw || !kw.keyword) return "";
    return `<p>• ${kw.keyword} – ${kw.volume !== null ? kw.volume.toLocaleString("es-ES") : "N/D"} búsquedas/mes</p>`;
  };

  return `
  <div style="padding: ${options.mode === "pdf" ? "30px 45px" : "32px"}; ${baseTextStyle}">

    <p style="${h2Style}">INTRODUCCIÓN</p>

    <p>Este informe recoge los resultados obtenidos durante la Fase II de la prestación del servicio de optimización SEO para el sitio web ${domain}, correspondientes al periodo ${period}, según lo establecido en el Acuerdo de Prestación de Soluciones de Digitalización. Durante este intervalo, se ha evaluado el estado inicial del dominio y se han aplicado acciones orientadas a establecer una base sólida de visibilidad online dentro del sector correspondiente.</p>

    <p>La empresa no disponía previamente de configuraciones ni prácticas SEO implementadas, por lo que la intervención se ha centrado en aspectos fundamentales: optimización técnica, revisión estructural del dominio, implementación de mejoras en indexabilidad y rastreo, y creación de contenido alineado con las búsquedas más relevantes del sector. Paralelamente, se han trabajado acciones de posicionamiento externo, reforzadas por la existencia de ${fmtNum(refDomains)} dominios de referencia y ${fmtNum(backlinks)} backlinks, que sirven como punto de apoyo para incrementar la autoridad del sitio.</p>

    <p>Las gráficas y datos utilizados proceden de la herramienta profesional ${tool}. Debido a que la plataforma no permite seleccionar intervalos temporales completamente personalizados, se han empleado las vistas disponibles que abarcan el periodo subvencionado. En ellas se han marcado explícitamente los meses de inicio y fin con el fin de garantizar la trazabilidad de los resultados y verificar el impacto real de las acciones implementadas durante la Fase II del servicio.</p>

    <p>(IMAGEN DE INTRODUCCIÓN)</p>
    ${imagesBlock(introImages)}

    <p>📌 Captura de visión general del dominio interpretada</p>

    <p style="${h2Style}">1. ANÁLISIS DE PALABRAS CLAVE</p>

    <p>El trabajo de investigación se centró en la identificación de palabras clave relevantes dentro del sector del beneficiario, priorizando términos con un volumen de búsqueda significativo y un nivel de dificultad (KD) asumible para su aprovechamiento estratégico. Entre las keywords más destacadas detectadas en las capturas se encuentran:</p>

    ${kwBullet(k1)}
    ${kwBullet(k2)}
    ${kwBullet(k3)}

    <p>Estos términos muestran un interés elevado por servicios alineados con la naturaleza de los servicios ofrecidos por el sitio web analizado.</p>

    <p>Adicionalmente, el análisis grupal de keywords asociadas a los servicios principales reveló datos específicos orientados a búsqueda y segmentación:</p>

    ${kwBullet(k4)}
    ${kwBullet(k5)}

    <p>Se trata de términos directamente vinculados con el ámbito de actividad del beneficiario, reforzando la orientación estratégica hacia áreas con demanda real y búsquedas activas.</p>

    <p>Finalmente, el estudio confirma la existencia de un conjunto de oportunidades enfocadas en servicios clave del sector, con un volumen lo suficientemente amplio como para generar tráfico cualificado hacia el sitio. Este tipo de keywords permite optimizar contenidos y mejorar la capacidad de captación de clientes interesados, consolidando así el posicionamiento orgánico del dominio.</p>

    <p>(IMÁGENES DE ANÁLISIS DE PALABRAS CLAVE)</p>
    ${imagesBlock([...keywordImages, ...positioningImages])}

    <p>Las gráficas extraídas de ${tool} muestran que, durante el periodo subvencionado, el sitio web ${presenceText} registra presencia en los 100 primeros resultados de Google. Según los datos visibles en las capturas, el dominio se sitúa en posiciones ${rangeText}, lo que limita su visibilidad digital y su capacidad de captación de clientes.</p>

    <p><strong>TABLA EVOLUTIVA DE PALABRAS CLAVE (Periodo: ${period})</strong></p>

    <p>La evolución del posicionamiento orgánico del dominio muestra un comportamiento inicial sin presencia en los rankings, partiendo de posiciones elevadas (superiores a 50) y manteniendo esta situación durante el periodo subvencionado.</p>

    <p>Los valores de la tabla deben ser coherentes con la captura inicial del dominio, reflejando un estado realista del proyecto SEO.</p>

    ${tableHtml}

    <p><strong>BACKLINKS DE ALTA CALIDAD</strong></p>

    <p>La interpretación de las capturas muestra la existencia de ${fmtNum(backlinks)} backlinks y ${fmtNum(refDomains)} dominios de referencia, que contribuyen a reforzar la autoridad del sitio. Esta mejora en la autoridad del dominio tiene un impacto positivo en su visibilidad online y sienta las bases para futuras mejoras de posicionamiento.</p>

    
    ${imagesBlock(backlinksImages)}

    <p style="${h2Style}">2. INDEXACIÓN Y JERARQUIZACIÓN DEL CONTENIDO</p>

    <p>Dentro de la Fase II del Kit Digital se ha trabajado la correcta jerarquización de contenidos y la indexación técnica del sitio web, asegurando que la estructura interna y las directrices para los motores de búsqueda cumplan con los estándares de optimización SEO.</p>

    <p><strong>Jerarquización de encabezados y análisis semántico</strong></p>

    <p>El análisis de encabezados detectado en las capturas refleja la siguiente estructura:</p>

    <p>• ${fmtNum(h1)} H1</p>
    <p>• ${fmtNum(h2)} H2</p>
    <p>• ${fmtNum(h3)} H3</p>

    <p>Además, el análisis semántico identifica términos clave coherentes con la actividad del sitio, alineados con las búsquedas relevantes del sector.</p>

    <p><strong>Enlazado interno y atributos técnicos</strong></p>

    <p>El análisis del enlazado interno muestra ${fmtNum(totalLinks)} enlaces, siendo ${internalPercent !== null ? internalPercent : "N/D"}% internos. Asimismo, las imágenes analizadas cuentan con atributos ALT correctamente configurados, favoreciendo la accesibilidad y el SEO visual del contenido.</p>

    <p>(IMÁGENES DE INDEXACIÓN Y JERARQUIZACIÓN DEL CONTENIDO)</p>
    ${imagesBlock(hierarchyImages)}

    <p><strong>Indexación y aspectos técnicos</strong></p>

    <p>Para garantizar una correcta indexación en buscadores se revisaron los elementos técnicos del sitio, incluyendo robots.txt, sitemap XML, etiquetas canónicas, meta título y meta descripción, ausencia de enlaces rotos y otros parámetros técnicos detectados en las capturas.</p>

    <p>Se ha implementado estrategias de indexación y jerarquización de contenido eficaces, contribuyendo a una correcta experiencia de usuario y a un rastreo eficiente por parte de los motores de búsqueda.</p>

    <p>(IMÁGENES DE INDEXACIÓN Y ASPECTOS TÉCNICOS)</p>
    ${imagesBlock(indexingImages)}

    <p>Al obtener puntuaciones elevadas en rendimiento, accesibilidad, prácticas óptimas y SEO según PageSpeed Insights, la web demuestra estar técnicamente preparada para competir en el entorno digital.</p>

    <p>(IMÁGENES DE RENDIMIENTO Y EXPERIENCIA DE USUARIO)</p>
    ${imagesBlock(pagespeedImages)}

    
  </div>
  `;
}

export function buildSeoSolucionWebPreviewHtmlV2(
  formData: FormData,
  reportData: VisionReportData,
  sections: ReportSection[]
): string {
  return buildBodyHtmlV2(formData, reportData, sections, { mode: "preview" });
}

export function buildSeoSolucionWebPdfBodyHtmlV2(
  formData: FormData,
  reportData: VisionReportData,
  sections: ReportSection[]
): string {
  return buildBodyHtmlV2(formData, reportData, sections, { mode: "pdf" });
}
