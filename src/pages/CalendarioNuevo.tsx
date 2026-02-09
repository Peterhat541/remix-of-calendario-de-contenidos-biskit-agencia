import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Eye, Users, Save, Send, Link2, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import CalendarMonthSection from '@/components/CalendarMonthSection';
import CalendarPdfViewerModal from '@/components/CalendarPdfViewerModal';
import { SendEmailModal } from '@/components/SendEmailModal';
import { 
  CalendarMonth,
  CalendarFormData, 
  CalendarMeta,
  AVAILABLE_CHANNELS, 
  DEFAULT_CHANNEL,
  generateMonthsArray
} from '@/types/contentCalendar';
import { Agency } from '@/types/calendarCrm';
import { generateCalendarPDF } from '@/utils/calendarPdfGenerator';
import { useCalendarCrm } from '@/hooks/useCalendarCrm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getPublicBaseUrl } from '@/utils/publicUrl';

const CalendarioNuevo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { teamMembers, createOrUpdateContact, createCalendar, updateCalendarPdf } = useCalendarCrm();
  
  const [months, setMonths] = useState<CalendarMonth[]>([]);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAndSending, setIsSavingAndSending] = useState(false);
  const [savedCalendarId, setSavedCalendarId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([]);
  const [existingContactId, setExistingContactId] = useState<string | null>(null);
  
  // Agency state - always biskit
  const [selectedAgencies, setSelectedAgencies] = useState<Agency[]>(['biskit']);
  
  const [calendarMeta, setCalendarMeta] = useState<CalendarMeta>({
    client_name: '',
    brand: '',
    channel: DEFAULT_CHANNEL,
    month_start: '',
    month_end: '',
    timezone: 'Europe/Madrid',
    language: 'es-ES'
  });
  
  const [formData, setFormData] = useState<CalendarFormData>({
    clientName: '',
    brand: '',
    channel: DEFAULT_CHANNEL,
    monthStart: '',
    monthEnd: '',
  });

  const [contactData, setContactData] = useState({
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    address: ''
  });

  // Load contact data if contactId is provided (coming from another calendar)
  useEffect(() => {
    const loadContactData = async () => {
      const contactId = searchParams.get('contactId');
      if (!contactId) return;

      const { data: contact, error } = await supabase
        .from('calendar_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error || !contact) {
        console.error('Error loading contact:', error);
        return;
      }

      // Store the existing contact id to use when saving
      setExistingContactId(contactId);

      // Set form data with contact info
      setFormData(prev => ({
        ...prev,
        clientName: contact.company_name
      }));

      setContactData({
        contact_name: contact.contact_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        website: contact.website || '',
        address: contact.address || ''
      });

      // Set channel from query params
      const channelParam = searchParams.get('channel');
      if (channelParam) {
        setFormData(prev => ({
          ...prev,
          channel: channelParam
        }));
      }

      // Set agencies from query params
      const agenciesParam = searchParams.get('agencies');
      if (agenciesParam) {
        const agencies = agenciesParam.split(',').filter(a => a === 'biskit') as Agency[];
        if (agencies.length > 0) {
          setSelectedAgencies(agencies);
        }
      }

      // Set responsibles from query params
      const responsiblesParam = searchParams.get('responsibles');
      if (responsiblesParam) {
        const responsibles = responsiblesParam.split(',');
        setSelectedResponsibles(responsibles);
      }
    };

    loadContactData();
  }, [searchParams]);

  // Update agencies when query param changes (for agency param only, not full contactId flow)
  // Agency is always biskit - no need to handle query params

  // Generate months when date range changes
  useEffect(() => {
    if (formData.monthStart && formData.monthEnd) {
      const newMonths = generateMonthsArray(formData.monthStart, formData.monthEnd);
      setMonths(newMonths);
      setCalendarMeta(prev => ({
        ...prev,
        client_name: formData.clientName,
        brand: formData.brand,
        channel: formData.channel,
        month_start: formData.monthStart,
        month_end: formData.monthEnd
      }));
    }
  }, [formData.monthStart, formData.monthEnd]);

  // Update meta when form changes
  useEffect(() => {
    setCalendarMeta(prev => ({
      ...prev,
      client_name: formData.clientName,
      brand: formData.brand,
      channel: formData.channel
    }));
  }, [formData.clientName, formData.brand, formData.channel]);

  const handleUpdateMonth = (index: number, updated: CalendarMonth) => {
    setMonths(prev => prev.map((m, i) => i === index ? updated : m));
  };

  const getTotalPosts = () => {
    return months.reduce((acc, m) => acc + m.posts.filter(p => p.day_of_month).length, 0);
  };

  const toggleResponsible = (id: string) => {
    setSelectedResponsibles(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const handleSaveCalendar = async () => {
    if (!formData.clientName) {
      toast.error('Introduce el nombre del cliente');
      return;
    }
    if (!formData.monthStart || !formData.monthEnd) {
      toast.error('Selecciona el rango de meses');
      return;
    }
    if (selectedAgencies.length === 0) {
      toast.error('Selecciona al menos una agencia');
      return;
    }

    setIsSaving(true);
    toast.loading('Guardando calendario...', { id: 'save-calendar' });

    try {
      // 1. Get contact id - use existing or create/update
      let contactId = existingContactId;
      
      if (!contactId) {
        // Create/update contact
        const contact = await createOrUpdateContact(formData.clientName, {
          contact_name: contactData.contact_name || null,
          email: contactData.email || null,
          phone: contactData.phone || null,
          website: contactData.website || null,
          address: contactData.address || null
        });

        if (!contact) {
          throw new Error('Error al crear contacto');
        }
        contactId = contact.id;
      } else {
        // Update existing contact with any new data
        await supabase
          .from('calendar_contacts')
          .update({
            contact_name: contactData.contact_name || null,
            email: contactData.email || null,
            phone: contactData.phone || null,
            website: contactData.website || null,
            address: contactData.address || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', contactId);
      }

      // 2. Create calendar with agencies
      const calendar = await createCalendar(
        contactId,
        formData.channel,
        `${formData.monthStart}-01`,
        `${formData.monthEnd}-01`,
        selectedResponsibles,
        selectedAgencies
      );

      if (!calendar) {
        throw new Error('Error al crear calendario');
      }

      // 3. Save posts to database
      const postsToSave = months.flatMap((month, monthIndex) => 
        month.posts.map((post, postIndex) => ({
          calendar_id: calendar.id,
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
      ).filter(p => p.day_of_month || p.title || p.copy); // Only save posts with some content

      if (postsToSave.length > 0) {
        const { error: postsError } = await supabase
          .from('calendar_posts')
          .insert(postsToSave);

        if (postsError) {
          console.error('Error saving posts:', postsError);
          // Don't throw, calendar is still saved
        }
      }

      setSavedCalendarId(calendar.id);
      toast.success('Calendario guardado correctamente', { id: 'save-calendar' });
    } catch (error) {
      console.error('Error saving calendar:', error);
      toast.error('Error al guardar el calendario', { id: 'save-calendar' });
    } finally {
      setIsSaving(false);
    }
  };

  const generateShareLinkForCalendar = async (calendarId: string): Promise<string | null> => {
    try {
      // Generate random token
      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      
      // Fetch posts from database
      const { data: posts } = await supabase
        .from('calendar_posts')
        .select('*')
        .eq('calendar_id', calendarId)
        .order('post_order', { ascending: true });

      // Group posts by month
      const monthsMap = new Map<string, any>();
      (posts || []).forEach((post: any) => {
        const key = `${post.month_name}-${post.month_year}`;
        if (!monthsMap.has(key)) {
          monthsMap.set(key, {
            month: post.month_name,
            year: post.month_year,
            posts: []
          });
        }
        monthsMap.get(key).posts.push({
          id: post.id,
          day_of_month: post.day_of_month,
          image: {
            source: post.image_source || 'none',
            clipboard_data_url: post.image_source === 'clipboard' ? post.image_url : '',
            file_url: post.image_source === 'file' ? post.image_url : ''
          },
          title: post.title || '',
          copy: post.copy || ''
        });
      });

      // Build content JSON
      const responsibleEmails = teamMembers
        .filter(tm => selectedResponsibles.includes(tm.id))
        .map(tm => tm.email);

      const contentJson = {
        calendar: {
          client_name: formData.clientName,
          brand: formData.brand,
          channel: formData.channel,
          month_start: formData.monthStart,
          month_end: formData.monthEnd,
          responsibles: responsibleEmails
        },
        months: Array.from(monthsMap.values())
      };

      // Create document
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert([{
          calendar_id: calendarId,
          content_json: contentJson
        }])
        .select()
        .single();

      if (docError) throw docError;

      // Create share link
      const { error: linkError } = await supabase
        .from('share_links')
        .insert([{
          document_id: doc.id,
          token: token,
          can_view: true,
          can_propose: true
        }]);

      if (linkError) throw linkError;

      // Update calendar status
      await supabase
        .from('content_calendars')
        .update({ status: 'Pendiente de aprobación' })
        .eq('id', calendarId);

      // Record in history
      const baseUrl = getPublicBaseUrl();
      await supabase
        .from('content_calendar_edits')
        .insert([{
          calendar_id: calendarId,
          action: 'calendar_sent',
          performed_by: user?.email || null,
          details: {
            timestamp: new Date().toISOString(),
            share_link: `${baseUrl}/share/${token}`
          }
        }]);

      return `${baseUrl}/share/${token}`;
    } catch (err) {
      console.error('Error generating share link:', err);
      return null;
    }
  };

  const handleSaveAndSend = async () => {
    if (!formData.clientName) {
      toast.error('Introduce el nombre del cliente');
      return;
    }
    if (!formData.monthStart || !formData.monthEnd) {
      toast.error('Selecciona el rango de meses');
      return;
    }
    if (selectedAgencies.length === 0) {
      toast.error('Selecciona al menos una agencia');
      return;
    }
    if (!contactData.email) {
      toast.error('Introduce el email del contacto para enviar');
      return;
    }

    setIsSavingAndSending(true);
    toast.loading('Guardando y generando enlace...', { id: 'save-and-send' });

    try {
      // 1. Create/update contact
      const contact = await createOrUpdateContact(formData.clientName, {
        contact_name: contactData.contact_name || null,
        email: contactData.email || null,
        phone: contactData.phone || null,
        website: contactData.website || null,
        address: contactData.address || null
      });

      if (!contact) throw new Error('Error al crear contacto');

      // 2. Create calendar
      const calendar = await createCalendar(
        contact.id,
        formData.channel,
        `${formData.monthStart}-01`,
        `${formData.monthEnd}-01`,
        selectedResponsibles,
        selectedAgencies
      );

      if (!calendar) throw new Error('Error al crear calendario');

      // 3. Save posts
      const postsToSave = months.flatMap((month, monthIndex) => 
        month.posts.map((post, postIndex) => ({
          calendar_id: calendar.id,
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
        await supabase.from('calendar_posts').insert(postsToSave);
      }

      setSavedCalendarId(calendar.id);

      // 4. Generate share link
      const link = await generateShareLinkForCalendar(calendar.id);
      if (!link) throw new Error('Error al generar enlace');

      setShareLink(link);
      toast.success('¡Calendario guardado y enlace generado!', { id: 'save-and-send' });
      
      // 5. Open email modal
      setEmailModalOpen(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar y generar enlace', { id: 'save-and-send' });
    } finally {
      setIsSavingAndSending(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast.error('Error al copiar el enlace');
    }
  };

  // Email data
  const responsibleEmails = useMemo(() => {
    return teamMembers
      .filter(tm => selectedResponsibles.includes(tm.id))
      .map(tm => tm.email);
  }, [teamMembers, selectedResponsibles]);

  const handleGeneratePDF = async () => {
    if (getTotalPosts() === 0) {
      toast.error('No hay posts con fecha asignada para exportar');
      return;
    }

    setIsGeneratingPdf(true);
    toast.loading('Generando PDF...', { id: 'pdf-generation' });

    try {
      // Generate PDF blob
      const pdfBlob = await generateCalendarPDF(calendarMeta, months, true);
      
      if (pdfBlob && savedCalendarId) {
        // Upload to storage
        const fileName = `calendar-${savedCalendarId}-${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('content-calendars')
          .upload(fileName, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('content-calendars')
          .getPublicUrl(fileName);

        // Update calendar with PDF URL
        await updateCalendarPdf(savedCalendarId, urlData.publicUrl);
        toast.success('PDF generado y guardado', { id: 'pdf-generation' });
      } else {
        // Just download if not saved
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

  // Always use Biskit logo
  const getHeaderLogo = () => '/logo-biskit.png';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-biskit.png" alt="Biskit Agencia" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-foreground">Nuevo Calendario</span>
            <Badge 
              variant="outline"
              className="bg-primary/10 text-foreground border-primary/30"
            >
              Biskit Agencia
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/calendarios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Main Config */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Configuración
                </CardTitle>
                <CardDescription>
                  {existingContactId 
                    ? `Nuevo calendario para ${formData.clientName || 'cliente existente'}`
                    : 'Define el cliente, rango de meses y canal'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del cliente *</Label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Ej: Clínica Dental Sonrisas"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Marca / Negocio</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Ej: Sonrisas Dentales"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select
                    value={formData.channel}
                    onValueChange={(v) => setFormData({ ...formData, channel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_CHANNELS.map(channel => (
                        <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Mes inicio *</Label>
                    <Input
                      type="month"
                      value={formData.monthStart}
                      onChange={(e) => setFormData({ ...formData, monthStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mes fin *</Label>
                    <Input
                      type="month"
                      value={formData.monthEnd}
                      onChange={(e) => setFormData({ ...formData, monthEnd: e.target.value })}
                    />
                  </div>
                </div>


                {/* Responsibles */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Responsables
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers.map(tm => (
                      <Badge
                        key={tm.id}
                        variant={selectedResponsibles.includes(tm.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleResponsible(tm.id)}
                      >
                        {tm.email.split('@')[0]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contact Data (optional) */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="text-muted-foreground text-sm">Datos de contacto (opcional)</Label>
                  <Input
                    value={contactData.contact_name}
                    onChange={(e) => setContactData({ ...contactData, contact_name: e.target.value })}
                    placeholder="Nombre del contacto"
                  />
                  <Input
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    placeholder="Email"
                    type="email"
                  />
                  <Input
                    value={contactData.phone}
                    onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                    placeholder="Teléfono"
                  />
                </div>

                {months.length > 0 && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {months.length} {months.length === 1 ? 'mes' : 'meses'} · {getTotalPosts()} posts
                    </p>
                    
                    {/* Save and Send button - Primary action */}
                    {!savedCalendarId && (
                      <Button 
                        onClick={handleSaveAndSend} 
                        className="w-full bg-[#E91E63] hover:bg-[#C2185B] text-white"
                        disabled={isSavingAndSending || isSaving}
                      >
                        {isSavingAndSending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generando enlace...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Guardar y enviar al cliente
                          </>
                        )}
                      </Button>
                    )}

                    {/* Save button - Secondary */}
                    {!savedCalendarId && (
                    <Button 
                      onClick={handlePreviewPDF} 
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Vista previa
                    </Button>
                  )}

                  {savedCalendarId && !shareLink && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm text-green-700 dark:text-green-400">
                      ✓ Calendario guardado
                    </div>
                  )}

                  {/* Share link section */}
                  {shareLink && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Enlace generado</span>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={shareLink} 
                          readOnly 
                          className="text-xs font-mono"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={copyShareLink}
                        >
                          {linkCopied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => window.open(shareLink, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        onClick={() => setEmailModalOpen(true)}
                        className="w-full bg-[#E91E63] hover:bg-[#C2185B] text-white mt-2"
                        disabled={!contactData.email}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar email al cliente
                      </Button>
                    </div>
                  )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendar Template */}
          <div className="lg:col-span-2">
            {months.length === 0 ? (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Selecciona un rango de meses</p>
                  <p className="text-sm">El calendario se generará automáticamente</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-xl font-semibold">
                    {calendarMeta.client_name || 'Calendario'} 
                    {calendarMeta.channel && ` - ${calendarMeta.channel}`}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Plantilla editable · Añade posts y selecciona las fechas manualmente
                  </p>
                </div>

                {/* Months */}
                {months.map((monthData, index) => (
                  <CalendarMonthSection
                    key={`${monthData.month}-${monthData.year}`}
                    monthData={monthData}
                    onUpdateMonth={(updated) => handleUpdateMonth(index, updated)}
                  />
                ))}
              </div>
            )}
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

      {/* Email Modal */}
      {savedCalendarId && shareLink && (
        <SendEmailModal
          open={emailModalOpen}
          onOpenChange={setEmailModalOpen}
          calendarId={savedCalendarId}
          companyName={formData.clientName}
          channel={formData.channel}
          period={`${formData.monthStart} - ${formData.monthEnd}`}
          contactEmail={contactData.email}
          contactName={contactData.contact_name}
          responsibleEmails={responsibleEmails}
          shareLink={shareLink}
          agencies={selectedAgencies}
          sendCalendarOnly={true}
          onEmailSent={() => {
            toast.success('Email enviado correctamente');
            navigate(`/calendarios/${savedCalendarId}`);
          }}
        />
      )}
    </div>
  );
};

export default CalendarioNuevo;