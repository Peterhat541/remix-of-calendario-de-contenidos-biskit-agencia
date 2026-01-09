import { useNavigate } from "react-router-dom";
import { useSeoWebReports, useDeleteSeoWebReport } from "@/hooks/useSeoWebReports";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { FileText, Download, Trash2, Eye, Plus, ArrowLeft, FileDown } from "lucide-react";
import { SeoReportStatus, SeoWebReport } from "@/types/seoWebReport";

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

export default function InformesSeoLista() {
  const navigate = useNavigate();
  const { data: reports, isLoading, error } = useSeoWebReports();
  const deleteMutation = useDeleteSeoWebReport();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Informe eliminado correctamente");
    } catch (err) {
      console.error("Error deleting report:", err);
      toast.error("Error al eliminar el informe");
    }
  };

  const handleViewReport = (id: string) => {
    navigate(`/informes/seo/${id}`);
  };

  const handleDownloadPdf = (pdfPath: string | null) => {
    if (!pdfPath) {
      toast.error("No hay PDF disponible");
      return;
    }
    window.open(pdfPath, "_blank");
  };

  const handleDownloadWord = (wordPath: string | null) => {
    if (!wordPath) {
      toast.error("No hay Word disponible");
      return;
    }
    window.open(wordPath, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-muted-foreground">Cargando informes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-destructive">Error al cargar los informes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/informes")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Informes SEO Solución Web</h1>
              <p className="text-muted-foreground">
                Listado de todos los informes generados
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/informes/seo-solucion-web")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo informe
          </Button>
        </div>

        {reports && reports.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Beneficiario</TableHead>
                  <TableHead>Sitio Web</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {formatDate(report.created_at)}
                    </TableCell>
                    <TableCell>{report.beneficiary || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {report.site_url}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewReport(report.id)}
                          title="Ver informe"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {report.pdf_path && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPdf(report.pdf_path)}
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}

                        {(report as SeoWebReport & { word_path?: string | null }).word_path && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadWord((report as SeoWebReport & { word_path?: string | null }).word_path ?? null)}
                            title="Descargar Word"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar informe?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El informe será
                                eliminado permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(report.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border rounded-lg p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay informes</h3>
            <p className="text-muted-foreground mb-4">
              Aún no has generado ningún informe SEO Solución Web.
            </p>
            <Button onClick={() => navigate("/informes/seo-solucion-web")}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer informe
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
