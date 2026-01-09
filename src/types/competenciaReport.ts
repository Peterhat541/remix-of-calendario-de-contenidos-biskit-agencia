/**
 * Types for Informe Mensual de Competencia
 * Presencia Avanzada en Internet – Fase II
 */

export interface CompetenciaFormData {
  beneficiaryName: string;
  nif: string;
  websiteUrl: string;
  servicio: string;
  startDate: string;
  endDate: string;
  reportDate: string;
}

// Bloque 1: Introducción (2 capturas)
export interface IntroBlock {
  images: CompetenciaImage[];
}

// Bloque 2: Visión General por mes (3-4 capturas)
export interface VisionGeneralMonth {
  month: string; // e.g. "Enero 2025"
  year: number;
  image: CompetenciaImage;
  interpretation: string;
}

export interface VisionGeneralBlock {
  months: VisionGeneralMonth[];
  // Datos extraídos de las capturas
  metrics: CompetenciaMetrics | null;
}

// Bloque 3: Tráfico Orgánico vs Competencia
export interface TraficoCompetenciaBlock {
  images: CompetenciaImage[];
  periodAnalyzed: string;
  trafficEvolution: string;
  competitorComparison: string;
  keywordOverlap: string;
  opportunities: string;
  conclusion: string;
}

export interface CompetenciaImage {
  id: string;
  src: string;
  caption?: string;
  monthLabel?: string; // Para identificar a qué mes pertenece
}

export interface CompetenciaMetrics {
  // Del dominio principal
  authorityScore: number | null;
  organicTraffic: number | null;
  organicKeywords: number | null;
  backlinks: number | null;
  refDomains: number | null;
  trafficShare: number | null;
  // Competidores detectados
  competitors: CompetitorData[];
}

export interface CompetitorData {
  domain: string;
  authorityScore: number | null;
  organicTraffic: number | null;
  organicKeywords: number | null;
  backlinks: number | null;
  refDomains: number | null;
  trafficShare: number | null;
}

// Datos extraídos por vision-extract
export interface CompetenciaReportData {
  // Período detectado de las capturas
  detectedPeriod: {
    start: string | null;
    end: string | null;
    months: string[];
  };
  // Datos por mes
  monthlyData: MonthlyCompetenciaData[];
  // Datos agregados
  mainDomain: {
    domain: string | null;
    authorityScore: number | null;
    organicTraffic: number | null;
    organicKeywords: number | null;
    backlinks: number | null;
    refDomains: number | null;
  };
  // Competidores
  competitors: CompetitorData[];
  // Superposición de keywords
  keywordOverlap: {
    shared: number | null;
    unique: number | null;
    missing: number | null;
    opportunities: string[];
  };
  // Evolución de tráfico
  trafficEvolution: {
    mainDomainRange: { min: number | null; max: number | null };
    competitorRanges: Array<{ domain: string; min: number | null; max: number | null; peak: number | null }>;
  };
  // Secciones faltantes
  missing: string[];
}

export interface MonthlyCompetenciaData {
  month: string;
  year: number;
  authorityScore: number | null;
  organicTraffic: number | null;
  organicKeywords: number | null;
  trafficShare: number | null;
}

// Secciones del formulario
export interface CompetenciaSection {
  id: 'intro' | 'vision-general' | 'trafico-competencia';
  title: string;
  images: CompetenciaImage[];
  monthLabels?: string[]; // Para vision-general
}

export const DEFAULT_COMPETENCIA_SECTIONS: CompetenciaSection[] = [
  {
    id: 'intro',
    title: 'Introducción',
    images: [],
  },
  {
    id: 'vision-general',
    title: '1. Visión General del Dominio frente a la Competencia',
    images: [],
    monthLabels: [],
  },
  {
    id: 'trafico-competencia',
    title: '2. Tráfico Orgánico frente a la Competencia',
    images: [],
  },
];
