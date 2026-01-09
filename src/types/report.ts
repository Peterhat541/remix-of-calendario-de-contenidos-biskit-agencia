import { ExtractedImageData } from "./imageAnalysis";

export interface FormData {
  beneficiaryName: string;
  nif: string;
  websiteUrl: string;
  startDate: string;
  endDate: string;
  reportDate: string;
  servicio: string; // e.g. "veterinario", "fisioterapia", "cerrajería"
}

// Generated keyword evolution table data
export interface KeywordEvolutionRow {
  keyword: string;
  valuesByMonth: number[];
  variationText: string;
}

export interface KeywordEvolutionTable {
  months: string[];
  rows: KeywordEvolutionRow[];
  footnote: string;
}

// Section-specific form data
export interface KeywordAnalysisData {
  tool: "semrush" | "sistrix" | "gsc" | "otra";
  activeKeywords: string;
  organicTraffic: string;
  mainKeyword?: string;
  volume?: string;
  kd?: string;
  comment?: string;
}

export interface PositioningEvolutionData {
  periodStart: string;
  periodEnd: string;
  trend: "crece" | "estable" | "desciende";
  peakMonth?: string;
  peakValue?: string;
}

export interface KeywordTableData {
  top3: string;
  top10: string;
  top11_20: string;
  top21_100: string;
}

export interface BacklinksData {
  referenceDomains: string;
  totalBacklinks: string;
  tool: "semrush" | "ahrefs" | "majestic" | "otra";
  note?: string;
}

export interface HierarchyData {
  h1Count?: number;
  h2Count?: number;
  h3Count?: number;
}

export interface IndexingData {
  robotsOk: boolean;
  sitemapOk: boolean;
  canonicalsOk: boolean;
  headingsOk: boolean;
  metaOk: boolean;
  linksOk: boolean;
}

export interface PageSpeedData {
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
}

export interface SectionData {
  keywords?: KeywordAnalysisData;
  positioning?: PositioningEvolutionData;
  keywordTable?: KeywordTableData;
  backlinks?: BacklinksData;
  hierarchy?: HierarchyData;
  indexing?: IndexingData;
  pagespeed?: PageSpeedData;
}

export interface ImageItem {
  id: string;
  src: string;
  caption?: string;
  extractedData?: ExtractedImageData;
}

export interface ReportSection {
  id: string;
  title: string;
  images: ImageItem[];
  data?: SectionData[keyof SectionData];
  editedContent?: string; // Texto editado por el usuario
}

// Estructura oficial Kit Digital Fase II - Texto canónico
// Solo 2 secciones principales: 1. Análisis de Palabras Clave y 2. Indexación y Jerarquización
export const DEFAULT_SECTIONS: ReportSection[] = [
  {
    id: "intro",
    title: "Introducción",
    images: [],
  },
  {
    id: "keywords",
    title: "1. Análisis de Palabras Clave",
    images: [],
    data: {
      tool: "semrush",
      activeKeywords: "",
      organicTraffic: "",
    } as KeywordAnalysisData,
  },
  {
    id: "positioning",
    title: "Evolución del Posicionamiento",
    images: [],
    data: {
      periodStart: "",
      periodEnd: "",
      trend: "crece",
    } as PositioningEvolutionData,
  },
  {
    id: "keywordTable",
    title: "Tabla Evolutiva de Palabras Clave",
    images: [],
    data: {
      top3: "",
      top10: "",
      top11_20: "",
      top21_100: "",
    } as KeywordTableData,
  },
  {
    id: "backlinks",
    title: "Backlinks de Alta Calidad",
    images: [],
    data: {
      referenceDomains: "",
      totalBacklinks: "",
      tool: "semrush",
    } as BacklinksData,
  },
  {
    id: "hierarchy",
    title: "2. Indexación y Jerarquización del Contenido",
    images: [],
    data: {} as HierarchyData,
  },
  {
    id: "indexing",
    title: "Indexación y Aspectos Técnicos",
    images: [],
    data: {
      robotsOk: false,
      sitemapOk: false,
      canonicalsOk: false,
      headingsOk: false,
      metaOk: false,
      linksOk: false,
    } as IndexingData,
  },
  {
    id: "pagespeed",
    title: "Rendimiento y Experiencia de Usuario",
    images: [],
    data: {} as PageSpeedData,
  },
];
