/**
 * Generador de Informe de Seguimiento
 * PRESENCIA AVANZADA EN INTERNET – Fase II
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileDown, ArrowLeft, Loader2, Sparkles, Trash2, FileText, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageDropzone } from "@/components/ImageDropzone";
import { toast } from "sonner";
import { useSeguimientoReport } from "@/hooks/useSeguimientoReport";
import { useSeguimientoReports, SeguimientoReportRecord } from "@/hooks/useSeguimientoReports";
import { generateSeguimientoPDF } from "@/utils/seguimientoPdfGenerator";
import { generateSeguimientoWordWithBlob } from "@/utils/seguimientoWordGenerator";
import {
  SeguimientoFormData,
  SeguimientoSection,
  SeguimientoImage,
  DEFAULT_SEGUIMIENTO_SECTIONS,
  SeguimientoReportData,
} from "@/types/seguimientoReport";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Screen = "list" | "form" | "preview";

const InformeSeguimiento = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("list");
  const [isGenerating, setIsGenerating] = useState(false);
  const seguimientoReport = useSeguimientoReport();
  const { reports, isLoading, isSaving, fetchReports, saveReport, deleteReport } = useSeguimientoReports();

  const [formData, setFormData] = useState<SeguimientoFormData>({
    beneficiaryName: "",
    nif: "",
    websiteUrl: "",
    reportDate: new Date().toISOString().split("T")[0],
  });

  const [sections, setSections] = useState<SeguimientoSection[]>(DEFAULT_SEGUIMIENTO_SECTIONS);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateSectionImages = (sectionId: string, images: SeguimientoImage[]) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, images } : s))
    );
  };

  const startNewReport = () => {
    setFormData({
      beneficiaryName: "",
      nif: "",
      websiteUrl: "",
      reportDate: new Date().toISOString().split("T")[0],
    });
    setSections(DEFAULT_SEGUIMIENTO_SECTIONS);
    seguimientoReport.clearCase();
    setScreen("form");
  };

  const totalImages = sections.reduce((acc, s) => acc + s.images.length, 0);

  const handleGenerate = async () => {
    if (!formData.beneficiaryName.trim() || !formData.nif.trim()) {
      toast.error("Rellena al menos el nombre del beneficiario y el NIF");
      return;
    }

    const allImages: SeguimientoImage[] = [];
    sections.forEach((section) => {
      section.images.forEach((img) => allImages.push(img));
    });

    if (allImages.length === 0) {
      toast.error("No hay capturas", {
        description: "Sube al menos una captura antes de generar el informe",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await seguimientoReport.processImages(allImages);

      if (!result?.success) {
        toast.error("Error al procesar las capturas", {
          description: seguimientoReport.error || "Intenta de nuevo",
        });
        return;
      }

      toast.success("Capturas procesadas correctamente");
      setScreen("preview");

      await saveReport(formData, result.reportData, "completed");
    } catch (error) {
      toast.error("Error al procesar las capturas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const { blob, filename } = await generateSeguimientoPDF(
        formData,
        seguimientoReport.reportData,
        sections
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("PDF descargado correctamente");
    } catch (error) {
      toast.error("Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = async () => {
    setIsGenerating(true);
    try {
      const { blob, filename } = await generateSeguimientoWordWithBlob(
        formData,
        seguimientoReport.reportData,
        sections
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Word descargado correctamente");
    } catch (error) {
      toast.error("Error al generar el Word");
    } finally {
      setIsGenerating(false);
    }
  };

  const buildFormDataFromRecord = (report: SeguimientoReportRecord): SeguimientoFormData => ({
    beneficiaryName: report.beneficiary_name || "",
    nif: report.nif || "",
    websiteUrl: report.website_url || "",
    reportDate: report.report_date || new Date().toISOString().split("T")[0],
  });

  const getEmptySections = (): SeguimientoSection[] =>
    DEFAULT_SEGUIMIENTO_SECTIONS.map((s) => ({ ...s, images: [] }));

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSavedWord = async (report: SeguimientoReportRecord) => {
    if (!report.report_data) {
      toast.error("Este informe no tiene datos guardados para generar el Word");
      return;
    }

    setIsGenerating(true);
    try {
      const savedFormData = buildFormDataFromRecord(report);
      const { blob, filename } = await generateSeguimientoWordWithBlob(
        savedFormData,
        report.report_data as SeguimientoReportData,
        getEmptySections()
      );

      downloadBlob(blob, filename);
      toast.success("Word descargado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el Word");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSavedPDF = async (report: SeguimientoReportRecord) => {
    if (!report.report_data) {
      toast.error("Este informe no tiene datos guardados para generar el PDF");
      return;
    }

    setIsGenerating(true);
    try {
      const savedFormData = buildFormDataFromRecord(report);
      const { blob, filename } = await generateSeguimientoPDF(
        savedFormData,
        report.report_data as SeguimientoReportData,
        getEmptySections()
      );

      downloadBlob(blob, filename);
      toast.success("PDF descargado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-7" />
            <span className="text-sm font-medium text-muted-foreground">
              Informe de Seguimiento
            </span>
          </div>
          <div className="flex items-center gap-2">
            {screen !== "list" && (
              <Button variant="ghost" size="sm" onClick={() => setScreen("list")}>
                <List className="h-4 w-4 mr-1" />
                Ver informes
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/informes")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* LIST VIEW */}
        {screen === "list" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Informes de Seguimiento</h1>
              <Button onClick={startNewReport}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Informe
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No hay informes guardados</p>
                  <Button onClick={startNewReport}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer informe
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beneficiario</TableHead>
                      <TableHead>Web</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.beneficiary_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {report.website_url}
                        </TableCell>
                        <TableCell className="text-sm">
                          {report.period_start && report.period_end
                            ? `${report.period_start} - ${report.period_end}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(report.report_date).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.status === "completed" ? "default" : "secondary"}>
                            {report.status === "completed" ? "Completado" : "Borrador"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadSavedPDF(report)}
                              disabled={isGenerating}
                              title="Descargar PDF"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadSavedWord(report)}
                              disabled={isGenerating}
                              title="Descargar Word"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReport(report.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {/* FORM VIEW */}
        {screen === "form" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datos del Beneficiario</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre del beneficiario *</Label>
                  <Input
                    value={formData.beneficiaryName}
                    onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                    placeholder="Empresa S.L."
                  />
                </div>
                <div>
                  <Label>NIF/CIF *</Label>
                  <Input
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    placeholder="B12345678"
                  />
                </div>
                <div>
                  <Label>URL del sitio web</Label>
                  <Input
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://ejemplo.com"
                  />
                </div>
                <div>
                  <Label>Fecha del informe</Label>
                  <Input
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardHeader>
                <CardContent>
                  <ImageDropzone
                    images={section.images as any}
                    onChange={(images) => updateSectionImages(section.id, images as any)}
                    maxImages={section.maxImages}
                  />
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => setScreen("list")}>
                Cancelar
              </Button>
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating || seguimientoReport.isProcessing}
              >
                {isGenerating || seguimientoReport.isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generar Informe ({totalImages} capturas)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* PREVIEW VIEW */}
        {screen === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setScreen("list");
                  fetchReports();
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la lista
              </Button>
              <div className="flex gap-2">
                <Button onClick={handleDownloadPDF} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Descargar PDF
                </Button>
                <Button variant="outline" onClick={handleDownloadWord} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Descargar Word
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Informe</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <h2>PRESENCIA AVANZADA EN INTERNET – INFORME DE SEGUIMIENTO</h2>
                <p>
                  <strong>Beneficiario:</strong> {formData.beneficiaryName}
                </p>
                <p>
                  <strong>Web:</strong> {formData.websiteUrl}
                </p>
                <p>
                  <strong>Período detectado:</strong>{" "}
                  {seguimientoReport.reportData?.detectedPeriod?.months?.join(", ") || "No detectado"}
                </p>
                <p>
                  <strong>Tráfico orgánico:</strong>{" "}
                  {seguimientoReport.reportData?.mainDomain?.organicTraffic?.toLocaleString("es-ES") ||
                    "No detectado"}
                </p>
                <p>
                  <strong>Keywords:</strong>{" "}
                  {seguimientoReport.reportData?.mainDomain?.organicKeywords?.toLocaleString("es-ES") ||
                    "No detectado"}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Descarga el PDF o Word para ver el informe completo con todas las secciones y capturas.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default InformeSeguimiento;
