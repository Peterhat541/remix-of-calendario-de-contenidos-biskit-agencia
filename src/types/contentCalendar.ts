export interface PostImage {
  source: 'none' | 'clipboard' | 'file';
  clipboard_data_url: string;
  file_url: string;
}

export interface CalendarPost {
  id: string;
  day_of_month: number | null;
  image: PostImage;
  title: string;
  copy: string;
}

export interface CalendarMonth {
  month: string;
  year: number | null;
  posts_count: number;
  posts: CalendarPost[];
}

export interface CalendarMeta {
  client_name: string;
  brand: string;
  channel: string;
  month_start: string;
  month_end: string;
  timezone: string;
  language: string;
}

export interface RenderOptions {
  preview: {
    enabled: boolean;
    mode: string;
  };
  pdf: {
    enabled: boolean;
    page_size: string;
    orientation: string;
  };
}

export interface CalendarTemplateResponse {
  ok: boolean;
  version: string;
  calendar: CalendarMeta;
  months: CalendarMonth[];
  render: RenderOptions;
  errors: string[];
}

export interface CalendarFormData {
  clientName: string;
  brand: string;
  channel: string;
  monthStart: string;
  monthEnd: string;
}

export const AVAILABLE_CHANNELS = [
  'Instagram',
  'Facebook',
  'LinkedIn',
  'Twitter/X',
  'TikTok',
  'Google Business Profile',
];

export const DEFAULT_CHANNEL = 'Instagram';

export const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export const MONTH_NAMES_CAPITALIZED = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function generateMonthsArray(monthStart: string, monthEnd: string): CalendarMonth[] {
  if (!monthStart || !monthEnd) return [];
  
  const months: CalendarMonth[] = [];
  const [startYear, startMonth] = monthStart.split('-').map(Number);
  const [endYear, endMonth] = monthEnd.split('-').map(Number);
  
  let currentYear = startYear;
  let currentMonth = startMonth;
  
  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    months.push({
      month: MONTH_NAMES[currentMonth - 1],
      year: currentYear,
      posts_count: 0,
      posts: []
    });
    
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  return months;
}

export function createEmptyPost(): CalendarPost {
  return {
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    day_of_month: null,
    image: {
      source: 'none',
      clipboard_data_url: '',
      file_url: ''
    },
    title: '',
    copy: ''
  };
}

export function getDaysInMonth(month: string, year: number): number {
  const monthIndex = MONTH_NAMES.indexOf(month.toLowerCase());
  if (monthIndex === -1) return 31;
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getImageUrl(image: PostImage): string {
  if (image.source === 'clipboard') return image.clipboard_data_url;
  if (image.source === 'file') return image.file_url;
  return '';
}

export function formatMonthYear(month: string, year: number | null): string {
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return year ? `${capitalizedMonth} ${year}` : capitalizedMonth;
}

export function formatDateFull(day: number, month: string, year: number): string {
  const monthIndex = MONTH_NAMES.indexOf(month.toLowerCase());
  const dayStr = day.toString().padStart(2, '0');
  const monthStr = (monthIndex + 1).toString().padStart(2, '0');
  return `${dayStr}/${monthStr}/${year}`;
}

export function buildFullTemplateJSON(
  calendarMeta: CalendarMeta,
  months: CalendarMonth[]
): CalendarTemplateResponse {
  return {
    ok: true,
    version: 'calendar_template_v2',
    calendar: calendarMeta,
    months: months.map(m => ({
      ...m,
      posts: m.posts.map(({ id, ...rest }) => ({ id, ...rest }))
    })),
    render: {
      preview: { enabled: true, mode: 'html' },
      pdf: { enabled: true, page_size: 'A4', orientation: 'portrait' }
    },
    errors: []
  };
}
