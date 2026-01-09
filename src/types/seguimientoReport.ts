/**
 * Types for Informe de Seguimiento
 * PRESENCIA AVANZADA EN INTERNET – Fase II
 */

export interface SeguimientoFormData {
  beneficiaryName: string;
  nif: string;
  websiteUrl: string;
  reportDate: string;
}

export interface SeguimientoImage {
  id: string;
  src: string;
  name: string;
}

export interface SeguimientoSection {
  id: string;
  title: string;
  description: string;
  images: SeguimientoImage[];
  maxImages: number;
}

export const DEFAULT_SEGUIMIENTO_SECTIONS: SeguimientoSection[] = [
  {
    id: "intro",
    title: "Introducción",
    description: "Página principal del sitio y aviso legal / información del titular",
    images: [],
    maxImages: 999,
  },
  {
    id: "vision-general",
    title: "1. Visión General del dominio",
    description: "Captura de SEMrush – Visión general del dominio",
    images: [],
    maxImages: 999,
  },
  {
    id: "indexacion",
    title: "2. Indexación y jerarquización",
    description: "Capturas de encabezados, enlaces, robots.txt, sitemap",
    images: [],
    maxImages: 999,
  },
  {
    id: "serp",
    title: "3. Resultados en la SERP",
    description: "Captura de distribución de posiciones",
    images: [],
    maxImages: 999,
  },
  {
    id: "keywords",
    title: "4. Evolución de Keywords",
    description: "Listado de keywords + intención de búsqueda",
    images: [],
    maxImages: 999,
  },
];

export interface SeguimientoReportData {
  detectedPeriod: {
    start: string;
    end: string;
    months: string[];
  } | null;
  mainDomain: {
    domain: string;
    authorityScore: number | null;
    organicTraffic: number | null;
    organicKeywords: number | null;
    backlinks: number | null;
    refDomains: number | null;
    paidTraffic: boolean;
  } | null;
  indexation: {
    h1: string | null;
    h2List: string[];
    robotsTxt: boolean;
    sitemapXml: boolean;
    totalLinks: number | null;
    internalLinks: number | null;
    externalLinks: number | null;
  } | null;
  serp: {
    top3: number | null;
    top10: number | null;
    top20: number | null;
    top50: number | null;
    top100: number | null;
  } | null;
  keywords: {
    total: number | null;
    brandKeyword: string | null;
    navigational: number | null;
    informational: number | null;
    commercial: number | null;
    transactional: number | null;
  } | null;
  missing: string[];
}
