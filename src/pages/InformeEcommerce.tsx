/**
 * Generador de Informe Trimestral de Seguimiento del SEO (eCommerce)
 * Fase II – Presencia Avanzada en Internet
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileDown, ArrowLeft, Loader2, Sparkles, Trash2, FileText, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageDropzone } from "@/components/ImageDropzone";
import { toast } from "sonner";
import { useEcommerceReport } from "@/hooks/useEcommerceReport";
import { useEcommerceReports, EcommerceReportRecord } from "@/hooks/useEcommerceReports";
import { generateEcommercePDF } from "@/utils/ecommercePdfGenerator";
import { generateEcommerceWordWithBlob } from "@/utils/ecommerceWordGenerator";
import { EcommerceFormData, EcommerceSection, EcommerceImage, DEFAULT_ECOMMERCE_SECTIONS, EcommerceReportData } from "@/types/ecommerceReport";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Screen = "list" | "form" | "preview";

const InformeEcommerce = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("list");
  const [isGenerating, setIsGenerating] = useState(false);
  const ecommerceReport = useEcommerceReport();
  const { reports, isLoading, fetchReports, saveReport, deleteReport } = useEcommerceReports();

  const [formData, setFormData] = useState<EcommerceFormData>({
    beneficiaryName: "",
    websiteUrl: "",
    reportDate: new Date().toISOString().split("T")[0],
    serviceStart: "",
    serviceEnd: "",
  });

  const [sections, setSections] = useState<EcommerceSection[]>(DEFAULT_ECOMMERCE_SECTIONS);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateSectionImages = (sectionId: string, images: EcommerceImage[]) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, images } : s)));
  };

  const startNewReport = () => {
    setFormData({ beneficiaryName: "", websiteUrl: "", reportDate: new Date().toISOString().split("T")[0], serviceStart: "", serviceEnd: "" });
    setSections(DEFAULT_ECOMMERCE_SECTIONS);
    ecommerceReport.clearCase();
    setScreen("form");
  };

  const totalImages = sections.reduce((acc, s) => acc + s.images.length, 0);

  const handleGenerate = async () => {
    if (!formData.beneficiaryName.trim()) { toast.error("Rellena el nombre del beneficiario"); return; }
    const allImages: EcommerceImage[] = sections.flatMap(s => s.images);
    if (allImages.length === 0) { toast.error("Sube al menos una captura"); return; }

    setIsGenerating(true);
    try {
      const result = await ecommerceReport.processImages(allImages);
      if (!result?.success) { toast.error("Error al procesar", { description: ecommerceReport.error }); return; }
      toast.success("Capturas procesadas");
      setScreen("preview");
      await saveReport(formData, result.reportData, "completed");
    } catch { toast.error("Error al procesar"); } finally { setIsGenerating(false); }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const { blob, filename } = await generateEcommercePDF(formData, ecommerceReport.reportData, sections);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("PDF descargado");
    } catch { toast.error("Error al generar PDF"); } finally { setIsGenerating(false); }
  };

  const handleDownloadWord = async () => {
    setIsGenerating(true);
    try {
      const { blob, filename } = await generateEcommerceWordWithBlob(formData, ecommerceReport.reportData, sections);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("Word descargado");
    } catch { toast.error("Error al generar Word"); } finally { setIsGenerating(false); }
  };

  const handleDownloadSavedPDF = async (report: EcommerceReportRecord) => {
    if (!report.report_data) { toast.error("Sin datos guardados"); return; }
    setIsGenerating(true);
    try {
      const fd: EcommerceFormData = { beneficiaryName: report.beneficiary_name, websiteUrl: report.website_url, reportDate: report.report_date, serviceStart: report.service_start || "", serviceEnd: report.service_end || "" };
      const { blob, filename } = await generateEcommercePDF(fd, report.report_data, DEFAULT_ECOMMERCE_SECTIONS.map(s => ({ ...s, images: [] })));
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("PDF descargado");
    } catch { toast.error("Error"); } finally { setIsGenerating(false); }
  };

  const handleDownloadSavedWord = async (report: EcommerceReportRecord) => {
    if (!report.report_data) { toast.error("Sin datos guardados"); return; }
    setIsGenerating(true);
    try {
      const fd: EcommerceFormData = { beneficiaryName: report.beneficiary_name, websiteUrl: report.website_url, reportDate: report.report_date, serviceStart: report.service_start || "", serviceEnd: report.service_end || "" };
      const { blob, filename } = await generateEcommerceWordWithBlob(fd, report.report_data, DEFAULT_ECOMMERCE_SECTIONS.map(s => ({ ...s, images: [] })));
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("Word descargado");
    } catch { toast.error("Error"); } finally { setIsGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-7" />
            <span className="text-sm font-medium text-muted-foreground">Informe Trimestral SEO eCommerce</span>
          </div>
          <div className="flex items-center gap-2">
            {screen !== "list" && <Button variant="ghost" size="sm" onClick={() => setScreen("list")}><List className="h-4 w-4 mr-1" />Ver informes</Button>}
            <Button variant="ghost" size="sm" onClick={() => navigate("/informes")}><ArrowLeft className="h-4 w-4 mr-1" />Volver</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {screen === "list" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Informes Trimestrales SEO (eCommerce)</h1>
              <Button onClick={startNewReport}><Plus className="h-4 w-4 mr-2" />Nuevo Informe</Button>
            </div>
            {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : reports.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground mb-4">No hay informes guardados</p><Button onClick={startNewReport}><Plus className="h-4 w-4 mr-2" />Crear primer informe</Button></CardContent></Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>Beneficiario</TableHead><TableHead>Web</TableHead><TableHead>Período</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.beneficiary_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{report.website_url}</TableCell>
                        <TableCell className="text-sm">{report.period_start && report.period_end ? `${report.period_start} - ${report.period_end}` : "-"}</TableCell>
                        <TableCell><Badge variant={report.status === "completed" ? "default" : "secondary"}>{report.status === "completed" ? "Completado" : "Borrador"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadSavedPDF(report)} disabled={isGenerating} title="PDF"><FileDown className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadSavedWord(report)} disabled={isGenerating} title="Word"><FileText className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteReport(report.id)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

        {screen === "form" && (
          <div className="space-y-8">
            <Card>
              <CardHeader><CardTitle className="text-lg">Datos del Beneficiario</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nombre del beneficiario *</Label><Input value={formData.beneficiaryName} onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })} placeholder="Empresa S.L." /></div>
                <div><Label>URL eCommerce</Label><Input value={formData.websiteUrl} onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })} placeholder="https://tienda.com" /></div>
                <div><Label>Fecha del informe</Label><Input type="date" value={formData.reportDate} onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })} /></div>
                <div><Label>Inicio del servicio</Label><Input type="date" value={formData.serviceStart} onChange={(e) => setFormData({ ...formData, serviceStart: e.target.value })} /></div>
                <div><Label>Fin del servicio</Label><Input type="date" value={formData.serviceEnd} onChange={(e) => setFormData({ ...formData, serviceEnd: e.target.value })} /></div>
              </CardContent>
            </Card>

            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader><CardTitle className="text-lg">{section.title}</CardTitle><p className="text-sm text-muted-foreground">{section.description}</p></CardHeader>
                <CardContent><ImageDropzone images={section.images as any} onChange={(images) => updateSectionImages(section.id, images as any)} maxImages={section.maxImages} /></CardContent>
              </Card>
            ))}

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => setScreen("list")}>Cancelar</Button>
              <Button size="lg" onClick={handleGenerate} disabled={isGenerating || ecommerceReport.isProcessing}>
                {isGenerating || ecommerceReport.isProcessing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Procesando...</> : <><Sparkles className="h-5 w-5 mr-2" />Generar Informe ({totalImages} capturas)</>}
              </Button>
            </div>
          </div>
        )}

        {screen === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => { setScreen("list"); fetchReports(); }}><ArrowLeft className="h-4 w-4 mr-2" />Volver a la lista</Button>
              <div className="flex gap-2">
                <Button onClick={handleDownloadPDF} disabled={isGenerating}>{isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}Descargar PDF</Button>
                <Button variant="outline" onClick={handleDownloadWord} disabled={isGenerating}>{isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}Descargar Word</Button>
              </div>
            </div>
            <Card><CardHeader><CardTitle>Vista Previa del Informe</CardTitle></CardHeader><CardContent className="prose prose-sm max-w-none"><h2>INFORME TRIMESTRAL DE SEGUIMIENTO DEL SEO</h2><p><strong>Beneficiario:</strong> {formData.beneficiaryName}</p><p><strong>eCommerce:</strong> {formData.websiteUrl}</p><p><strong>Servicio:</strong> {formData.serviceStart} a {formData.serviceEnd}</p></CardContent></Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default InformeEcommerce;
