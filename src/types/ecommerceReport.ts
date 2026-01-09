/**
 * Types for Informe Trimestral de Seguimiento del SEO (eCommerce)
 * Fase II – Presencia Avanzada en Internet
 */

export interface EcommerceFormData {
  beneficiaryName: string;
  websiteUrl: string;
  reportDate: string;
  serviceStart: string;
  serviceEnd: string;
}

export interface EcommerceImage {
  id: string;
  src: string;
  name: string;
}

export interface EcommerceSection {
  id: string;
  title: string;
  description: string;
  images: EcommerceImage[];
  maxImages: number;
}

export const DEFAULT_ECOMMERCE_SECTIONS: EcommerceSection[] = [
  {
    id: "keywords",
    title: "1. Análisis de Palabras Clave",
    description: "Capturas de listado de keywords, volumen de búsqueda, tendencia, competición",
    images: [],
    maxImages: 999,
  },
  {
    id: "competencia",
    title: "2. Análisis de la Competencia",
    description: "Visión general del dominio: Authority Score, tráfico orgánico, keywords, backlinks, dominios de referencia",
    images: [],
    maxImages: 999,
  },
  {
    id: "competencia-comparativa",
    title: "2.1. Comparativa frente a Competidores",
    description: "Capturas mensuales comparando dominio vs competidores (uno por mes del trimestre)",
    images: [],
    maxImages: 999,
  },
  {
    id: "trafico-organico",
    title: "2.2. Tráfico Orgánico vs Competencia",
    description: "Gráfica de tráfico orgánico y superposición de palabras clave",
    images: [],
    maxImages: 999,
  },
  {
    id: "indexacion",
    title: "3. Indexación y Jerarquización del Contenido",
    description: "Etiqueta de título, meta descripción, vista previa de Google, encabezados H1/H2/H3",
    images: [],
    maxImages: 999,
  },
  {
    id: "seo-onpage",
    title: "4. Análisis SEO On-Page",
    description: "Enlaces en página (internos, externos follow, nofollow)",
    images: [],
    maxImages: 999,
  },
  {
    id: "accesibilidad",
    title: "5. Evaluación de Indexación y Accesibilidad",
    description: "Resolver URL, robots.txt, sitemap XML, etiquetas canónicas, hreflang, enlaces rotos",
    images: [],
    maxImages: 999,
  },
];

export interface EcommerceReportData {
  // Período detectado
  detectedPeriod: {
    start: string;
    end: string;
    months: string[];
  } | null;

  // Keywords
  keywords: {
    list: Array<{
      keyword: string;
      avgVolume: number | null;
      trend: string | null;
      competition: string | null;
    }>;
    summary: string | null;
  } | null;

  // Dominio principal
  mainDomain: {
    domain: string;
    authorityScore: number | null;
    organicTraffic: number | null;
    organicKeywords: number | null;
    backlinks: number | null;
    refDomains: number | null;
    paidTraffic: number | null;
    trafficShare: string | null;
  } | null;

  // Competidores
  competitors: Array<{
    domain: string;
    authorityScore: number | null;
    organicTraffic: number | null;
    organicKeywords: number | null;
    backlinks: number | null;
    refDomains: number | null;
  }>;

  // Superposición de keywords
  keywordOverlap: {
    mainCount: number | null;
    competitors: Array<{ domain: string; count: number }>;
  } | null;

  // Indexación
  indexation: {
    titleTag: string | null;
    titleLength: number | null;
    metaDescription: string | null;
    metaDescriptionLength: number | null;
    h1: string | null;
    h2List: string[];
    h3List: string[];
  } | null;

  // SEO On-Page
  seoOnPage: {
    totalLinks: number | null;
    internalLinksPercent: number | null;
    externalFollowPercent: number | null;
    externalNofollowPercent: number | null;
  } | null;

  // Accesibilidad técnica
  technicalSeo: {
    urlResolution: boolean;
    robotsTxt: boolean;
    sitemapXml: string | null;
    canonical: string | null;
    robotsMeta: string | null;
    hreflangTags: Array<{ url: string; lang: string }>;
    brokenLinks: number | null;
  } | null;

  // Datos faltantes
  missing: string[];
}
