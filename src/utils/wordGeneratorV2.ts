/**
 * Word Document Generator V2 for SEO Solución Web
 * Uses VisionReportData from vision-extract to generate .docx files
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import { FormData, ReportSection, ImageItem } from "@/types/report";
import { VisionReportData, VisionKeyword } from "@/types/visionReport";
import { generateKeywordEvolutionTable } from "@/utils/keywordTableGenerator";
import { validateSeoReportV2 } from "@/utils/seoSolucionWebReportV2";
import { createDocxImageParagraphs } from "@/utils/docxImages";

function formatDateSpanish(dateString: string): string {
  if (!dateString) return "—";
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

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
}

function fmtNum(val: number | null | undefined, suffix = ""): string {
  if (val === null || val === undefined) return "N/D";
  return val.toLocaleString("es-ES") + suffix;
}

function getSection(sections: ReportSection[], id: string): ReportSection | undefined {
  return sections.find((s) => s.id === id);
}

/**
 * Create image paragraphs from ImageItems
 */
async function createImageParagraphs(images: ImageItem[]): Promise<Paragraph[]> {
  return await createDocxImageParagraphs(
    images.map((img) => ({ src: img.src })),
    { width: 500, height: 300 }
  );
}


/**
 * Create a standard paragraph
 */
function createParagraph(text: string, options?: { bold?: boolean; spacing?: number }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        size: 24, // 12pt
      }),
    ],
    spacing: { after: options?.spacing ?? 200 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

/**
 * Create a bullet point
 */
function createBullet(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `• ${text}`,
        size: 24,
      }),
    ],
    spacing: { after: 100 },
    indent: { left: 400 },
  });
}

/**
 * Create keyword evolution table
 */
function createKeywordTable(
  kwTable: { months: string[]; rows: Array<{ keyword: string; valuesByMonth: number[] }> }
): Table {
  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "d1d5db",
  };

  // Header row
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: "Palabra clave", bold: true, size: 20 })] })],
        width: { size: 2500, type: WidthType.DXA },
        borders: { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle },
        shading: { fill: "f3f4f6" },
      }),
      ...kwTable.months.map(
        (month) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: month, bold: true, size: 18 })] })],
            width: { size: 800, type: WidthType.DXA },
            borders: { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle },
            shading: { fill: "f3f4f6" },
          })
      ),
    ],
  });

  // Data rows
  const dataRows = kwTable.rows.map(
    (row, idx) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: row.keyword, bold: true, size: 20 })] })],
            borders: { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle },
            shading: { fill: idx % 2 === 0 ? "ffffff" : "f9fafb" },
          }),
          ...row.valuesByMonth.map(
            (value) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(value), size: 20 })] })],
                borders: { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle },
                shading: { fill: idx % 2 === 0 ? "ffffff" : "f9fafb" },
              })
          ),
        ],
      })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Generate Word document using VisionReportData
 */
export async function generateWordV2(
  formData: FormData | null | undefined,
  reportData: VisionReportData | null | undefined,
  sections: ReportSection[] | null | undefined
): Promise<Blob> {
  // Defensive guards
  const safeFormData = formData ?? ({} as FormData);
  const safeReportData = reportData ?? ({} as VisionReportData);
  const safeSections = sections ?? [];

  // Validate before export (log warnings but don't block)
  const validation = validateSeoReportV2(safeFormData, safeReportData, safeSections);
  if (!validation.ok) {
    console.warn("[wordGenerator] Datos incompletos:", validation.errors);
  }

  // Extract data from VisionReportData
  const website = (safeFormData.websiteUrl ?? "").trim();
  const domain = website ? domainFromUrl(website) : "dominio no especificado";
  const period = `${formatDateSpanish(safeFormData.startDate ?? "")} / ${formatDateSpanish(safeFormData.endDate ?? "")}`;
  const tool = "herramienta SEO profesional";

  const safeBacklinks = safeReportData.backlinks;
  const safeHeadings = safeReportData.headings;
  const safeInternalLinks = safeReportData.internalLinks;
  const safeKeywords = safeReportData.keywords ?? [];
  const safePagespeed = safeReportData.pagespeed;

  const backlinks = safeBacklinks?.backlinksCount ?? null;
  const refDomains = safeBacklinks?.refDomainsCount ?? null;
  const h1 = safeHeadings?.h1Count ?? null;
  const h2 = safeHeadings?.h2Count ?? null;
  const h3 = safeHeadings?.h3Count ?? null;
  const totalLinks = safeInternalLinks?.total ?? null;
  const internalPercent = safeInternalLinks?.internalPct ?? null;

  // Keywords
  const keywordsWithVolume = safeKeywords.filter((k) => k && k.volume !== null);
  const k1 = keywordsWithVolume[0];
  const k2 = keywordsWithVolume[1];
  const k3 = keywordsWithVolume[2];
  const k4 = keywordsWithVolume[3];
  const k5 = keywordsWithVolume[4];

  // Get images from sections
  const introImages = getSection(safeSections, "intro")?.images ?? [];
  const keywordImages = getSection(safeSections, "keywords")?.images ?? [];
  const positioningImages = getSection(safeSections, "positioning")?.images ?? [];
  const backlinksImages = getSection(safeSections, "backlinks")?.images ?? [];
  const hierarchyImages = getSection(safeSections, "hierarchy")?.images ?? [];
  const indexingImages = getSection(safeSections, "indexing")?.images ?? [];
  const pagespeedImages = getSection(safeSections, "pagespeed")?.images ?? [];

  // Generate keyword evolution table
  const keywordStrings = keywordsWithVolume.map((k) => k?.keyword ?? "").filter(Boolean);
  const kwTable =
    keywordStrings.length >= 4
      ? generateKeywordEvolutionTable(
          safeFormData.servicio ?? "",
          safeFormData.startDate ?? "",
          safeFormData.endDate ?? "",
          keywordStrings
        )
      : null;

  // Collect all paragraphs for document
  const docChildren: (Paragraph | Table)[] = [];

  // ============ COVER PAGE ============

  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "INFORME DE RESULTADO DEL SERVICIO DE MEJORA DEL POSICIONAMIENTO SEO",
          bold: true,
          size: 36,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "INFORMACIÓN DE CABECERA", bold: true, size: 24 })],
      spacing: { after: 200 },
    })
  );

  docChildren.push(createParagraph(`SITIO WEB: ${safeFormData.websiteUrl ?? ""}`));
  docChildren.push(createParagraph(`Periodo de prestación del servicio: ${period}`));
  docChildren.push(
    createParagraph(`Fecha de elaboración del presente informe: ${formatDateSpanish(safeFormData.reportDate ?? "")}`)
  );
  docChildren.push(createParagraph(`Beneficiario: ${safeFormData.beneficiaryName ?? ""}`));

  // Page break
  docChildren.push(new Paragraph({ pageBreakBefore: true, children: [] }));

  // ============ INTRO ============
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "INTRODUCCIÓN", bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    })
  );

  docChildren.push(
    createParagraph(
      `Este informe recoge los resultados obtenidos durante la Fase II de la prestación del servicio de optimización SEO para el sitio web ${domain}, correspondientes al periodo ${period}, según lo establecido en el Acuerdo de Prestación de Soluciones de Digitalización. Durante este intervalo, se ha evaluado el estado inicial del dominio y se han aplicado acciones orientadas a establecer una base sólida de visibilidad online dentro del sector correspondiente.`
    )
  );

  docChildren.push(
    createParagraph(
      `La empresa no disponía previamente de configuraciones ni prácticas SEO implementadas, por lo que la intervención se ha centrado en aspectos fundamentales: optimización técnica, revisión estructural del dominio, implementación de mejoras en indexabilidad y rastreo, y creación de contenido alineado con las búsquedas más relevantes del sector. Paralelamente, se han trabajado acciones de posicionamiento externo, reforzadas por la existencia de ${fmtNum(refDomains)} dominios de referencia y ${fmtNum(backlinks)} backlinks, que sirven como punto de apoyo para incrementar la autoridad del sitio.`
    )
  );

  docChildren.push(
    createParagraph(
      `Las gráficas y datos utilizados proceden de la ${tool}. Debido a que la plataforma no permite seleccionar intervalos temporales completamente personalizados, se han empleado las vistas disponibles que abarcan el periodo subvencionado.`
    )
  );

  // Intro images placeholder
  docChildren.push(createParagraph("(IMAGEN DE INTRODUCCIÓN)", { bold: true }));
  const introImgParagraphs = await createImageParagraphs(introImages);
  docChildren.push(...introImgParagraphs);

  // ============ 1. ANÁLISIS DE PALABRAS CLAVE ============
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "1. ANÁLISIS DE PALABRAS CLAVE", bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  docChildren.push(
    createParagraph(
      `El trabajo de investigación se centró en la identificación de palabras clave relevantes dentro del sector del beneficiario, priorizando términos con un volumen de búsqueda significativo y un nivel de dificultad (KD) asumible para su aprovechamiento estratégico. Entre las keywords más destacadas detectadas en las capturas se encuentran:`
    )
  );

  if (k1) docChildren.push(createBullet(`${k1.keyword} – ${fmtNum(k1.volume)} búsquedas/mes`));
  if (k2) docChildren.push(createBullet(`${k2.keyword} – ${fmtNum(k2.volume)} búsquedas/mes`));
  if (k3) docChildren.push(createBullet(`${k3.keyword} – ${fmtNum(k3.volume)} búsquedas/mes`));

  docChildren.push(
    createParagraph(
      `Estos términos muestran un interés elevado por servicios alineados con la naturaleza de los servicios ofrecidos por el sitio web analizado.`
    )
  );

  docChildren.push(
    createParagraph(
      `Adicionalmente, el análisis grupal de keywords asociadas a los servicios principales reveló datos específicos orientados a búsqueda y segmentación:`
    )
  );

  if (k4) docChildren.push(createBullet(`${k4.keyword} – ${fmtNum(k4.volume)} búsquedas/mes`));
  if (k5) docChildren.push(createBullet(`${k5.keyword} – ${fmtNum(k5.volume)} búsquedas/mes`));

  docChildren.push(
    createParagraph(
      `Finalmente, el estudio confirma la existencia de un conjunto de oportunidades enfocadas en servicios clave del sector, con un volumen lo suficientemente amplio como para generar tráfico cualificado hacia el sitio.`
    )
  );

  // Keyword images
  docChildren.push(createParagraph("(IMÁGENES DE ANÁLISIS DE PALABRAS CLAVE)", { bold: true }));
  const kwImgParagraphs = await createImageParagraphs([...keywordImages, ...positioningImages]);
  docChildren.push(...kwImgParagraphs);

  // ============ TABLA EVOLUTIVA ============
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: `TABLA EVOLUTIVA DE PALABRAS CLAVE (Periodo: ${period})`, bold: true, size: 24 })],
      spacing: { before: 400, after: 200 },
    })
  );

  if (kwTable) {
    docChildren.push(createKeywordTable(kwTable));
  } else {
    docChildren.push(
      createParagraph("(Tabla evolutiva no disponible: faltan keywords con volúmenes en capturas)")
    );
  }

  // ============ BACKLINKS ============
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "BACKLINKS DE ALTA CALIDAD", bold: true, size: 24 })],
      spacing: { before: 400, after: 200 },
    })
  );

  docChildren.push(
    createParagraph(
      `La interpretación de las capturas muestra la existencia de ${fmtNum(backlinks)} backlinks y ${fmtNum(refDomains)} dominios de referencia, que contribuyen a reforzar la autoridad del sitio. Esta mejora en la autoridad del dominio tiene un impacto positivo en su visibilidad online y sienta las bases para futuras mejoras de posicionamiento.`
    )
  );

  
  const blImgParagraphs = await createImageParagraphs(backlinksImages);
  docChildren.push(...blImgParagraphs);

  // ============ 2. INDEXACIÓN Y JERARQUIZACIÓN ============
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "2. INDEXACIÓN Y JERARQUIZACIÓN DEL CONTENIDO", bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  docChildren.push(
    createParagraph(
      `Dentro de la Fase II del Kit Digital se ha trabajado la correcta jerarquización de contenidos y la indexación técnica del sitio web, asegurando que la estructura interna y las directrices para los motores de búsqueda cumplan con los estándares de optimización SEO.`
    )
  );

  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "Jerarquización de encabezados y análisis semántico", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );

  docChildren.push(
    createParagraph(`El análisis de encabezados detectado en las capturas refleja la siguiente estructura:`)
  );

  docChildren.push(createBullet(`${fmtNum(h1)} H1`));
  docChildren.push(createBullet(`${fmtNum(h2)} H2`));
  docChildren.push(createBullet(`${fmtNum(h3)} H3`));

  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "Enlazado interno y atributos técnicos", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );

  docChildren.push(
    createParagraph(
      `El análisis del enlazado interno muestra ${fmtNum(totalLinks)} enlaces, siendo ${internalPercent !== null ? internalPercent : "N/D"}% internos. Asimismo, las imágenes analizadas cuentan con atributos ALT correctamente configurados, favoreciendo la accesibilidad y el SEO visual del contenido.`
    )
  );

  docChildren.push(createParagraph("(IMÁGENES DE JERARQUIZACIÓN)", { bold: true }));
  const hierImgParagraphs = await createImageParagraphs(hierarchyImages);
  docChildren.push(...hierImgParagraphs);

  // ============ ASPECTOS TÉCNICOS ============
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "Indexación y aspectos técnicos", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );

  docChildren.push(
    createParagraph(
      `Para garantizar una correcta indexación en buscadores se revisaron los elementos técnicos del sitio, incluyendo robots.txt, sitemap XML, etiquetas canónicas, meta título y meta descripción, ausencia de enlaces rotos y otros parámetros técnicos detectados en las capturas.`
    )
  );

  docChildren.push(createParagraph("(IMÁGENES DE ASPECTOS TÉCNICOS)", { bold: true }));
  const indexImgParagraphs = await createImageParagraphs(indexingImages);
  docChildren.push(...indexImgParagraphs);

  // ============ PAGESPEED ============
  if (safePagespeed) {
    docChildren.push(
      new Paragraph({
        children: [new TextRun({ text: "RENDIMIENTO Y EXPERIENCIA DE USUARIO (PageSpeed Insights)", bold: true, size: 24 })],
        spacing: { before: 400, after: 200 },
      })
    );

    if (safePagespeed.performance !== null || safePagespeed.accessibility !== null) {
      docChildren.push(createBullet(`Rendimiento: ${fmtNum(safePagespeed.performance)}/100`));
      docChildren.push(createBullet(`Accesibilidad: ${fmtNum(safePagespeed.accessibility)}/100`));
      docChildren.push(createBullet(`Buenas prácticas: ${fmtNum(safePagespeed.bestPractices)}/100`));
      docChildren.push(createBullet(`SEO: ${fmtNum(safePagespeed.seo)}/100`));
    }

    docChildren.push(
      createParagraph(
        `Al obtener puntuaciones elevadas en rendimiento, accesibilidad, prácticas óptimas y SEO según PageSpeed Insights, la web demuestra estar técnicamente preparada para competir en el entorno digital.`
      )
    );

    docChildren.push(createParagraph("(IMÁGENES DE PAGESPEED)", { bold: true }));
    const psImgParagraphs = await createImageParagraphs(pagespeedImages);
    docChildren.push(...psImgParagraphs);
  }

  // ============ FIN ============

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  // Generate the blob
  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * Generate Word document and return blob with filename
 */
export async function generateWordV2WithBlob(
  formData: FormData | null | undefined,
  reportData: VisionReportData | null | undefined,
  sections: ReportSection[] | null | undefined
): Promise<{ blob: Blob; filename: string }> {
  const safeFormData = formData ?? ({} as FormData);
  
  const blob = await generateWordV2(formData, reportData, sections);
  const filename = `InformeSEO-${sanitizeFilename(safeFormData.beneficiaryName ?? "borrador")}.docx`;
  
  return { blob, filename };
}

/**
 * Generate and download Word document
 */
export async function downloadWordV2(
  formData: FormData | null | undefined,
  reportData: VisionReportData | null | undefined,
  sections: ReportSection[] | null | undefined
): Promise<void> {
  const { blob, filename } = await generateWordV2WithBlob(formData, reportData, sections);
  saveAs(blob, filename);
}
