import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { ShareDocument, ProposalData, createEmptyProposal, getPostProposal } from '@/types/shareCalendar';
import ShareDocumentCover from '@/components/share/ShareDocumentCover';
import ShareMonthSection from '@/components/share/ShareMonthSection';
import ShareDocumentFooter from '@/components/share/ShareDocumentFooter';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';

const ShareCalendar = () => {
  const { token, slug } = useParams<{ token?: string; slug?: string }>();
  const [document, setDocument] = useState<ShareDocument | null>(null);
  const [resolvedToken, setResolvedToken] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ProposalData>(createEmptyProposal());
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const identifier = token || slug;
    if (identifier) {
      console.log("ENTER SHARECALENDAR", {
        token,
        slug,
        origin: window.location.origin,
        href: window.location.href,
      });
      resolveAndLoadDocument(identifier);
    }
  }, [token, slug]);

  const resolveAndLoadDocument = async (identifier: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use SECURITY DEFINER function to validate the link
      // This prevents enumeration of all share links
      const { data: linkResults, error: linkError } = await supabase
        .rpc('validate_share_link', { _identifier: identifier });

      const shareLink = linkResults && linkResults.length > 0 ? linkResults[0] : null;

      if (linkError || !shareLink) {
        setError('Enlace no válido o caducado');
        setIsLoading(false);
        return;
      }

      // Store the resolved token for later use
      const actualToken = shareLink.token;
      setResolvedToken(actualToken);

      // Check expiration
      if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
        setError('Enlace no válido o caducado');
        setIsLoading(false);
        return;
      }

      // Get the document
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', shareLink.document_id)
        .single();

      if (docError || !doc) {
        setError('Documento no encontrado');
        setIsLoading(false);
        return;
      }

      setDocument(doc as unknown as ShareDocument);

      // Check if calendar is already approved (only for this specific token)
      if (doc.calendar_id) {
        const { data: calendar } = await supabase
          .from('content_calendars')
          .select('approval_status, approved_at, approved_via')
          .eq('id', doc.calendar_id)
          .single();
        
        if (
          calendar?.approval_status === 'approved_no_changes' &&
          calendar?.approved_at &&
          calendar?.approved_via === actualToken
        ) {
          setIsApproved(true);
        }
      }

      // Check if there's an existing proposal for this token
      const { data: existingProposal } = await supabase
        .from('proposals')
        .select('*')
        .eq('token', actualToken)
        .eq('document_id', shareLink.document_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingProposal) {
        setProposalId(existingProposal.id);
        setProposal(existingProposal.proposal_json as unknown as ProposalData);
        if (existingProposal.status === 'submitted') {
          setIsSubmitted(true);
        }
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Error al cargar el documento');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePostProposal = (postId: string, field: 'titleChange' | 'copyChange' | 'comment', value: string) => {
    setProposal(prev => {
      const current = getPostProposal(prev, postId);
      return {
        ...prev,
        changes: {
          ...prev.changes,
          [postId]: {
            ...current,
            [field]: value || undefined
          }
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const countProposalChanges = () => {
    let titleChanges = 0;
    let copyChanges = 0;
    let totalComments = 0;

    Object.values(proposal.changes).forEach((postProposal) => {
      if (postProposal.titleChange) titleChanges++;
      if (postProposal.copyChange) copyChanges++;
      if (postProposal.comment) totalComments++;
    });

    return { titleChanges, copyChanges, totalComments, total: titleChanges + copyChanges + totalComments };
  };

  const handleSubmitFeedback = async () => {
    const activeToken = resolvedToken || token;
    if (!activeToken || !document) return;

    const changes = countProposalChanges();
    
    // If no changes, ask for confirmation
    if (changes.total === 0) {
      const confirmed = window.confirm(
        '¿Estás seguro de que quieres enviar el feedback sin ningún cambio o comentario?'
      );
      if (!confirmed) return;
    }
    
    setIsSubmitting(true);
    try {
      const proposalJson = JSON.parse(JSON.stringify(proposal));
      
      // Call the edge function to handle everything
      const { data, error } = await supabase.functions.invoke('send-feedback-notification', {
        body: {
          document_id: document.id,
          token: activeToken,
          proposal_id: proposalId,
          proposal_json: proposalJson,
          publicBaseUrl: window.location.origin,
        }
      });

      if (error) throw error;

      if (data?.proposal_id) {
        setProposalId(data.proposal_id);
      }

      setHasUnsavedChanges(false);
      setIsSubmitted(true);
      toast.success('¡Feedback enviado correctamente! El equipo lo revisará.');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Error al enviar el feedback. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveWithoutChanges = async () => {
    const activeToken = resolvedToken || token;
    if (!activeToken) return;

    // Confirmation dialog
    const confirmed = window.confirm(
      '¿Confirmas que apruebas el calendario sin cambios? Esta acción notificará al equipo que el contenido está listo para publicar.'
    );
    if (!confirmed) return;

    setIsApproving(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-calendar', {
        body: { token: activeToken }
      });

      if (error) throw error;

      if (data?.already_approved) {
        toast.info('El calendario ya fue aprobado anteriormente.');
      } else {
        toast.success('¡Calendario aprobado! El equipo ha sido notificado.');
      }
      
      setIsApproved(true);
    } catch (err) {
      console.error('Error approving calendar:', err);
      toast.error('Error al aprobar el calendario. Por favor, inténtalo de nuevo.');
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto px-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">{error}</h1>
            <p className="text-muted-foreground">
              El enlace que estás intentando acceder no existe o ha caducado. 
              Por favor, solicita un nuevo enlace al equipo.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!document) return null;

  const { calendar, months: allMonths } = document.content_json;
  
  // Filter months based on visible_months setting
  const months = document.visible_months && document.visible_months.length > 0
    ? allMonths.filter(m => {
        // Create month key in format "YYYY-MM" from month name and year
        const monthNames: Record<string, string> = {
          'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
          'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
          'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
          'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
          'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
          'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
        };
        const monthNum = monthNames[m.month] || '01';
        const monthKey = `${m.year}-${monthNum}`;
        return document.visible_months!.includes(monthKey);
      })
    : allMonths;

  return (
    <>
      <Helmet>
        <title>{calendar.client_name} - Calendario de Contenidos</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-muted/30 pb-40 sm:pb-24">
        {/* Document container */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Cover / Introduction */}
          <ShareDocumentCover
            clientName={calendar.client_name}
            responsibles={calendar.responsibles || []}
            channel={calendar.channel}
            monthStart={calendar.month_start}
            monthEnd={calendar.month_end}
          />

          {/* Approved message */}
          {isApproved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-12">
              <p className="text-green-800 font-medium text-lg">
                ✓ Calendario aprobado sin modificaciones
              </p>
              <p className="text-green-600 mt-2">
                El equipo ha sido notificado y procederá con la publicación del contenido.
              </p>
            </div>
          )}

          {/* Success message if submitted */}
          {isSubmitted && !isApproved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-12">
              <p className="text-green-800 font-medium text-lg">
                ✓ Tu feedback ha sido enviado correctamente
              </p>
              <p className="text-green-600 mt-2">
                El equipo revisará tus propuestas y se pondrá en contacto contigo.
              </p>
            </div>
          )}

          {/* Month sections */}
          {months.map((month) => (
            <ShareMonthSection
              key={`${month.month}-${month.year}`}
              month={month}
              proposal={proposal}
              onUpdateProposal={updatePostProposal}
              isSubmitted={isSubmitted || isApproved}
            />
          ))}

          {/* Document end */}
          <div className="text-center text-muted-foreground text-sm pt-8 border-t border-border/50">
            <p>Fin del documento</p>
          </div>
        </div>

        {/* Footer */}
        <ShareDocumentFooter
          hasUnsavedChanges={hasUnsavedChanges}
          isSubmitting={isSubmitting}
          isSubmitted={isSubmitted}
          isApproved={isApproved}
          isApproving={isApproving}
          onSubmit={handleSubmitFeedback}
          onApprove={handleApproveWithoutChanges}
        />
      </div>
    </>
  );
};

export default ShareCalendar;
