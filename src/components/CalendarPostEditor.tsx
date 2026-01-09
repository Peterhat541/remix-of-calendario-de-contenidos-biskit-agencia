import { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Edit3, Check, X, Upload, Clipboard, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarPost, getDaysInMonth, getImageUrl } from '@/types/contentCalendar';
import { toast } from 'sonner';

interface CalendarPostEditorProps {
  post: CalendarPost;
  monthName: string;
  year: number;
  onUpdate: (post: CalendarPost) => void;
  onDelete: (id: string) => void;
}

const CalendarPostEditor = ({ post, monthName, year, onUpdate, onDelete }: CalendarPostEditorProps) => {
  const [isEditing, setIsEditing] = useState(!post.title && !post.copy);
  const [editData, setEditData] = useState(post);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);

  const daysInMonth = getDaysInMonth(monthName, year);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(post);
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setEditData({
          ...editData,
          image: { 
            source: 'file', 
            clipboard_data_url: '', 
            file_url: dataUrl 
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteImage = useCallback(async (e?: ClipboardEvent) => {
    try {
      let items: ClipboardItems | DataTransferItemList;
      
      if (e && e.clipboardData) {
        items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                setEditData(prev => ({
                  ...prev,
                  image: { 
                    source: 'clipboard', 
                    clipboard_data_url: dataUrl, 
                    file_url: '' 
                  }
                }));
                toast.success('Imagen pegada');
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
      } else {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              setEditData(prev => ({
                ...prev,
                image: { 
                  source: 'clipboard', 
                  clipboard_data_url: dataUrl, 
                  file_url: '' 
                }
              }));
              toast.success('Imagen pegada');
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      toast.error('No hay imagen en el portapapeles');
    } catch (err) {
      toast.error('No se pudo acceder al portapapeles');
    }
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    
    const handlePaste = (e: ClipboardEvent) => {
      handlePasteImage(e);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isEditing, handlePasteImage]);

  const handleClearImage = () => {
    setEditData({
      ...editData,
      image: { source: 'none', clipboard_data_url: '', file_url: '' }
    });
  };

  const currentImageUrl = getImageUrl(editData.image);
  const displayImageUrl = getImageUrl(post.image);

  if (isEditing) {
    return (
      <Card className="border-primary/50 bg-card">
        <CardContent className="p-4 space-y-4">
          {/* Day selector */}
          <div className="space-y-2">
            <Label>Día del mes</Label>
            <Select
              value={editData.day_of_month?.toString() || ''}
              onValueChange={(v) => setEditData({ ...editData, day_of_month: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona día" />
              </SelectTrigger>
              <SelectContent>
                {days.map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    {day} de {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image section */}
          <div className="space-y-2">
            <Label>Imagen</Label>
            <div 
              ref={imageAreaRef}
              className="border-2 border-dashed border-border rounded-md p-4 text-center transition-colors hover:border-primary/50"
            >
              {currentImageUrl ? (
                <div className="relative">
                  <img 
                    src={currentImageUrl} 
                    alt="Preview"
                    className="w-full h-40 object-contain rounded-md bg-muted"
                  />
                  <div className="flex gap-2 justify-center mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Cambiar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handlePasteImage()}
                    >
                      <Clipboard className="h-4 w-4 mr-1" />
                      Pegar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={handleClearImage}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Pulsa <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+V</kbd> para pegar imagen
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Subir archivo
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handlePasteImage()}
                    >
                      <Clipboard className="h-4 w-4 mr-1" />
                      Pegar
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título del post</Label>
            <Input
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              placeholder="Título del post"
            />
          </div>

          {/* Copy */}
          <div className="space-y-2">
            <Label>Copy</Label>
            <Textarea
              value={editData.copy}
              onChange={(e) => setEditData({ ...editData, copy: e.target.value })}
              placeholder="Texto del post..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image preview */}
          <div className="w-20 h-20 flex-shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
            {displayImageUrl ? (
              <img 
                src={displayImageUrl} 
                alt="Post image"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-primary">
                  {post.day_of_month ? `${post.day_of_month} de ${monthName}` : 'Sin fecha'}
                </span>
                <h4 className="font-medium text-foreground line-clamp-1">
                  {post.title || <span className="text-muted-foreground italic">Sin título</span>}
                </h4>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(post.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {post.copy || <span className="italic">Sin copy</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarPostEditor;
