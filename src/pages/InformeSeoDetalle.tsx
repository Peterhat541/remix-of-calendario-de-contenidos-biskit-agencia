import { useParams, useNavigate } from "react-router-dom";
import { useSeoWebReportById } from "@/hooks/useSeoWebReports";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, AlertCircle } from "lucide-react";
import { SeoReportStatus } from "@/types/seoWebReport";

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: SeoReportStatus) {
  const variants: Record<SeoReportStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Borrador", variant: "secondary" },
    ready: { label: "Listo", variant: "default" },
    exported: { label: "Exportado", variant: "outline" },
    error: { label: "Error", variant: "destructive" },
  };
  const { label, variant } = variants[status] || { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}

export default function InformeSeoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, error } = useSeoWebReportById(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Cargando informe...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Informe no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El informe que buscas no existe o ha sido eliminado.
          </p>
          <Button onClick={() => navigate("/informes/seo-lista")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al listado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/informes/seo-lista")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Detalle del Informe</h1>
            <p className="text-muted-foreground">ID: {report.id}</p>
          </div>
          {getStatusBadge(report.status)}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Beneficiario</p>
                <p className="font-medium">{report.beneficiary || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sitio Web</p>
                <p className="font-medium break-all">{report.site_url}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Periodo de servicio</p>
                <p className="font-medium">{report.service_period || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha del informe</p>
                <p className="font-medium">{formatDate(report.report_date)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadatos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Creado</p>
                <p className="font-medium">{formatDate(report.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actualizado</p>
                <p className="font-medium">{formatDate(report.updated_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clave del caso</p>
                <p className="font-medium font-mono text-xs">
                  {report.case_key || "—"}
                </p>
              </div>
              {report.vision_report_id && (
                <div>
                  <p className="text-sm text-muted-foreground">ID Vision Report</p>
                  <p className="font-medium font-mono text-xs truncate">
                    {report.vision_report_id}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {report.missing && report.missing.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Secciones faltantes
              </CardTitle>
              <CardDescription>
                Estas secciones no fueron detectadas en las capturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {report.missing.map((section) => (
                  <Badge key={section} variant="destructive">
                    {section}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {report.pdf_path && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Adjunto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg overflow-hidden bg-muted/50">
                <iframe
                  src={report.pdf_path}
                  className="w-full h-[500px]"
                  title="Vista previa del PDF"
                />
              </div>
              <Button onClick={() => window.open(report.pdf_path!, "_blank")}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </CardContent>
          </Card>
        )}
        
        {report.status === "exported" && !report.pdf_path && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                <FileText className="h-5 w-5" />
                PDF no disponible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Este informe fue exportado antes de la actualización. Regenera el PDF desde el generador para adjuntarlo.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
