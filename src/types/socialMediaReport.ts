import { ExtractedImageData } from "./imageAnalysis";

export interface SocialMediaFormData {
  beneficiaryName: string;
  nif: string;
  socialNetwork: string; // "Google My Business", "Instagram", "Facebook", "LinkedIn", etc.
  socialNetworkUrl: string;
  startDate: string;
  endDate: string;
  reportDate: string;
}

export interface ImageItem {
  id: string;
  src: string;
  caption?: string;
  extractedData?: ExtractedImageData;
}

export interface MonthlyPublications {
  monthName: string; // e.g., "Junio 2025"
  images: ImageItem[];
}

export interface SocialMediaMetricsData {
  // Datos extraídos de las capturas de métricas
  profileInteractions?: number | null;
  calls?: number | null;
  directionsRequests?: number | null;
  websiteClicks?: number | null;
  // Datos mensuales
  monthlyData?: {
    month: string;
    interactions?: number | null;
    calls?: number | null;
    directions?: number | null;
    clicks?: number | null;
  }[];
}

export interface SocialMediaReport {
  formData: SocialMediaFormData;
  publications: MonthlyPublications[];
  metricsImages: ImageItem[];
  metricsData?: SocialMediaMetricsData;
  editedContent?: string; // Texto narrativo editado por el usuario
}

// Obtener los 3 meses anteriores a la fecha fin
export function getLastThreeMonths(endDateString: string): string[] {
  if (!endDateString) return ["Mes 1", "Mes 2", "Mes 3"];
  
  const endDate = new Date(endDateString);
  const months: string[] = [];
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  // Get the 3 months before the end date (not including the end month)
  for (let i = 3; i >= 1; i--) {
    const date = new Date(endDate);
    date.setMonth(date.getMonth() - i);
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    months.push(`${monthName} ${year}`);
  }
  
  return months;
}

// Inicializar publicaciones vacías
export function initializePublications(endDateString: string): MonthlyPublications[] {
  const months = getLastThreeMonths(endDateString);
  return months.map(monthName => ({
    monthName,
    images: [],
  }));
}
