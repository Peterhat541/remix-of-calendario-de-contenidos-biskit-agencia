import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Eye, Save, Loader2, MessageSquare, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import CalendarMonthSection from '@/components/CalendarMonthSection';
import CalendarPdfViewerModal from '@/components/CalendarPdfViewerModal';
import {
  CalendarMonth,
  CalendarMeta,
  CalendarPost,
  generateMonthsArray
} from '@/types/contentCalendar';
import { generateCalendarPDF } from '@/utils/calendarPdfGenerator';
import { useCalendarCrm } from '@/hooks/useCalendarCrm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ProposalData, PostProposal } from '@/types/shareCalendar';
import { getPublicBaseUrl } from '@/utils/publicUrl';

const CalendarioEditar = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { updateCalendarPdf, getCalendarById } = useCalendarCrm();
  
  const feedbackSectionRef = useRef<HTMLDivElement>(null);
  const [months, setMonths] = useState<CalendarMonth[]>([]);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientProposal, setClientProposal] = useState<ProposalData | null>(null);
  
  const [calendarMeta, setCalendarMeta] = useState<CalendarMeta>({
    client_name: '',
    brand: '',
    channel: '',
    month_start: '',
    month_end: '',
    timezone: 'Europe/Madrid',
    language: 'es-ES'
  });

  // Load calendar data
  useEffect(() => {
    if (id) {
      loadCalendarData();
    }
  }, [id]);

  // Scroll to feedback section if focus=feedback
  useEffect(() => {
    if (searchParams.get('focus') === 'feedback' && feedbackSectionRef.current && !loading) {
      setTimeout(() => {
        feedbackSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [searchParams, loading]);

  const loadCalendarData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // Load calendar
      const calendar = await getCalendarById(id);
      if (!calendar) {
        toast.error('Calendario no encontrado');
        navigate('/calendarios');
        return;
      }

      // Set calendar meta
      setCalendarMeta({
        client_name: calendar.calendar_contact?.company_name || '',
        brand: '',
        channel: calendar.channel,
        month_start: calendar.month_start,
        month_end: calendar.month_end,
        timezone: 'Europe/Madrid',
        language: 'es-ES'
      });

      // Load posts
      const { data: posts, error: postsError } = await supabase
        .from('calendar_posts')
        .select('*')
        .eq('calendar_id', id)
        .order('post_order', { ascending: true });

      if (postsError) {
        console.error('Error loading posts:', postsError);
      }

      // Generate months structure
      const monthStart = calendar.month_start.substring(0, 7);
      const monthEnd = calendar.month_end.substring(0, 7);
      const generatedMonths = generateMonthsArray(monthStart, monthEnd);

      // Load client proposals/feedback (último documento publicado)
      let loadedProposal: ProposalData | null = null;
      const docPostIdToPositionKey: Record<string, string> = {};

      const { data: docs } = await supabase
        .from('documents')
        .select('id, content_json, created_at, share_links(token, created_at)')
        .eq('calendar_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (docs && docs.length > 0) {
        const doc = docs[0];
        const shareLinks = doc.share_links as unknown as Array<{ token: string; created_at?: string }>;

        // Build mapping from document post IDs -> positional key (month+year+index)
        const docContent = doc.content_json as any;
        if (docContent?.months) {
          docContent.months.forEach((docMonth: any) => {
            docMonth.posts?.forEach((docPost: any, postIdx: number) => {
              const positionKey = `${docMonth.month}-${docMonth.year}-${postIdx}`;
              docPostIdToPositionKey[docPost.id] = positionKey;
            });
          });
        }

        const token = shareLinks?.[0]?.token;
        if (token) {
          const { data: proposals } = await supabase
            .from('proposals')
            .select('*')
            .eq('token', token)
            .eq('status', 'submitted')
            .order('updated_at', { ascending: false })
            .limit(1);

          if (proposals && proposals.length > 0) {
            loadedProposal = proposals[0].proposal_json as unknown as ProposalData;
          }
        }
      }

      // Populate with existing posts
      const dbPostIdByPositionKey: Record<string, string> = {};

      const monthsWithPosts = generatedMonths.map((month, monthIdx) => {
        const monthPosts = (posts || []).filter(
          p => p.month_name === month.month && p.month_year === month.year
        );

        // Convert DB posts to CalendarPost format
        const calendarPosts: CalendarPost[] = monthPosts.map((p, postIdx) => {
          const positionKey = `${month.month}-${month.year}-${postIdx}`;
          dbPostIdByPositionKey[positionKey] = p.id;

          return {
            id: p.id,
            day_of_month: p.day_of_month,
            image: {
              source: (p.image_source || 'none') as 'none' | 'clipboard' | 'file',
              clipboard_data_url: p.image_source === 'clipboard' ? (p.image_url || '') : '',
              file_url: p.image_source === 'file' ? (p.image_url || '') : ''
            },
            title: p.title || '',
            copy: p.copy || ''
          };
        });

        // If no posts, add empty ones
        if (calendarPosts.length === 0) {
          return { ...month, posts: month.posts };
        }

        return { ...month, posts: calendarPosts };
      });

      // Remap proposal keys (document postId -> current DB postId) by position
      const remapProposalToCurrentPosts = (proposal: ProposalData | null): ProposalData | null => {
        if (!proposal) return null;

        const remapped: Record<string, PostProposal> = {};
        Object.entries(proposal.changes || {}).forEach(([docPostId, change]) => {
          const positionKey = docPostIdToPositionKey[docPostId];
          const dbPostId = positionKey ? dbPostIdByPositionKey[positionKey] : undefined;
          const targetId = dbPostId || docPostId;
          remapped[targetId] = { ...(change as PostProposal), postId: targetId };
        });

        return { ...proposal, changes: remapped };
      };

      setMonths(monthsWithPosts);
      setClientProposal(remapProposalToCurrentPosts(loadedProposal));
    } catch (err) {
      console.error('Error loading calendar:', err);
      toast.error('Error al cargar el calendario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMonth = (index: number, updated: CalendarMonth) => {
    setMonths(prev => prev.map((m, i) => i === index ? updated : m));
  };

  const getTotalPosts = () => {
    return months.reduce((acc, m) => acc + m.posts.filter(p => p.day_of_month).length, 0);
  };

  const handleSaveChanges = async () => {
    if (!id) return;

    const hasClientFeedback = !!clientProposal && getPostsWithFeedback().length > 0;

    setIsSaving(true);
    toast.loading(hasClientFeedback ? 'Guardando y publicando actualización...' : 'Guardando cambios...', { id: 'save-changes' });

    try {
      // Delete existing posts
      await supabase
        .from('calendar_posts')
        .delete()
        .eq('calendar_id', id);

      // Save new posts
      const postsToSave = months.flatMap((month, monthIndex) =>
        month.posts.map((post, postIndex) => ({
          calendar_id: id,
          month_name: month.month,
          month_year: month.year || new Date().getFullYear(),
          day_of_month: post.day_of_month,
          title: post.title || null,
          copy: post.copy || null,
          image_source: post.image.source,
          image_url: post.image.source === 'clipboard'
            ? post.image.clipboard_data_url
            : post.image.source === 'file'
            ? post.image.file_url
            : null,
          post_order: monthIndex * 100 + postIndex
        }))
      ).filter(p => p.day_of_month || p.title || p.copy);

      if (postsToSave.length > 0) {
        const { error: postsError } = await supabase
          .from('calendar_posts')
          .insert(postsToSave);

        if (postsError) {
          console.error('Error saving posts:', postsError);
          throw postsError;
        }
      }

      // Record edit in history
      await supabase
        .from('content_calendar_edits')
        .insert([{
          calendar_id: id,
          action: 'calendar_edited',
          performed_by: user?.email || null,
          details: {
            timestamp: new Date().toISOString(),
            posts_count: postsToSave.length
          }
        }]);

      // If we are applying client feedback, publish a NEW share link + send update email to the client
      let publishedShareUrl: string | null = null;

      if (hasClientFeedback) {
        const { data: publishData, error: publishError } = await supabase.functions.invoke('publish-calendar-update', {
          body: {
            calendarId: id,
            publicBaseUrl: getPublicBaseUrl(),
            performedBy: user?.email || null,
          }
        });

        if (publishError) {
          console.error('Error publishing calendar update:', publishError);
        } else {
          publishedShareUrl = (publishData as any)?.shareUrl || null;
        }
      }

      toast.success(
        <div className="flex flex-col gap-2">
          <span>
            {hasClientFeedback
              ? (publishedShareUrl ? 'Cambios guardados y actualización enviada al cliente' : 'Cambios guardados (no se pudo enviar el email)')
              : 'Cambios guardados correctamente'}
          </span>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => navigate(`/calendarios/${id}`)}
              className="text-sm underline text-primary hover:text-primary/80 text-left"
            >
              → Ver calendario actualizado
            </button>
            {publishedShareUrl && (
              <button
                onClick={() => window.open(publishedShareUrl!, '_blank')}
                className="text-sm underline text-primary hover:text-primary/80 text-left inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir enlace nuevo para el cliente
              </button>
            )}
          </div>
        </div>,
        { id: 'save-changes', duration: 7000 }
      );
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Error al guardar los cambios', { id: 'save-changes' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (getTotalPosts() === 0) {
      toast.error('No hay posts con fecha asignada para exportar');
      return;
    }

    setIsGeneratingPdf(true);
    toast.loading('Generando PDF...', { id: 'pdf-generation' });

    try {
      const pdfBlob = await generateCalendarPDF(calendarMeta, months, true);
      
      if (pdfBlob && id) {
        const fileName = `calendar-${id}-${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('content-calendars')
          .upload(fileName, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('content-calendars')
          .getPublicUrl(fileName);

        await updateCalendarPdf(id, urlData.publicUrl);
        toast.success('PDF generado y guardado', { id: 'pdf-generation' });
      } else {
        await generateCalendarPDF(calendarMeta, months, false);
        toast.success('PDF generado correctamente', { id: 'pdf-generation' });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF', { id: 'pdf-generation' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePreviewPDF = () => {
    if (getTotalPosts() === 0) {
      toast.error('No hay posts con fecha asignada para previsualizar');
      return;
    }
    setShowPdfPreview(true);
  };

  const getPostsWithFeedback = (): string[] => {
    if (!clientProposal) return [];
    return Object.keys(clientProposal.changes).filter(postId => {
      const change = clientProposal.changes[postId];
      return change.titleChange || change.copyChange || 
        change.comment || change.note;
    });
  };

  const handleApplyChange = (postId: string, field: 'title' | 'copy', newValue: string) => {
    setMonths(prev => prev.map(month => ({
      ...month,
      posts: month.posts.map(post => {
        if (post.id === postId) {
          return field === 'title' 
            ? { ...post, title: newValue }
            : { ...post, copy: newValue };
        }
        return post;
      })
    })));
    toast.success(`${field === 'title' ? 'Título' : 'Copy'} aplicado correctamente`);
  };

  const postsWithFeedback = getPostsWithFeedback();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-foreground">Editar Calendario</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/calendarios/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al detalle
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {calendarMeta.client_name}
                </CardTitle>
                <CardDescription>
                  {calendarMeta.channel}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>{months.length} {months.length === 1 ? 'mes' : 'meses'} · {getTotalPosts()} posts</p>
                </div>

                {/* Feedback Summary */}
                {clientProposal && postsWithFeedback.length > 0 && (
                  <div ref={feedbackSectionRef} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium text-sm">Feedback del cliente</span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {postsWithFeedback.length} post(s) con cambios o comentarios
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-border space-y-3">
                  {/* Save button */}
                  <Button 
                    onClick={handleSaveChanges} 
                    className="w-full"
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>

                  {/* PDF buttons */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handlePreviewPDF} 
                      variant="secondary" 
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Vista previa del PDF
                    </Button>
                    <Button 
                      onClick={handleGeneratePDF} 
                      variant="outline"
                      className="w-full"
                      disabled={isGeneratingPdf}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isGeneratingPdf ? 'Generando...' : 'Generar PDF'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Editor */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-xl font-semibold">
                  {calendarMeta.client_name || 'Calendario'} 
                  {calendarMeta.channel && ` - ${calendarMeta.channel}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Edita los posts y guarda los cambios
                </p>
              </div>

              {/* Detailed Feedback Section */}
              {clientProposal && postsWithFeedback.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <MessageSquare className="h-5 w-5" />
                      Feedback del cliente a aplicar
                    </CardTitle>
                    <CardDescription>
                      Revisa los cambios propuestos y edita los posts correspondientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {postsWithFeedback.map(postId => {
                      const change = clientProposal.changes[postId];
                      // Find the post in months to get its title
                      let postTitle = 'Post';
                      let postDay: number | null = null;
                      months.forEach(m => {
                        const found = m.posts.find(p => p.id === postId);
                        if (found) {
                          postTitle = found.title || 'Sin título';
                          postDay = found.day_of_month;
                        }
                      });

                      return (
                        <div 
                          key={postId} 
                          className="p-4 bg-white dark:bg-card rounded-lg border border-amber-200 dark:border-amber-700"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-300">
                              {postDay ? `Día ${postDay}` : 'Sin fecha'}
                            </Badge>
                            <span className="font-medium text-sm">{postTitle}</span>
                          </div>

                          {/* Title change */}
                          {change.titleChange && (
                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                                    ✏️ Cambio de título propuesto:
                                  </p>
                                  <p className="text-sm text-blue-800 dark:text-blue-200">
                                    "{change.titleChange}"
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0 bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700"
                                  onClick={() => handleApplyChange(postId, 'title', change.titleChange!)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Aplicar
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Copy change */}
                          {change.copyChange && (
                            <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                                    ✏️ Cambio de copy propuesto:
                                  </p>
                                  <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">
                                    "{change.copyChange}"
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0 bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-700"
                                  onClick={() => handleApplyChange(postId, 'copy', change.copyChange!)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Aplicar
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Comment */}
                          {change.comment && (
                            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                                💬 Comentario:
                              </p>
                              <p className="text-sm text-green-800 dark:text-green-200">
                                {change.comment}
                              </p>
                            </div>
                          )}

                          {/* Note */}
                          {change.note && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded border border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                📝 Nota:
                              </p>
                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                {change.note}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* General notes */}
                    {clientProposal.generalNotes && clientProposal.generalNotes.length > 0 && (
                      <div className="p-4 bg-white dark:bg-card rounded-lg border border-amber-200 dark:border-amber-700">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                          📋 Notas generales del cliente:
                        </p>
                        <ul className="space-y-1">
                          {clientProposal.generalNotes.map((note, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              • {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Months */}
              {months.map((monthData, index) => (
                <CalendarMonthSection
                  key={`${monthData.month}-${monthData.year}`}
                  monthData={monthData}
                  onUpdateMonth={(updated) => handleUpdateMonth(index, updated)}
                  highlightPostIds={postsWithFeedback}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* PDF Viewer Modal */}
      <CalendarPdfViewerModal
        open={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        calendarMeta={calendarMeta}
        months={months}
      />
    </div>
  );
};

export default CalendarioEditar;
