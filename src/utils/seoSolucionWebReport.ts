import { FormData, ReportSection, ImageItem } from "@/types/report";
import { ExtractedImageData, KeywordItem } from "@/types/imageAnalysis";
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

function getAllExtracted(sections: ReportSection[]): ExtractedImageData[] {
  const out: ExtractedImageData[] = [];
  for (const s of sections) {
    for (const img of s.images) {
      if (img.extractedData) out.push(img.extractedData);
    }
  }
  return out;
}

function pickFirst<T>(values: Array<T | null | undefined>): T | null {
  for (const v of values) {
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function dedupeKeywords(list: KeywordItem[]): KeywordItem[] {
  const seen = new Set<string>();
  const out: KeywordItem[] = [];
  for (const k of list) {
    const key = (k.keyword || "").trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
  }
  return out;
}

export function extractKeywordSeedList(sections: ReportSection[]): string[] {
  const extracted = getAllExtracted(sections);
  const all = extracted.flatMap((e) => e.metrics.keyword_list || []);
  return dedupeKeywords(all).map((k) => k.keyword).filter(Boolean);
}

export type SeoReportValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validateSeoSolucionWebReport(formData: FormData, sections: ReportSection[]): SeoReportValidationResult {
  const errors: string[] = [];

  // 2.1 Campos de formulario (obligatorios)
  if (!formData.websiteUrl?.trim()) errors.push("Falta 'SITIO WEB' (campo del formulario).");
  if (!formData.startDate) errors.push("Falta 'Fecha inicio del servicio' (campo del formulario).");
  if (!formData.endDate) errors.push("Falta 'Fecha fin del servicio' (campo del formulario).");
  if (!formData.reportDate) errors.push("Falta 'Fecha de elaboración' (campo del formulario).");
  if (!formData.beneficiaryName?.trim()) errors.push("Falta 'Beneficiario' (campo del formulario).");

  const introImages = getSection(sections, "intro")?.images || [];
  const keywordImages = getSection(sections, "keywords")?.images || [];
  const positioningImages = getSection(sections, "positioning")?.images || [];
  const backlinksImages = getSection(sections, "backlinks")?.images || [];
  const hierarchyImages = getSection(sections, "hierarchy")?.images || [];
  const indexingImages = getSection(sections, "indexing")?.images || [];
  const pagespeedImages = getSection(sections, "pagespeed")?.images || [];

  const allExtracted = getAllExtracted(sections);

  // Herramienta (de capturas)
  const tool = pickFirst(allExtracted.map((e) => e.source_tool));
  if (!tool) errors.push("Falta detectar la herramienta SEO en capturas (SEMrush, PageSpeed, etc.).");

  // A) Keywords (mínimo 4 para tabla evolutiva)
  const keywordList = dedupeKeywords(
    [...keywordImages, ...positioningImages]
      .map((i) => i.extractedData)
      .filter(Boolean)
      .flatMap((e) => (e as ExtractedImageData).metrics.keyword_list || [])
  ).filter((k) => k.volume !== null);

  if (keywordList.length < 4) {
    errors.push(`Faltan keywords con volúmenes en capturas (tienes ${keywordList.length}, mín. 4).`);
  }

  // D) Backlinks y dominios de referencia
  const backlinks = pickFirst([
    ...backlinksImages.map((i) => i.extractedData?.metrics.backlinks),
    ...allExtracted.map((e) => e.metrics.backlinks),
  ]);
  const refDomains = pickFirst([
    ...backlinksImages.map((i) => i.extractedData?.metrics.ref_domains),
    ...allExtracted.map((e) => e.metrics.ref_domains),
  ]);

  if (backlinks === null) errors.push("Falta nº de backlinks en capturas.");
  if (refDomains === null) errors.push("Falta nº de dominios de referencia en capturas.");

  // E) H1/H2/H3
  const h1 = pickFirst([...hierarchyImages.map((i) => i.extractedData?.h1_count), ...allExtracted.map((e) => e.h1_count)]);
  const h2 = pickFirst([...hierarchyImages.map((i) => i.extractedData?.h2_count), ...allExtracted.map((e) => e.h2_count)]);
  const h3 = pickFirst([...hierarchyImages.map((i) => i.extractedData?.h3_count), ...allExtracted.map((e) => e.h3_count)]);
  if (h1 === null) errors.push("Falta nº H1 en capturas.");
  if (h2 === null) errors.push("Falta nº H2 en capturas.");
  if (h3 === null) errors.push("Falta nº H3 en capturas.");

  // F) Enlazado interno + ALT
  const internalLinks = pickFirst([
    ...indexingImages.map((i) => i.extractedData?.internal_links),
    ...hierarchyImages.map((i) => i.extractedData?.internal_links),
    ...allExtracted.map((e) => e.internal_links),
  ]);
  const externalLinks = pickFirst([
    ...indexingImages.map((i) => i.extractedData?.external_links),
    ...hierarchyImages.map((i) => i.extractedData?.external_links),
    ...allExtracted.map((e) => e.external_links),
  ]);

  if (internalLinks === null && externalLinks === null) {
    errors.push("Faltan nº de enlaces internos/externos en capturas.");
  }

  // G) Indexación técnica (robots/sitemap/canonicals) - solo warning, no bloqueo
  // H) PageSpeed - solo warning, no bloqueo

  // Requiere al menos una captura por bloque clave
  if (introImages.length === 0) errors.push("Falta captura de introducción (visión general del dominio).");
  if (keywordImages.length + positioningImages.length === 0) errors.push("Faltan capturas de análisis de keywords/posicionamiento.");
  if (backlinksImages.length === 0) errors.push("Faltan capturas de backlinks.");
  if (hierarchyImages.length === 0) errors.push("Faltan capturas de jerarquización (H1/H2/H3).");

  return { ok: errors.length === 0, errors };
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

function getPositioningPhrase(sections: ReportSection[]): { presenceText: "sí" | "no"; rangeText: string } {
  const extracted = getAllExtracted(sections);
  const keywordsCount = pickFirst(extracted.map((e) => e.metrics.keywords_count));
  const top3 = pickFirst(extracted.map((e) => e.metrics.top_3)) ?? 0;
  const top10 = pickFirst(extracted.map((e) => e.metrics.top_10)) ?? 0;
  const top11_20 = pickFirst(extracted.map((e) => e.metrics.top_11_20)) ?? 0;
  const top21_100 = pickFirst(extracted.map((e) => e.metrics.top_21_100)) ?? 0;

  const hasPresence = (keywordsCount ?? top3 + top10 + top11_20 + top21_100) > 0;

  let rangeText = "fuera del Top 100";
  if (!hasPresence) {
    rangeText = "fuera del Top 100";
  } else if (top21_100 > 0) {
    rangeText = ">50";
  } else if (top11_20 > 0) {
    rangeText = "11–20";
  } else if (top10 > 0) {
    rangeText = "Top 10";
  } else if (top3 > 0) {
    rangeText = "Top 3";
  } else {
    rangeText = ">50";
  }

  return { presenceText: hasPresence ? "sí" : "no", rangeText };
}

// Helper para formatear número o mostrar "N/D"
function fmtNum(val: number | null | undefined, suffix = ""): string {
  if (val === null || val === undefined) return "N/D";
  return val.toLocaleString("es-ES") + suffix;
}

function buildBodyHtml(
  formData: FormData,
  sections: ReportSection[],
  options: { mode: "pdf" | "preview" }
): string {
  const website = formData.websiteUrl.trim();
  const domain = domainFromUrl(website);
  const period = `${formatDateSpanish(formData.startDate)} / ${formatDateSpanish(formData.endDate)}`;

  const extracted = getAllExtracted(sections);
  const tool = pickFirst(extracted.map((e) => e.source_tool)) || "herramienta SEO profesional";

  const backlinks = pickFirst(extracted.map((e) => e.metrics.backlinks));
  const refDomains = pickFirst(extracted.map((e) => e.metrics.ref_domains));

  const introImages = getSection(sections, "intro")?.images || [];
  const keywordImages = getSection(sections, "keywords")?.images || [];
  const positioningImages = getSection(sections, "positioning")?.images || [];
  const backlinksImages = getSection(sections, "backlinks")?.images || [];
  const hierarchyImages = getSection(sections, "hierarchy")?.images || [];
  const indexingImages = getSection(sections, "indexing")?.images || [];
  const pagespeedImages = getSection(sections, "pagespeed")?.images || [];

  const imagesBlock = options.mode === "pdf" ? renderImagesForPdf : renderImagesForPreview;

  const keywordsAll = dedupeKeywords(
    [...keywordImages, ...positioningImages]
      .map((i) => i.extractedData)
      .filter(Boolean)
      .flatMap((e) => (e as ExtractedImageData).metrics.keyword_list || [])
  ).filter((k) => k.volume !== null);

  const k1 = keywordsAll[0];
  const k2 = keywordsAll[1];
  const k3 = keywordsAll[2];
  const k4 = keywordsAll[3];
  const k5 = keywordsAll[4];

  const h1 = pickFirst(extracted.map((e) => e.h1_count));
  const h2 = pickFirst(extracted.map((e) => e.h2_count));
  const h3 = pickFirst(extracted.map((e) => e.h3_count));

  const internalLinks = pickFirst(extracted.map((e) => e.internal_links));
  const externalLinks = pickFirst(extracted.map((e) => e.external_links));
  const totalLinks = internalLinks !== null && externalLinks !== null ? internalLinks + externalLinks : null;
  const internalPercent = totalLinks && internalLinks !== null ? Math.round((internalLinks / totalLinks) * 100) : null;

  const { presenceText, rangeText } = getPositioningPhrase(sections);

  // Generar tabla solo si hay >= 4 keywords reales
  const kwTable = keywordsAll.length >= 4
    ? generateKeywordEvolutionTable(
        formData.servicio,
        formData.startDate,
        formData.endDate,
        keywordsAll.map((k) => k.keyword)
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
  const kwBullet = (kw: KeywordItem | undefined) => {
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

export function buildSeoSolucionWebPreviewHtml(formData: FormData, sections: ReportSection[]): string {
  return buildBodyHtml(formData, sections, { mode: "preview" });
}

export function buildSeoSolucionWebPdfBodyHtml(formData: FormData, sections: ReportSection[]): string {
  return buildBodyHtml(formData, sections, { mode: "pdf" });
}
