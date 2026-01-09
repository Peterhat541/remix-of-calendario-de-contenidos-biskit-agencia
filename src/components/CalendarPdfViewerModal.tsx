import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { CalendarMeta, CalendarMonth } from '@/types/contentCalendar';
import { generateCalendarPDF } from '@/utils/calendarPdfGenerator';

interface CalendarPdfViewerModalProps {
  open: boolean;
  onClose: () => void;
  calendarMeta: CalendarMeta;
  months: CalendarMonth[];
}

const CalendarPdfViewerModal = ({ 
  open, 
  onClose, 
  calendarMeta, 
  months 
}: CalendarPdfViewerModalProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);

  const generatePdfPreview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Clean up previous URL using ref
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
      setPdfUrl(null);
    }
    
    try {
      const blob = await generateCalendarPDF(calendarMeta, months, true);
      if (blob) {
        // Create object URL from blob - this is safe for iframe embedding
        const url = URL.createObjectURL(blob);
        pdfUrlRef.current = url;
        setPdfUrl(url);
      } else {
        throw new Error('No se pudo generar el PDF');
      }
    } catch (err) {
      console.error('Error generating PDF preview:', err);
      setError('Error al generar la vista previa del PDF');
    } finally {
      setIsLoading(false);
    }
  }, [calendarMeta, months]);

  useEffect(() => {
    if (open) {
      generatePdfPreview();
    }
    
    return () => {
      // Clean up URL when modal closes or component unmounts
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, [open, generatePdfPreview]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!open && pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
      setPdfUrl(null);
      setError(null);
    }
  }, [open]);

  const handleDownload = async () => {
    try {
      await generateCalendarPDF(calendarMeta, months, false);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Error al descargar el PDF');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Vista previa del PDF</DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={generatePdfPreview} 
                size="sm" 
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerar
              </Button>
              <Button onClick={handleDownload} size="sm" disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-4 overflow-hidden bg-muted/30">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Generando PDF...</p>
              </div>
            </div>
          )}
          
          {error && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={generatePdfPreview} variant="outline">
                  Reintentar
                </Button>
              </div>
            </div>
          )}
          
          {pdfUrl && !isLoading && !error && (
            <object
              data={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              type="application/pdf"
              className="w-full h-full rounded border bg-white"
              title="Vista previa del PDF"
            >
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-muted-foreground">
                  Tu navegador no puede mostrar PDFs embebidos.
                </p>
                <Button onClick={handleDownload} variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF para ver
                </Button>
              </div>
            </object>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarPdfViewerModal;
