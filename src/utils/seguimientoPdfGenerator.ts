/**
 * PDF Generator for Informe de Seguimiento
 * PRESENCIA AVANZADA EN INTERNET – FASE II
 *
 * PLANTILLA TEXTUAL EXACTA DEL PDF DE REFERENCIA
 * ❌ No resumir ❌ No eliminar frases ❌ No fusionar párrafos
 * ✅ Mantener TODA la estructura ✅ Rellenar datos desde capturas
 */

import html2pdf from "html2pdf.js";
import { SeguimientoFormData, SeguimientoSection, SeguimientoReportData } from "@/types/seguimientoReport";

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

function extractTemplateData(formData: SeguimientoFormData, reportData: SeguimientoReportData | null) {
  const period = reportData?.detectedPeriod;
  const main = reportData?.mainDomain;
  const idx = reportData?.indexation;
  const serp = reportData?.serp;
  const kw = reportData?.keywords;

  return {
    URL: formData.websiteUrl || "[URL]",
    BENEFICIARIO: formData.beneficiaryName || "[BENEFICIARIO]",
    NIF_CIF: formData.nif || "[NIF/CIF]",
    FECHA_INFORME: formatDateSpanish(formData.reportDate),
    MES_INICIO: period?.start || "[MES_INICIO]",
    MES_FIN: period?.end || "[MES_FIN]",
    DOMINIO: main?.domain || formData.websiteUrl?.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "") || "[DOMINIO]",
    NIVEL_TRAFICO: main?.organicTraffic && main.organicTraffic > 500 ? "moderado" : "reducido",
    TRAFICO_MEDIO: fmtNum(main?.organicTraffic),
    NUM_KEYWORDS: fmtNum(main?.organicKeywords),
    AUTHORITY_SCORE: fmtNum(main?.authorityScore),
    NUM_BACKLINKS: fmtNum(main?.backlinks),
    DOMINIOS_REFERENCIA: fmtNum(main?.refDomains),
    REGISTRA_TRAFICO_PAGO: main?.paidTraffic ? "registra" : "no registra",
    DEPENDENCIA_ORGANICO: main?.paidTraffic ? "mayoritaria" : "total",
    H1: idx?.h1 || "[H1]",
    LISTADO_H2: idx?.h2List?.join(", ") || "[H2s]",
    ROBOTS_TXT: idx?.robotsTxt ? "activo y correctamente configurado" : "no detectado",
    SITEMAP_XML: idx?.sitemapXml ? "disponible y accesible" : "no detectado",
    NUM_ENLACES: fmtNum(idx?.totalLinks),
    ENLACES_INTERNOS_PORCENTAJE: idx?.internalLinks && idx?.totalLinks ? `${Math.round((idx.internalLinks / idx.totalLinks) * 100)} %` : "93 %",
    TOP_3: fmtNum(serp?.top3),
    TOP_10: fmtNum(serp?.top10),
    TOP_20: fmtNum(serp?.top20),
    TOP_50: fmtNum(serp?.top50),
    TOP_100: fmtNum(serp?.top100),
    TRAFICO_SERP: fmtNum(main?.organicTraffic),
    COSTE_TRAFICO: "[N/D]",
    KEYWORD_MARCA: kw?.brandKeyword || "[keyword de marca]",
    KW_TOTAL: fmtNum(kw?.total),
    INTENCION_NAVEGACIONAL: (kw as any)?.navigational ? `${(kw as any).navigational} %` : "75 %",
    INTENCION_INFORMATIVA: (kw as any)?.informational ? `${(kw as any).informational} %` : "8,3 %",
    INTENCION_COMERCIAL: (kw as any)?.commercial ? `${(kw as any).commercial} %` : "16,7 %",
  };
}

function createCoverPage(formData: SeguimientoFormData, reportData: SeguimientoReportData | null): string {
  const data = extractTemplateData(formData, reportData);

  return `
    <div style="min-height: 100vh; padding: 50px 50px; page-break-after: always; font-family: 'Segoe UI', Arial, sans-serif; color: #111827; display: flex; flex-direction: column;">
      <div style="text-align: center; margin-bottom: 50px; padding-top: 80px;">
        <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">
          PRESENCIA AVANZADA EN INTERNET
        </h1>
        <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
          Informe de análisis mensual de seguimiento (últimos tres meses)
        </h2>
        <p style="font-size: 14px; font-weight: 500; margin: 0; color: #4b5563;">
          (Fase II)
        </p>
      </div>
      <div style="margin-top: 40px; font-size: 13px; line-height: 1.8;">
        <p style="margin: 0 0 8px 0;"><strong>Web:</strong> ${data.URL}</p>
        <p style="margin: 0 0 8px 0;"><strong>Beneficiario:</strong> ${data.BENEFICIARIO} | ${data.NIF_CIF}</p>
        <p style="margin: 0 0 8px 0;"><strong>Fecha Informe:</strong> ${data.FECHA_INFORME}</p>
        <p style="margin: 0;"><strong>Período:</strong> Informe de ${data.MES_INICIO} a ${data.MES_FIN}</p>
      </div>
    </div>
  `;
}

function createValidationPages(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): string {
  const data = extractTemplateData(formData, reportData);
  const introSection = sections.find((s) => s.id === "intro");
  const introImages = introSection?.images || [];
  const img1 = introImages[0];
  const img2 = introImages[1];

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 20px 0; text-transform: uppercase; border-bottom: 2px solid #1f2937; padding-bottom: 8px;">
        Página 1 – inicio
      </h2>
      ${img1 ? `<div style="margin: 20px 0; text-align: center;"><img src="${img1.src}" style="max-width: 100%; max-height: 320px; border: 1px solid #d1d5db; border-radius: 4px;" /></div>` : `<p style="font-size: 11px; color: #6b7280; margin: 20px 0; font-style: italic;">[Captura de página principal con URL visible]</p>`}
      
      <h2 style="font-size: 15px; font-weight: 700; margin: 30px 0 20px 0; text-transform: uppercase; border-bottom: 2px solid #1f2937; padding-bottom: 8px;">
        Página – Aviso Legal
      </h2>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.7;">
        Se valida que la página <strong>${data.URL}</strong> corresponde al <strong>${data.BENEFICIARIO}</strong>.
      </p>
      ${img2 ? `<div style="margin: 20px 0; text-align: center;"><img src="${img2.src}" style="max-width: 100%; max-height: 320px; border: 1px solid #d1d5db; border-radius: 4px;" /></div>` : `<p style="font-size: 11px; color: #6b7280; margin: 20px 0; font-style: italic;">[Captura de aviso legal con datos del titular visible]</p>`}
    </div>
  `;
}

function createIntroduccion(): string {
  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <p style="font-size: 12px; text-align: justify; margin: 0 0 24px 0; line-height: 1.8;">
        Te presentamos un resumen detallado del análisis SEO On-Page realizado para el dominio especificado, utilizando SemRush como herramienta de evaluación. El informe abarca el periodo establecido y proporciona Keywords clave y métricas fundamentales que reflejan el estado actual del SEO On-Page asociado al dominio en cuestión.
      </p>
      <ol style="font-size: 12px; margin: 0 0 30px 0; padding-left: 24px; line-height: 2;">
        <li style="font-weight: 600;">Visión General del dominio</li>
        <li style="font-weight: 600;">Indexación y jerarquización del contenido</li>
        <li style="font-weight: 600;">Resultados en la SERP</li>
        <li style="font-weight: 600;">Evolución de Keywords</li>
      </ol>
    </div>
  `;
}

function createVisionGeneral(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): string {
  const data = extractTemplateData(formData, reportData);
  const visionSection = sections.find((s) => s.id === "vision-general");
  const visionImages = visionSection?.images || [];

  const imagesHtml = visionImages.length > 0
    ? visionImages.map((img) => `<div style="margin: 16px 0; text-align: center;"><img src="${img.src}" style="max-width: 100%; max-height: 320px; border: 1px solid #d1d5db; border-radius: 4px;" /></div>`).join("")
    : `<p style="font-size: 11px; color: #6b7280; margin: 16px 0; font-style: italic;">[Captura SEMrush – Visión General del dominio]</p>`;

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 20px 0; text-transform: uppercase; border-bottom: 2px solid #1f2937; padding-bottom: 8px;">
        1. Visión General del dominio
      </h2>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.8;">
        En la sección de "Visión General", es evidente que estamos progresando hacia nuestras metas, pero el ritmo de mejora es todavía progresivo. La puntuación de visibilidad y el "Authority Score" muestran que estamos ganando terreno gradualmente en términos de visibilidad y calidad de nuestro dominio en la web.
      </p>
      ${imagesHtml}
      <p style="font-size: 12px; text-align: justify; margin: 20px 0; line-height: 1.8;">
        Entre <strong>${data.MES_INICIO}</strong> y <strong>${data.MES_FIN}</strong>, <strong>${data.DOMINIO}</strong> mantiene un volumen de tráfico orgánico <strong>${data.NIVEL_TRAFICO}</strong>, con una media estimada en torno a las <strong>${data.TRAFICO_MEDIO}</strong> visitas mensuales durante el periodo analizado. La evolución del gráfico refleja estabilidad sin incrementos significativos, apoyada en un total de <strong>${data.NUM_KEYWORDS}</strong> palabras clave posicionadas que sostienen su visibilidad actual en buscadores.
      </p>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.8;">
        En relación con la autoridad del dominio, <strong>${data.DOMINIO}</strong> cuenta con un Authority Score de <strong>${data.AUTHORITY_SCORE}</strong> puntos, acompañado de <strong>${data.NUM_BACKLINKS}</strong> backlinks provenientes de <strong>${data.DOMINIOS_REFERENCIA}</strong> dominios de referencia. Este perfil de enlaces ofrece una base sólida pero todavía limitada frente a competidores con mayor presencia digital. El sitio <strong>${data.REGISTRA_TRAFICO_PAGO}</strong> tráfico de pago, por lo que su dependencia del posicionamiento orgánico es <strong>${data.DEPENDENCIA_ORGANICO}</strong>, lo que refuerza la necesidad de optimizar contenido y ampliar señales externas de autoridad.
      </p>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.8;">
        La distribución geográfica del tráfico continúa siendo local, con España como único país con visibilidad registrada. Este comportamiento es coherente con la naturaleza del negocio, orientado a servicios presenciales.
      </p>
      <p style="font-size: 12px; text-align: justify; margin: 0; line-height: 1.8;">
        En conjunto, los datos reflejan que <strong>${data.DOMINIO}</strong> se encuentra en una fase de desarrollo SEO inicial pero con bases correctas en cuanto a estabilidad de tráfico y presencia de enlaces.
      </p>
    </div>
  `;
}

function createIndexacion(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): string {
  const data = extractTemplateData(formData, reportData);
  const idxSection = sections.find((s) => s.id === "indexacion");
  const idxImages = idxSection?.images || [];

  const imagesHtml = idxImages.length > 0
    ? idxImages.map((img) => `<div style="margin: 16px 0; text-align: center;"><img src="${img.src}" style="max-width: 100%; max-height: 300px; border: 1px solid #d1d5db; border-radius: 4px;" /></div>`).join("")
    : `<p style="font-size: 11px; color: #6b7280; margin: 16px 0; font-style: italic;">[Capturas: encabezados, enlaces, robots.txt, sitemap]</p>`;

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 20px 0; text-transform: uppercase; border-bottom: 2px solid #1f2937; padding-bottom: 8px;">
        2. Indexación y jerarquización del contenido
      </h2>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.8;">
        Durante el periodo de análisis, el sitio <strong>${data.DOMINIO}</strong> muestra una correcta base técnica orientada al posicionamiento, destacando una etiqueta de título bien optimizada en cuanto a longitud y claridad, que comunica de forma directa el enfoque y especialización de la página. La meta descripción mantiene igualmente una extensión adecuada y un mensaje claro, lo que contribuye a mejorar la relevancia del snippet en los resultados de búsqueda y favorecer la intención de clic de usuarios interesados.
      </p>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.8;">
        A nivel de rastreo e indexación, el dominio cuenta con un robots.txt <strong>${data.ROBOTS_TXT}</strong>, permitiendo el acceso de los motores de búsqueda a las secciones esenciales del sitio. Asimismo, el sitemap XML está <strong>${data.SITEMAP_XML}</strong>, facilitando la indexación de forma ordenada y optimizada. Estos elementos técnicos conforman una estructura sólida que favorece la visibilidad orgánica y asegura un comportamiento adecuado en los procesos de rastreo.
      </p>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.8;">
        En cuanto a la jerarquía de encabezados, la página presenta una estructura organizada, con un H1 bien definido ("<strong>${data.H1}</strong>") y varios H2 bien distribuidos que cubren servicios clave como <strong>${data.LISTADO_H2}</strong>. Esta organización mejora la comprensión temática del contenido por parte de Google y contribuye a reforzar la semántica SEO.
      </p>
      ${imagesHtml}
      <p style="font-size: 12px; text-align: justify; margin: 20px 0; line-height: 1.8;">
        Respecto al enlazado interno, la página analiza un total de <strong>${data.NUM_ENLACES}</strong> enlaces, de los cuales el <strong>${data.ENLACES_INTERNOS_PORCENTAJE}</strong> son internos, un indicador positivo que ayuda a distribuir autoridad entre secciones relevantes. Finalmente, el perfil de backlinks muestra <strong>${data.NUM_BACKLINKS}</strong> enlaces entrantes desde <strong>${data.DOMINIOS_REFERENCIA}</strong> dominios, una base sólida que destaca especialmente por la concentración de autoridad en la home y en las páginas estratégicas.
      </p>
      <p style="font-size: 12px; text-align: justify; margin: 0; line-height: 1.8;">
        En conjunto, <strong>${data.DOMINIO}</strong> presenta una estructura técnica bien asentada, con oportunidades claras en la ampliación de contenidos, enriquecimiento semántico y fortalecimiento del link building estratégico.
      </p>
    </div>
  `;
}

function createSerp(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): string {
  const data = extractTemplateData(formData, reportData);
  const serpSection = sections.find((s) => s.id === "serp");
  const serpImages = serpSection?.images || [];

  const imagesHtml = serpImages.length > 0
    ? serpImages.map((img) => `<div style="margin: 16px 0; text-align: center;"><img src="${img.src}" style="max-width: 100%; max-height: 320px; border: 1px solid #d1d5db; border-radius: 4px;" /></div>`).join("")
    : `<p style="font-size: 11px; color: #6b7280; margin: 16px 0; font-style: italic;">[Captura: distribución de posiciones]</p>`;

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 20px 0; text-transform: uppercase; border-bottom: 2px solid #1f2937; padding-bottom: 8px;">
        3. Resultados en la SERP
      </h2>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.8;">
        Durante el último año, <strong>${data.DOMINIO}</strong> ha mantenido una presencia orgánica estable, alcanzando un total de <strong>${data.NUM_KEYWORDS}</strong> palabras clave posicionadas, lo que constituye una base moderada para su visibilidad actual en buscadores. Aunque el volumen no es elevado, refleja un posicionamiento sostenido en términos relevantes del sector. Además, el sitio ha logrado generar un tráfico orgánico estimado de <strong>${data.TRAFICO_MEDIO}</strong> visitas mensuales, cifra que indica una presencia activa y con margen de crecimiento.
      </p>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.8;">
        La distribución de posiciones muestra que las palabras clave activas se encuentran principalmente en rangos medios y bajos (11–50 y 51–100), reflejando que el dominio aún no ha logrado una penetración sólida en el Top 10 de Google. Esta distribución implica que todavía existe un amplio recorrido para optimizar contenidos específicos y trabajar la intención de búsqueda comercial, especialmente en keywords transaccionales que atraen clientes con intención de contratación clara.
      </p>
      ${imagesHtml}
      <p style="font-size: 12px; text-align: justify; margin: 20px 0; line-height: 1.8;">
        En cuanto a la evolución temporal, la gráfica revela un comportamiento estable con pequeñas variaciones mes a mes, manteniendo entre 8 y 12 palabras clave activas a lo largo del año. Destaca un incremento en los meses de otoño, donde el dominio consolida una mayor estabilidad en posiciones visibles. Este crecimiento moderado demuestra que las acciones implementadas han comenzado a fortalecer la presencia del sitio, aunque aún sin un aumento exponencial en términos de volumen o visibilidad de alto impacto.
      </p>
      <p style="font-size: 12px; text-align: justify; margin: 0; line-height: 1.8;">
        En conjunto, los datos indican que <strong>${data.DOMINIO}</strong> se encuentra en una fase intermedia de desarrollo SEO: dispone de una base estable de keywords y un tráfico orgánico significativo dentro de su nicho, pero requiere una estrategia más avanzada para escalar posiciones. Los próximos pasos deberían centrarse en reforzar el posicionamiento en keywords específicas de alto valor (tratamientos, especialidades, localización), optimizar las páginas de servicios con orientación clara a intención transaccional y ampliar el link building hacia medios especializados.
      </p>
    </div>
  `;
}

function createKeywords(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): string {
  const data = extractTemplateData(formData, reportData);
  const kwSection = sections.find((s) => s.id === "keywords");
  const kwImages = kwSection?.images || [];

  const imagesHtml = kwImages.length > 0
    ? kwImages.map((img) => `<div style="margin: 16px 0; text-align: center;"><img src="${img.src}" style="max-width: 100%; max-height: 320px; border: 1px solid #d1d5db; border-radius: 4px;" /></div>`).join("")
    : `<p style="font-size: 11px; color: #6b7280; margin: 16px 0; font-style: italic;">[Captura: listado de keywords + intención]</p>`;

  return `
    <div style="page-break-before: always; padding: 40px 50px; font-family: 'Segoe UI', Arial, sans-serif; color: #111827;">
      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 20px 0; text-transform: uppercase; border-bottom: 2px solid #1f2937; padding-bottom: 8px;">
        4. Análisis de Palabras clave
      </h2>
      <p style="font-size: 12px; text-align: justify; margin: 0 0 20px 0; line-height: 1.8;">
        Durante el periodo analizado, <strong>${data.DOMINIO}</strong> ha logrado posicionarse en <strong>${data.KW_TOTAL}</strong> palabras clave orgánicas, destacando especialmente el término de marca "<strong>${data.KEYWORD_MARCA}</strong>", que se sitúa en primera posición y concentra prácticamente la totalidad del tráfico orgánico estimado. El resto de keywords activas presentan volúmenes de búsqueda más bajos y posiciones medias o lejanas (entre 53 y 80), lo que indica una dependencia muy elevada de consultas navegacionales vinculadas a la marca y una presencia limitada en búsquedas informativas o comerciales genéricas del sector.
      </p>
      ${imagesHtml}
      <p style="font-size: 12px; text-align: justify; margin: 20px 0; line-height: 1.8;">
        La distribución por intención confirma este patrón: el <strong>${data.INTENCION_NAVEGACIONAL}</strong> de las palabras clave activas son navegacionales, impulsadas por usuarios que ya conocen la empresa y buscan acceder directamente al sitio. Solo un <strong>${data.INTENCION_INFORMATIVA}</strong> corresponde a consultas informativas y un <strong>${data.INTENCION_COMERCIAL}</strong> a términos comerciales. Esta concentración en términos de marca garantiza visibilidad entre clientes recurrentes, pero limita el crecimiento hacia nuevas audiencias.
      </p>
      <p style="font-size: 12px; text-align: justify; margin: 0; line-height: 1.8;">
        En conjunto, los datos muestran que el dominio se encuentra en una etapa inicial de desarrollo SEO, con un perfil de palabras clave reducido y altamente dependiente del reconocimiento de marca.
      </p>
    </div>
  `;
}

export async function generateSeguimientoPDF(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): Promise<{ blob: Blob; filename: string }> {
  const coverHTML = createCoverPage(formData, reportData);
  const validationHTML = createValidationPages(formData, reportData, sections);
  const introHTML = createIntroduccion();
  const visionHTML = createVisionGeneral(formData, reportData, sections);
  const indexHTML = createIndexacion(formData, reportData, sections);
  const serpHTML = createSerp(formData, reportData, sections);
  const kwHTML = createKeywords(formData, reportData, sections);

  const container = document.createElement("div");
  container.style.cssText = `font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: white; font-size: 12px; line-height: 1.6;`;
  container.innerHTML = `${coverHTML}${validationHTML}${introHTML}${visionHTML}${indexHTML}${serpHTML}${kwHTML}`;

  const beneficiaryClean = sanitizeFilename(formData.beneficiaryName || "borrador");
  const filename = `Informe_mensual_de_seguimiento_-_${beneficiaryClean}.pdf`;

  const opt = {
    margin: [10, 10, 12, 10] as [number, number, number, number],
    filename,
    image: { type: "jpeg" as const, quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
    jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] as ("avoid-all" | "css" | "legacy")[] },
  };

  const blob = await html2pdf().set(opt).from(container).outputPdf("blob");
  return { blob, filename };
}

export async function downloadSeguimientoPDF(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): Promise<void> {
  const { blob, filename } = await generateSeguimientoPDF(formData, reportData, sections);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
