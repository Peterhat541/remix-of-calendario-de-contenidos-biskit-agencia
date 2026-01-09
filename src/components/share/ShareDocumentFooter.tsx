import { Button } from '@/components/ui/button';
import { Loader2, Send, CheckCircle, Check } from 'lucide-react';

interface ShareDocumentFooterProps {
  hasUnsavedChanges: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  isApproved: boolean;
  isApproving: boolean;
  onSubmit: () => void;
  onApprove: () => void;
}

const ShareDocumentFooter = ({
  hasUnsavedChanges,
  isSubmitting,
  isSubmitted,
  isApproved,
  isApproving,
  onSubmit,
  onApprove
}: ShareDocumentFooterProps) => {
  // Already approved state
  if (isApproved) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-green-50 border-t border-green-200 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">
            Calendario aprobado sin modificaciones
          </p>
        </div>
      </div>
    );
  }

  // Feedback submitted state
  if (isSubmitted) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-green-50 border-t border-green-200 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">
            Feedback enviado correctamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {hasUnsavedChanges ? (
            <span className="text-amber-600 font-medium">● Tienes cambios pendientes de enviar</span>
          ) : (
            <span>Revise el documento y añada sus propuestas en cada publicación</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Approve without changes button */}
          <Button
            variant="outline"
            size="lg"
            onClick={onApprove}
            disabled={isApproving || isSubmitting || hasUnsavedChanges}
            className="gap-2 border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800"
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Aprobando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Aprobar sin modificaciones
              </>
            )}
          </Button>
          
          {/* Submit feedback button */}
          <Button
            size="lg"
            onClick={onSubmit}
            disabled={isSubmitting || isApproving}
            className="gap-2 shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar feedback
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentFooter;
