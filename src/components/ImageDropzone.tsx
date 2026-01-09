import { useCallback, useState } from "react";
import { ImageIcon, X, GripVertical, Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { ImageItem } from "@/types/report";
import { ExtractedImageData } from "@/types/imageAnalysis";
import { analyzeImage } from "@/services/imageAnalysisService";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ImageDropzoneProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  sectionId?: string;
  onDataExtracted?: (data: ExtractedImageData) => void;
}

// Component to show extracted data summary
function ExtractedDataSummary({ data }: { data: ExtractedImageData }) {
  const [expanded, setExpanded] = useState(false);
  
  // Get low confidence items
  const lowConfidenceItems = data.evidence?.filter(e => e.confidence < 0.6) || [];
  
  // Build summary
  const summaryItems: string[] = [];
  if (data.source_tool) summaryItems.push(`Herramienta: ${data.source_tool}`);
  if (data.domain) summaryItems.push(`Dominio: ${data.domain}`);
  if (data.metrics.organic_traffic !== null) summaryItems.push(`Tráfico: ${data.metrics.organic_traffic}`);
  if (data.metrics.keywords_count !== null) summaryItems.push(`Keywords: ${data.metrics.keywords_count}`);
  if (data.metrics.authority_score !== null) summaryItems.push(`AS: ${data.metrics.authority_score}`);
  if (data.metrics.ref_domains !== null) summaryItems.push(`Dominios ref: ${data.metrics.ref_domains}`);
  if (data.metrics.backlinks !== null) summaryItems.push(`Backlinks: ${data.metrics.backlinks}`);
  
  return (
    <div className="mt-2 p-2 bg-muted/50 rounded text-xs border border-border">
      <div className="flex items-center justify-between">
        <span className="font-medium text-primary">{data.capture_type}</span>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-muted rounded"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      
      {summaryItems.length > 0 && (
        <div className="mt-1 text-muted-foreground">
          {summaryItems.slice(0, 3).join(" · ")}
        </div>
      )}
      
      {lowConfidenceItems.length > 0 && (
        <div className="mt-1 text-amber-600 dark:text-amber-400">
          ⚠️ {lowConfidenceItems.length} dato(s) con baja confianza
        </div>
      )}
      
      {expanded && (
        <pre className="mt-2 p-2 bg-background rounded text-[10px] overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function SortableImage({
  image,
  onRemove,
  onAnalyze,
  isAnalyzing,
}: {
  image: ImageItem;
  onRemove: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasLowConfidence = image.extractedData?.evidence?.some(e => e.confidence < 0.6);
  const hasData = !!image.extractedData;

  return (
    <div ref={setNodeRef} style={style} className="relative space-y-2">
      <div className="relative group bg-muted rounded-lg overflow-hidden border border-border">
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1 bg-background/80 rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X className="w-4 h-4" />
        </button>
        
        <img
          src={image.src}
          alt="Captura"
          className="w-full h-32 object-cover"
        />
        
        {/* Status indicator overlay */}
        {hasData && (
          <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 text-xs rounded ${
            hasLowConfidence 
              ? "bg-amber-500/90 text-white" 
              : "bg-emerald-600/90 text-white"
          }`}>
            {hasLowConfidence ? "⚠️ Verificar" : "✅ Datos extraídos"}
          </div>
        )}
      </div>
      
      {/* Action button below image - always visible */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-60 ${
          isAnalyzing
            ? "bg-muted text-muted-foreground cursor-wait"
            : hasData && hasLowConfidence
            ? "bg-amber-500 hover:bg-amber-600 text-white"
            : hasData
            ? "bg-muted hover:bg-muted/80 text-foreground border border-border"
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        }`}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Extrayendo…
          </>
        ) : hasData && hasLowConfidence ? (
          <>
            <RefreshCw className="w-4 h-4" />
            🔁 Reintentar
          </>
        ) : hasData ? (
          <>
            <RefreshCw className="w-4 h-4" />
            Reintentar extracción
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            ✨ Extraer datos
          </>
        )}
      </button>
      
      {/* Low confidence warning */}
      {hasData && hasLowConfidence && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Asegúrate de que los recuadros resaltan números/texto legible.
        </p>
      )}
      
      {/* Extracted data summary below image */}
      {hasData && (
        <ExtractedDataSummary data={image.extractedData!} />
      )}
    </div>
  );
}

export function ImageDropzone({
  images,
  onChange,
  maxImages = 999,
  sectionId,
  onDataExtracted,
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [analyzingImageId, setAnalyzingImageId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAnalyzeImage = async (image: ImageItem) => {
    setAnalyzingImageId(image.id);
    
    try {
      const result = await analyzeImage(image.src);
      
      if (result.success && result.data) {
        // Update the image with extracted data
        const updatedImages = images.map((img) =>
          img.id === image.id ? { ...img, extractedData: result.data } : img
        );
        onChange(updatedImages);
        
        // Notify parent about extracted data
        if (onDataExtracted) {
          onDataExtracted(result.data);
        }
        
        const lowConfidence = result.data.evidence?.some(e => e.confidence < 0.6);
        
        toast.success("Datos extraídos", {
          description: `Tipo: ${result.data.capture_type}${lowConfidence ? " (algunos datos requieren verificación)" : ""}`,
        });
      } else {
        toast.error("Error al analizar la imagen", {
          description: result.error || "No se pudieron extraer datos",
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Error inesperado al analizar");
    } finally {
      setAnalyzingImageId(null);
    }
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = maxImages - images.length;
      const toProcess = Array.from(files).slice(0, remaining);

      toProcess.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              const newImage: ImageItem = {
                id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                src: e.target.result as string,
              };
              onChange([...images, newImage]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    },
    [images, onChange, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          const dt = new DataTransfer();
          if (file) dt.items.add(file);
          handleFiles(dt.files);
          break;
        }
      }
    },
    [handleFiles]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-3" onPaste={handlePaste}>
      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          `}
          onClick={() => document.getElementById(`file-input-${sectionId || "default"}`)?.click()}
        >
          <input
            id={`file-input-${sectionId || "default"}`}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Arrastra capturas aquí o <span className="text-primary">haz clic</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            También puedes usar <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+V</kbd>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {images.length} {images.length === 1 ? 'captura' : 'capturas'}
          </p>
        </div>
      )}

      {/* Image grid with drag & drop */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onRemove={() => removeImage(image.id)}
                  onAnalyze={() => handleAnalyzeImage(image)}
                  isAnalyzing={analyzingImageId === image.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Help text - only show if images exist but none analyzed */}
      {images.length > 0 && !images.some(img => img.extractedData) && (
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border">
          💡 Usa el botón global <strong>"✨ Extraer datos (todas las capturas)"</strong> o extrae individualmente con el botón de cada imagen.
        </p>
      )}
    </div>
  );
}
