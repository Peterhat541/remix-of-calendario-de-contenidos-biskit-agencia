import { SocialMediaFormData, SocialMediaMetricsData } from "@/types/socialMediaReport";
import { ExtractedImageData } from "@/types/imageAnalysis";

function formatDateSpanish(dateString: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getMonthName(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  return monthNames[date.getMonth()];
}

function getYear(dateString: string): string {
  if (!dateString) return "";
  return new Date(dateString).getFullYear().toString();
}

// Extraer datos de métricas de las capturas
export function extractMetricsFromImages(images: { extractedData?: ExtractedImageData }[]): SocialMediaMetricsData {
  const metricsData: SocialMediaMetricsData = {
    profileInteractions: null,
    calls: null,
    directionsRequests: null,
    websiteClicks: null,
    monthlyData: [],
  };

  // Consolidar datos de todas las capturas
  for (const img of images) {
    if (!img.extractedData) continue;
    
    const data = img.extractedData;
    
    // Buscar en evidence los valores de métricas de redes sociales
    for (const evidence of data.evidence || []) {
      const field = evidence.field.toLowerCase();
      const rawText = evidence.raw_text;
      
      // Intentar extraer números del texto
      const numMatch = rawText?.match(/[\d,.]+/);
      const numValue = numMatch ? parseInt(numMatch[0].replace(/[,.]/g, "")) : null;
      
      if (field.includes("interaction") || field.includes("interaccion")) {
        metricsData.profileInteractions = numValue;
      }
      if (field.includes("call") || field.includes("llamada")) {
        metricsData.calls = numValue;
      }
      if (field.includes("direction") || field.includes("como llegar") || field.includes("ruta")) {
        metricsData.directionsRequests = numValue;
      }
      if (field.includes("click") || field.includes("web") || field.includes("sitio")) {
        metricsData.websiteClicks = numValue;
      }
    }
  }

  return metricsData;
}

export function generateSocialMediaMetricsText(
  formData: SocialMediaFormData,
  metricsData: SocialMediaMetricsData,
  monthNames: string[]
): string {
  const beneficiary = formData.beneficiaryName || "[Nombre del beneficiario]";
  const socialNetwork = formData.socialNetwork || "[Red social]";
  const startDate = formatDateSpanish(formData.startDate);
  const endDate = formatDateSpanish(formData.endDate);
  const period = `${startDate} – ${endDate}`;
  
  // Valores extraídos o placeholders
  const interactions = metricsData.profileInteractions !== null 
    ? metricsData.profileInteractions.toLocaleString("es-ES") 
    : "N/D";
  const calls = metricsData.calls !== null 
    ? metricsData.calls.toLocaleString("es-ES") 
    : "N/D";
  const directions = metricsData.directionsRequests !== null 
    ? metricsData.directionsRequests.toLocaleString("es-ES") 
    : "N/D";
  const clicks = metricsData.websiteClicks !== null 
    ? metricsData.websiteClicks.toLocaleString("es-ES") 
    : "N/D";

  // Construir los párrafos mensuales
  const monthParagraphs = monthNames.map((month, index) => {
    const monthNumber = index + 1;
    return `<p style="margin-bottom: 12px;">
Durante el mes de <strong>${month}</strong>, el perfil de ${socialNetwork} de ${beneficiary} ha registrado actividad relevante en términos de interacción con usuarios potenciales. Las métricas obtenidas reflejan el alcance y la efectividad de las publicaciones realizadas durante este periodo, consolidando la presencia digital del negocio en la plataforma y facilitando la conexión con clientes interesados en los servicios ofrecidos.
</p>`;
  }).join("\n");

  return `
<p style="margin-bottom: 12px;">
El presente informe recoge el análisis de la actividad y métricas del perfil de <strong>${socialNetwork}</strong> de <strong>${beneficiary}</strong> durante el periodo comprendido entre ${period}. Durante este intervalo, se ha llevado a cabo un seguimiento exhaustivo de las interacciones generadas por el perfil, así como de las acciones directas de los usuarios que han derivado en contacto con el negocio.
</p>

<p style="margin-bottom: 12px;">
Las gráficas extraídas de las herramientas de análisis de ${socialNetwork} muestran la evolución de las principales métricas de rendimiento del perfil. A continuación, se detallan los resultados obtenidos durante los meses correspondientes al periodo de prestación del servicio, evidenciando la efectividad de la estrategia de publicación y gestión de contenidos implementada.
</p>

${monthParagraphs}

<p style="margin-bottom: 12px;">
En cuanto a las métricas globales del periodo analizado, el perfil ha registrado un total de <strong>${interactions}</strong> interacciones con el perfil de empresa, lo que incluye visualizaciones del perfil, búsquedas directas y descubrimientos a través de la plataforma. Esta cifra refleja el nivel de visibilidad alcanzado y el interés generado entre los usuarios de ${socialNetwork}.
</p>

<p style="margin-bottom: 12px;">
Respecto a las acciones directas que evidencian intención de contacto, se han contabilizado <strong>${calls}</strong> llamadas telefónicas realizadas directamente desde el perfil, así como <strong>${directions}</strong> solicitudes de indicaciones para llegar al establecimiento y <strong>${clicks}</strong> clics hacia el sitio web. Estas métricas demuestran que la presencia en ${socialNetwork} no solo genera visibilidad, sino que también impulsa acciones concretas por parte de usuarios potencialmente interesados en los servicios del negocio.
</p>

<p style="margin-bottom: 12px;">
La evolución mensual de estos indicadores evidencia una tendencia positiva en el alcance y la efectividad del perfil, validando la correcta ejecución de las acciones de publicación y optimización llevadas a cabo durante la fase de prestación del servicio. La combinación de publicaciones regulares, optimización del perfil y respuesta activa a las interacciones de usuarios ha contribuido a consolidar la presencia digital de ${beneficiary} en ${socialNetwork}.
</p>

<p style="margin-bottom: 12px;">
A modo de recomendación, se sugiere mantener una frecuencia de publicación constante, responder de forma ágil a las reseñas y consultas de los usuarios, y actualizar periódicamente la información del perfil para maximizar el rendimiento orgánico y la conversión de visitas en contactos efectivos. Estas acciones permitirán consolidar y ampliar los resultados obtenidos durante el periodo analizado.
</p>
`;
}
