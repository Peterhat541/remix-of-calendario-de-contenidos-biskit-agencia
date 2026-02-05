import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  CalendarMeta, 
  CalendarMonth, 
  CalendarPost,
  getImageUrl,
  MONTH_NAMES 
} from '@/types/contentCalendar';

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
}

const formatMonthYear = (month: string, year: number | null): string => {
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return year ? `${capitalizedMonth} ${year}` : capitalizedMonth;
};

const formatDateDisplay = (day: number, month: string, year: number | null): string => {
  const monthIndex = MONTH_NAMES.indexOf(month.toLowerCase());
  const dayStr = day.toString().padStart(2, '0');
  const monthStr = (monthIndex + 1).toString().padStart(2, '0');
  return `${dayStr}/${monthStr}/${year || new Date().getFullYear()}`;
};

const getMonthRange = (calendarMeta: CalendarMeta): string => {
  if (!calendarMeta.month_start || !calendarMeta.month_end) return '';
  const [startYear, startMonth] = calendarMeta.month_start.split('-');
  const [endYear, endMonth] = calendarMeta.month_end.split('-');
  const startMonthName = MONTH_NAMES[parseInt(startMonth) - 1];
  const endMonthName = MONTH_NAMES[parseInt(endMonth) - 1];
  return `${startMonthName.charAt(0).toUpperCase() + startMonthName.slice(1)} ${startYear} – ${endMonthName.charAt(0).toUpperCase() + endMonthName.slice(1)} ${endYear}`;
};

function getDaysInMonth(month: string, year: number): number {
  const monthIndex = MONTH_NAMES.indexOf(month.toLowerCase());
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getFirstDayOfWeek(month: string, year: number): number {
  const monthIndex = MONTH_NAMES.indexOf(month.toLowerCase());
  const day = new Date(year, monthIndex, 1).getDay();
  return day === 0 ? 7 : day;
}

function calculateDuration(monthsCount: number): string {
  if (monthsCount === 1) return '1 mes';
  if (monthsCount === 12) return 'un año';
  return `${monthsCount} meses`;
}

function calculatePostsPerMonth(months: CalendarMonth[]): string {
  const postCounts = months.map(m => m.posts.filter(p => p.day_of_month).length);
  const totalPosts = postCounts.reduce((a, b) => a + b, 0);
  
  if (totalPosts === 0) return 'X';
  
  const avgPosts = Math.round(totalPosts / months.length);
  return avgPosts.toString();
}

// Brand colors
const BRAND_PINK = '#ff018b';
const BRAND_PINK_LIGHT = '#fff0f7';
const BRAND_TEAL = '#00c4c2';

function createCoverPage(calendarMeta: CalendarMeta, months: CalendarMonth[]): string {
  const postsPerMonth = calculatePostsPerMonth(months);
  const duration = calculateDuration(months.length);
  const channel = calendarMeta.channel || 'canal';
  const client = calendarMeta.client_name || 'cliente';

  return `
    <div style="
      min-height: 100vh;
      padding: 60px 50px;
      page-break-after: always;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(180deg, #ffffff 0%, ${BRAND_PINK_LIGHT} 100%);
      position: relative;
    ">
      <!-- Header with Logo -->
      <div style="text-align: center; margin-bottom: 50px;">
        <img src="/logo-likearocket.png" style="height: 60px; width: auto; margin-bottom: 30px;" onerror="this.style.display='none'" />
        <h1 style="
          font-size: 32px;
          font-weight: 700;
          color: ${BRAND_PINK};
          margin: 0;
          line-height: 1.3;
          text-transform: uppercase;
          letter-spacing: 2px;
        ">
          Calendario de Contenidos
        </h1>
      </div>

      <!-- Info Cards -->
      <div style="
        background: #ffffff;
        border-radius: 12px;
        padding: 35px 40px;
        margin-bottom: 40px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        border-left: 5px solid ${BRAND_PINK};
      ">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Cliente</div>
            <div style="font-size: 18px; font-weight: 600; color: #1f2937;">${calendarMeta.client_name || "—"}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Marca</div>
            <div style="font-size: 18px; font-weight: 600; color: #1f2937;">${calendarMeta.brand || "—"}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Canal / Plataforma</div>
            <div style="font-size: 18px; font-weight: 600; color: ${BRAND_PINK};">${calendarMeta.channel || "—"}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Periodo</div>
            <div style="font-size: 18px; font-weight: 600; color: #1f2937;">${getMonthRange(calendarMeta) || "—"}</div>
          </div>
        </div>
      </div>

      <!-- Introduction Text -->
      <div style="
        font-size: 14px;
        line-height: 1.9;
        color: #374151;
        text-align: justify;
        padding: 0 10px;
      ">
        <p style="margin-bottom: 18px;">
          En este documento, se detallará el calendario de publicaciones programadas para el <strong style="color: ${BRAND_PINK};">${channel}</strong> de <strong>${client}</strong>. Cada publicación está diseñada estratégicamente para aumentar la visibilidad online, mejorar la interacción con los clientes y promover los servicios de la empresa de forma constante y coherente.
        </p>
        <p style="margin-bottom: 18px;">
          A lo largo del calendario, se incluirán las fechas, el contenido, las imágenes y los mensajes clave de cada publicación, alineados con los objetivos de comunicación de <strong>${client}</strong>.
        </p>
        <p style="margin-bottom: 0;">
          Se publicarán <strong style="color: ${BRAND_PINK};">${postsPerMonth} posts mensuales</strong> durante <strong>${duration}</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div style="
        position: absolute;
        bottom: 40px;
        left: 50px;
        right: 50px;
        text-align: center;
        font-size: 11px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
        padding-top: 20px;
      ">
        Generado con Like a Rocket · ${new Date().toLocaleDateString('es-ES')}
      </div>
    </div>
  `;
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function getFullDateString(day: number, month: string, year: number): string {
  const monthIndex = MONTH_NAMES.indexOf(month.toLowerCase());
  const date = new Date(year, monthIndex, day);
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[monthIndex];
  return `${dayName} ${day} ${monthName} ${year}`;
}

function createMonthCalendarPage(monthData: CalendarMonth, isFirst: boolean): string {
  const year = monthData.year || new Date().getFullYear();
  const daysInMonth = getDaysInMonth(monthData.month, year);
  const firstDayOfWeek = getFirstDayOfWeek(monthData.month, year);
  const postDays = new Set(monthData.posts.filter(p => p.day_of_month).map(p => p.day_of_month));

  const dayHeaders = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  const headerRow = dayHeaders.map(d => 
    `<th style="
      padding: 14px 8px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      background: ${BRAND_PINK};
      letter-spacing: 1px;
    ">${d}</th>`
  ).join('');

  const weeks: string[] = [];
  let currentWeek: string[] = [];

  // Fill empty cells before first day
  for (let i = 1; i < firstDayOfWeek; i++) {
    currentWeek.push(`<td style="padding: 20px; border: 1px solid #e5e7eb; background: #fafafa;"></td>`);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const hasPost = postDays.has(day);
    const bgColor = hasPost ? BRAND_PINK_LIGHT : '#ffffff';
    const borderColor = hasPost ? BRAND_PINK : '#e5e7eb';
    const textColor = '#1f2937';
    const fontWeight = hasPost ? '700' : '500';

    currentWeek.push(`
      <td style="
        padding: 18px 12px;
        text-align: center;
        font-size: 16px;
        font-weight: ${fontWeight};
        border: 2px solid ${borderColor};
        background: ${bgColor};
        color: ${textColor};
        vertical-align: middle;
        position: relative;
      ">
        ${day}
        ${hasPost ? `<div style="
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          background: ${BRAND_PINK};
          border-radius: 50%;
        "></div>` : ''}
      </td>
    `);

    if (currentWeek.length === 7) {
      weeks.push(`<tr>${currentWeek.join('')}</tr>`);
      currentWeek = [];
    }
  }

  // Fill remaining cells
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(`<td style="padding: 20px; border: 1px solid #e5e7eb; background: #fafafa;"></td>`);
    }
    weeks.push(`<tr>${currentWeek.join('')}</tr>`);
  }

  const postsCount = monthData.posts.filter(p => p.day_of_month).length;

  // Only use page-break-before for months after the first one
  const pageBreakStyle = isFirst ? '' : 'page-break-before: always;';

  return `
    <div style="
      min-height: 100vh;
      padding: 50px;
      ${pageBreakStyle}
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: #ffffff;
    ">
      <!-- Month Title -->
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="
          font-size: 42px;
          font-weight: 700;
          color: ${BRAND_PINK};
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 3px;
        ">
          ${formatMonthYear(monthData.month, monthData.year)}
        </h2>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">
          ${postsCount} ${postsCount === 1 ? 'publicación programada' : 'publicaciones programadas'}
        </p>
      </div>
      
      <!-- Calendar Grid -->
      <table style="
        width: 100%;
        border-collapse: collapse;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        border-radius: 12px;
        overflow: hidden;
      ">
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${weeks.join('')}
        </tbody>
      </table>

      <!-- Legend -->
      <div style="
        margin-top: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        font-size: 12px;
        color: #6b7280;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; background: ${BRAND_PINK_LIGHT}; border: 2px solid ${BRAND_PINK}; border-radius: 4px;"></div>
          <span>Día con publicación</span>
        </div>
      </div>
    </div>
  `;
}

function createPostPage(post: CalendarPost, month: string, year: number | null): string {
  const actualYear = year || new Date().getFullYear();
  const imageUrl = getImageUrl(post.image);
  const fullDate = post.day_of_month 
    ? getFullDateString(post.day_of_month, month, actualYear)
    : 'Sin fecha';
  
  const imageHtml = imageUrl ? `
    <img 
      src="${imageUrl}" 
      style="
        max-width: 100%;
        max-height: 420px;
        object-fit: contain;
        display: block;
        margin: 0 auto;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.10);
      "
      onerror="this.style.display='none'"
    />
  ` : `<p style="color: #9ca3af; font-style: italic; text-align: center;">(Sin imagen)</p>`;

  return `
    <div style="
      min-height: 100vh;
      padding: 40px 50px;
      page-break-before: always;
      page-break-inside: avoid;
      break-inside: avoid;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: #ffffff;
    ">
      <!-- BLOQUE 1: FECHA DE PUBLICACIÓN -->
      <div style="margin-bottom: 20px;">
        <div style="
          font-size: 11px;
          font-weight: 700;
          color: ${BRAND_PINK};
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        ">FECHA DE PUBLICACIÓN</div>
        <div style="
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          text-transform: capitalize;
        ">${fullDate}</div>
      </div>

      <!-- BLOQUE 2: POST (IMAGEN) -->
      <div style="margin-bottom: 20px;">
        <div style="
          font-size: 11px;
          font-weight: 700;
          color: ${BRAND_PINK};
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 10px;
        ">POST</div>
        <div style="
          background: #f9fafb;
          border-radius: 8px;
          padding: 15px;
          min-height: 100px;
        ">
          ${imageHtml}
        </div>
      </div>
      
      <!-- BLOQUE 3: TÍTULO DEL POST -->
      <div style="margin-bottom: 20px;">
        <div style="
          font-size: 11px;
          font-weight: 700;
          color: ${BRAND_PINK};
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        ">TÍTULO DEL POST</div>
        <div style="
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.4;
        ">${post.title || '(Sin título)'}</div>
      </div>
      
      <!-- BLOQUE 4: COPY -->
      <div>
        <div style="
          font-size: 11px;
          font-weight: 700;
          color: ${BRAND_PINK};
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        ">COPY</div>
        <div style="
          font-size: 14px;
          color: #374151;
          white-space: pre-wrap;
          line-height: 1.7;
          background: #f9fafb;
          padding: 15px 20px;
          border-radius: 8px;
          border-left: 3px solid ${BRAND_PINK};
        ">${post.copy || '(Sin copy)'}</div>
      </div>
    </div>
  `;
}

export function generateCalendarPdfHTML(calendarMeta: CalendarMeta, months: CalendarMonth[]): string {
  const coverPage = createCoverPage(calendarMeta, months);
  
  let monthPages = '';
  let isFirstMonth = true;
  
  for (const monthData of months) {
    // Add the calendar grid page for this month
    monthPages += createMonthCalendarPage(monthData, isFirstMonth);
    isFirstMonth = false;
    
    // Add individual pages for each post - get ALL posts with day_of_month
    const allPosts = monthData.posts.filter(p => p.day_of_month !== null && p.day_of_month !== undefined);
    const sortedPosts = [...allPosts].sort((a, b) => (a.day_of_month || 0) - (b.day_of_month || 0));
    
    // Debug: log post count
    console.log(`Month ${monthData.month}: ${sortedPosts.length} posts to render`);
    
    for (const post of sortedPosts) {
      monthPages += createPostPage(post, monthData.month, monthData.year);
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { 
          box-sizing: border-box; 
          margin: 0;
          padding: 0;
        }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          background: white;
          color: #1f2937;
          line-height: 1.5;
          font-size: 14px;
        }
        @page { 
          size: A4 portrait;
          margin: 0;
        }
      </style>
    </head>
    <body>
      ${coverPage}
      ${monthPages}
    </body>
    </html>
  `;
}

export async function generateCalendarPDF(
  calendarMeta: CalendarMeta, 
  months: CalendarMonth[],
  returnBlob?: boolean
): Promise<Blob | void> {
  const htmlContent = generateCalendarPdfHTML(calendarMeta, months);
  
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.cssText = `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    color: #1f2937;
    background: white;
    font-size: 14px;
    line-height: 1.6;
  `;

  // Append to document temporarily for rendering
  document.body.appendChild(container);

  // Wait for images to load
  const images = container.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => {
        const parent = img.parentElement;
        if (parent) parent.style.display = 'none';
        resolve();
      };
    });
  });
  await Promise.all(imagePromises);

  const filename = `Calendario_${sanitizeFilename(calendarMeta.client_name || 'contenidos')}_${calendarMeta.month_start}_${calendarMeta.month_end}.pdf`;

  // Find all page elements (each div with min-height: 100vh represents a page)
  const pages = container.querySelectorAll<HTMLElement>(':scope > div');
  
  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    // Render page to canvas
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    
    if (i > 0) {
      pdf.addPage();
    }
    
    // Add image to fill the entire page
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  }

  // Clean up
  document.body.removeChild(container);

  if (returnBlob) {
    return pdf.output('blob');
  } else {
    pdf.save(filename);
  }
}