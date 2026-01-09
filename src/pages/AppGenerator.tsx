import { useState, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileDown, Eye, ArrowLeft, Loader2, Edit3, Sparkles, AlertTriangle, Home, AlertCircle, FileText, FolderOpen } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormSection } from "@/components/FormSection";
import { ImageDropzone } from "@/components/ImageDropzone";
import { ReportPreview } from "@/components/ReportPreview";
import { KeywordEvolutionTableView } from "@/components/KeywordEvolutionTableView";
import { filterSectionsWithData, renumberSections } from "@/utils/pdfGenerator";
import { generateSectionText, setVisionReportData } from "@/utils/textGenerator";
import { autoMapExtractedData, sectionHasData } from "@/utils/dataMapper";
import { generateKeywordEvolutionTable, canGenerateTable } from "@/utils/keywordTableGenerator";
import { generatePDFV2, generatePDFV2WithBlob, getValidationErrors } from "@/utils/pdfGeneratorV2";
import { uploadPdfToStorage, uploadWordToStorage } from "@/services/pdfStorageService";
import { generateWordV2WithBlob } from "@/utils/wordGeneratorV2";
import { useVisionReport } from "@/hooks/useVisionReport";
import { useUpsertSeoWebReportByCaseKey } from "@/hooks/useSeoWebReports";
import { getMissingErrorMessage } from "@/services/visionService";
import {
  FormData,
  ReportSection,
  DEFAULT_SECTIONS,
  ImageItem,
} from "@/types/report";
import { ExtractedImageData } from "@/types/imageAnalysis";
import { toast } from "sonner";

type Screen = "form" | "edit" | "preview";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("form");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingVision, setIsProcessingVision] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<{ type: 'pdf' | 'word'; errors: string[] } | null>(null);

  // Vision report hook for unified image processing (V2 flow)
  // caseId is now managed inside the hook (persisted in localStorage)
  const visionReport = useVisionReport();

  // Upsert SEO report to database
  const upsertReport = useUpsertSeoWebReportByCaseKey();
  const reportSavedRef = useRef<boolean>(false);

  // Optional sections: if missing, we show N/D and DO NOT block export
  const OPTIONAL_MISSING_SECTIONS = ["pagespeed", "technical"] as const;
  const getCriticalMissing = useCallback(
    (missing: string[]) => missing.filter((m) => !(OPTIONAL_MISSING_SECTIONS as readonly string[]).includes(m)),
    []
  );
  const [formData, setFormData] = useState<FormData>({
    beneficiaryName: "",
    nif: "",
    websiteUrl: "",
    startDate: "",
    endDate: "",
    reportDate: new Date().toISOString().split("T")[0],
    servicio: "",
  });

  const [sections, setSections] = useState<ReportSection[]>(DEFAULT_SECTIONS);

  // Generate keyword list from VisionReportData (priority) or fallback to extractedData
  const keywordSeedList = useMemo(() => {
    const all: string[] = [];
    
    // PRIORITY: Use VisionReportData keywords
    if (visionReport.reportData?.keywords && visionReport.reportData.keywords.length > 0) {
      for (const kw of visionReport.reportData.keywords) {
        if (kw.keyword?.trim()) all.push(kw.keyword.trim());
      }
    } else {
      // FALLBACK: Legacy extractedData from images
      for (const section of sections) {
        for (const img of section.images) {
          if (img.extractedData?.metrics?.keyword_list) {
            for (const kw of img.extractedData.metrics.keyword_list) {
              if (kw.keyword?.trim()) all.push(kw.keyword.trim());
            }
          }
        }
      }
    }
    // Dedupe
    return [...new Set(all)];
  }, [sections, visionReport.reportData]);

  const keywordEvolutionTable = useMemo(() => {
    return generateKeywordEvolutionTable(formData.servicio, formData.startDate, formData.endDate, keywordSeedList);
  }, [formData.servicio, formData.startDate, formData.endDate, keywordSeedList]);

  const canGenerateKeywordTable = useMemo(() => {
    return canGenerateTable(formData.servicio, formData.startDate, formData.endDate, keywordSeedList);
  }, [formData.servicio, formData.startDate, formData.endDate, keywordSeedList]);

  // Count total images across all sections (excluding keywordTable which doesn't use images)
  const totalImages = useMemo(() => {
    return sections.reduce((acc, s) => s.id !== "keywordTable" ? acc + s.images.length : acc, 0);
  }, [sections]);

  // Count sections with data for UI feedback (including keywordTable if can be generated)
  const sectionsWithData = useMemo(() => {
    return sections.filter(s => {
      if (s.id === "keywordTable") {
        return canGenerateKeywordTable;
      }
      return sectionHasData(s.id, s.data, s.images);
    });
  }, [sections, canGenerateKeywordTable]);

  const updateSectionData = (sectionId: string, data: ReportSection["data"]) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, data } : s))
    );
  };

  const updateSectionImages = (sectionId: string, images: ImageItem[]) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, images } : s))
    );
  };

  const updateSectionContent = (sectionId: string, content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, editedContent: content } : s))
    );
  };

  // Merge extracted data with confidence-based conflict resolution
  const mergeExtractedData = (existing: ExtractedImageData | undefined, newData: ExtractedImageData): ExtractedImageData => {
    if (!existing) return newData;
    
    const merged = { ...existing };
    
    // Helper to pick value with higher confidence
    const pickBestValue = <T,>(field: string, existingVal: T, newVal: T): T => {
      if (existingVal === null || existingVal === undefined) return newVal;
      if (newVal === null || newVal === undefined) return existingVal;
      
      const existingEvidence = existing.evidence?.find(e => e.field === field);
      const newEvidence = newData.evidence?.find(e => e.field === field);
      
      const existingConf = existingEvidence?.confidence ?? 0;
      const newConf = newEvidence?.confidence ?? 0;
      
      return newConf > existingConf ? newVal : existingVal;
    };
    
    // Merge metrics
    merged.metrics = {
      organic_traffic: pickBestValue('organic_traffic', existing.metrics.organic_traffic, newData.metrics.organic_traffic),
      keywords_count: pickBestValue('keywords_count', existing.metrics.keywords_count, newData.metrics.keywords_count),
      authority_score: pickBestValue('authority_score', existing.metrics.authority_score, newData.metrics.authority_score),
      ref_domains: pickBestValue('ref_domains', existing.metrics.ref_domains, newData.metrics.ref_domains),
      backlinks: pickBestValue('backlinks', existing.metrics.backlinks, newData.metrics.backlinks),
      top_3: pickBestValue('top_3', existing.metrics.top_3, newData.metrics.top_3),
      top_10: pickBestValue('top_10', existing.metrics.top_10, newData.metrics.top_10),
      top_11_20: pickBestValue('top_11_20', existing.metrics.top_11_20, newData.metrics.top_11_20),
      top_21_100: pickBestValue('top_21_100', existing.metrics.top_21_100, newData.metrics.top_21_100),
      pagespeed_performance: pickBestValue('pagespeed_performance', existing.metrics.pagespeed_performance, newData.metrics.pagespeed_performance),
      pagespeed_accessibility: pickBestValue('pagespeed_accessibility', existing.metrics.pagespeed_accessibility, newData.metrics.pagespeed_accessibility),
      pagespeed_best_practices: pickBestValue('pagespeed_best_practices', existing.metrics.pagespeed_best_practices, newData.metrics.pagespeed_best_practices),
      pagespeed_seo: pickBestValue('pagespeed_seo', existing.metrics.pagespeed_seo, newData.metrics.pagespeed_seo),
      lcp_ms: pickBestValue('lcp_ms', existing.metrics.lcp_ms, newData.metrics.lcp_ms),
      cls: pickBestValue('cls', existing.metrics.cls, newData.metrics.cls),
      inp_ms: pickBestValue('inp_ms', existing.metrics.inp_ms, newData.metrics.inp_ms),
      // Combine keyword lists without duplicates
      keyword_list: [...existing.metrics.keyword_list, ...newData.metrics.keyword_list.filter(
        nk => !existing.metrics.keyword_list.some(ek => ek.keyword === nk.keyword)
      )],
    };
    
    // Merge technical fields
    merged.robots_ok = pickBestValue('robots_ok', existing.robots_ok, newData.robots_ok);
    merged.sitemap_ok = pickBestValue('sitemap_ok', existing.sitemap_ok, newData.sitemap_ok);
    merged.canonicals_ok = pickBestValue('canonicals_ok', existing.canonicals_ok, newData.canonicals_ok);
    merged.h1_count = pickBestValue('h1_count', existing.h1_count, newData.h1_count);
    merged.h2_count = pickBestValue('h2_count', existing.h2_count, newData.h2_count);
    merged.h3_count = pickBestValue('h3_count', existing.h3_count, newData.h3_count);
    merged.alt_images_ok = pickBestValue('alt_images_ok', existing.alt_images_ok, newData.alt_images_ok);
    merged.internal_links = pickBestValue('internal_links', existing.internal_links, newData.internal_links);
    merged.external_links = pickBestValue('external_links', existing.external_links, newData.external_links);
    
    // Merge evidence arrays
    merged.evidence = [...(existing.evidence || []), ...(newData.evidence || [])];
    
    return merged;
  };

  // Handle extracted data from individual image analysis (kept for ImageDropzone compatibility)
  const handleDataExtracted = (sectionId: string, extracted: ExtractedImageData) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newData = autoMapExtractedData(sectionId, extracted, section.data);
    updateSectionData(sectionId, newData as ReportSection["data"]);
    
    toast.success("Datos extraídos correctamente", {
      description: `Tipo detectado: ${extracted.capture_type}`,
    });
  };

  // Generate initial text content for all sections
  const generateInitialContent = useCallback(() => {
    // IMPORTANT: Set the VisionReportData before generating text so textGenerator can access it
    setVisionReportData(visionReport.reportData);
    
    const filtered = filterSectionsWithData(sections);
    const numbered = renumberSections(filtered);
    
    setSections((prev) =>
      prev.map((section) => {
        const numberedSection = numbered.find((s) => s.id === section.id);
        if (!numberedSection) return section;
        
        // Only generate if not already edited
        if (!section.editedContent) {
          const generatedText = generateSectionText(section, formData);
          return { ...section, editedContent: generatedText };
        }
        return section;
      })
    );
  }, [sections, formData, visionReport.reportData]);

  // Helper function to save report to database
  const saveReportToDatabase = useCallback(async (
    status: 'draft' | 'ready' | 'exported', 
    pdfPath?: string,
    wordPath?: string
  ) => {
    if (!formData.websiteUrl.trim()) return;
    
    try {
      const servicePeriod = formData.startDate && formData.endDate 
        ? `${formData.startDate} / ${formData.endDate}`
        : null;
      
      await upsertReport.mutateAsync({
        caseKey: visionReport.caseId,
        input: {
          site_url: formData.websiteUrl.trim(),
          beneficiary: formData.beneficiaryName.trim() || null,
          service_period: servicePeriod,
          report_date: formData.reportDate || null,
          case_key: visionReport.caseId,
          missing: visionReport.missing,
          status,
          pdf_path: pdfPath,
          word_path: wordPath,
          meta: {
            nif: formData.nif,
            servicio: formData.servicio,
          },
        },
      });
      console.log(`[AppGenerator] Report saved with status: ${status}${pdfPath ? ', pdf_path: ' + pdfPath : ''}${wordPath ? ', word_path: ' + wordPath : ''}`);
    } catch (error) {
      console.error("[AppGenerator] Error saving report to database:", error);
    }
  }, [formData, visionReport.caseId, visionReport.missing, upsertReport]);

  // Main action: "Generar informe" - calls vision-extract with all images
  const handleGoToEdit = async () => {
    if (!formData.beneficiaryName.trim() || !formData.nif.trim()) {
      toast.error("Rellena al menos el nombre del beneficiario y el NIF");
      return;
    }
    
    // Collect all images from all sections
    const allImages: ImageItem[] = [];
    sections.forEach(section => {
      section.images.forEach(img => allImages.push(img));
    });
    
    if (allImages.length === 0) {
      toast.error("No hay capturas", {
        description: "Sube al menos una captura antes de generar el informe",
      });
      return;
    }
    
    // Check if we already have valid cached data for these images
    if (visionReport.hasValidCachedData(allImages)) {
      console.log("[AppGenerator] Using cached reportData, skipping vision-extract");
      toast.success("Usando datos guardados");
      generateInitialContent();
      // Save as draft if not already saved
      if (!reportSavedRef.current) {
        await saveReportToDatabase('draft');
        reportSavedRef.current = true;
      }
      setScreen("edit");
      return;
    }
    
    // Call vision-extract with all images (V2 unified flow)
    setIsProcessingVision(true);
    try {
      const result = await visionReport.processImages(allImages);
      
      if (!result?.success) {
        toast.error("Error al procesar las capturas", {
          description: visionReport.error || "Intenta de nuevo",
        });
        setIsProcessingVision(false);
        return;
      }
      
      // Check for missing sections (ignore optional ones like pagespeed)
      const criticalMissing = getCriticalMissing(result.reportData.missing || []);
      if (criticalMissing.length > 0) {
        toast.warning("Datos incompletos", {
          description: getMissingErrorMessage(criticalMissing),
        });
      } else if ((result.reportData.missing || []).length > 0) {
        toast.info("Capturas procesadas", {
          description: "PageSpeed no detectado: se mostrará como N/D.",
        });
      } else {
        toast.success("Capturas procesadas correctamente");
      }
      
      // Generate initial content for sections
      generateInitialContent();
      
      // Save report to database as draft
      await saveReportToDatabase('draft');
      reportSavedRef.current = true;
      
      setScreen("edit");
    } catch (error) {
      toast.error("Error al procesar las capturas", {
        description: error instanceof Error ? error.message : "Intenta de nuevo",
      });
    } finally {
      setIsProcessingVision(false);
    }
  };

  const handleGoToPreview = () => {
    setScreen("preview");
  };

  // PDF export - only exports, no vision processing (that happened in handleGoToEdit)
  const handleGeneratePDF = async (forceDownload = false) => {
    // Block if no reportData
    if (!visionReport.reportData) {
      toast.error("No hay datos procesados", {
        description: "Vuelve atrás y genera el informe primero",
      });
      return;
    }

    // Check validation errors
    const validationErrors = getValidationErrors(formData, visionReport.reportData, sections);
    
    // If there are errors and not forcing download, show confirmation dialog
    if (validationErrors.length > 0 && !forceDownload) {
      setPendingDownload({ type: 'pdf', errors: validationErrors });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate PDF blob and download (skip validation since we confirmed)
      const { blob, filename } = await generatePDFV2WithBlob(formData, visionReport.reportData, sections, { skipValidation: true });
      
      // Download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Upload to storage and get URL
      let pdfUrl: string | undefined;
      try {
        pdfUrl = await uploadPdfToStorage(blob, filename, visionReport.caseId);
        console.log("[AppGenerator] PDF uploaded to storage:", pdfUrl);
      } catch (uploadError) {
        console.warn("[AppGenerator] Failed to upload PDF to storage:", uploadError);
      }
      
      // Update report status to exported with pdf_path
      await saveReportToDatabase('exported', pdfUrl);
      
      if (validationErrors.length > 0) {
        toast.warning("PDF descargado con datos incompletos");
      } else {
        toast.success("PDF descargado correctamente");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar el PDF");
      console.error(error);
    } finally {
      setIsGenerating(false);
      setPendingDownload(null);
    }
  };

  // Word export - generates .docx file
  const handleGenerateWord = async (forceDownload = false) => {
    // Block if no reportData
    if (!visionReport.reportData) {
      toast.error("No hay datos procesados", {
        description: "Vuelve atrás y genera el informe primero",
      });
      return;
    }

    // Check validation errors
    const validationErrors = getValidationErrors(formData, visionReport.reportData, sections);
    
    // If there are errors and not forcing download, show confirmation dialog
    if (validationErrors.length > 0 && !forceDownload) {
      setPendingDownload({ type: 'word', errors: validationErrors });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate Word blob
      const { blob, filename } = await generateWordV2WithBlob(formData, visionReport.reportData, sections);
      
      // Download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Upload to storage and get URL
      let wordUrl: string | undefined;
      try {
        wordUrl = await uploadWordToStorage(blob, filename, visionReport.caseId);
        console.log("[AppGenerator] Word uploaded to storage:", wordUrl);
      } catch (uploadError) {
        console.warn("[AppGenerator] Failed to upload Word to storage:", uploadError);
      }
      
      // Update report status to exported with word_path
      await saveReportToDatabase('exported', undefined, wordUrl);
      
      if (validationErrors.length > 0) {
        toast.warning("Word descargado con datos incompletos");
      } else {
        toast.success("Word descargado correctamente");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar el Word");
      console.error(error);
    } finally {
      setIsGenerating(false);
      setPendingDownload(null);
    }
  };

  // Check if export can be generated (has data and no CRITICAL missing sections)
  const canExportPdf = visionReport.canExportPdf;

  // Confirmation dialog for incomplete PDF download
  const renderConfirmationDialog = () => (
    <AlertDialog open={!!pendingDownload} onOpenChange={(open) => !open && setPendingDownload(null)}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Datos incompletos
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>El informe tiene los siguientes datos pendientes:</p>
              <ul className="list-disc pl-4 space-y-1 text-sm max-h-48 overflow-y-auto">
                {pendingDownload?.errors.map((error, i) => (
                  <li key={i} className="text-muted-foreground">{error}</li>
                ))}
              </ul>
              <p className="text-sm font-medium">¿Deseas descargar el {pendingDownload?.type === 'pdf' ? 'PDF' : 'Word'} de todos modos?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (pendingDownload?.type === 'pdf') {
                handleGeneratePDF(true);
              } else {
                handleGenerateWord(true);
              }
            }}
          >
            Descargar de todos modos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Check if section has data for visual indicator
  const sectionHasDataIndicator = (section: ReportSection) => {
    if (section.id === "keywordTable") {
      return canGenerateKeywordTable;
    }
    return sectionHasData(section.id, section.data, section.images);
  };

  // ============ EDIT SCREEN ============
  if (screen === "edit") {
    // Ensure VisionReportData is set for any on-the-fly text generation
    setVisionReportData(visionReport.reportData);
    
    const filteredSections = filterSectionsWithData(sections);
    const numberedSections = renumberSections(filteredSections);
    
    return (
      <div className="min-h-screen bg-muted/30 pb-24">
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setScreen("form")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a capturas
            </button>
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Editar informe</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8 px-6 space-y-6">
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Edita el texto del informe antes de descargarlo.</strong> Puedes ajustar la redacción, añadir contexto específico o corregir cualquier detalle. Los cambios se guardarán automáticamente.
            </p>
          </div>

          {numberedSections.map((section) => {
            const originalSection = sections.find((s) => s.id === section.id);
            const content = originalSection?.editedContent || generateSectionText(originalSection!, formData);
            
            return (
              <div key={section.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b border-border">
                  <h3 className="font-semibold">{section.title}</h3>
                </div>
                <div className="p-4">
                  <div
                    className="prose prose-sm max-w-none min-h-[150px] p-3 border border-border rounded-lg focus-within:ring-2 focus-within:ring-primary/50 bg-background"
                    contentEditable
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: content }}
                    onBlur={(e) => {
                      updateSectionContent(section.id, e.currentTarget.innerHTML);
                    }}
                  />
                  
                  {/* Show images as reference */}
                  {originalSection?.images && originalSection.images.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Figuras de esta sección:</p>
                      <div className="flex gap-2 flex-wrap">
                        {originalSection.images.map((img, idx) => (
                          <img
                            key={img.id}
                            src={img.src}
                            alt={`Figura ${idx + 1}`}
                            className="h-16 w-auto rounded border border-border object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border">
          <div className="max-w-4xl mx-auto px-6 py-4 flex gap-3">
            <button
              onClick={handleGoToPreview}
              className="btn-secondary flex items-center justify-center gap-2 px-4"
            >
              <Eye className="w-5 h-5" />
              Vista previa
            </button>
            <button
              onClick={() => handleGenerateWord()}
              disabled={isGenerating || !visionReport.reportData}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando...
                </>
              ) : !visionReport.reportData ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Sin datos
                </>
              ) : !canExportPdf ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Descargar Word (incompleto)
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Descargar Word
                </>
              )}
            </button>
            <button
              onClick={() => handleGeneratePDF()}
              disabled={isGenerating || !visionReport.reportData}
              className="flex-1 btn-generate flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando...
                </>
              ) : !visionReport.reportData ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Sin datos
                </>
              ) : !canExportPdf ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Descargar PDF (incompleto)
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
        {renderConfirmationDialog()}
      </div>
    );
  }

  // ============ PREVIEW SCREEN ============
  if (screen === "preview") {
    // Ensure VisionReportData is set for any on-the-fly text generation
    setVisionReportData(visionReport.reportData);
    
    const filteredSections = filterSectionsWithData(sections);
    const numberedSections = renumberSections(filteredSections);
    
    return (
      <div className="min-h-screen bg-muted/30 pb-24">
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setScreen("edit")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a edición
            </button>
            <h1 className="text-lg font-semibold">Vista previa ({numberedSections.length} secciones)</h1>
          </div>
        </header>

        <main className="py-8 px-6">
          <ReportPreview formData={formData} sections={sections} reportData={visionReport.reportData} />
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border">
          <div className="max-w-4xl mx-auto px-6 py-4 flex gap-3">
            <button
              onClick={() => handleGenerateWord()}
              disabled={isGenerating || !visionReport.reportData}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando...
                </>
              ) : !visionReport.reportData ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Sin datos
                </>
              ) : !canExportPdf ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Descargar Word (incompleto)
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Descargar Word
                </>
              )}
            </button>
            <button
              onClick={() => handleGeneratePDF()}
              disabled={isGenerating || !visionReport.reportData}
              className="flex-1 btn-generate flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando PDF...
                </>
              ) : !visionReport.reportData ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Sin datos
                </>
              ) : !canExportPdf ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Descargar PDF (incompleto)
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
        {renderConfirmationDialog()}
      </div>
    );
  }

  // ============ FORM SCREEN (CAPTURE UPLOAD) ============
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/informes" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-10 w-auto" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">Justificaciones Like a Rocket</h1>
                <p className="text-sm text-muted-foreground">Generador de informes Kit Digital – Fase II</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/informes/seo-lista" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Ver informes</span>
            </Link>
            <Link 
              to="/informes" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* General Form Data */}
        <FormSection data={formData} onChange={setFormData} />

        {/* Sections - Only capture upload, no manual forms */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Secciones del Informe</h2>
            <span className="text-sm text-muted-foreground">
              {sectionsWithData.length} de {sections.length} con datos
            </span>
          </div>
          
          {/* Instructions */}
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-sm flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
            <span>
              <strong>Sube capturas con recuadros resaltados</strong> en cada sección. Al pulsar "Generar informe", todas las capturas se procesarán automáticamente con IA.
            </span>
          </div>

          {/* Vision report status */}
          {visionReport.isProcessing && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">Procesando capturas con IA...</span>
            </div>
          )}
          
          {visionReport.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-destructive">{visionReport.error}</span>
            </div>
          )}

          {visionReport.missingMessage && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">{visionReport.missingMessage}</span>
            </div>
          )}

          {sections.map((section) => {
            const hasData = sectionHasDataIndicator(section);
            const isKeywordTableSection = section.id === "keywordTable";
            
            // Get missing fields for keyword table section
            const missingFields: string[] = [];
            if (isKeywordTableSection) {
              if (!formData.servicio?.trim()) missingFields.push("Servicio");
              if (!formData.startDate) missingFields.push("Fecha inicio");
              if (!formData.endDate) missingFields.push("Fecha fin");
              if (keywordSeedList.length < 4) missingFields.push("Capturas de keywords (mín. 4)");
            }
            
            return (
              <div 
                key={section.id} 
                className={`section-card ${hasData ? "ring-1 ring-accent/40" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                  <div className="flex items-center gap-2">
                    {hasData ? (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-medium">
                        ✓ Con datos
                      </span>
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        Sin datos
                      </span>
                    )}
                  </div>
                </div>

                {/* For keywordTable section, show generated table instead of image dropzone */}
                {isKeywordTableSection ? (
                  <KeywordEvolutionTableView
                    table={keywordEvolutionTable}
                    canGenerate={canGenerateKeywordTable}
                    missingFields={missingFields}
                  />
                ) : (
                  <ImageDropzone
                    images={section.images}
                    onChange={(images) => updateSectionImages(section.id, images)}
                    maxImages={5}
                    sectionId={section.id}
                    onDataExtracted={(data) => handleDataExtracted(section.id, data)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating action button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button 
            onClick={handleGoToEdit} 
            className="w-full btn-generate flex items-center justify-center gap-2"
            disabled={totalImages === 0 || isProcessingVision}
          >
            {isProcessingVision ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando capturas...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generar informe ({totalImages} capturas)
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Las capturas se procesarán con IA y podrás editar el texto antes de descargar
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
