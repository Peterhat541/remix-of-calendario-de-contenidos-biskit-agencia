import { useCallback, useState } from "react";
import { ImageIcon, X, GripVertical, Edit2, Check } from "lucide-react";
import { MonthlyPublications, ImageItem } from "@/types/socialMediaReport";
import { Input } from "@/components/ui/input";
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

interface MonthlyPublicationsDropzoneProps {
  publications: MonthlyPublications[];
  onChange: (publications: MonthlyPublications[]) => void;
  maxImagesPerMonth?: number;
}

function SortableImage({
  image,
  onRemove,
}: {
  image: ImageItem;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="relative bg-muted rounded-lg overflow-hidden border border-border">
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
          alt="Publicación"
          className="w-full h-24 object-cover"
        />
      </div>
    </div>
  );
}

function MonthBlock({
  publication,
  onChange,
  maxImages,
  monthIndex,
}: {
  publication: MonthlyPublications;
  onChange: (updated: MonthlyPublications) => void;
  maxImages: number;
  monthIndex: number;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(publication.monthName);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = maxImages - publication.images.length;
      const toProcess = Array.from(files).slice(0, remaining);

      const newImages: ImageItem[] = [];
      let processed = 0;

      toProcess.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              newImages.push({
                id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                src: e.target.result as string,
              });
              processed++;
              if (processed === toProcess.length) {
                onChange({
                  ...publication,
                  images: [...publication.images, ...newImages],
                });
              }
            }
          };
          reader.readAsDataURL(file);
        }
      });
    },
    [publication, onChange, maxImages]
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
      const oldIndex = publication.images.findIndex((img) => img.id === active.id);
      const newIndex = publication.images.findIndex((img) => img.id === over.id);
      onChange({
        ...publication,
        images: arrayMove(publication.images, oldIndex, newIndex),
      });
    }
  };

  const removeImage = (id: string) => {
    onChange({
      ...publication,
      images: publication.images.filter((img) => img.id !== id),
    });
  };

  const saveMonthName = () => {
    onChange({
      ...publication,
      monthName: editName,
    });
    setIsEditingName(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden" onPaste={handlePaste}>
      <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 w-40"
              autoFocus
            />
            <button
              type="button"
              onClick={saveMonthName}
              className="p-1 hover:bg-muted rounded"
            >
              <Check className="w-4 h-4 text-primary" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">
              Mes {monthIndex + 1}: {publication.monthName}
            </h4>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="p-1 hover:bg-muted rounded"
            >
              <Edit2 className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}
        <span className="text-xs text-muted-foreground">
          {publication.images.length}/{maxImages} capturas
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Drop zone */}
        {publication.images.length < maxImages && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
              ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
            `}
            onClick={() => document.getElementById(`file-input-month-${monthIndex}`)?.click()}
          >
            <input
              id={`file-input-month-${monthIndex}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">
              Arrastra capturas de publicaciones o <span className="text-primary">haz clic</span>
            </p>
          </div>
        )}

        {/* Image grid */}
        {publication.images.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={publication.images.map((img) => img.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {publication.images.map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    onRemove={() => removeImage(image.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {publication.images.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Sin capturas de publicaciones para este mes
          </p>
        )}
      </div>
    </div>
  );
}

export function MonthlyPublicationsDropzone({
  publications,
  onChange,
  maxImagesPerMonth = 5,
}: MonthlyPublicationsDropzoneProps) {
  const handleMonthChange = (index: number, updated: MonthlyPublications) => {
    const newPublications = [...publications];
    newPublications[index] = updated;
    onChange(newPublications);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
        <p className="text-sm text-foreground">
          <strong>Publicaciones de los 3 últimos meses</strong>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Sube capturas de las publicaciones realizadas en cada mes. Estas imágenes aparecerán en el PDF sin interpretación de IA.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {publications.map((publication, index) => (
          <MonthBlock
            key={index}
            publication={publication}
            onChange={(updated) => handleMonthChange(index, updated)}
            maxImages={maxImagesPerMonth}
            monthIndex={index}
          />
        ))}
      </div>
    </div>
  );
}
