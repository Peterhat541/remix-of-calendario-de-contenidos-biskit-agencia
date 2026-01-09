/**
 * PDF Generator for Informe Trimestral de Seguimiento del SEO (eCommerce)
 * Fase II – Presencia Avanzada en Internet
 *
 * Plantilla textual exacta del PDF de referencia
 */

import html2pdf from "html2pdf.js";
import { EcommerceFormData, EcommerceSection, EcommerceReportData } from "@/types/ecommerceReport";

function formatDateSpanish(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return date.toLocaleDateString("es-ES", options);
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);
}

function fmtNum(val: number | null | undefined, suffix = ""): string {
  if (val === null || val === undefined) return "[N/D]";
  return val.toLocaleString("es-ES") + suffix;
}

function extractTemplateData(formData: EcommerceFormData, reportData: EcommerceReportData | null) {
  const period = reportData?.detectedPeriod;
  const main = reportData?.mainDomain;
  const idx = reportData?.indexation;
  const seo = reportData?.seoOnPage;
  const tech = reportData?.technicalSeo;
  const kw = reportData?.keywords;

  return {
    URL: formData.websiteUrl || "[URL]",
    BENEFICIARIO: formData.beneficiaryName || "[BENEFICIARIO]",
    FECHA_INFORME: formatDateSpanish(formData.reportDate),
    SERVICIO_INICIO: formData.serviceStart || "[FECHA_INICIO]",
    SERVICIO_FIN: formData.serviceEnd || "[FECHA_FIN]",
    MES_INICIO: period?.start || "[MES_INICIO]",
    MES_FIN: period?.end || "[MES_FIN]",
    DOMINIO: main?.domain || formData.websiteUrl?.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "") || "[DOMINIO]",
    AUTHORITY_SCORE: fmtNum(main?.authorityScore),
    TRAFICO_ORGANICO: fmtNum(main?.organicTraffic),
    NUM_KEYWORDS: fmtNum(main?.organicKeywords),
    NUM_BACKLINKS: fmtNum(main?.backlinks),
    DOMINIOS_REFERENCIA: fmtNum(main?.refDomains),
    TRAFICO_PAGO: fmtNum(main?.paidTraffic),
    CUOTA_TRAFICO: main?.trafficShare || "[N/D]",
    TITLE_TAG: idx?.titleTag || "[TITLE]",
    TITLE_LENGTH: fmtNum(idx?.titleLength),
    META_DESCRIPTION: idx?.metaDescription || "[META_DESCRIPTION]",
    META_LENGTH: fmtNum(idx?.metaDescriptionLength),
    H1: idx?.h1 || "[H1]",
    H2_LIST: idx?.h2List?.join(", ") || "[H2s]",
    H3_LIST: idx?.h3List?.join(", ") || "[H3s]",
    TOTAL_LINKS: fmtNum(seo?.totalLinks),
    INTERNAL_PERCENT: fmtNum(seo?.internalLinksPercent, " %"),
    EXTERNAL_FOLLOW_PERCENT: fmtNum(seo?.externalFollowPercent, " %"),
    EXTERNAL_NOFOLLOW_PERCENT: fmtNum(seo?.externalNofollowPercent, " %"),
    ROBOTS_TXT: tech?.robotsTxt ? "activo y correctamente configurado" : "no detectado",
    SITEMAP_XML: tech?.sitemapXml || "no detectado",
    CANONICAL: tech?.canonical || "[CANONICAL]",
    ROBOTS_META: tech?.robotsMeta || "index, follow",
    BROKEN_LINKS: tech?.brokenLinks === 0 ? "No se encontraron enlaces rotos" : `${tech?.brokenLinks} enlaces rotos`,
    KW_SUMMARY: kw?.summary || "",
  };
}

function createCoverPage(formData: EcommerceFormData, reportData: EcommerceReportData | null): string {
  const data = extractTemplateData(formData, reportData);

  return `
    <div style="min-height: 100vh; padding: 50px; page-break-after: always; font-family: 'Segoe UI', Arial, sans-serif; color: #111827; display: flex; flex-direction: column;">
      <div style="text-align: center; margin-bottom: 50px; padding-top: 80px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">
          INFORME TRIMESTRAL DE SEGUIMIENTO DEL SEO
        </h1>
      </div>
      <div style="margin-top: 40px; font-size: 13px; line-height: 2;">
        <p style="margin: 0 0 8px 0;"><strong>Nombre del Beneficiario:</strong> ${data.BENEFICIARIO}</p>
        <p style="margin: 0 0 8px 0;"><strong>E-commerce:</strong> ${data.URL}</p>
        <p style="margin: 0 0 8px 0;"><strong>Fecha de prestación del servicio:</strong> ${data.SERVICIO_INICIO} al ${data.SERVICIO_FIN}</p>
        <p style="margin: 0 0 8px 0;"><strong>Período analizado:</strong> ${data.MES_INICIO} a ${data.MES_FIN}</p>
        <p style="margin: 0;"><strong>Fecha del Informe:</strong> ${data.FECHA_INFORME}</p>
      </div>
    </div>
  `;
}

function createKeywordsSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): string {
  const kw = reportData?.keywords;
  const keywordsSection = sections.find(s => s.id === "keywords");
  const imagesHtml = keywordsSection?.images?.map(img => `
    <div style="margin: 15px 0; text-align: center;">
      <img src="${img.src}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;" />
    </div>
  `).join("") || "";

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h2 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
        Informe SEO ON-PAGE
      </h2>
      <h3 style="font-size: 14px; font-weight: 600; margin: 20px 0 12px 0;">1. Análisis de palabras clave</h3>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        En este informe trimestral de SEO para ${reportData?.mainDomain?.domain || "[DOMINIO]"} se presenta un análisis meticuloso de las mejoras implementadas y los resultados obtenidos en el posicionamiento del sitio mediante estrategias de optimización de motores de búsqueda. Hemos identificado un conjunto de palabras clave estratégicamente seleccionadas que son cruciales para atraer tráfico relevante al sitio.
      </p>
      ${kw?.summary ? `<p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">${kw.summary}</p>` : ""}
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        Estas palabras clave no solo son altamente pertinentes para el mercado objetivo, sino que también han demostrado ser efectivas para generar un tráfico mensual significativo. La implementación de estas palabras clave en el contenido del sitio ha sido fundamental para mejorar el alcance y la visibilidad del dominio en búsquedas específicas relacionadas con sus servicios, contribuyendo notablemente al crecimiento en la visibilidad online de la empresa.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify;">
        Este enfoque estratégico ha permitido posicionar al dominio de manera más competitiva en el mercado con palabras claves, destacando su compromiso con la excelencia y la innovación en su ámbito.
      </p>
      ${imagesHtml}
    </div>
  `;
}

function createCompetenciaSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): string {
  const main = reportData?.mainDomain;
  const competenciaSection = sections.find(s => s.id === "competencia");
  const imagesHtml = competenciaSection?.images?.map(img => `
    <div style="margin: 15px 0; text-align: center;">
      <img src="${img.src}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;" />
    </div>
  `).join("") || "";

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">2. Análisis de la competencia</h3>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        El sitio web ${main?.domain || "[DOMINIO]"} mantiene actualmente una presencia digital ${main?.organicTraffic && main.organicTraffic > 100 ? "activa" : "limitada"}, con un Authority Score de ${main?.authorityScore || "[N/D]"}, un volumen de ${main?.organicTraffic || "[N/D]"} visitas orgánicas mensuales y un total de ${main?.organicKeywords || "[N/D]"} palabras clave posicionadas, lo que refleja un nivel ${main?.organicKeywords && main.organicKeywords > 50 ? "consolidado" : "inicial"} de visibilidad en buscadores. ${main?.paidTraffic === 0 ? "Aunque no registra tráfico de pago, el" : "El"} dominio cuenta con ${main?.backlinks || "[N/D]"} backlinks procedentes de ${main?.refDomains || "[N/D]"} dominios de referencia, un dato positivo que contribuye a fortalecer la autoridad del sitio.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify;">
        Respecto al comportamiento del tráfico a lo largo del tiempo, la gráfica mensual revela picos de crecimiento muy concretos, seguidos de períodos de estabilización.
      </p>
      ${imagesHtml}
    </div>
  `;
}

function createCompetidoresSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): string {
  const main = reportData?.mainDomain;
  const competitors = reportData?.competitors || [];
  const comparativaSection = sections.find(s => s.id === "competencia-comparativa");
  const traficoSection = sections.find(s => s.id === "trafico-organico");
  
  const comparativaImages = comparativaSection?.images?.map(img => `
    <div style="margin: 15px 0; text-align: center;">
      <img src="${img.src}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;" />
    </div>
  `).join("") || "";

  const traficoImages = traficoSection?.images?.map(img => `
    <div style="margin: 15px 0; text-align: center;">
      <img src="${img.src}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;" />
    </div>
  `).join("") || "";

  const competitorsList = competitors.slice(0, 3).map(c => 
    `${c.domain} (Authority Score ${c.authorityScore || "N/D"}; ${c.organicTraffic || "N/D"} visitas orgánicas; ${c.organicKeywords || "N/D"} keywords)`
  ).join(", ");

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">2.1 Análisis de la competencia frente a sus competidores</h3>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        En el último trimestre, ${main?.domain || "[DOMINIO]"} mantiene un rendimiento ${main?.organicTraffic && main.organicTraffic > 100 ? "estable" : "limitado"} frente a sus principales competidores del sector. Con un Authority Score de ${main?.authorityScore || "[N/D]"}, un tráfico orgánico de ${main?.organicTraffic || "[N/D]"} visitas mensuales y ${main?.organicKeywords || "[N/D]"} palabras clave posicionadas${competitors.length > 0 ? `, el dominio se compara con competidores como ${competitorsList}` : ""}.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify;">
        El sitio cuenta con ${main?.backlinks || "[N/D]"} backlinks procedentes de ${main?.refDomains || "[N/D]"} dominios de referencia, lo que representa una base ${main?.refDomains && main.refDomains > 50 ? "sólida" : "aceptable"} para su crecimiento futuro.
      </p>
      ${comparativaImages}
      ${traficoImages}
    </div>
  `;
}

function createIndexacionSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): string {
  const idx = reportData?.indexation;
  const indexacionSection = sections.find(s => s.id === "indexacion");
  const imagesHtml = indexacionSection?.images?.map(img => `
    <div style="margin: 15px 0; text-align: center;">
      <img src="${img.src}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;" />
    </div>
  `).join("") || "";

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">3. Indexación y jerarquización del contenido</h3>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        La revisión del sitio muestra una configuración SEO on-page adecuada, con una etiqueta de título optimizada —"${idx?.titleTag || "[TITLE]"}"— que cumple con la longitud recomendada (${idx?.titleLength || "[N/D]"} caracteres) y refleja de forma clara la actividad principal de la empresa.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        La meta descripción, por su parte, ofrece un mensaje completo y descriptivo —"${idx?.metaDescription || "[META_DESCRIPTION]"}"— que aporta información relevante para los motores de búsqueda y para los usuarios (${idx?.metaDescriptionLength || "[N/D]"} caracteres). Ambos elementos presentan una estructura coherente, profesional y orientada a mejorar la indexación, sentando una base sólida para el posicionamiento orgánico del dominio.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify;">
        En cuanto a la jerarquía de encabezados, el sitio presenta una estructura clara con un H1 que introduce la propuesta principal: "${idx?.h1 || "[H1]"}". Los H2 organizan los bloques de contenido más importantes${idx?.h2List && idx.h2List.length > 0 ? `: ${idx.h2List.slice(0, 5).join(", ")}` : ""}.
      </p>
      ${imagesHtml}
    </div>
  `;
}

function createSeoOnPageSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): string {
  const seo = reportData?.seoOnPage;
  const seoSection = sections.find(s => s.id === "seo-onpage");
  const imagesHtml = seoSection?.images?.map(img => `
    <div style="margin: 15px 0; text-align: center;">
      <img src="${img.src}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;" />
    </div>
  `).join("") || "";

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Análisis SEO On-Page</h3>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        Como parte del análisis SEO on-page, la revisión de la estructura de enlaces muestra un total de ${seo?.totalLinks || "[N/D]"} enlaces, con una clara predominancia de enlaces internos, que representan el ${seo?.internalLinksPercent || "[N/D]"} % del total. Esta distribución indica una arquitectura bien enlazada, donde las diferentes secciones del sitio se conectan entre sí de manera coherente. Este enfoque favorece la navegación del usuario, facilita el rastreo por parte de los motores de búsqueda y contribuye a una correcta transmisión de autoridad interna.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify;">
        Además, el análisis detecta un ${seo?.externalFollowPercent || "[N/D]"} % de enlaces externos follow y ${seo?.externalNofollowPercent || "0"} % de enlaces nofollow, lo que sugiere un uso puntual de recursos externos. La ausencia de enlaces rotos y la proporción equilibrada entre enlaces internos y externos reflejan una estructura estable y funcional.
      </p>
      ${imagesHtml}
    </div>
  `;
}

function createAccesibilidadSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): string {
  const tech = reportData?.technicalSeo;
  const accSection = sections.find(s => s.id === "accesibilidad");
  const imagesHtml = accSection?.images?.map(img => `
    <div style="margin: 15px 0; text-align: center;">
      <img src="${img.src}" style="max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;" />
    </div>
  `).join("") || "";

  const hreflangList = tech?.hreflangTags?.map(h => `${h.url} (${h.lang})`).join(", ") || "No detectadas";

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Evaluación de la Indexación y Accesibilidad del Sitio</h3>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        Para evaluar la correcta indexación del sitio y su accesibilidad para los motores de búsqueda, se ha llevado a cabo un análisis técnico de los elementos esenciales que influyen en el rastreo y la lectura del contenido. Los resultados muestran una configuración sólida y bien alineada con las prácticas recomendadas de SEO técnico.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        <strong>Resolver URL:</strong> Se confirma que todas las versiones del dominio —con y sin www, tanto en http como en https— redirigen correctamente hacia la misma URL final en HTTPS. Este comportamiento unificado evita la duplicidad de versiones y concentra la autoridad en un único punto.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        <strong>Robots.txt:</strong> El archivo robots.txt se encuentra ${tech?.robotsTxt ? "activo y accesible" : "no detectado"}, permitiendo el rastreo del contenido relevante del sitio.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        <strong>Sitemap XML:</strong> ${tech?.sitemapXml ? `Disponible en ${tech.sitemapXml}` : "No detectado"}, lo que facilita la localización, rastreo e indexación ordenada de todas las secciones del dominio.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        <strong>Etiqueta canónica:</strong> ${tech?.canonical || "Correctamente definida"}.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify; margin-bottom: 15px;">
        <strong>Etiquetas Hreflang:</strong> ${hreflangList}.
      </p>
      <p style="font-size: 12px; line-height: 1.8; text-align: justify;">
        <strong>Enlaces rotos:</strong> ${tech?.brokenLinks === 0 ? "No se encontraron enlaces rotos en esta web." : `Se detectaron ${tech?.brokenLinks} enlaces rotos.`}
      </p>
      ${imagesHtml}
    </div>
  `;
}

export async function generateEcommercePDF(
  formData: EcommerceFormData,
  reportData: EcommerceReportData | null,
  sections: EcommerceSection[]
): Promise<{ blob: Blob; filename: string }> {
  const html = `
    <div id="ecommerce-report">
      ${createCoverPage(formData, reportData)}
      ${createKeywordsSection(reportData, sections)}
      ${createCompetenciaSection(reportData, sections)}
      ${createCompetidoresSection(reportData, sections)}
      ${createIndexacionSection(reportData, sections)}
      ${createSeoOnPageSection(reportData, sections)}
      ${createAccesibilidadSection(reportData, sections)}
    </div>
  `;

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  // Wait for images to load
  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => {
              img.style.display = "none";
              resolve();
            };
          }
        })
    )
  );

  const options = {
    margin: 0,
    filename: `Informe_Trimestral_SEO_${sanitizeFilename(formData.beneficiaryName)}.pdf`,
    image: { type: "jpeg" as const, quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    pagebreak: { mode: ["css", "legacy"] as const, before: ".page-break-before" },
  };

  const blob = await html2pdf().set(options).from(container).outputPdf("blob") as Blob;
  document.body.removeChild(container);

  return { blob, filename: options.filename };
}
