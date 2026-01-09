import { useState } from 'react';
import { Trash2, GripVertical, Edit3, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarPost } from '@/types/contentCalendar';

interface CalendarEntryEditorProps {
  entry: CalendarPost;
  onUpdate: (entry: CalendarPost) => void;
  onDelete: (id: string) => void;
}

const CalendarEntryEditor = ({ entry, onUpdate, onDelete }: CalendarEntryEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(entry);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(entry);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="border-primary/50">
        <CardContent className="p-4 space-y-3">
          <Input
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            placeholder="Título del post"
            className="font-medium"
          />
          <Textarea
            value={editData.copy}
            onChange={(e) => setEditData({ ...editData, copy: e.target.value })}
            placeholder="Copy del post"
            rows={4}
          />
          <div className="flex gap-2 justify-end">
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
        <div className="flex items-start gap-3">
          <div className="cursor-grab opacity-0 group-hover:opacity-40 transition-opacity pt-1">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">
              {entry.title || <span className="text-muted-foreground italic">Sin título</span>}
            </h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {entry.copy || <span className="italic">Sin copy</span>}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(entry.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarEntryEditor;
