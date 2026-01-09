/**
 * Word Generator for Informe Trimestral de Seguimiento del SEO (eCommerce)
 * Fase II – Presencia Avanzada en Internet
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from "docx";
import { EcommerceFormData, EcommerceSection, EcommerceReportData } from "@/types/ecommerceReport";
import { createDocxImageParagraphs } from "./docxImages";

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

async function createCoverSection(formData: EcommerceFormData, reportData: EcommerceReportData | null): Promise<Paragraph[]> {
  const period = reportData?.detectedPeriod;

  return [
    new Paragraph({
      children: [new TextRun({ text: "INFORME TRIMESTRAL DE SEGUIMIENTO DEL SEO", bold: true, size: 36 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({ children: [], spacing: { after: 600 } }),
    new Paragraph({
      children: [
        new TextRun({ text: "Nombre del Beneficiario: ", bold: true }),
        new TextRun({ text: formData.beneficiaryName || "[BENEFICIARIO]" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "E-commerce: ", bold: true }),
        new TextRun({ text: formData.websiteUrl || "[URL]" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Fecha de prestación del servicio: ", bold: true }),
        new TextRun({ text: `${formData.serviceStart || "[INICIO]"} al ${formData.serviceEnd || "[FIN]"}` }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Período analizado: ", bold: true }),
        new TextRun({ text: `${period?.start || "[MES_INICIO]"} a ${period?.end || "[MES_FIN]"}` }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Fecha del Informe: ", bold: true }),
        new TextRun({ text: formatDateSpanish(formData.reportDate) }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

async function createKeywordsSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): Promise<Paragraph[]> {
  const kw = reportData?.keywords;
  const domain = reportData?.mainDomain?.domain || "[DOMINIO]";
  const keywordsSection = sections.find(s => s.id === "keywords");
  const images = keywordsSection?.images || [];

  const paragraphs: Paragraph[] = [
    new Paragraph({ text: "Informe SEO ON-PAGE", heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
    new Paragraph({ text: "1. Análisis de palabras clave", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `En este informe trimestral de SEO para ${domain} se presenta un análisis meticuloso de las mejoras implementadas y los resultados obtenidos en el posicionamiento del sitio mediante estrategias de optimización de motores de búsqueda. Hemos identificado un conjunto de palabras clave estratégicamente seleccionadas que son cruciales para atraer tráfico relevante al sitio.`,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  if (kw?.summary) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: kw.summary })], spacing: { after: 200 } }));
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Estas palabras clave no solo son altamente pertinentes para el mercado objetivo, sino que también han demostrado ser efectivas para generar un tráfico mensual significativo. La implementación de estas palabras clave en el contenido del sitio ha sido fundamental para mejorar el alcance y la visibilidad del dominio en búsquedas específicas relacionadas con sus servicios.",
        }),
      ],
      spacing: { after: 200 },
    })
  );

  if (images.length > 0) {
    const imageParagraphs = await createDocxImageParagraphs(
      images.map(img => ({ src: img.src, caption: img.name })),
      { width: 500, height: 300, alignment: AlignmentType.CENTER, includeCaptions: false }
    );
    paragraphs.push(...imageParagraphs);
  }

  return paragraphs;
}

async function createCompetenciaSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): Promise<Paragraph[]> {
  const main = reportData?.mainDomain;
  const competenciaSection = sections.find(s => s.id === "competencia");
  const images = competenciaSection?.images || [];

  const paragraphs: Paragraph[] = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: "2. Análisis de la competencia", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `El sitio web ${main?.domain || "[DOMINIO]"} mantiene actualmente una presencia digital ${main?.organicTraffic && main.organicTraffic > 100 ? "activa" : "limitada"}, con un Authority Score de ${main?.authorityScore || "[N/D]"}, un volumen de ${main?.organicTraffic || "[N/D]"} visitas orgánicas mensuales y un total de ${main?.organicKeywords || "[N/D]"} palabras clave posicionadas. ${main?.paidTraffic === 0 ? "Aunque no registra tráfico de pago, el" : "El"} dominio cuenta con ${main?.backlinks || "[N/D]"} backlinks procedentes de ${main?.refDomains || "[N/D]"} dominios de referencia.`,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  if (images.length > 0) {
    const imageParagraphs = await createDocxImageParagraphs(
      images.map(img => ({ src: img.src, caption: img.name })),
      { width: 500, height: 300, alignment: AlignmentType.CENTER, includeCaptions: false }
    );
    paragraphs.push(...imageParagraphs);
  }

  return paragraphs;
}

async function createCompetidoresSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): Promise<Paragraph[]> {
  const main = reportData?.mainDomain;
  const competitors = reportData?.competitors || [];
  const comparativaSection = sections.find(s => s.id === "competencia-comparativa");
  const traficoSection = sections.find(s => s.id === "trafico-organico");

  const competitorsList = competitors.slice(0, 3).map(c =>
    `${c.domain} (Authority Score ${c.authorityScore || "N/D"}; ${c.organicTraffic || "N/D"} visitas; ${c.organicKeywords || "N/D"} keywords)`
  ).join(", ");

  const paragraphs: Paragraph[] = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: "2.1 Análisis de la competencia frente a sus competidores", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `En el último trimestre, ${main?.domain || "[DOMINIO]"} mantiene un rendimiento ${main?.organicTraffic && main.organicTraffic > 100 ? "estable" : "limitado"} frente a sus principales competidores del sector. Con un Authority Score de ${main?.authorityScore || "[N/D]"}, un tráfico orgánico de ${main?.organicTraffic || "[N/D]"} visitas mensuales y ${main?.organicKeywords || "[N/D]"} palabras clave posicionadas${competitors.length > 0 ? `, el dominio se compara con competidores como ${competitorsList}` : ""}.`,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  const allImages = [...(comparativaSection?.images || []), ...(traficoSection?.images || [])];
  if (allImages.length > 0) {
    const imageParagraphs = await createDocxImageParagraphs(
      allImages.map(img => ({ src: img.src, caption: img.name })),
      { width: 500, height: 300, alignment: AlignmentType.CENTER, includeCaptions: false }
    );
    paragraphs.push(...imageParagraphs);
  }

  return paragraphs;
}

async function createIndexacionSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): Promise<Paragraph[]> {
  const idx = reportData?.indexation;
  const indexacionSection = sections.find(s => s.id === "indexacion");
  const images = indexacionSection?.images || [];

  const paragraphs: Paragraph[] = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: "3. Indexación y jerarquización del contenido", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `La revisión del sitio muestra una configuración SEO on-page adecuada, con una etiqueta de título optimizada —"${idx?.titleTag || "[TITLE]"}"— que cumple con la longitud recomendada (${idx?.titleLength || "[N/D]"} caracteres).`,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `La meta descripción ofrece un mensaje completo y descriptivo —"${idx?.metaDescription || "[META_DESCRIPTION]"}"— con ${idx?.metaDescriptionLength || "[N/D]"} caracteres.`,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `En cuanto a la jerarquía de encabezados, el sitio presenta un H1: "${idx?.h1 || "[H1]"}". Los H2 organizan los bloques de contenido${idx?.h2List && idx.h2List.length > 0 ? `: ${idx.h2List.slice(0, 5).join(", ")}` : ""}.`,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  if (images.length > 0) {
    const imageParagraphs = await createDocxImageParagraphs(
      images.map(img => ({ src: img.src, caption: img.name })),
      { width: 500, height: 300, alignment: AlignmentType.CENTER, includeCaptions: false }
    );
    paragraphs.push(...imageParagraphs);
  }

  return paragraphs;
}

async function createSeoOnPageSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): Promise<Paragraph[]> {
  const seo = reportData?.seoOnPage;
  const seoSection = sections.find(s => s.id === "seo-onpage");
  const images = seoSection?.images || [];

  const paragraphs: Paragraph[] = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: "Análisis SEO On-Page", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `La revisión de la estructura de enlaces muestra un total de ${seo?.totalLinks || "[N/D]"} enlaces, con una predominancia de enlaces internos (${seo?.internalLinksPercent || "[N/D]"} %). Se detecta un ${seo?.externalFollowPercent || "[N/D]"} % de enlaces externos follow y ${seo?.externalNofollowPercent || "0"} % nofollow.`,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  if (images.length > 0) {
    const imageParagraphs = await createDocxImageParagraphs(
      images.map(img => ({ src: img.src, caption: img.name })),
      { width: 500, height: 300, alignment: AlignmentType.CENTER, includeCaptions: false }
    );
    paragraphs.push(...imageParagraphs);
  }

  return paragraphs;
}

async function createAccesibilidadSection(reportData: EcommerceReportData | null, sections: EcommerceSection[]): Promise<Paragraph[]> {
  const tech = reportData?.technicalSeo;
  const accSection = sections.find(s => s.id === "accesibilidad");
  const images = accSection?.images || [];

  const paragraphs: Paragraph[] = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: "Evaluación de la Indexación y Accesibilidad del Sitio", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Para evaluar la correcta indexación del sitio, se ha llevado a cabo un análisis técnico de los elementos esenciales. Los resultados muestran una configuración sólida y bien alineada con las prácticas recomendadas de SEO técnico.`,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Robots.txt: ", bold: true }),
        new TextRun({ text: tech?.robotsTxt ? "Activo y accesible" : "No detectado" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Sitemap XML: ", bold: true }),
        new TextRun({ text: tech?.sitemapXml || "No detectado" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Etiqueta canónica: ", bold: true }),
        new TextRun({ text: tech?.canonical || "Correctamente definida" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Enlaces rotos: ", bold: true }),
        new TextRun({ text: tech?.brokenLinks === 0 ? "No se encontraron" : `${tech?.brokenLinks} detectados` }),
      ],
      spacing: { after: 200 },
    }),
  ];

  if (images.length > 0) {
    const imageParagraphs = await createDocxImageParagraphs(
      images.map(img => ({ src: img.src, caption: img.name })),
      { width: 500, height: 300, alignment: AlignmentType.CENTER, includeCaptions: false }
    );
    paragraphs.push(...imageParagraphs);
  }

  return paragraphs;
}

export async function generateEcommerceWordWithBlob(
  formData: EcommerceFormData,
  reportData: EcommerceReportData | null,
  sections: EcommerceSection[]
): Promise<{ blob: Blob; filename: string }> {
  const coverSection = await createCoverSection(formData, reportData);
  const keywordsSection = await createKeywordsSection(reportData, sections);
  const competenciaSection = await createCompetenciaSection(reportData, sections);
  const competidoresSection = await createCompetidoresSection(reportData, sections);
  const indexacionSection = await createIndexacionSection(reportData, sections);
  const seoOnPageSection = await createSeoOnPageSection(reportData, sections);
  const accesibilidadSection = await createAccesibilidadSection(reportData, sections);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...coverSection,
          ...keywordsSection,
          ...competenciaSection,
          ...competidoresSection,
          ...indexacionSection,
          ...seoOnPageSection,
          ...accesibilidadSection,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Informe_Trimestral_SEO_${sanitizeFilename(formData.beneficiaryName)}.docx`;

  return { blob, filename };
}
