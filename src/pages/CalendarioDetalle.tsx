import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Calendar,
  CalendarPlus,
  Users, 
  FileText,
  Download,
  Eye,
  Edit2,
  Clock,
  MessageSquare,
  Send,
  Link2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Mail,
  Pencil,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCalendarCrm } from '@/hooks/useCalendarCrm';
import { useAuth } from '@/hooks/useAuth';
import { 
  ContentCalendar, 
  ContentCalendarEdit,
  CALENDAR_STATUSES, 
  STATUS_COLORS,
  CalendarStatus,
  CalendarContact,
  Agency,
  AGENCIES,
  AGENCY_LABELS
} from '@/types/calendarCrm';
import { ProposalData, PostProposal } from '@/types/shareCalendar';
import { SendEmailModal } from '@/components/SendEmailModal';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { getPublicBaseUrl } from '@/utils/publicUrl';
import { ContactAISection } from '@/components/ContactAISection';

// Share history item type
interface ShareHistoryItem {
  id: string;
  token: string;
  created_at: string;
  visible_months: string[] | null;
  proposal: ProposalData | null;
  proposal_status: 'draft' | 'submitted' | null;
  is_approved: boolean;
}

const CalendarioDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    teamMembers, 
    updateCalendarStatus, 
    updateCalendarResponsibles,
    updateCalendarAgencies,
    updateContact,
    addNote,
    getCalendarEdits,
    getCalendarById
  } = useCalendarCrm();

  const feedbackSectionRef = useRef<HTMLDivElement>(null);
  const [calendar, setCalendar] = useState<ContentCalendar | null>(null);
  const [edits, setEdits] = useState<ContentCalendarEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editResponsiblesOpen, setEditResponsiblesOpen] = useState(false);
  const [editAgenciesOpen, setEditAgenciesOpen] = useState(false);
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<Agency[]>([]);
  const [contactForm, setContactForm] = useState<Partial<CalendarContact>>({});
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isUpdatingDocument, setIsUpdatingDocument] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [clientProposal, setClientProposal] = useState<ProposalData | null>(null);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalShareLink, setEmailModalShareLink] = useState<string | null>(null);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [documentNeedsUpdate, setDocumentNeedsUpdate] = useState(false);
  const [lastDocumentUpdate, setLastDocumentUpdate] = useState<string | null>(null);
  const [extendDatesOpen, setExtendDatesOpen] = useState(false);
  const [newMonthEnd, setNewMonthEnd] = useState('');
  const [isExtendingDates, setIsExtendingDates] = useState(false);
  const [clientCalendarsCount, setClientCalendarsCount] = useState<number>(0);
  const [selectMonthsOpen, setSelectMonthsOpen] = useState(false);
  const [selectedVisibleMonths, setSelectedVisibleMonths] = useState<string[]>([]);
  const [existingVisibleMonths, setExistingVisibleMonths] = useState<string[] | null>(null);
  const [shareHistory, setShareHistory] = useState<ShareHistoryItem[]>([]);
  const [shareSlug, setShareSlug] = useState<string>('');
  const [isUpdatingSlug, setIsUpdatingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [currentShareLinkId, setCurrentShareLinkId] = useState<string | null>(null);
  // Calculate email data - MUST be before any early returns
  const contactEmail = useMemo(() => {
    return calendar?.calendar_contact?.email || '';
  }, [calendar]);

  const responsibleEmails = useMemo(() => {
    if (!calendar) return [];
    return Array.isArray(calendar.responsibles)
      ? calendar.responsibles
          .map(r => typeof r === 'string' ? r : r?.email)
          .filter((email): email is string => !!email)
      : [];
  }, [calendar]);

  // Can send email if contact has email AND at least one responsible
  const canSendEmail = !!contactEmail && responsibleEmails.length > 0;
  
  const getEmailButtonTooltip = () => {
    if (!contactEmail) return 'El contacto no tiene email';
    if (responsibleEmails.length === 0) return 'No hay responsables asignados';
    return 'Enviar email al contacto';
  };

  // Generate list of available months from calendar date range
  const availableMonths = useMemo(() => {
    if (!calendar) return [];
    const months: { key: string; label: string }[] = [];
    const start = parseISO(calendar.month_start);
    const end = parseISO(calendar.month_end);
    
    let current = start;
    while (current <= end) {
      const key = format(current, 'yyyy-MM');
      const label = format(current, 'MMMM yyyy', { locale: es });
      months.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return months;
  }, [calendar]);

  const toggleMonthVisibility = (monthKey: string) => {
    setSelectedVisibleMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey]
    );
  };

  const selectAllMonths = () => {
    setSelectedVisibleMonths(availableMonths.map(m => m.key));
  };

  const deselectAllMonths = () => {
    setSelectedVisibleMonths([]);
  };
  useEffect(() => {
    if (id) {
      loadCalendar();
      loadExistingShareLink();
    }
  }, [id]);

  // Scroll to feedback section if focus=feedback query param
  useEffect(() => {
    if (searchParams.get('focus') === 'feedback' && feedbackSectionRef.current && !loading) {
      setTimeout(() => {
        feedbackSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [searchParams, loading]);

  const loadCalendar = async () => {
    if (!id) return;
    setLoading(true);
    const cal = await getCalendarById(id);
    if (cal) {
      setCalendar(cal);
      setSelectedResponsibles(cal.responsibles?.map(r => r.id) || []);
      setSelectedAgencies((cal.agencies || ['biskit']) as Agency[]);
      
      // Initialize visible months with all months from the calendar range
      const start = parseISO(cal.month_start);
      const end = parseISO(cal.month_end);
      const allMonthKeys: string[] = [];
      let current = start;
      while (current <= end) {
        allMonthKeys.push(format(current, 'yyyy-MM'));
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
      setSelectedVisibleMonths(allMonthKeys);
      
      if (cal.calendar_contact) {
        setContactForm({
          contact_name: cal.calendar_contact.contact_name,
          email: cal.calendar_contact.email,
          phone: cal.calendar_contact.phone,
          website: cal.calendar_contact.website,
          address: cal.calendar_contact.address
        });
        
        // Count all calendars for this contact
        const { count } = await supabase
          .from('content_calendars')
          .select('*', { count: 'exact', head: true })
          .eq('calendar_contact_id', cal.calendar_contact.id);
        
        setClientCalendarsCount(count || 0);
      }
      const editsList = await getCalendarEdits(id);
      setEdits(editsList);
    }
    setLoading(false);
  };

  const loadExistingShareLink = async () => {
    if (!id) return;

    // Load ALL documents with share links and proposals for this calendar
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, created_at, updated_at, visible_months, share_links(id, token, slug, created_at)')
      .eq('calendar_id', id)
      .order('created_at', { ascending: false });

    if (allDocs && allDocs.length > 0) {
      // Build share history
      const historyItems: ShareHistoryItem[] = [];
      
      for (const doc of allDocs) {
        const docTyped = doc as { id: string; created_at: string; updated_at: string; visible_months: string[] | null; share_links: unknown };
        const shareLinks = docTyped.share_links as unknown as Array<{ id: string; token: string; slug?: string; created_at?: string }>;
        const token = shareLinks?.[0]?.token;
        
        if (token) {
          // Load proposal for this token
          const { data: proposals } = await supabase
            .from('proposals')
            .select('*')
            .eq('token', token)
            .order('updated_at', { ascending: false })
            .limit(1);

          const proposal = proposals?.[0];
          
          // Check if approved via this token
          const { data: calData } = await supabase
            .from('content_calendars')
            .select('approval_status, approved_via')
            .eq('id', id)
            .single();
          
          const isApproved = calData?.approval_status === 'approved_no_changes' && calData?.approved_via === token;
          
          historyItems.push({
            id: docTyped.id,
            token,
            created_at: docTyped.created_at,
            visible_months: docTyped.visible_months,
            proposal: proposal ? (proposal.proposal_json as unknown as ProposalData) : null,
            proposal_status: proposal?.status as 'draft' | 'submitted' | null,
            is_approved: isApproved
          });
        }
      }
      
      setShareHistory(historyItems);
      
      // Set the most recent one as the active share link
      const mostRecent = allDocs[0] as { id: string; created_at: string; updated_at: string; visible_months: string[] | null; share_links: unknown };
      const mostRecentLinks = mostRecent.share_links as unknown as Array<{ id: string; token: string; slug?: string; created_at?: string }>;
      const linkData = mostRecentLinks?.[0];
      const token = linkData?.token;

      if (token) {
        const baseUrl = getPublicBaseUrl();
        const shareUrl = linkData?.slug ? `${baseUrl}/c/${linkData.slug}` : `${baseUrl}/share/${token}`;
        setShareLink(shareUrl);
        setLastDocumentUpdate(mostRecent.updated_at);
        setExistingVisibleMonths(mostRecent.visible_months);
        setCurrentShareLinkId(linkData.id);
        setShareSlug(linkData.slug || '');
        if (mostRecent.visible_months) {
          setSelectedVisibleMonths(mostRecent.visible_months);
        }

        if (baseUrl !== window.location.origin) {
          console.log("SHARE LINK BASE OVERRIDDEN", { origin: window.location.origin, baseUrl, shareUrl });
        }

        // Check if calendar or posts have been updated after the document
        const documentUpdatedAt = new Date(mostRecent.updated_at).getTime();
        
        // Check calendar updated_at
        const { data: calData } = await supabase
          .from('content_calendars')
          .select('updated_at')
          .eq('id', id)
          .single();
        
        // Check posts updated_at
        const { data: postsData } = await supabase
          .from('calendar_posts')
          .select('updated_at')
          .eq('calendar_id', id)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        const calendarUpdatedAt = calData?.updated_at ? new Date(calData.updated_at).getTime() : 0;
        const latestPostUpdatedAt = postsData?.[0]?.updated_at ? new Date(postsData[0].updated_at).getTime() : 0;
        
        // If calendar or posts have been updated after the document, mark as needing update
        const needsUpdate = calendarUpdatedAt > documentUpdatedAt || latestPostUpdatedAt > documentUpdatedAt;
        setDocumentNeedsUpdate(needsUpdate);

        // Load submitted proposals for current token to show feedback alert
        const currentProposal = historyItems.find(h => h.token === token);
        if (currentProposal?.proposal && currentProposal.proposal_status === 'submitted') {
          setClientProposal(currentProposal.proposal);
        }
      }
    }
  };

  const generateShareLink = async () => {
    if (!id || !calendar) return;

    setIsGeneratingLink(true);
    try {
      // Check if there's already a document and share_link for this calendar (use latest)
      const { data: existingDocs } = await supabase
        .from('documents')
        .select('id, created_at, share_links(token, created_at)')
        .eq('calendar_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingDocs && existingDocs.length > 0) {
        const doc = existingDocs[0];
        const shareLinks = doc.share_links as unknown as Array<{ token: string; created_at?: string }>;
        const existingToken = shareLinks?.[0]?.token;

        if (existingToken) {
          // Document exists - update it with current data
          const { data: posts } = await supabase
            .from('calendar_posts')
            .select('*')
            .eq('calendar_id', id)
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

          // Build updated content JSON
          const updatedContentJson = {
            calendar: {
              client_name: calendar.calendar_contact?.company_name || '',
              brand: '',
              channel: calendar.channel,
              month_start: calendar.month_start,
              month_end: calendar.month_end,
              responsibles: calendar.responsibles?.map(r => r.email) || []
            },
            months: Array.from(monthsMap.values())
          };

          // Update the existing document with visible_months
          const visibleMonthsToSave = selectedVisibleMonths.length > 0 && selectedVisibleMonths.length < availableMonths.length 
            ? selectedVisibleMonths 
            : null;
          
          await supabase
            .from('documents')
            .update({ 
              content_json: updatedContentJson, 
              updated_at: new Date().toISOString(),
              visible_months: visibleMonthsToSave
            })
            .eq('id', doc.id);
          
          setExistingVisibleMonths(visibleMonthsToSave);

          const baseUrl = getPublicBaseUrl();
          const fullLink = `${baseUrl}/share/${existingToken}`;
          setShareLink(fullLink);
          toast.success('Documento actualizado con los datos actuales');
          return;
        }
      }

      // Generate random token
      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      
      // Fetch posts from database
      const { data: posts, error: postsError } = await supabase
        .from('calendar_posts')
        .select('*')
        .eq('calendar_id', id)
        .order('post_order', { ascending: true });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
      }

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

      // Build content JSON from calendar data
      const contentJson = {
        calendar: {
          client_name: calendar.calendar_contact?.company_name || '',
          brand: '',
          channel: calendar.channel,
          month_start: calendar.month_start,
          month_end: calendar.month_end,
          responsibles: calendar.responsibles?.map(r => r.email) || []
        },
        months: Array.from(monthsMap.values())
      };

      // Create document with visible_months if selected
      const visibleMonthsToSave = selectedVisibleMonths.length > 0 && selectedVisibleMonths.length < availableMonths.length 
        ? selectedVisibleMonths 
        : null;
      
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert([{
          calendar_id: id,
          content_json: contentJson,
          visible_months: visibleMonthsToSave
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

      // Update status to "Pendiente de aprobación" if currently "Pendiente de enviar"
      if (calendar.status === 'Pendiente de enviar') {
        await supabase
          .from('content_calendars')
          .update({ status: 'Pendiente de aprobación' })
          .eq('id', id);

        // Record in history
        await supabase
          .from('content_calendar_edits')
          .insert([{
            calendar_id: id,
            action: 'calendar_sent',
            performed_by: user?.email || null,
            details: {
              timestamp: new Date().toISOString(),
              share_link: `${getPublicBaseUrl()}/share/${token}`
            }
          }]);
      }

      const baseUrl = getPublicBaseUrl();
      const fullLink = `${baseUrl}/share/${token}`;
      setShareLink(fullLink);
      toast.success('Enlace generado correctamente');
      await loadCalendar(); // Reload to update status
    } catch (err) {
      console.error('Error generating share link:', err);
      toast.error('Error al generar el enlace');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const updateShareDocument = async () => {
    if (!id || !calendar) return;

    setIsUpdatingDocument(true);
    try {
      // Determine if visible_months changed - if so, create NEW document + link
      const visibleMonthsToSave = selectedVisibleMonths.length > 0 && selectedVisibleMonths.length < availableMonths.length 
        ? selectedVisibleMonths 
        : null;
      
      const visibleMonthsChanged = JSON.stringify(existingVisibleMonths) !== JSON.stringify(visibleMonthsToSave);
      
      // Fetch current posts
      const { data: posts } = await supabase
        .from('calendar_posts')
        .select('*')
        .eq('calendar_id', id)
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

      // Build updated content JSON
      const updatedContentJson = {
        calendar: {
          client_name: calendar.calendar_contact?.company_name || '',
          brand: '',
          channel: calendar.channel,
          month_start: calendar.month_start,
          month_end: calendar.month_end,
          responsibles: calendar.responsibles?.map(r => r.email) || []
        },
        months: Array.from(monthsMap.values())
      };

      if (visibleMonthsChanged) {
        // Create NEW document and share link for new period
        const newToken = crypto.randomUUID();
        
        const { data: newDoc, error: docError } = await supabase
          .from('documents')
          .insert([{
            calendar_id: id,
            content_json: updatedContentJson,
            visible_months: visibleMonthsToSave
          }])
          .select()
          .single();

        if (docError) throw docError;

        // Create new share link
        const { error: linkError } = await supabase
          .from('share_links')
          .insert([{
            document_id: newDoc.id,
            token: newToken,
            can_view: true,
            can_propose: true
          }]);

        if (linkError) throw linkError;

        // Update the share link state with the new token
        const baseUrl = getPublicBaseUrl();
        const fullLink = `${baseUrl}/share/${newToken}`;
        setShareLink(fullLink);
        setExistingVisibleMonths(visibleMonthsToSave);

        // Record in history
        await supabase
          .from('content_calendar_edits')
          .insert([{
            calendar_id: id,
            action: 'calendar_sent',
            performed_by: user?.email || null,
            details: {
              timestamp: new Date().toISOString(),
              share_link: fullLink,
              visible_months: visibleMonthsToSave,
              new_period: true
            }
          }]);

        toast.success('Nuevo enlace generado para este periodo');
      } else {
        // Just update existing document (no visible_months change)
        const { data: existingDocs } = await supabase
          .from('documents')
          .select('id')
          .eq('calendar_id', id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!existingDocs || existingDocs.length === 0) {
          toast.error('No hay documento para actualizar');
          return;
        }

        const doc = existingDocs[0];
        const newUpdatedAt = new Date().toISOString();
        
        await supabase
          .from('documents')
          .update({ 
            content_json: updatedContentJson, 
            updated_at: newUpdatedAt,
            visible_months: visibleMonthsToSave
          })
          .eq('id', doc.id);

        // Record in history
        await supabase
          .from('content_calendar_edits')
          .insert([{
            calendar_id: id,
            action: 'document_updated',
            performed_by: user?.email || null,
            details: {
              timestamp: newUpdatedAt,
              posts_count: posts?.length || 0
            }
          }]);

        setLastDocumentUpdate(newUpdatedAt);
        toast.success('Documento actualizado correctamente');
      }

      // Update state
      setDocumentNeedsUpdate(false);
      
      // Reload share history and edits
      await loadExistingShareLink();
      const editsList = await getCalendarEdits(id);
      setEdits(editsList);
    } catch (err) {
      console.error('Error updating document:', err);
      toast.error('Error al actualizar el documento');
    } finally {
      setIsUpdatingDocument(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      
      // If status is "Pendiente de enviar", update to "Pendiente de aprobación"
      if (calendar && calendar.status === 'Pendiente de enviar') {
        await supabase
          .from('content_calendars')
          .update({ status: 'Pendiente de aprobación' })
          .eq('id', calendar.id);

        // Record in history
        await supabase
          .from('content_calendar_edits')
          .insert([{
            calendar_id: calendar.id,
            action: 'calendar_sent',
            performed_by: user?.email || null,
            details: {
              timestamp: new Date().toISOString(),
              share_link: shareLink
            }
          }]);
        
        await loadCalendar(); // Reload to update status
      }
      
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Error al copiar el enlace');
    }
  };

  // Generate a slug from the company name
  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const handleAutoGenerateSlug = () => {
    if (calendar?.calendar_contact?.company_name) {
      const newSlug = generateSlugFromName(calendar.calendar_contact.company_name);
      setShareSlug(newSlug);
      setSlugError(null);
    }
  };

  const handleSaveSlug = async () => {
    if (!currentShareLinkId) return;
    
    const trimmedSlug = shareSlug.trim();
    
    // Validate slug format
    if (trimmedSlug && !/^[a-z0-9-]+$/.test(trimmedSlug)) {
      setSlugError('El slug solo puede contener letras minúsculas, números y guiones');
      return;
    }
    
    setIsUpdatingSlug(true);
    setSlugError(null);
    
    try {
      const slugToSave = trimmedSlug || null;
      
      // Check uniqueness if slug is not empty
      if (slugToSave) {
        const { data: existing } = await supabase
          .from('share_links')
          .select('id')
          .eq('slug', slugToSave)
          .neq('id', currentShareLinkId)
          .single();
        
        if (existing) {
          setSlugError('Este slug ya está en uso. Prueba con otro nombre.');
          setIsUpdatingSlug(false);
          return;
        }
      }
      
      const { error } = await supabase
        .from('share_links')
        .update({ slug: slugToSave })
        .eq('id', currentShareLinkId);
      
      if (error) throw error;
      
      // Update the share link display
      const baseUrl = getPublicBaseUrl();
      if (slugToSave) {
        setShareLink(`${baseUrl}/c/${slugToSave}`);
      } else {
        // Reload to get the token URL
        await loadExistingShareLink();
      }
      
      toast.success(slugToSave ? 'URL amigable guardada' : 'URL amigable eliminada');
    } catch (err) {
      console.error('Error saving slug:', err);
      toast.error('Error al guardar la URL amigable');
    } finally {
      setIsUpdatingSlug(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Calendario no encontrado</p>
          <Button onClick={() => navigate('/calendarios')}>Volver</Button>
        </div>
      </div>
    );
  }

  const formatPeriod = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const startMonth = format(startDate, 'MMMM yyyy', { locale: es });
    const endMonth = format(endDate, 'MMMM yyyy', { locale: es });
    
    if (startMonth === endMonth) {
      return startMonth.charAt(0).toUpperCase() + startMonth.slice(1);
    }
    return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} – ${endMonth.charAt(0).toUpperCase() + endMonth.slice(1)}`;
  };

  const handleStatusChange = async (newStatus: CalendarStatus) => {
    if (await updateCalendarStatus(calendar.id, newStatus, user?.email)) {
      await loadCalendar();
    }
  };

  const handleSaveContact = async () => {
    if (!calendar.calendar_contact) return;
    if (await updateContact(calendar.calendar_contact.id, contactForm)) {
      setEditContactOpen(false);
      await loadCalendar();
    }
  };

  const handleSaveResponsibles = async () => {
    if (await updateCalendarResponsibles(calendar.id, selectedResponsibles, user?.email)) {
      setEditResponsiblesOpen(false);
      await loadCalendar();
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Escribe una nota');
      return;
    }
    if (await addNote(calendar.id, newNote.trim(), user?.email)) {
      setNewNote('');
      await loadCalendar();
    }
  };

  const toggleResponsible = (id: string) => {
    setSelectedResponsibles(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const toggleAgency = (agency: Agency) => {
    setSelectedAgencies(prev => {
      if (prev.includes(agency)) {
        // Don't allow removing all agencies
        if (prev.length === 1) return prev;
        return prev.filter(a => a !== agency);
      }
      return [...prev, agency];
    });
  };

  const handleSaveAgencies = async () => {
    if (selectedAgencies.length === 0) {
      toast.error('Selecciona al menos una agencia');
      return;
    }
    if (await updateCalendarAgencies(calendar!.id, selectedAgencies, user?.email)) {
      setEditAgenciesOpen(false);
      await loadCalendar();
    }
  };

  const handleExtendDates = async () => {
    if (!calendar || !newMonthEnd) {
      toast.error('Selecciona la nueva fecha de fin');
      return;
    }

    // Validate new end date is after current end date
    const currentEnd = new Date(calendar.month_end);
    const newEnd = new Date(`${newMonthEnd}-01`);
    
    if (newEnd <= currentEnd) {
      toast.error('La nueva fecha debe ser posterior a la actual');
      return;
    }

    setIsExtendingDates(true);
    toast.loading('Extendiendo calendario...', { id: 'extend-dates' });

    try {
      // Update calendar with new month_end
      const { error: updateError } = await supabase
        .from('content_calendars')
        .update({ 
          month_end: `${newMonthEnd}-01`,
          updated_at: new Date().toISOString()
        })
        .eq('id', calendar.id);

      if (updateError) throw updateError;

      // Log the action
      await supabase
        .from('content_calendar_edits')
        .insert([{
          calendar_id: calendar.id,
          action: 'updated',
          performed_by: user?.email || null,
          details: {
            type: 'dates_extended',
            previous_end: calendar.month_end,
            new_end: `${newMonthEnd}-01`,
            timestamp: new Date().toISOString()
          }
        }]);

      toast.success('Calendario extendido correctamente', { id: 'extend-dates' });
      setExtendDatesOpen(false);
      setNewMonthEnd('');
      await loadCalendar();
      
      // Redirect to edit page to add posts for new months
      navigate(`/calendarios/${calendar.id}/editar`);
    } catch (error) {
      console.error('Error extending dates:', error);
      toast.error('Error al extender el calendario', { id: 'extend-dates' });
    } finally {
      setIsExtendingDates(false);
    }
  };

  const handleMarkAsReviewedAndApprove = async () => {
    if (!calendar) return;
    setIsMarkingReviewed(true);
    try {
      // Update calendar: feedback_status + status to Aprobado
      const { error: updateError } = await supabase
        .from('content_calendars')
        .update({ 
          feedback_status: 'sin_feedback',
          status: 'Aprobado'
        })
        .eq('id', calendar.id);

      if (updateError) throw updateError;

      // Add history entry with performed_by
      await supabase
        .from('content_calendar_edits')
        .insert([{
          calendar_id: calendar.id,
          action: 'feedback_reviewed_approved',
          details: { 
            timestamp: new Date().toISOString(),
            previous_status: calendar.status
          },
          performed_by: user?.email || null
        }]);

      toast.success('Feedback revisado y calendario aprobado');
      setClientProposal(null);
      setConfirmApproveOpen(false);
      await loadCalendar();
    } catch (err) {
      console.error('Error marking feedback as reviewed:', err);
      toast.error('Error al marcar como revisado');
    } finally {
      setIsMarkingReviewed(false);
    }
  };

  const handleEditAndApplyFeedback = () => {
    navigate(`/calendarios/${calendar?.id}/editar?focus=feedback`);
  };

  const getProposalChangesCount = (proposal: ProposalData): { posts: number, comments: number, notes: number } => {
    let posts = 0;
    let comments = 0;
    let notes = 0;
    
    Object.values(proposal.changes).forEach(change => {
      if (change.titleChange || change.copyChange) posts++;
      if (change.comment) comments++;
      
    });
    
    notes += proposal.generalNotes?.length || 0;
    
    return { posts, comments, notes };
  };

  const getEditIcon = (action: string): string => {
    const icons: Record<string, string> = {
      created: '🆕',
      status_changed: '🔄',
      pdf_generated: '📄',
      note_added: '📝',
      feedback_received: '💬',
      feedback_reviewed: '✅',
      feedback_reviewed_approved: '✅',
      approved_no_changes: '✅',
      approval_notification_sent: '📩',
      approval_notification_error: '⚠️',
      email_sent: '📧',
      email_error: '⚠️',
      calendar_sent: '📤',
      updated: '✏️',
      document_updated: '🔄',
    };
    return icons[action] || '📋';
  };

  const getEditTitle = (edit: ContentCalendarEdit): string => {
    const titles: Record<string, string> = {
      created: 'Calendario creado',
      status_changed: 'Cambio de estado',
      pdf_generated: 'PDF generado',
      note_added: 'Nota interna añadida',
      feedback_received: 'Feedback del cliente',
      feedback_reviewed: 'Feedback revisado',
      feedback_reviewed_approved: 'Feedback revisado y aprobado',
      approved_no_changes: 'Aprobado sin modificaciones',
      approval_notification_sent: 'Notificación de aprobación enviada',
      approval_notification_error: 'Error al notificar aprobación',
      email_sent: 'Email enviado',
      email_error: 'Error al enviar email',
      calendar_sent: 'Calendario enviado',
      updated: 'Calendario actualizado',
      document_updated: 'Documento compartido actualizado',
    };
    return titles[edit.action] || 'Acción registrada';
  };

  const renderEditDetails = (edit: ContentCalendarEdit) => {
    const details = edit.details as Record<string, unknown> | null;
    
    switch (edit.action) {
      case 'created':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Se creó un nuevo calendario de contenidos.</p>
            {details?.channel && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Canal:</span>
                <span className="font-medium">{details.channel as string}</span>
              </div>
            )}
          </div>
        );
      
      case 'status_changed':
        return (
          <div className="space-y-2 text-sm">
            {details?.old_status && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Estado anterior:</span>
                <Badge variant="outline" className="text-xs">{details.old_status as string}</Badge>
              </div>
            )}
            {details?.new_status && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Nuevo estado:</span>
                <Badge className={STATUS_COLORS[details.new_status as CalendarStatus] || 'bg-gray-100'}>
                  {details.new_status as string}
                </Badge>
              </div>
            )}
            {details?.reason && (
              <div className="mt-2 p-2 bg-muted rounded text-muted-foreground">
                <span className="font-medium">Motivo:</span> {details.reason as string}
              </div>
            )}
          </div>
        );
      
      case 'pdf_generated':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Se generó el PDF del calendario.</p>
            {details?.pdf_url && (
              <a 
                href={details.pdf_url as string} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:underline flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Descargar PDF
              </a>
            )}
          </div>
        );
      
      case 'note_added':
        return (
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
              <p className="italic">{details?.note as string || 'Sin contenido'}</p>
            </div>
          </div>
        );
      
      case 'feedback_received':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">El cliente ha enviado feedback sobre el calendario.</p>
            {details?.changes_count && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Cambios propuestos:</span>
                <Badge variant="secondary">{details.changes_count as number}</Badge>
              </div>
            )}
            {details?.general_notes && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-amber-800 dark:text-amber-300">
                <span className="font-medium">Notas generales:</span> {details.general_notes as string}
              </div>
            )}
          </div>
        );
      
      case 'feedback_reviewed':
      case 'feedback_reviewed_approved':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-green-600 dark:text-green-400">
              El feedback del cliente fue revisado{edit.action === 'feedback_reviewed_approved' ? ' y el calendario fue aprobado' : ''}.
            </p>
            {details?.approved_changes && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Cambios aplicados:</span>
                <Badge variant="secondary">{details.approved_changes as number}</Badge>
              </div>
            )}
          </div>
        );
      
      case 'approved_no_changes':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-green-600 dark:text-green-400 font-medium">
              El cliente aprobó el calendario sin solicitar modificaciones.
            </p>
            {details?.client_email && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Cliente:</span>
                <span>{details.client_email as string}</span>
              </div>
            )}
          </div>
        );
      
      case 'email_sent':
      case 'calendar_sent':
        return (
          <div className="space-y-2 text-sm">
            {details?.to && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Destinatario:</span>
                <span className="font-medium">{details.to as string}</span>
              </div>
            )}
            {edit.template_name && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Plantilla:</span>
                <Badge variant="outline" className="text-xs">{edit.template_name}</Badge>
              </div>
            )}
            {details?.subject && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Asunto:</span>
                <span>{details.subject as string}</span>
              </div>
            )}
            {details?.share_link && (
              <div className="flex gap-2 items-center">
                <span className="text-muted-foreground">Enlace compartido:</span>
                <a 
                  href={details.share_link as string} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline text-xs truncate max-w-[200px]"
                >
                  {details.share_link as string}
                </a>
              </div>
            )}
            {details?.cc && Array.isArray(details.cc) && details.cc.length > 0 && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">CC:</span>
                <span className="text-xs">{(details.cc as string[]).join(', ')}</span>
              </div>
            )}
          </div>
        );
      
      case 'email_error':
      case 'approval_notification_error':
        return (
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded text-red-600 dark:text-red-400">
              <span className="font-medium">Error:</span> {details?.error as string || 'Error desconocido'}
            </div>
            {details?.to && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Destinatario:</span>
                <span>{details.to as string}</span>
              </div>
            )}
          </div>
        );
      
      case 'approval_notification_sent':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Se notificó a los responsables sobre la aprobación.</p>
            {details?.responsibles && Array.isArray(details.responsibles) && (
              <div className="flex flex-wrap gap-1">
                {(details.responsibles as string[]).map((email, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{email}</Badge>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'updated':
        if (details?.action === 'responsibles_updated') {
          return (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Se actualizaron los responsables del calendario.</p>
              {details?.old_responsibles && Array.isArray(details.old_responsibles) && (
                <div>
                  <span className="text-muted-foreground text-xs">Anteriores:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(details.old_responsibles as string[]).map((email, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{email}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {details?.new_responsibles && Array.isArray(details.new_responsibles) && (
                <div>
                  <span className="text-muted-foreground text-xs">Nuevos:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(details.new_responsibles as string[]).map((email, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{email}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }
        if (details?.action === 'agencies_updated') {
          return (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Se actualizaron las agencias del calendario.</p>
              {details?.new_agencies && Array.isArray(details.new_agencies) && (
                <div className="flex flex-wrap gap-1">
                  {(details.new_agencies as string[]).map((agency, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {AGENCY_LABELS[agency as Agency] || agency}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">El calendario fue actualizado.</p>
            {details && Object.keys(details).length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono overflow-x-auto">
                {JSON.stringify(details, null, 2)}
              </div>
            )}
          </div>
        );
      
      case 'document_updated':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-green-600 dark:text-green-400">
              El documento compartido fue actualizado con los últimos cambios.
            </p>
            {details?.posts_count !== undefined && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Posts sincronizados:</span>
                <Badge variant="secondary">{details.posts_count as number}</Badge>
              </div>
            )}
            {details?.timestamp && (
              <div className="text-xs text-muted-foreground">
                Sincronizado: {format(parseISO(details.timestamp as string), "dd/MM/yyyy HH:mm", { locale: es })}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Acción registrada en el sistema.</p>
            {details && Object.keys(details).length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono overflow-x-auto">
                <pre>{JSON.stringify(details, null, 2)}</pre>
              </div>
            )}
          </div>
        );
    }
  };

  // Biskit theming - always use Biskit styling
  const isBiskitOnly = true;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - themed based on agency */}
      <header className={`border-b sticky top-0 z-10 ${
        isBiskitOnly 
          ? 'bg-biskit-bg border-biskit-yellow/20' 
          : 'bg-card border-border'
      }`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-biskit.png?v=20251229" 
              alt="Biskit Agencia"
              className="h-8 w-auto" 
              loading="eager"
              onError={(e) => {
                console.error('Logo failed to load:', e.currentTarget.src);
              }}
            />
            <span className={`text-lg font-semibold ${
              isBiskitOnly ? 'text-biskit-yellow' : 'text-foreground'
            }`}>
              {calendar.calendar_contact?.company_name}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/calendarios')}
            className={isBiskitOnly ? 'text-biskit-yellow hover:bg-biskit-yellow/10' : ''}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Approval Success Banner - show when status is "Aprobado" */}
                {calendar.status === 'Aprobado' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 dark:bg-green-950/30 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-green-800 font-semibold dark:text-green-300">
                          ✅ Aprobado sin modificaciones
                        </p>
                        <p className="text-green-600 text-sm mt-1 dark:text-green-400">
                          El cliente ha aprobado el calendario. Listo para publicar.
                        </p>
                        {calendar.approved_at && (
                          <p className="text-green-500 text-xs mt-2 dark:text-green-500">
                            Aprobado el {format(parseISO(calendar.approved_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback Alert - show when status is "Editado" */}
                {calendar.status === 'Editado' && shareLink && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 dark:bg-red-950/30 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-red-800 font-semibold dark:text-red-300">
                          ⚠️ Calendario editado por el cliente
                        </p>
                        <p className="text-red-600 text-sm mt-1 dark:text-red-400">
                          El cliente ha enviado feedback. Revisa los cambios propuestos.
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <a 
                            href={shareLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-red-700 hover:text-red-800 text-sm font-medium underline dark:text-red-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver propuestas del cliente
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Empresa</Label>
                    <p className="font-medium">{calendar.calendar_contact?.company_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Canal</Label>
                    <p className="font-medium">{calendar.channel}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Periodo</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{formatPeriod(calendar.month_start, calendar.month_end)}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          // Pre-set the new month end to one month after current end
                          const currentEnd = new Date(calendar.month_end);
                          currentEnd.setMonth(currentEnd.getMonth() + 1);
                          const year = currentEnd.getFullYear();
                          const month = String(currentEnd.getMonth() + 1).padStart(2, '0');
                          setNewMonthEnd(`${year}-${month}`);
                          setExtendDatesOpen(true);
                        }}
                        title="Extender fechas"
                      >
                        <CalendarPlus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <div className="mt-1">
                      <Select value={calendar.status} onValueChange={(v) => handleStatusChange(v as CalendarStatus)}>
                        <SelectTrigger className="w-[220px]">
                          <Badge className={STATUS_COLORS[calendar.status]}>
                            {calendar.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {CALENDAR_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>
                              <Badge className={STATUS_COLORS[status]}>{status}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Agencies */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-muted-foreground flex-1">Agencias</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {calendar.agencies && calendar.agencies.length > 0 ? (
                      calendar.agencies.map(agency => (
                        <Badge 
                          key={agency} 
                          variant="outline"
                          className={agency === 'biskit' 
                            ? 'bg-biskit-bg text-biskit-yellow border-biskit-yellow/30' 
                            : 'bg-accent/10 text-accent border-accent/30'
                          }
                        >
                          {AGENCY_LABELS[agency]}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="bg-biskit-bg text-biskit-yellow border-biskit-yellow/30">
                        Biskit Agencia
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Responsibles */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-muted-foreground flex-1">Responsables</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {calendar.responsibles && calendar.responsibles.length > 0 ? (
                      calendar.responsibles.map(resp => (
                        <Badge key={resp.id} variant="secondary">
                          {resp.email}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin responsables asignados</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Proposals Card */}
            {calendar.status === 'Editado' && clientProposal && (
              <Card ref={feedbackSectionRef} className="border-red-200 dark:border-red-800">
                <CardHeader className="bg-red-50 dark:bg-red-950/30 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-300">
                    <MessageSquare className="h-5 w-5" />
                    Detalle del feedback del cliente
                  </CardTitle>
                  <CardDescription className="text-red-600 dark:text-red-400">
                    {(() => {
                      const counts = getProposalChangesCount(clientProposal);
                      const parts = [];
                      if (counts.posts > 0) parts.push(`${counts.posts} post${counts.posts > 1 ? 's' : ''} modificado${counts.posts > 1 ? 's' : ''}`);
                      if (counts.comments > 0) parts.push(`${counts.comments} comentario${counts.comments > 1 ? 's' : ''}`);
                      if (counts.notes > 0) parts.push(`${counts.notes} nota${counts.notes > 1 ? 's' : ''}`);
                      return parts.length > 0 ? parts.join(', ') : 'Sin cambios';
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* General Notes */}
                  {clientProposal.generalNotes && clientProposal.generalNotes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground font-semibold">Notas generales del cliente</Label>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 dark:bg-amber-950/30 dark:border-amber-800">
                        {clientProposal.generalNotes.map((note, idx) => (
                          <p key={idx} className="text-sm text-amber-800 dark:text-amber-300">
                            • {note}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post Changes */}
                  {Object.entries(clientProposal.changes).length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-muted-foreground font-semibold">Cambios en publicaciones</Label>
                      {Object.entries(clientProposal.changes).map(([postId, change]) => (
                        <div key={postId} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                          <p className="text-xs text-muted-foreground font-mono">Post ID: {postId.slice(0, 8)}...</p>
                          
                          {change.titleChange && (
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-muted-foreground">Nuevo título propuesto:</span>
                              <p className="text-sm bg-green-50 border-l-2 border-green-500 pl-2 py-1 dark:bg-green-950/30">
                                {change.titleChange}
                              </p>
                            </div>
                          )}
                          
                          {change.copyChange && (
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-muted-foreground">Nuevo copy propuesto:</span>
                              <p className="text-sm bg-green-50 border-l-2 border-green-500 pl-2 py-1 whitespace-pre-wrap dark:bg-green-950/30">
                                {change.copyChange}
                              </p>
                            </div>
                          )}
                          
                          {change.comment && (
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-muted-foreground">Comentario:</span>
                              <p className="text-sm bg-blue-50 border-l-2 border-blue-500 pl-2 py-1 dark:bg-blue-950/30">
                                {change.comment}
                              </p>
                            </div>
                          )}
                          
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={handleEditAndApplyFeedback}
                      className="flex-1"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      ✏️ Editar y aplicar feedback
                    </Button>
                    <Button
                      onClick={() => setConfirmApproveOpen(true)}
                      disabled={isMarkingReviewed}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isMarkingReviewed ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      ✅ Marcar como revisado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirm Approve Modal */}
            <AlertDialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar aprobación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Confirmas que ya has aplicado los cambios del feedback y el calendario queda aprobado?
                    <br /><br />
                    El estado del calendario pasará a <strong>Aprobado</strong> y quedará listo para publicar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleMarkAsReviewedAndApprove}
                    disabled={isMarkingReviewed}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isMarkingReviewed ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Sí, aprobar calendario
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Extend Dates Modal */}
            <Dialog open={extendDatesOpen} onOpenChange={setExtendDatesOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarPlus className="h-5 w-5" />
                    Extender fechas del calendario
                  </DialogTitle>
                  <DialogDescription>
                    Extiende el periodo del calendario añadiendo más meses al final.
                    Los meses actuales y sus posts se mantienen.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Fecha inicio (actual)</Label>
                      <Input 
                        value={format(parseISO(calendar.month_start), 'MMMM yyyy', { locale: es })}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Fecha fin (actual)</Label>
                      <Input 
                        value={format(parseISO(calendar.month_end), 'MMMM yyyy', { locale: es })}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nueva fecha de fin *</Label>
                    <Input
                      type="month"
                      value={newMonthEnd}
                      onChange={(e) => setNewMonthEnd(e.target.value)}
                      min={calendar.month_end.substring(0, 7)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Selecciona un mes posterior a {format(parseISO(calendar.month_end), 'MMMM yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setExtendDatesOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleExtendDates} disabled={isExtendingDates || !newMonthEnd}>
                    {isExtendingDates ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extendiendo...
                      </>
                    ) : (
                      <>
                        <CalendarPlus className="h-4 w-4 mr-2" />
                        Extender y editar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>


            {/* Share Link Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Compartir con cliente
                </CardTitle>
                <CardDescription>
                  Genera un enlace para que el cliente pueda ver y proponer cambios
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Month visibility selector */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Meses visibles para el cliente</Label>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={selectAllMonths}
                        className="h-6 px-2 text-xs"
                      >
                        Todos
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={deselectAllMonths}
                        className="h-6 px-2 text-xs"
                      >
                        Ninguno
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableMonths.map(month => (
                      <label 
                        key={month.key}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer border transition-colors ${
                          selectedVisibleMonths.includes(month.key)
                            ? 'bg-primary/10 border-primary/30 text-foreground font-medium'
                            : 'bg-muted border-border text-muted-foreground'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVisibleMonths.includes(month.key)}
                          onChange={() => toggleMonthVisibility(month.key)}
                          className="rounded"
                        />
                        <span className="text-sm">{month.label}</span>
                      </label>
                    ))}
                  </div>
                  {selectedVisibleMonths.length === 0 && (
                    <p className="text-destructive text-xs mt-2">
                      ⚠️ Selecciona al menos un mes para compartir
                    </p>
                  )}
                  {selectedVisibleMonths.length > 0 && selectedVisibleMonths.length < availableMonths.length && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Se compartirán {selectedVisibleMonths.length} de {availableMonths.length} meses
                    </p>
                  )}
                  {selectedVisibleMonths.length === availableMonths.length && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Se compartirán todos los meses
                    </p>
                  )}
                </div>

                {shareLink ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input 
                        value={shareLink} 
                        readOnly 
                        className="text-sm font-mono"
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
                    <div className="flex items-center gap-2 mt-2">
                      <Button 
                        variant={documentNeedsUpdate ? "destructive" : "outline"}
                        size="sm"
                        onClick={updateShareDocument}
                        disabled={isUpdatingDocument}
                        className={`flex-1 ${!documentNeedsUpdate && !isUpdatingDocument ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/40' : ''}`}
                      >
                        {isUpdatingDocument ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Actualizando...
                          </>
                        ) : documentNeedsUpdate ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Actualizar documento
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Documento actualizado
                          </>
                        )}
                      </Button>
                    </div>
                    {documentNeedsUpdate && (
                      <p className="text-xs text-destructive mt-1">
                        ⚠️ Hay cambios sin sincronizar con el enlace compartido
                      </p>
                    )}
                    {existingVisibleMonths && existingVisibleMonths.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        📅 Meses compartidos actualmente: {existingVisibleMonths.length} de {availableMonths.length}
                      </p>
                    )}
                    {/* Slug / Friendly URL section */}
                    <div className="border-t border-border pt-3 mt-3">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        URL amigable (opcional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/c/</span>
                          <Input
                            value={shareSlug}
                            onChange={(e) => {
                              setShareSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                              setSlugError(null);
                            }}
                            placeholder="nombre-cliente"
                            className="text-sm font-mono pl-9"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAutoGenerateSlug}
                          title="Auto-generar desde nombre"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveSlug}
                          disabled={isUpdatingSlug}
                        >
                          {isUpdatingSlug ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Guardar'
                          )}
                        </Button>
                      </div>
                      {slugError && (
                        <p className="text-xs text-destructive mt-1">{slugError}</p>
                      )}
                      {shareSlug && !slugError && (
                        <p className="text-xs text-muted-foreground mt-1">
                          URL corta: <span className="font-mono">{getPublicBaseUrl()}/c/{shareSlug}</span>
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Cualquier persona con este enlace puede ver el calendario y enviar propuestas
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={generateShareLink} 
                    disabled={isGeneratingLink}
                    className="w-full"
                  >
                    {isGeneratingLink ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Generar enlace de compartir
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Share History - All sent periods with feedback */}
            {shareHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historial de envíos
                  </CardTitle>
                  <CardDescription>
                    Periodos enviados al cliente con su estado de feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shareHistory.map((item, index) => {
                      const periodLabel = item.visible_months && item.visible_months.length > 0
                        ? item.visible_months.map(vm => {
                            const [year, month] = vm.split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                            return format(date, 'MMM yyyy', { locale: es });
                          }).join(', ')
                        : 'Todos los meses';
                      
                      const proposalChangesCount = item.proposal 
                        ? Object.values(item.proposal.changes).filter(c => 
                            c.titleChange || c.copyChange || c.comment
                          ).length + (item.proposal.generalNotes?.length || 0)
                        : 0;
                      
                      return (
                        <div 
                          key={item.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            index === 0 
                              ? 'bg-primary/5 border-primary/30' 
                              : 'bg-muted/50 border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium truncate">
                                  {periodLabel}
                                </span>
                                {index === 0 && (
                                  <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-foreground">
                                    Actual
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Enviado {format(parseISO(item.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.is_approved ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  <Check className="h-3 w-3 mr-1" />
                                  Aprobado
                                </Badge>
                              ) : item.proposal_status === 'submitted' ? (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Feedback ({proposalChangesCount})
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Pendiente
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Show feedback details if submitted */}
                          {item.proposal_status === 'submitted' && item.proposal && proposalChangesCount > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {Object.values(item.proposal.changes).filter(c => c.titleChange).length > 0 && (
                                  <span>📝 {Object.values(item.proposal.changes).filter(c => c.titleChange).length} títulos</span>
                                )}
                                {Object.values(item.proposal.changes).filter(c => c.copyChange).length > 0 && (
                                  <span>✏️ {Object.values(item.proposal.changes).filter(c => c.copyChange).length} copys</span>
                                )}
                                {Object.values(item.proposal.changes).filter(c => c.comment).length > 0 && (
                                  <span>💬 {Object.values(item.proposal.changes).filter(c => c.comment).length} comentarios</span>
                                )}
                                {(item.proposal.generalNotes?.length || 0) > 0 && (
                                  <span>📋 {item.proposal.generalNotes?.length} notas</span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Link to view */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs px-2"
                              onClick={() => {
                                const baseUrl = getPublicBaseUrl();
                                window.open(`${baseUrl}/share/${item.token}`, '_blank');
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs px-2"
                              onClick={async () => {
                                const baseUrl = getPublicBaseUrl();
                                await navigator.clipboard.writeText(`${baseUrl}/share/${item.token}`);
                                toast.success('Enlace copiado');
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar enlace
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs px-2 text-[#E91E63]"
                              onClick={() => {
                                const baseUrl = getPublicBaseUrl();
                                setEmailModalShareLink(`${baseUrl}/share/${item.token}`);
                                setEmailModalOpen(true);
                              }}
                              disabled={!canSendEmail}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Reenviar este periodo
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Edit Calendar - Primary Action */}
              <Button 
                onClick={() => navigate(`/calendarios/${calendar.id}/editar`)}
                className={`w-full py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                  isBiskitOnly 
                    ? 'bg-biskit-yellow hover:bg-biskit-yellow/90 text-black' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
                size="lg"
              >
                <Pencil className="h-5 w-5 mr-2" />
                Editar calendario
              </Button>

              {/* Send Email - Secondary Action */}
              <Button 
                onClick={() => {
                  // Ensure the share link matches the currently selected visible months,
                  // so each period gets its own feedback.
                  void (async () => {
                    if (!shareLink) {
                      await generateShareLink();
                    } else {
                      const visibleMonthsToSave = selectedVisibleMonths.length > 0 && selectedVisibleMonths.length < availableMonths.length
                        ? selectedVisibleMonths
                        : null;
                      const visibleMonthsChanged = JSON.stringify(existingVisibleMonths) !== JSON.stringify(visibleMonthsToSave);

                      if (visibleMonthsChanged || documentNeedsUpdate) {
                        await updateShareDocument();
                      }
                    }

                    setEmailModalShareLink(null); // Use the main share link
                    setEmailModalOpen(true);
                  })();
                }}
                disabled={!canSendEmail || isUpdatingDocument || isGeneratingLink}
                title={getEmailButtonTooltip()}
                variant="outline"
                className="w-full py-5 text-base font-medium border-[#E91E63] text-[#E91E63] hover:bg-[#E91E63]/10"
                size="lg"
              >
                <Mail className="h-5 w-5 mr-2" />
                Enviar email al cliente
              </Button>

              
              {/* Edit Responsibles - Secondary Action */}
              <Dialog open={editResponsiblesOpen} onOpenChange={setEditResponsiblesOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" size="sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar responsables
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar responsables</DialogTitle>
                    <DialogDescription>
                      Selecciona los responsables del calendario
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 py-4">
                    {teamMembers.map(tm => (
                      <label 
                        key={tm.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedResponsibles.includes(tm.id)}
                          onChange={() => toggleResponsible(tm.id)}
                          className="rounded"
                        />
                        <span>{tm.email}</span>
                      </label>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditResponsiblesOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveResponsibles}>
                      Guardar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Agencies */}
              <Dialog open={editAgenciesOpen} onOpenChange={setEditAgenciesOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" size="sm">
                    <Building2 className="h-4 w-4 mr-2" />
                    Editar agencia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar agencia</DialogTitle>
                    <DialogDescription>
                      Selecciona las agencias del calendario
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 py-4">
                    {AGENCIES.map(agency => (
                      <label 
                        key={agency.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedAgencies.includes(agency.id)
                            ? agency.id === 'biskit'
                              ? 'bg-biskit-bg border-biskit-yellow text-biskit-yellow'
                              : 'bg-accent/10 border-accent text-accent'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                        onClick={() => toggleAgency(agency.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAgencies.includes(agency.id)}
                          onChange={() => {}}
                          className="rounded"
                        />
                        <span className={selectedAgencies.includes(agency.id) ? '' : 'text-foreground'}>
                          {agency.name}
                        </span>
                      </label>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">
                      Puedes seleccionar una o ambas agencias
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditAgenciesOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveAgencies}>
                      Guardar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {/* History - Large with accordion items */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historial
                    {edits.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {historyFilter === 'all' ? edits.length : edits.filter(e => e.action === historyFilter).length}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                {edits.length > 0 && (
                  <Select value={historyFilter} onValueChange={setHistoryFilter}>
                    <SelectTrigger className="w-full mt-2 h-8 text-xs">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los eventos</SelectItem>
                      <SelectItem value="created">🆕 Calendario creado</SelectItem>
                      <SelectItem value="status_changed">🔄 Cambios de estado</SelectItem>
                      <SelectItem value="note_added">📝 Notas internas</SelectItem>
                      <SelectItem value="email_sent">📧 Emails enviados</SelectItem>
                      <SelectItem value="calendar_sent">📤 Calendario enviado</SelectItem>
                      <SelectItem value="feedback_received">💬 Feedback recibido</SelectItem>
                      <SelectItem value="feedback_reviewed">✅ Feedback revisado</SelectItem>
                      <SelectItem value="approved_no_changes">✅ Aprobaciones</SelectItem>
                      <SelectItem value="pdf_generated">📄 PDFs generados</SelectItem>
                      <SelectItem value="updated">✏️ Actualizaciones</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="max-h-[calc(100vh-450px)] min-h-[250px] overflow-y-auto pr-2">
                  {edits.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sin cambios registrados
                    </p>
                  ) : (
                    <Accordion type="multiple" className="space-y-2">
                      {edits
                        .filter(edit => historyFilter === 'all' || edit.action === historyFilter)
                        .map((edit, index) => (
                        <AccordionItem 
                          key={edit.id} 
                          value={edit.id}
                          className="border rounded-lg px-3 data-[state=open]:bg-muted/30"
                        >
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-start gap-3 text-left w-full pr-2">
                              <span className="text-lg flex-shrink-0">
                                {getEditIcon(edit.action)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {getEditTitle(edit)}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <span>
                                    {format(parseISO(edit.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                                  </span>
                                  {edit.performed_by && (
                                    <>
                                      <span>•</span>
                                      <span className="text-muted-foreground truncate max-w-[120px]">
                                        {edit.performed_by}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-4">
                            <div className="pl-9 border-l-2 border-primary/20 ml-2">
                              {renderEditDetails(edit)}
                              
                              {/* Metadata footer */}
                              <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>ID: {edit.id.slice(0, 8)}...</span>
                                {edit.performed_by ? (
                                  <span>Por: {edit.performed_by}</span>
                                ) : edit.action !== 'feedback_received' ? (
                                  <span>Por: Sistema</span>
                                ) : (
                                  <span>Por: Cliente</span>
                                )}
                                <span>
                                  {format(parseISO(edit.created_at), "EEEE d 'de' MMMM yyyy 'a las' HH:mm:ss", { locale: es })}
                                </span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Notas internas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Añadir nota..."
                    className="min-h-[60px]"
                  />
                </div>
                <Button onClick={handleAddNote} size="sm" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Añadir nota
                </Button>
              </CardContent>
            </Card>

            {/* Contact - Collapsible Accordion */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4" />
                        Contacto
                      </CardTitle>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                    </div>
                    <CardDescription className="text-left">
                      {calendar.calendar_contact?.contact_name || calendar.calendar_contact?.email || 'Sin contacto'}
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3 text-sm">
                      {calendar.calendar_contact?.contact_name && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Nombre</Label>
                          <p className="font-medium">{calendar.calendar_contact.contact_name}</p>
                        </div>
                      )}
                      {calendar.calendar_contact?.email && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Email</Label>
                          <p className="font-medium">{calendar.calendar_contact.email}</p>
                        </div>
                      )}
                      {calendar.calendar_contact?.phone && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Teléfono</Label>
                          <p className="font-medium">{calendar.calendar_contact.phone}</p>
                        </div>
                      )}
                      {calendar.calendar_contact?.website && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Web</Label>
                          <p className="font-medium">{calendar.calendar_contact.website}</p>
                        </div>
                      )}
                      {calendar.calendar_contact?.address && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Dirección</Label>
                          <p className="font-medium">{calendar.calendar_contact.address}</p>
                        </div>
                      )}
                      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <Edit2 className="h-3 w-3 mr-2" />
                            Editar contacto
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar perfil de contacto</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Nombre del contacto</Label>
                              <Input
                                value={contactForm.contact_name || ''}
                                onChange={(e) => setContactForm({ ...contactForm, contact_name: e.target.value })}
                                placeholder="Nombre del contacto"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={contactForm.email || ''}
                                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                placeholder="email@ejemplo.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Teléfono</Label>
                              <Input
                                value={contactForm.phone || ''}
                                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                placeholder="+34 600 000 000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Web</Label>
                              <Input
                                value={contactForm.website || ''}
                                onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })}
                                placeholder="https://ejemplo.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Dirección</Label>
                              <Input
                                value={contactForm.address || ''}
                                onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                                placeholder="Calle, Ciudad, País"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditContactOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleSaveContact}>
                              Guardar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* AI Content Profile Section */}
            {calendar.calendar_contact && (
              <ContactAISection 
                contactId={calendar.calendar_contact.id}
                onProfileUpdated={loadCalendar}
              />
            )}
          </div>
        </div>
      </main>

      {/* Email Modal */}
      <SendEmailModal
        open={emailModalOpen}
        onOpenChange={(open) => {
          setEmailModalOpen(open);
          if (!open) setEmailModalShareLink(null);
        }}
        calendarId={calendar.id}
        companyName={calendar.calendar_contact?.company_name || ''}
        channel={calendar.channel}
        period={formatPeriod(calendar.month_start, calendar.month_end)}
        contactEmail={contactEmail}
        contactName={calendar.calendar_contact?.contact_name || ''}
        responsibleEmails={responsibleEmails}
        shareLink={emailModalShareLink || shareLink}
        onEmailSent={loadCalendar}
        performedBy={user?.email}
        agencies={calendar.agencies}
      />
    </div>
  );
};

export default CalendarioDetalle;
