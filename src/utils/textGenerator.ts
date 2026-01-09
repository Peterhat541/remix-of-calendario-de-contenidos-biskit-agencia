import {
  FormData,
  ReportSection,
  KeywordAnalysisData,
  PositioningEvolutionData,
  KeywordTableData,
  BacklinksData,
  IndexingData,
  HierarchyData,
  PageSpeedData,
  ImageItem,
} from "@/types/report";
import { ExtractedImageData } from "@/types/imageAnalysis";
import { VisionReportData } from "@/types/visionReport";

// Global context for VisionReportData - set by generateAllSectionTexts
let _visionReportData: VisionReportData | null = null;

/**
 * Set the VisionReportData to use for text generation
 * This should be called before generating section texts
 */
export function setVisionReportData(data: VisionReportData | null): void {
  _visionReportData = data;
}

/**
 * Get the current VisionReportData
 */
export function getVisionReportData(): VisionReportData | null {
  return _visionReportData;
}

function formatDateSpanish(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getMonthYearSpanish(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Get all extracted data from section images (legacy - used as fallback)
function getExtractedFromImages(images: ImageItem[]): ExtractedImageData | null {
  for (const img of images) {
    if (img.extractedData) {
      return img.extractedData;
    }
  }
  return null;
}

// Merge extracted data from multiple images in a section (legacy - used as fallback)
function getAllExtractedFromImages(images: ImageItem[]): ExtractedImageData[] {
  const extracted: ExtractedImageData[] = [];
  for (const img of images) {
    if (img.extractedData) {
      extracted.push(img.extractedData);
    }
  }
  return extracted;
}

/**
 * TEXTO INTRODUCTORIO - Texto canónico obligatorio
 * Datos variables extraídos de capturas: dominio, periodo, ref_domains, backlinks, herramienta, meses inicio/fin
 */
export function generateIntroText(formData: FormData, images: ImageItem[] = []): string {
  const url = formData.websiteUrl || "[dominio detectado en la captura]";
  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const startDate = formatDateSpanish(formData.startDate);
  const endDate = formatDateSpanish(formData.endDate);
  const period = `${startDate} – ${endDate}`;
  
  // PRIORITY: Use VisionReportData if available, fallback to image extraction
  const visionData = getVisionReportData();
  const extracted = getExtractedFromImages(images);
  
  // Get backlinks data from VisionReportData first, then fallback
  const refDomains = visionData?.backlinks?.refDomainsCount ?? 
                     extracted?.metrics?.ref_domains ?? 
                     "[número detectado]";
  const backlinks = visionData?.backlinks?.backlinksCount ?? 
                    extracted?.metrics?.backlinks ?? 
                    "[número detectado]";
  const tool = extracted?.source_tool || "SEMrush";
  
  // Texto canónico EXACTO - solo se sustituyen los valores entre corchetes
  let text = `<p>Este informe recoge los resultados obtenidos durante la Fase II de la prestación del servicio de optimización SEO para el sitio web <strong>${domain}</strong>, correspondientes al periodo <strong>${period}</strong>, según lo establecido en el Acuerdo de Prestación de Soluciones de Digitalización. Durante este intervalo, se ha evaluado el estado inicial del dominio y se han aplicado acciones orientadas a establecer una base sólida de visibilidad online dentro del sector correspondiente.</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>La empresa no disponía previamente de configuraciones ni prácticas SEO implementadas, por lo que la intervención se ha centrado en aspectos fundamentales: optimización técnica, revisión estructural del dominio, implementación de mejoras en indexabilidad y rastreo, y creación de contenido alineado con las búsquedas más relevantes del sector. Paralelamente, se han trabajado acciones de posicionamiento externo, reforzadas por la existencia de <strong>${refDomains}</strong> dominios de referencia y <strong>${backlinks}</strong> backlinks, que sirven como punto de apoyo para incrementar la autoridad del sitio.</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>Las gráficas y datos utilizados proceden de la herramienta profesional <strong>${tool}</strong>. Debido a que la plataforma no permite seleccionar intervalos temporales completamente personalizados, se han empleado las vistas disponibles que abarcan el periodo subvencionado. En ellas se han marcado explícitamente los meses de inicio y fin con el fin de garantizar la trazabilidad de los resultados y verificar el impacto real de las acciones implementadas durante la Fase II del servicio.</p>`;

  return text;
}

/**
 * 1. ANÁLISIS DE PALABRAS CLAVE - Texto canónico obligatorio
 * Datos variables extraídos de capturas: keywords con volúmenes
 */
export function generateKeywordText(data: KeywordAnalysisData | undefined, formData: FormData, images: ImageItem[] = []): string {
  const allExtracted = getAllExtractedFromImages(images);
  const visionData = getVisionReportData();
  
  // PRIORITY: Use VisionReportData keywords if available
  const allKeywords: Array<{keyword: string, volume: number | null}> = [];
  
  if (visionData?.keywords && visionData.keywords.length > 0) {
    // Use VisionReportData keywords
    for (const kw of visionData.keywords) {
      allKeywords.push({ keyword: kw.keyword, volume: kw.volume });
    }
  } else {
    // Fallback: collect from image extractedData
    for (const ext of allExtracted) {
      if (ext.metrics.keyword_list) {
        allKeywords.push(...ext.metrics.keyword_list);
      }
    }
  }
  
  // Texto canónico EXACTO
  let text = `<p>El trabajo de investigación se centró en la identificación de palabras clave relevantes dentro del sector del beneficiario, priorizando términos con un volumen de búsqueda significativo y un nivel de dificultad (KD) asumible para su aprovechamiento estratégico. Entre las keywords más destacadas detectadas en las capturas se encuentran:</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  // Lista de keywords principales - extraídas de capturas
  if (allKeywords.length > 0) {
    text += `<ul>`;
    allKeywords.slice(0, 3).forEach(kw => {
      const volume = kw.volume !== null && kw.volume !== undefined 
        ? `${kw.volume.toLocaleString('es-ES')} búsquedas/mes`
        : "[volumen] búsquedas/mes";
      text += `<li><strong>${kw.keyword}</strong> – ${volume}</li>`;
    });
    text += `</ul>`;
  } else {
    text += `<ul>`;
    text += `<li><strong>[keyword detectada]</strong> – [volumen] búsquedas/mes</li>`;
    text += `<li><strong>[keyword detectada]</strong> – [volumen] búsquedas/mes</li>`;
    text += `<li><strong>[keyword detectada]</strong> – [volumen] búsquedas/mes</li>`;
    text += `</ul>`;
  }
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>Estos términos muestran un interés elevado por servicios alineados con la naturaleza de los servicios ofrecidos por el sitio web analizado.</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>Adicionalmente, el análisis grupal de keywords asociadas a los servicios principales reveló datos específicos orientados a búsqueda y segmentación:</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  // Keywords grupales - extraídas de capturas
  if (allKeywords.length > 3) {
    text += `<ul>`;
    allKeywords.slice(3, 5).forEach(kw => {
      const volume = kw.volume !== null && kw.volume !== undefined 
        ? `${kw.volume.toLocaleString('es-ES')} búsquedas/mes`
        : "[volumen] búsquedas/mes";
      text += `<li><strong>${kw.keyword}</strong> – ${volume}</li>`;
    });
    text += `</ul>`;
  } else {
    text += `<ul>`;
    text += `<li><strong>[keyword detectada]</strong> – [volumen] búsquedas/mes</li>`;
    text += `<li><strong>[keyword detectada]</strong> – [volumen] búsquedas/mes</li>`;
    text += `</ul>`;
  }
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>Se trata de términos directamente vinculados con el ámbito de actividad del beneficiario, reforzando la orientación estratégica hacia áreas con demanda real y búsquedas activas.</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>Finalmente, el estudio confirma la existencia de un conjunto de oportunidades enfocadas en servicios clave del sector, con un volumen lo suficientemente amplio como para generar tráfico cualificado hacia el sitio. Este tipo de keywords permite optimizar contenidos y mejorar la capacidad de captación de clientes interesados, consolidando así el posicionamiento orgánico del dominio.</p>`;

  return text;
}

/**
 * EVOLUCIÓN DEL POSICIONAMIENTO ORGÁNICO - Texto canónico (después de imágenes de keywords)
 * Datos variables: herramienta, presencia en top 100, rango de posiciones
 */
export function generatePositioningText(data: PositioningEvolutionData | undefined, images: ImageItem[] = []): string {
  const extracted = getExtractedFromImages(images);
  const tool = extracted?.source_tool || "SEMrush";
  
  // Determinar estado del dominio basado en capturas
  const keywordsCount = extracted?.metrics.keywords_count;
  const hasPresence = keywordsCount !== null && keywordsCount !== undefined && keywordsCount > 0;
  const presenceText = hasPresence ? "sí" : "no";
  const positionRange = ">50 / fuera del Top 100";
  
  // Texto canónico EXACTO
  let text = `<p>Las gráficas extraídas de <strong>${tool}</strong> muestran que, durante el periodo subvencionado, el sitio web <strong>${presenceText}</strong> registra presencia en los 100 primeros resultados de Google. Según los datos visibles en las capturas, el dominio se sitúa en posiciones <strong>${positionRange}</strong>, lo que limita su visibilidad digital y su capacidad de captación de clientes.</p>`;

  return text;
}

/**
 * TABLA EVOLUTIVA DE PALABRAS CLAVE - Texto canónico
 * Datos variables: periodo
 */
export function generateKeywordTableText(data: KeywordTableData | undefined, images: ImageItem[] = []): string {
  const extracted = getExtractedFromImages(images);
  const period = extracted?.date_or_range || "[periodo detectado]";
  
  // Texto canónico EXACTO
  let text = `<p><strong>TABLA EVOLUTIVA DE PALABRAS CLAVE (Periodo: ${period})</strong></p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>La evolución del posicionamiento orgánico del dominio muestra un comportamiento inicial sin presencia en los rankings, partiendo de posiciones elevadas (superiores a 50) y manteniendo esta situación durante el periodo subvencionado.</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>Los valores de la tabla deben ser coherentes con la captura inicial del dominio, reflejando un estado realista del proyecto SEO.</p>`;

  return text;
}

/**
 * BACKLINKS DE ALTA CALIDAD - Texto canónico
 * Datos variables: número de backlinks y dominios de referencia
 */
export function generateBacklinksText(data: BacklinksData | undefined, images: ImageItem[] = []): string {
  const visionData = getVisionReportData();
  const extracted = getExtractedFromImages(images);
  
  // PRIORITY: Use VisionReportData backlinks if available
  const refDomains = visionData?.backlinks?.refDomainsCount ?? 
                     extracted?.metrics?.ref_domains ?? 
                     "[número detectado]";
  const backlinks = visionData?.backlinks?.backlinksCount ?? 
                    extracted?.metrics?.backlinks ?? 
                    "[número detectado]";
  
  // Texto canónico EXACTO
  let text = `<p>La interpretación de las capturas muestra la existencia de <strong>${backlinks}</strong> backlinks y <strong>${refDomains}</strong> dominios de referencia, que contribuyen a reforzar la autoridad del sitio. Esta mejora en la autoridad del dominio tiene un impacto positivo en su visibilidad online y sienta las bases para futuras mejoras de posicionamiento.</p>`;

  return text;
}

/**
 * 2. INDEXACIÓN Y JERARQUIZACIÓN DEL CONTENIDO - Texto canónico
 * Datos variables: H1, H2, H3, enlaces, porcentaje internos
 */
export function generateHierarchyText(data: HierarchyData | undefined, images: ImageItem[] = []): string {
  const allExtracted = getAllExtractedFromImages(images);
  const visionData = getVisionReportData();
  
  // PRIORITY: Use VisionReportData headings if available
  let h1 = "[número detectado]";
  let h2 = "[número detectado]";
  let h3 = "[número detectado]";
  let totalLinks = "[número detectado]";
  let internalPercent = "[porcentaje detectado]";
  
  // Try VisionReportData first
  if (visionData?.headings) {
    if (visionData.headings.h1Count !== null) h1 = String(visionData.headings.h1Count);
    if (visionData.headings.h2Count !== null) h2 = String(visionData.headings.h2Count);
    if (visionData.headings.h3Count !== null) h3 = String(visionData.headings.h3Count);
  }
  
  if (visionData?.internalLinks) {
    if (visionData.internalLinks.total !== null) totalLinks = String(visionData.internalLinks.total);
    if (visionData.internalLinks.internalPct !== null) internalPercent = String(visionData.internalLinks.internalPct);
  }
  
  // Fallback: search in extracted image data
  if (h1 === "[número detectado]" || h2 === "[número detectado]" || h3 === "[número detectado]") {
    for (const ext of allExtracted) {
      if (ext.h1_count !== null && ext.h1_count !== undefined && h1 === "[número detectado]") h1 = String(ext.h1_count);
      if (ext.h2_count !== null && ext.h2_count !== undefined && h2 === "[número detectado]") h2 = String(ext.h2_count);
      if (ext.h3_count !== null && ext.h3_count !== undefined && h3 === "[número detectado]") h3 = String(ext.h3_count);
      if (ext.internal_links !== null && ext.internal_links !== undefined && totalLinks === "[número detectado]") {
        const internal = ext.internal_links;
        const external = ext.external_links || 0;
        const total = internal + external;
        totalLinks = String(total);
        internalPercent = total > 0 ? String(Math.round((internal / total) * 100)) : "100";
      }
    }
  }
  
  // Usar datos del formulario si no hay datos extraídos
  if (h1 === "[número detectado]" && data?.h1Count !== undefined) h1 = String(data.h1Count);
  if (h2 === "[número detectado]" && data?.h2Count !== undefined) h2 = String(data.h2Count);
  if (h3 === "[número detectado]" && data?.h3Count !== undefined) h3 = String(data.h3Count);
  
  // Texto canónico EXACTO
  let text = `<p>Dentro de la Fase II del Kit Digital se ha trabajado la correcta jerarquización de contenidos y la indexación técnica del sitio web, asegurando que la estructura interna y las directrices para los motores de búsqueda cumplan con los estándares de optimización SEO.</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p><strong>Jerarquización de encabezados y análisis semántico</strong></p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>El análisis de encabezados detectado en las capturas refleja la siguiente estructura:</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<ul>`;
  text += `<li><strong>${h1}</strong> H1</li>`;
  text += `<li><strong>${h2}</strong> H2</li>`;
  text += `<li><strong>${h3}</strong> H3</li>`;
  text += `</ul>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>Además, el análisis semántico identifica términos clave coherentes con la actividad del sitio, alineados con las búsquedas relevantes del sector.</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p><strong>Enlazado interno y atributos técnicos</strong></p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>El análisis del enlazado interno muestra <strong>${totalLinks}</strong> enlaces, siendo <strong>${internalPercent}%</strong> internos. Asimismo, las imágenes analizadas cuentan con atributos ALT correctamente configurados, favoreciendo la accesibilidad y el SEO visual del contenido.</p>`;

  return text;
}

/**
 * INDEXACIÓN Y ASPECTOS TÉCNICOS - Texto canónico
 */
export function generateIndexingText(data: IndexingData | undefined, images: ImageItem[] = []): string {
  // Texto canónico EXACTO
  let text = `<p><strong>Indexación y aspectos técnicos</strong></p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>Para garantizar una correcta indexación en buscadores se revisaron los elementos técnicos del sitio, incluyendo robots.txt, sitemap XML, etiquetas canónicas, meta título y meta descripción, ausencia de enlaces rotos y otros parámetros técnicos detectados en las capturas.</p>`;
  
  text += `<p>&nbsp;</p>`;
  
  text += `<p>Se ha implementado estrategias de indexación y jerarquización de contenido eficaces, contribuyendo a una correcta experiencia de usuario y a un rastreo eficiente por parte de los motores de búsqueda.</p>`;

  return text;
}

/**
 * RENDIMIENTO Y EXPERIENCIA DE USUARIO - Texto canónico
 */
export function generatePageSpeedText(data: PageSpeedData | undefined, images: ImageItem[] = []): string {
  const visionData = getVisionReportData();
  
  // Check if we have actual PageSpeed data
  const hasData = visionData?.pagespeed && (
    visionData.pagespeed.performance !== null ||
    visionData.pagespeed.accessibility !== null ||
    visionData.pagespeed.bestPractices !== null ||
    visionData.pagespeed.seo !== null
  );
  
  if (hasData) {
    const ps = visionData!.pagespeed;
    const performance = ps.performance ?? "—";
    const accessibility = ps.accessibility ?? "—";
    const bestPractices = ps.bestPractices ?? "—";
    const seo = ps.seo ?? "—";
    
    let text = `<p>El análisis de rendimiento mediante PageSpeed Insights muestra los siguientes resultados:</p>`;
    text += `<p>&nbsp;</p>`;
    text += `<ul>`;
    text += `<li><strong>Rendimiento:</strong> ${performance}/100</li>`;
    text += `<li><strong>Accesibilidad:</strong> ${accessibility}/100</li>`;
    text += `<li><strong>Buenas prácticas:</strong> ${bestPractices}/100</li>`;
    text += `<li><strong>SEO:</strong> ${seo}/100</li>`;
    text += `</ul>`;
    text += `<p>&nbsp;</p>`;
    text += `<p>Estos resultados demuestran que la web está técnicamente preparada para competir en el entorno digital, con puntuaciones que reflejan un buen estado general de optimización.</p>`;
    return text;
  }
  
  // Fallback: Texto canónico sin datos específicos
  let text = `<p>Al obtener puntuaciones elevadas en rendimiento, accesibilidad, prácticas óptimas y SEO según PageSpeed Insights, la web demuestra estar técnicamente preparada para competir en el entorno digital.</p>`;

  return text;
}

/**
 * Generador principal - selecciona la función según sección
 */
export function generateSectionText(section: ReportSection, formData: FormData): string {
  switch (section.id) {
    case "intro":
      return generateIntroText(formData, section.images);
    case "keywords":
      return generateKeywordText(section.data as KeywordAnalysisData, formData, section.images);
    case "positioning":
      return generatePositioningText(section.data as PositioningEvolutionData, section.images);
    case "keywordTable":
      return generateKeywordTableText(section.data as KeywordTableData, section.images);
    case "backlinks":
      return generateBacklinksText(section.data as BacklinksData, section.images);
    case "hierarchy":
      return generateHierarchyText(section.data as HierarchyData, section.images);
    case "indexing":
      return generateIndexingText(section.data as IndexingData, section.images);
    case "pagespeed":
      return generatePageSpeedText(section.data as PageSpeedData, section.images);
    default:
      return "";
  }
}
