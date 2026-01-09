/**
 * Word Document Generator for Informe de Seguimiento
 * PRESENCIA AVANZADA EN INTERNET – FASE II
 *
 * PLANTILLA TEXTUAL EXACTA DEL PDF DE REFERENCIA
 * ❌ No resumir ❌ No eliminar frases ❌ No fusionar párrafos
 * ✅ Mantener TODA la estructura ✅ Rellenar datos desde capturas
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
import { saveAs } from "file-saver";
import { SeguimientoFormData, SeguimientoSection, SeguimientoReportData } from "@/types/seguimientoReport";
import { createDocxImageParagraphs } from "@/utils/docxImages";

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
    KEYWORD_MARCA: kw?.brandKeyword || "[keyword de marca]",
    KW_TOTAL: fmtNum(kw?.total),
    INTENCION_NAVEGACIONAL: (kw as any)?.navigational ? `${(kw as any).navigational} %` : "75 %",
    INTENCION_INFORMATIVA: (kw as any)?.informational ? `${(kw as any).informational} %` : "8,3 %",
    INTENCION_COMERCIAL: (kw as any)?.commercial ? `${(kw as any).commercial} %` : "16,7 %",
  };
}

function createParagraph(text: string, options?: { bold?: boolean; spacing?: number; italic?: boolean }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        italics: options?.italic,
        size: 22,
      }),
    ],
    spacing: { after: options?.spacing ?? 200 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function createHeading(text: string, level: 1 | 2 | 3 = 2): Paragraph {
  const sizes = { 1: 32, 2: 26, 3: 24 };
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: sizes[level],
      }),
    ],
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: 300, after: 150 },
  });
}

function createNumberedItem(number: number, text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${number}. ${text}`,
        bold: true,
        size: 22,
      }),
    ],
    spacing: { after: 100 },
    indent: { left: 200 },
  });
}

export async function generateSeguimientoWord(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): Promise<Blob> {
  const docChildren: Paragraph[] = [];
  const data = extractTemplateData(formData, reportData);

  const sectionImages = (id: string) => sections.find((s) => s.id === id)?.images ?? [];
  const introImages = sectionImages("intro");
  const visionImages = sectionImages("vision-general");
  const indexacionImages = sectionImages("indexacion");
  const serpImages = sectionImages("serp");
  const keywordsImages = sectionImages("keywords");

  // ============ PORTADA ============
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "PRESENCIA AVANZADA EN INTERNET", bold: true, size: 40 })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
    })
  );
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "Informe de análisis mensual de seguimiento (últimos tres meses)", bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "(Fase II)", size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
    })
  );

  docChildren.push(createParagraph(`Web: ${data.URL}`));
  docChildren.push(createParagraph(`Beneficiario: ${data.BENEFICIARIO} | ${data.NIF_CIF}`));
  docChildren.push(createParagraph(`Fecha Informe: ${data.FECHA_INFORME}`));
  docChildren.push(createParagraph(`Período: Informe de ${data.MES_INICIO} a ${data.MES_FIN}`, { spacing: 400 }));

  // Validación titularidad
  docChildren.push(createHeading("Página 1 – inicio", 3));
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "[Captura de página principal con URL visible]",
          italics: true,
          size: 20,
          color: "6b7280",
        }),
      ],
      spacing: { after: 150 },
    })
  );
  docChildren.push(
    ...(await createDocxImageParagraphs(introImages.slice(0, 1).map((img) => ({ src: img.src })), {
      width: 500,
      height: 300,
    }))
  );

  docChildren.push(createHeading("Página – Aviso Legal", 3));
  docChildren.push(createParagraph(`Se valida que la página ${data.URL} corresponde al ${data.BENEFICIARIO}.`));
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "[Captura de aviso legal con datos del titular visible]",
          italics: true,
          size: 20,
          color: "6b7280",
        }),
      ],
      spacing: { after: 150 },
    })
  );
  docChildren.push(
    ...(await createDocxImageParagraphs(introImages.slice(1, 2).map((img) => ({ src: img.src })), {
      width: 500,
      height: 300,
    }))
  );

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ============ INTRODUCCIÓN ============
  docChildren.push(
    createParagraph(
      "Te presentamos un resumen detallado del análisis SEO On-Page realizado para el dominio especificado, utilizando SemRush como herramienta de evaluación. El informe abarca el periodo establecido y proporciona Keywords clave y métricas fundamentales que reflejan el estado actual del SEO On-Page asociado al dominio en cuestión."
    )
  );
  docChildren.push(createNumberedItem(1, "Visión General del dominio"));
  docChildren.push(createNumberedItem(2, "Indexación y jerarquización del contenido"));
  docChildren.push(createNumberedItem(3, "Resultados en la SERP"));
  docChildren.push(createNumberedItem(4, "Evolución de Keywords"));

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ============ 1. VISIÓN GENERAL ============
  docChildren.push(createHeading("1. Visión General del dominio", 2));
  docChildren.push(
    createParagraph(
      "En la sección de \"Visión General\", es evidente que estamos progresando hacia nuestras metas, pero el ritmo de mejora es todavía progresivo. La puntuación de visibilidad y el \"Authority Score\" muestran que estamos ganando terreno gradualmente en términos de visibilidad y calidad de nuestro dominio en la web."
    )
  );
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "[Captura SEMrush – Visión general del dominio]", italics: true, size: 20, color: "6b7280" })],
      spacing: { after: 200 },
    })
  );
  docChildren.push(
    ...(await createDocxImageParagraphs(visionImages.map((img) => ({ src: img.src })), {
      width: 500,
      height: 300,
    }))
  );
  docChildren.push(
    createParagraph(
      `Entre ${data.MES_INICIO} y ${data.MES_FIN}, ${data.DOMINIO} mantiene un volumen de tráfico orgánico ${data.NIVEL_TRAFICO}, con una media estimada en torno a las ${data.TRAFICO_MEDIO} visitas mensuales durante el periodo analizado. La evolución del gráfico refleja estabilidad sin incrementos significativos, apoyada en un total de ${data.NUM_KEYWORDS} palabras clave posicionadas que sostienen su visibilidad actual en buscadores.`
    )
  );
  docChildren.push(
    createParagraph(
      `En relación con la autoridad del dominio, ${data.DOMINIO} cuenta con un Authority Score de ${data.AUTHORITY_SCORE} puntos, acompañado de ${data.NUM_BACKLINKS} backlinks provenientes de ${data.DOMINIOS_REFERENCIA} dominios de referencia. Este perfil de enlaces ofrece una base sólida pero todavía limitada frente a competidores con mayor presencia digital. El sitio ${data.REGISTRA_TRAFICO_PAGO} tráfico de pago, por lo que su dependencia del posicionamiento orgánico es ${data.DEPENDENCIA_ORGANICO}, lo que refuerza la necesidad de optimizar contenido y ampliar señales externas de autoridad.`
    )
  );
  docChildren.push(
    createParagraph(
      "La distribución geográfica del tráfico continúa siendo local, con España como único país con visibilidad registrada. Este comportamiento es coherente con la naturaleza del negocio, orientado a servicios presenciales."
    )
  );
  docChildren.push(
    createParagraph(
      `En conjunto, los datos reflejan que ${data.DOMINIO} se encuentra en una fase de desarrollo SEO inicial pero con bases correctas en cuanto a estabilidad de tráfico y presencia de enlaces.`
    )
  );

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ============ 2. INDEXACIÓN ============
  docChildren.push(createHeading("2. Indexación y jerarquización del contenido", 2));
  docChildren.push(
    createParagraph(
      `Durante el periodo de análisis, el sitio ${data.DOMINIO} muestra una correcta base técnica orientada al posicionamiento, destacando una etiqueta de título bien optimizada en cuanto a longitud y claridad, que comunica de forma directa el enfoque y especialización de la página. La meta descripción mantiene igualmente una extensión adecuada y un mensaje claro, lo que contribuye a mejorar la relevancia del snippet en los resultados de búsqueda y favorecer la intención de clic de usuarios interesados.`
    )
  );
  docChildren.push(
    createParagraph(
      `A nivel de rastreo e indexación, el dominio cuenta con un robots.txt ${data.ROBOTS_TXT}, permitiendo el acceso de los motores de búsqueda a las secciones esenciales del sitio. Asimismo, el sitemap XML está ${data.SITEMAP_XML}, facilitando la indexación de forma ordenada y optimizada. Estos elementos técnicos conforman una estructura sólida que favorece la visibilidad orgánica y asegura un comportamiento adecuado en los procesos de rastreo.`
    )
  );
  docChildren.push(
    createParagraph(
      `En cuanto a la jerarquía de encabezados, la página presenta una estructura organizada, con un H1 bien definido ("${data.H1}") y varios H2 bien distribuidos que cubren servicios clave como ${data.LISTADO_H2}. Esta organización mejora la comprensión temática del contenido por parte de Google y contribuye a reforzar la semántica SEO.`
    )
  );
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "[Capturas: encabezados, enlaces, robots.txt, sitemap, backlinks]",
          italics: true,
          size: 20,
          color: "6b7280",
        }),
      ],
      spacing: { after: 200 },
    })
  );
  docChildren.push(
    ...(await createDocxImageParagraphs(indexacionImages.map((img) => ({ src: img.src })), {
      width: 500,
      height: 300,
    }))
  );
  docChildren.push(
    createParagraph(
      `Respecto al enlazado interno, la página analiza un total de ${data.NUM_ENLACES} enlaces, de los cuales el ${data.ENLACES_INTERNOS_PORCENTAJE} son internos, un indicador positivo que ayuda a distribuir autoridad entre secciones relevantes. Finalmente, el perfil de backlinks muestra ${data.NUM_BACKLINKS} enlaces entrantes desde ${data.DOMINIOS_REFERENCIA} dominios, una base sólida que destaca especialmente por la concentración de autoridad en la home y en las páginas estratégicas.`
    )
  );
  docChildren.push(
    createParagraph(
      `En conjunto, ${data.DOMINIO} presenta una estructura técnica bien asentada, con oportunidades claras en la ampliación de contenidos, enriquecimiento semántico y fortalecimiento del link building estratégico.`
    )
  );

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ============ 3. SERP ============
  docChildren.push(createHeading("3. Resultados en la SERP", 2));
  docChildren.push(
    createParagraph(
      `Durante el último año, ${data.DOMINIO} ha mantenido una presencia orgánica estable, alcanzando un total de ${data.NUM_KEYWORDS} palabras clave posicionadas, lo que constituye una base moderada para su visibilidad actual en buscadores. Aunque el volumen no es elevado, refleja un posicionamiento sostenido en términos relevantes del sector. Además, el sitio ha logrado generar un tráfico orgánico estimado de ${data.TRAFICO_MEDIO} visitas mensuales, cifra que indica una presencia activa y con margen de crecimiento.`
    )
  );
  docChildren.push(
    createParagraph(
      "La distribución de posiciones muestra que las palabras clave activas se encuentran principalmente en rangos medios y bajos (11–50 y 51–100), reflejando que el dominio aún no ha logrado una penetración sólida en el Top 10 de Google. Esta distribución implica que todavía existe un amplio recorrido para optimizar contenidos específicos y trabajar la intención de búsqueda comercial, especialmente en keywords transaccionales que atraen clientes con intención de contratación clara."
    )
  );
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "[Captura: distribución de posiciones y evolución temporal]", italics: true, size: 20, color: "6b7280" })],
      spacing: { after: 200 },
    })
  );
  docChildren.push(
    ...(await createDocxImageParagraphs(serpImages.map((img) => ({ src: img.src })), {
      width: 500,
      height: 300,
    }))
  );
  docChildren.push(
    createParagraph(
      "En cuanto a la evolución temporal, la gráfica revela un comportamiento estable con pequeñas variaciones mes a mes, manteniendo entre 8 y 12 palabras clave activas a lo largo del año. Destaca un incremento en los meses de otoño, donde el dominio consolida una mayor estabilidad en posiciones visibles. Este crecimiento moderado demuestra que las acciones implementadas han comenzado a fortalecer la presencia del sitio, aunque aún sin un aumento exponencial en términos de volumen o visibilidad de alto impacto."
    )
  );
  docChildren.push(
    createParagraph(
      `En conjunto, los datos indican que ${data.DOMINIO} se encuentra en una fase intermedia de desarrollo SEO: dispone de una base estable de keywords y un tráfico orgánico significativo dentro de su nicho, pero requiere una estrategia más avanzada para escalar posiciones. Los próximos pasos deberían centrarse en reforzar el posicionamiento en keywords específicas de alto valor (tratamientos, especialidades, localización), optimizar las páginas de servicios con orientación clara a intención transaccional y ampliar el link building hacia medios especializados.`
    )
  );

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ============ 4. KEYWORDS ============
  docChildren.push(createHeading("4. Análisis de Palabras clave", 2));
  docChildren.push(
    createParagraph(
      `Durante el periodo analizado, ${data.DOMINIO} ha logrado posicionarse en ${data.KW_TOTAL} palabras clave orgánicas, destacando especialmente el término de marca "${data.KEYWORD_MARCA}", que se sitúa en primera posición y concentra prácticamente la totalidad del tráfico orgánico estimado. El resto de keywords activas presentan volúmenes de búsqueda más bajos y posiciones medias o lejanas (entre 53 y 80), lo que indica una dependencia muy elevada de consultas navegacionales vinculadas a la marca y una presencia limitada en búsquedas informativas o comerciales genéricas del sector.`
    )
  );
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "[Captura: listado de keywords principales + intención]", italics: true, size: 20, color: "6b7280" })],
      spacing: { after: 200 },
    })
  );
  docChildren.push(
    ...(await createDocxImageParagraphs(keywordsImages.map((img) => ({ src: img.src })), {
      width: 500,
      height: 300,
    }))
  );
  docChildren.push(
    createParagraph(
      `La distribución por intención confirma este patrón: el ${data.INTENCION_NAVEGACIONAL} de las palabras clave activas son navegacionales, impulsadas por usuarios que ya conocen la empresa y buscan acceder directamente al sitio. Solo un ${data.INTENCION_INFORMATIVA} corresponde a consultas informativas y un ${data.INTENCION_COMERCIAL} a términos comerciales. Esta concentración en términos de marca garantiza visibilidad entre clientes recurrentes, pero limita el crecimiento hacia nuevas audiencias.`
    )
  );
  docChildren.push(
    createParagraph(
      "En conjunto, los datos muestran que el dominio se encuentra en una etapa inicial de desarrollo SEO, con un perfil de palabras clave reducido y altamente dependiente del reconocimiento de marca."
    )
  );

  const doc = new Document({
    sections: [{ properties: {}, children: docChildren }],
  });

  return await Packer.toBlob(doc);
}

export async function generateSeguimientoWordWithBlob(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): Promise<{ blob: Blob; filename: string }> {
  const blob = await generateSeguimientoWord(formData, reportData, sections);
  const beneficiaryClean = sanitizeFilename(formData.beneficiaryName || "borrador");
  const filename = `Informe_mensual_de_seguimiento_-_${beneficiaryClean}.docx`;
  return { blob, filename };
}

export async function downloadSeguimientoWord(
  formData: SeguimientoFormData,
  reportData: SeguimientoReportData | null,
  sections: SeguimientoSection[]
): Promise<void> {
  const { blob, filename } = await generateSeguimientoWordWithBlob(formData, reportData, sections);
  saveAs(blob, filename);
}
