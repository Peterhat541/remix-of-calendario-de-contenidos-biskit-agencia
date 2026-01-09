import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FileDown, Eye, ArrowLeft, Loader2, Edit3, Sparkles, Home, CheckCircle, AlertTriangle, RefreshCw, XCircle, PenLine } from "lucide-react";
import { SocialMediaFormSection } from "@/components/SocialMediaFormSection";
import { MonthlyPublicationsDropzone } from "@/components/MonthlyPublicationsDropzone";
import { ImageDropzone } from "@/components/ImageDropzone";
import { ManualMetricsForm, ManualMetricsData } from "@/components/ManualMetricsForm";
import { generateSocialMediaPDF } from "@/utils/socialMediaPdfGenerator";
import { generateSocialMediaMetricsText, extractMetricsFromImages } from "@/utils/socialMediaTextGenerator";
import { analyzeImage, generateImageHash, getCachedResult, setCachedResult } from "@/services/imageAnalysisService";
import {
  SocialMediaFormData,
  MonthlyPublications,
  ImageItem,
  initializePublications,
  getLastThreeMonths,
} from "@/types/socialMediaReport";
import { ExtractedImageData } from "@/types/imageAnalysis";
import { toast } from "sonner";

type Screen = "form" | "edit" | "preview";

interface ExtractionState {
  isExtracting: boolean;
  progress: { current: number; total: number };
  retryAttempt: number;
  currentImageIndex: number;
  lastError: string | null;
  failedImages: number[];
  showManualForm: boolean;
}

export default function InformeRedesSociales() {
  const [screen, setScreen] = useState<Screen>("form");
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [extractionState, setExtractionState] = useState<ExtractionState>({
    isExtracting: false,
    progress: { current: 0, total: 0 },
    retryAttempt: 0,
    currentImageIndex: -1,
    lastError: null,
    failedImages: [],
    showManualForm: false,
  });

  const [formData, setFormData] = useState<SocialMediaFormData>({
    beneficiaryName: "",
    nif: "",
    socialNetwork: "",
    socialNetworkUrl: "",
    startDate: "",
    endDate: "",
    reportDate: new Date().toISOString().split("T")[0],
  });

  const [publications, setPublications] = useState<MonthlyPublications[]>([
    { monthName: "Mes 1", images: [] },
    { monthName: "Mes 2", images: [] },
    { monthName: "Mes 3", images: [] },
  ]);

  const [metricsImages, setMetricsImages] = useState<ImageItem[]>([]);
  const [editedContent, setEditedContent] = useState<string>("");
  const [manualMetrics, setManualMetrics] = useState<ManualMetricsData | null>(null);

  // Actualizar nombres de meses cuando cambia la fecha fin
  useEffect(() => {
    if (formData.endDate) {
      const newMonthNames = getLastThreeMonths(formData.endDate);
      setPublications(prev => prev.map((pub, idx) => ({
        ...pub,
        monthName: newMonthNames[idx] || pub.monthName,
      })));
    }
  }, [formData.endDate]);

  // Contar imágenes totales
  const totalPublicationImages = useMemo(() => {
    return publications.reduce((acc, p) => acc + p.images.length, 0);
  }, [publications]);

  const hasMetricsData = useMemo(() => {
    return metricsImages.some(img => img.extractedData) || manualMetrics !== null;
  }, [metricsImages, manualMetrics]);

  // Check if image is already cached
  const isImageCached = useCallback((imageSrc: string): boolean => {
    const hash = generateImageHash(imageSrc);
    return getCachedResult(hash) !== null;
  }, []);

  // Get images that need extraction (not cached and no extracted data)
  const imagesNeedingExtraction = useMemo(() => {
    return metricsImages.filter(img => !img.extractedData && !isImageCached(img.src));
  }, [metricsImages, isImageCached]);

  // Apply cached data to images on load
  useEffect(() => {
    const updatedImages = metricsImages.map(img => {
      if (img.extractedData) return img;
      const hash = generateImageHash(img.src);
      const cached = getCachedResult(hash);
      if (cached) {
        return { ...img, extractedData: cached };
      }
      return img;
    });
    
    const hasChanges = updatedImages.some((img, idx) => 
      img.extractedData !== metricsImages[idx].extractedData
    );
    
    if (hasChanges) {
      setMetricsImages(updatedImages);
    }
  }, [metricsImages.length]); // Only run when images count changes

  // Extraer datos de todas las capturas de métricas
  const handleExtractAll = async () => {
    if (metricsImages.length === 0) return;

    // Cancel any ongoing extraction
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setExtractionState({
      isExtracting: true,
      progress: { current: 0, total: metricsImages.length },
      retryAttempt: 0,
      currentImageIndex: 0,
      lastError: null,
      failedImages: [],
      showManualForm: false,
    });

    const updatedImages = [...metricsImages];
    let successCount = 0;
    const failedIndices: number[] = [];

    for (let i = 0; i < metricsImages.length; i++) {
      // Check for abort
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }

      const image = metricsImages[i];
      
      // Skip if already has data or is cached
      if (image.extractedData) {
        successCount++;
        setExtractionState(prev => ({
          ...prev,
          progress: { current: i + 1, total: metricsImages.length },
          currentImageIndex: i,
        }));
        continue;
      }

      // Check cache
      const hash = generateImageHash(image.src);
      const cached = getCachedResult(hash);
      if (cached) {
        updatedImages[i] = { ...image, extractedData: cached };
        successCount++;
        setExtractionState(prev => ({
          ...prev,
          progress: { current: i + 1, total: metricsImages.length },
          currentImageIndex: i,
        }));
        continue;
      }

      setExtractionState(prev => ({
        ...prev,
        progress: { current: i + 1, total: metricsImages.length },
        currentImageIndex: i,
        retryAttempt: 0,
      }));

      try {
        const result = await analyzeImage(image.src, {
          signal: abortControllerRef.current?.signal,
          onRetry: (state) => {
            setExtractionState(prev => ({
              ...prev,
              retryAttempt: state.attempt,
            }));
          },
        });

        if (result.success && result.data) {
          updatedImages[i] = { ...image, extractedData: result.data };
          successCount++;
        } else {
          console.error(`Failed to analyze image ${i}:`, result.error);
          failedIndices.push(i);
          if (result.error) {
            setExtractionState(prev => ({
              ...prev,
              lastError: result.error || null,
            }));
          }
        }
      } catch (error) {
        console.error(`Error analyzing image ${image.id}:`, error);
        failedIndices.push(i);
      }
    }

    setMetricsImages(updatedImages);
    
    const allFailed = successCount === 0 && failedIndices.length > 0;
    const someFailed = failedIndices.length > 0;

    setExtractionState(prev => ({
      ...prev,
      isExtracting: false,
      failedImages: failedIndices,
      showManualForm: allFailed,
    }));

    if (allFailed) {
      toast.error("No se pudieron extraer datos", {
        description: "Puedes reintentar o introducir los datos manualmente.",
      });
    } else if (someFailed) {
      toast.warning("Extracción parcial", {
        description: `${successCount}/${metricsImages.length} capturas procesadas. Algunas fallaron.`,
      });
    } else {
      toast.success("Extracción completada", {
        description: `${successCount}/${metricsImages.length} capturas procesadas`,
      });
    }
  };

  // Cancel extraction
  const handleCancelExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setExtractionState(prev => ({
      ...prev,
      isExtracting: false,
    }));
    toast.info("Extracción cancelada");
  };

  // Handle manual metrics submission
  const handleManualMetricsSubmit = (data: ManualMetricsData) => {
    setManualMetrics(data);
    setExtractionState(prev => ({
      ...prev,
      showManualForm: false,
    }));
    toast.success("Datos manuales guardados", {
      description: "Ahora puedes generar el informe.",
    });
  };

  // Manejar extracción individual
  const handleDataExtracted = (data: ExtractedImageData) => {
    toast.success("Datos extraídos", {
      description: `Tipo: ${data.capture_type}`,
    });
  };

  // Generar contenido inicial para edición
  const generateInitialContent = useCallback(() => {
    // Use manual metrics if available, otherwise extract from images
    let metricsData;
    if (manualMetrics) {
      metricsData = {
        profileInteractions: manualMetrics.profileInteractions,
        calls: manualMetrics.calls,
        directionsRequests: manualMetrics.directionsRequests,
        websiteClicks: manualMetrics.websiteClicks,
      };
    } else {
      metricsData = extractMetricsFromImages(metricsImages);
    }
    
    const monthNames = publications.map(p => p.monthName);
    const generatedText = generateSocialMediaMetricsText(formData, metricsData, monthNames);
    setEditedContent(generatedText);
  }, [formData, metricsImages, publications, manualMetrics]);

  const handleGoToEdit = () => {
    if (!formData.beneficiaryName.trim() || !formData.nif.trim()) {
      toast.error("Rellena al menos el nombre del beneficiario y el NIF");
      return;
    }

    if (!formData.socialNetwork) {
      toast.error("Selecciona la red social");
      return;
    }

    if (metricsImages.length === 0 && !manualMetrics) {
      toast.error("Añade al menos una captura de métricas o introduce datos manuales");
      return;
    }

    // Generar contenido si no existe
    if (!editedContent) {
      generateInitialContent();
    }

    setScreen("edit");
  };

  const handleGoToPreview = () => {
    setScreen("preview");
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generateSocialMediaPDF(formData, publications, metricsImages, editedContent);
      toast.success("PDF descargado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar el PDF");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ============ EDIT SCREEN ============
  if (screen === "edit") {
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
              <strong>Edita el texto del informe antes de descargarlo.</strong> Puedes ajustar la redacción, añadir contexto específico o corregir cualquier detalle.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b border-border">
              <h3 className="font-semibold">Monitorización y control periódico: estadísticas y métricas</h3>
            </div>
            <div className="p-4">
              <div
                className="prose prose-sm max-w-none min-h-[300px] p-3 border border-border rounded-lg focus-within:ring-2 focus-within:ring-primary/50 bg-background"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: editedContent }}
                onBlur={(e) => {
                  setEditedContent(e.currentTarget.innerHTML);
                }}
              />

              {/* Show metrics images as reference */}
              {metricsImages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Capturas de métricas:</p>
                  <div className="flex gap-2 flex-wrap">
                    {metricsImages.map((img, idx) => (
                      <img
                        key={img.id}
                        src={img.src}
                        alt={`Métrica ${idx + 1}`}
                        className="h-16 w-auto rounded border border-border object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border">
          <div className="max-w-4xl mx-auto px-6 py-4 flex gap-3">
            <button
              onClick={handleGoToPreview}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Vista previa
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex-1 btn-generate flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando...
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
      </div>
    );
  }

  // ============ PREVIEW SCREEN ============
  if (screen === "preview") {
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
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Vista previa</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8 px-6 space-y-6">
          {/* Preview del contenido */}
          <div className="bg-white border border-border rounded-lg p-8 shadow-sm">
            <h2 className="text-xl font-bold text-center mb-6 uppercase">
              Informe de Publicidad y Gestión de Redes Sociales
            </h2>

            <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6 text-sm">
              <p><strong>Red social:</strong> {formData.socialNetwork || "—"}</p>
              <p><strong>Enlace:</strong> {formData.socialNetworkUrl || "—"}</p>
              <p><strong>Periodo:</strong> {formData.startDate} / {formData.endDate}</p>
              <p><strong>Beneficiario:</strong> {formData.beneficiaryName} | {formData.nif}</p>
            </div>

            {/* Publicaciones */}
            {publications.some(p => p.images.length > 0) && (
              <div className="mb-6">
                <h3 className="text-lg font-bold border-b-2 border-black pb-2 mb-4">
                  Publicaciones de los últimos meses
                </h3>
                {publications.filter(p => p.images.length > 0).map((pub, idx) => (
                  <div key={idx} className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">{pub.monthName}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {pub.images.map((img, imgIdx) => (
                        <img
                          key={img.id}
                          src={img.src}
                          alt={`Publicación ${imgIdx + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Métricas */}
            <div className="mb-6">
              <h3 className="text-lg font-bold border-b-2 border-black pb-2 mb-4">
                Monitorización y control periódico
              </h3>
              {metricsImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {metricsImages.map((img, idx) => (
                    <img
                      key={img.id}
                      src={img.src}
                      alt={`Métricas ${idx + 1}`}
                      className="w-full h-32 object-contain rounded border"
                    />
                  ))}
                </div>
              )}
              <div
                className="prose prose-sm max-w-none text-justify"
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border">
          <div className="max-w-4xl mx-auto px-6 py-4 flex gap-3">
            <button
              onClick={() => setScreen("edit")}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <Edit3 className="w-5 h-5" />
              Volver a editar
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex-1 btn-generate flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando...
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
      </div>
    );
  }

  // ============ FORM SCREEN (default) ============
  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/informes"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-5 h-5" />
            Volver a informes
          </Link>
          <h1 className="text-lg font-semibold">Informe de Redes Sociales</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-6 space-y-8">
        {/* Formulario de cabecera */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Datos del informe</h2>
          <SocialMediaFormSection data={formData} onChange={setFormData} />
        </section>

        {/* Publicaciones por mes */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Publicaciones por mes</h2>
          <MonthlyPublicationsDropzone
            publications={publications}
            onChange={setPublications}
            maxImagesPerMonth={5}
          />
          <div className="mt-3 flex items-center gap-2 text-sm">
            {totalPublicationImages > 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">{totalPublicationImages} capturas de publicaciones</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-muted-foreground">Sin capturas de publicaciones</span>
              </>
            )}
          </div>
        </section>

        {/* Métricas con interpretación IA */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Métricas y estadísticas</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sube capturas de las estadísticas de la red social. Estas capturas serán interpretadas por IA para generar el texto narrativo.
          </p>

          <ImageDropzone
            images={metricsImages}
            onChange={setMetricsImages}
            maxImages={10}
            sectionId="metrics"
            onDataExtracted={handleDataExtracted}
          />

          {metricsImages.length > 0 && (
            <div className="mt-4 space-y-3">
              {/* Extraction button with states */}
              {extractionState.isExtracting ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Extrayendo {extractionState.progress.current}/{extractionState.progress.total}
                          {extractionState.retryAttempt > 0 && (
                            <span className="text-blue-600 ml-2">
                              (reintento {extractionState.retryAttempt}/3)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-blue-700">
                          Procesando captura {extractionState.currentImageIndex + 1}...
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCancelExtraction}
                      className="text-sm text-blue-700 hover:text-blue-900 flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(extractionState.progress.current / extractionState.progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleExtractAll}
                  disabled={extractionState.isExtracting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  <Sparkles className="w-5 h-5" />
                  {imagesNeedingExtraction.length < metricsImages.length 
                    ? `✨ Extraer datos (${imagesNeedingExtraction.length} pendientes)`
                    : "✨ Extraer datos de métricas"
                  }
                </button>
              )}

              {/* Error state with retry */}
              {extractionState.lastError && !extractionState.isExtracting && extractionState.failedImages.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Error en {extractionState.failedImages.length} captura(s)
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {extractionState.lastError}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleExtractAll}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reintentar
                    </button>
                    <button
                      onClick={() => setExtractionState(prev => ({ ...prev, showManualForm: true }))}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm hover:bg-amber-200 transition-colors"
                    >
                      <PenLine className="w-4 h-4" />
                      Introducir manualmente
                    </button>
                  </div>
                </div>
              )}

              {/* Manual form fallback */}
              {extractionState.showManualForm && (
                <ManualMetricsForm
                  onSubmit={handleManualMetricsSubmit}
                  onCancel={() => setExtractionState(prev => ({ ...prev, showManualForm: false }))}
                  initialData={manualMetrics || undefined}
                />
              )}

              {/* Show manual data indicator */}
              {manualMetrics && !extractionState.showManualForm && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-800">Usando datos introducidos manualmente</span>
                  </div>
                  <button
                    onClick={() => setExtractionState(prev => ({ ...prev, showManualForm: true }))}
                    className="text-xs text-amber-700 hover:text-amber-900 underline"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-sm">
            {hasMetricsData ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">
                  {manualMetrics ? "Datos manuales listos" : "Datos extraídos correctamente"}
                </span>
              </>
            ) : metricsImages.length > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-muted-foreground">Pulsa "Extraer datos" para interpretar las capturas</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-muted-foreground">Añade capturas de métricas (obligatorio)</span>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={handleGoToEdit}
            className="w-full btn-generate flex items-center justify-center gap-2"
          >
            <Edit3 className="w-5 h-5" />
            Generar informe
          </button>
        </div>
      </div>
    </div>
  );
}
