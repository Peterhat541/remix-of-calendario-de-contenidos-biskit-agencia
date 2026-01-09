import { FormData, ReportSection } from "@/types/report";
import { VisionReportData } from "@/types/visionReport";
import { buildSeoSolucionWebPreviewHtmlV2 } from "@/utils/seoSolucionWebReportV2";

interface ReportPreviewProps {
  formData: FormData;
  sections: ReportSection[];
  reportData: VisionReportData | null;
}

export function ReportPreview({ formData, sections, reportData }: ReportPreviewProps) {
  // Use V2 generator with VisionReportData for accurate data
  const html = reportData 
    ? buildSeoSolucionWebPreviewHtmlV2(formData, reportData, sections)
    : "<p>No hay datos procesados. Genera el informe primero.</p>";

  return (
    <div className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto">
      <div className="p-8 md:p-12 border-b border-gray-200">
        <p className="text-sm font-bold uppercase tracking-wide mb-2">TÍTULO</p>
        <h1 className="text-xl md:text-2xl font-bold text-center uppercase tracking-wide mb-8">
          INFORME DE RESULTADO DEL SERVICIO DE MEJORA DEL POSICIONAMIENTO SEO
        </h1>

        <p className="text-sm font-bold uppercase tracking-wide mb-3">INFORMACIÓN DE CABECERA</p>

        <div className="space-y-2 text-sm">
          <p>
            <strong>SITIO WEB:</strong> <span className="break-all">{formData.websiteUrl || "—"}</span>
          </p>
          <p>
            <strong>Periodo de prestación del servicio:</strong> {formData.startDate || "—"} / {formData.endDate || "—"}
          </p>
          <p>
            <strong>Fecha de elaboración del presente informe:</strong> {formData.reportDate || "—"}
          </p>
          <p>
            <strong>Beneficiario:</strong> {formData.beneficiaryName || "—"}
          </p>
        </div>
      </div>

      <div className="p-8 md:p-12">
        <div className="prose prose-sm max-w-none text-justify" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-400">
        Fin del informe
      </div>
    </div>
  );
}
