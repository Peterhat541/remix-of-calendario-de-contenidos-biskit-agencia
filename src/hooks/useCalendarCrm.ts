import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ContentCalendar, 
  CalendarContact, 
  TeamMemberCalendar, 
  ContentCalendarEdit,
  CalendarStatus,
  CalendarEditAction,
  parseCalendarStatus,
  Agency
} from '@/types/calendarCrm';
import { toast } from 'sonner';

export function useCalendarCrm() {
  const [calendars, setCalendars] = useState<ContentCalendar[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberCalendar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendars = async () => {
    setLoading(true);
    try {
      // Fetch calendars with contacts
      const { data: calendarsData, error: calendarsError } = await supabase
        .from('content_calendars')
        .select(`
          *,
          calendar_contact:calendar_contacts(*)
        `)
        .order('updated_at', { ascending: false });

      if (calendarsError) throw calendarsError;

      // Fetch responsibles for each calendar
      const calendarsWithResponsibles = await Promise.all(
        (calendarsData || []).map(async (cal) => {
          const { data: responsibles } = await supabase
            .from('content_calendar_responsibles')
            .select(`
              *,
              team_member:team_members_calendar(*)
            `)
            .eq('calendar_id', cal.id);

          return {
            ...cal,
            status: parseCalendarStatus(cal.status),
            agencies: (cal.agencies as Agency[]) || ['likearocket'],
            responsibles: responsibles?.map(r => r.team_member).filter(Boolean) || []
          } as ContentCalendar;
        })
      );

      setCalendars(calendarsWithResponsibles);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error('Error al cargar calendarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members_calendar')
        .select('*')
        .eq('is_active', true)
        .order('email');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  useEffect(() => {
    fetchCalendars();
    fetchTeamMembers();
  }, []);

  const createOrUpdateContact = async (companyName: string, contactData?: Partial<CalendarContact>): Promise<CalendarContact | null> => {
    try {
      // Check if contact exists
      const { data: existing } = await supabase
        .from('calendar_contacts')
        .select('*')
        .eq('company_name', companyName)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('calendar_contacts')
          .update({
            contact_name: contactData?.contact_name || existing.contact_name,
            email: contactData?.email || existing.email,
            phone: contactData?.phone || existing.phone,
            website: contactData?.website || existing.website,
            address: contactData?.address || existing.address
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('calendar_contacts')
          .insert({
            company_name: companyName,
            contact_name: contactData?.contact_name,
            email: contactData?.email,
            phone: contactData?.phone,
            website: contactData?.website,
            address: contactData?.address
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error creating/updating contact:', error);
      toast.error('Error al guardar contacto');
      return null;
    }
  };

  const createCalendar = async (
    contactId: string,
    channel: string,
    monthStart: string,
    monthEnd: string,
    responsibleIds: string[],
    agencies: Agency[] = ['likearocket']
  ): Promise<ContentCalendar | null> => {
    try {
      // Create calendar
      const { data: calendar, error: calendarError } = await supabase
        .from('content_calendars')
        .insert({
          calendar_contact_id: contactId,
          channel,
          month_start: monthStart,
          month_end: monthEnd,
          status: 'Pendiente de enviar',
          agencies: agencies
        })
        .select()
        .single();

      if (calendarError) {
        console.error('CREATE CALENDAR ERROR', calendarError);
        throw calendarError;
      }

      // Add responsibles
      if (responsibleIds.length > 0) {
        const { error: respError } = await supabase
          .from('content_calendar_responsibles')
          .insert(
            responsibleIds.map(teamMemberId => ({
              calendar_id: calendar.id,
              team_member_id: teamMemberId
            }))
          );

        if (respError) throw respError;
      }

      // Add edit entry
      const responsibleEmails = teamMembers
        .filter(tm => responsibleIds.includes(tm.id))
        .map(tm => tm.email);

      await addCalendarEdit(calendar.id, 'created', {
        channel,
        month_start: monthStart,
        month_end: monthEnd,
        responsibles_emails: responsibleEmails
      });

      await fetchCalendars();
      return {
        ...calendar,
        status: parseCalendarStatus(calendar.status),
        agencies: (calendar.agencies as Agency[]) || agencies
      } as ContentCalendar;
    } catch (error) {
      console.error('Error creating calendar:', error);
      toast.error('Error al crear calendario');
      return null;
    }
  };

  const updateCalendarStatus = async (calendarId: string, newStatus: CalendarStatus, performedBy?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('content_calendars')
        .update({ status: newStatus })
        .eq('id', calendarId);

      if (error) throw error;

      await addCalendarEdit(calendarId, 'status_changed', {
        new_status: newStatus
      }, performedBy);

      await fetchCalendars();
      toast.success('Estado actualizado');
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
      return false;
    }
  };

  const updateCalendarPdf = async (calendarId: string, pdfUrl: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('content_calendars')
        .update({ 
          pdf_url: pdfUrl,
          pdf_generated_at: new Date().toISOString()
        })
        .eq('id', calendarId);

      if (error) throw error;

      await addCalendarEdit(calendarId, 'pdf_generated', {
        pdf_url: pdfUrl
      });

      await fetchCalendars();
      return true;
    } catch (error) {
      console.error('Error updating PDF:', error);
      toast.error('Error al guardar PDF');
      return false;
    }
  };

  const updateCalendarResponsibles = async (calendarId: string, responsibleIds: string[], performedBy?: string): Promise<boolean> => {
    try {
      // Delete existing
      await supabase
        .from('content_calendar_responsibles')
        .delete()
        .eq('calendar_id', calendarId);

      // Add new
      if (responsibleIds.length > 0) {
        const { error } = await supabase
          .from('content_calendar_responsibles')
          .insert(
            responsibleIds.map(teamMemberId => ({
              calendar_id: calendarId,
              team_member_id: teamMemberId
            }))
          );

        if (error) throw error;
      }

      const responsibleEmails = teamMembers
        .filter(tm => responsibleIds.includes(tm.id))
        .map(tm => tm.email);

      await addCalendarEdit(calendarId, 'updated', {
        action: 'responsibles_updated',
        responsibles_emails: responsibleEmails
      }, performedBy);

      await fetchCalendars();
      toast.success('Responsables actualizados');
      return true;
    } catch (error) {
      console.error('Error updating responsibles:', error);
      toast.error('Error al actualizar responsables');
      return false;
    }
  };

  const updateContact = async (contactId: string, data: Partial<CalendarContact>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('calendar_contacts')
        .update({
          contact_name: data.contact_name,
          email: data.email,
          phone: data.phone,
          website: data.website,
          address: data.address
        })
        .eq('id', contactId);

      if (error) throw error;

      await fetchCalendars();
      toast.success('Contacto actualizado');
      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Error al actualizar contacto');
      return false;
    }
  };

  const addCalendarEdit = async (
    calendarId: string, 
    action: CalendarEditAction, 
    details?: Record<string, unknown>,
    performedBy?: string,
    templateName?: string
  ): Promise<void> => {
    try {
      await supabase
        .from('content_calendar_edits')
        .insert([{
          calendar_id: calendarId,
          action: action as string,
          details: (details || null) as unknown as Record<string, never>,
          performed_by: performedBy || null,
          template_name: templateName || null
        }]);
    } catch (error) {
      console.error('Error adding edit:', error);
    }
  };

  const addNote = async (calendarId: string, note: string, performedBy?: string): Promise<boolean> => {
    try {
      await addCalendarEdit(calendarId, 'note_added', { note }, performedBy);
      toast.success('Nota añadida');
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error al añadir nota');
      return false;
    }
  };

  const getCalendarEdits = async (calendarId: string): Promise<ContentCalendarEdit[]> => {
    try {
      const { data, error } = await supabase
        .from('content_calendar_edits')
        .select('*')
        .eq('calendar_id', calendarId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(edit => ({
        ...edit,
        action: edit.action as CalendarEditAction,
        details: edit.details as Record<string, unknown> | null,
        performed_by: edit.performed_by || null,
        template_name: edit.template_name || null
      }));
    } catch (error) {
      console.error('Error fetching edits:', error);
      return [];
    }
  };

  const getCalendarById = async (id: string): Promise<ContentCalendar | null> => {
    try {
      const { data, error } = await supabase
        .from('content_calendars')
        .select(`
          *,
          calendar_contact:calendar_contacts(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch responsibles
      const { data: responsibles } = await supabase
        .from('content_calendar_responsibles')
        .select(`
          *,
          team_member:team_members_calendar(*)
        `)
        .eq('calendar_id', id);

      return {
        ...data,
        status: parseCalendarStatus(data.status),
        agencies: (data.agencies as Agency[]) || ['likearocket'],
        responsibles: responsibles?.map(r => r.team_member).filter(Boolean) || []
      } as ContentCalendar;
    } catch (error) {
      console.error('Error fetching calendar:', error);
      return null;
    }
  };

  const deleteCalendar = async (calendarId: string): Promise<boolean> => {
    try {
      // Delete related records first
      await supabase
        .from('content_calendar_responsibles')
        .delete()
        .eq('calendar_id', calendarId);

      await supabase
        .from('content_calendar_edits')
        .delete()
        .eq('calendar_id', calendarId);

      await supabase
        .from('calendar_posts')
        .delete()
        .eq('calendar_id', calendarId);

      // Delete documents and their related data
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('calendar_id', calendarId);

      if (documents && documents.length > 0) {
        const docIds = documents.map(d => d.id);
        
        await supabase
          .from('proposals')
          .delete()
          .in('document_id', docIds);

        await supabase
          .from('share_links')
          .delete()
          .in('document_id', docIds);

        await supabase
          .from('documents')
          .delete()
          .eq('calendar_id', calendarId);
      }

      // Delete the calendar itself
      const { error } = await supabase
        .from('content_calendars')
        .delete()
        .eq('id', calendarId);

      if (error) throw error;

      await fetchCalendars();
      toast.success('Calendario eliminado');
      return true;
    } catch (error) {
      console.error('Error deleting calendar:', error);
      toast.error('Error al eliminar calendario');
      return false;
    }
  };

  const updateCalendarAgencies = async (calendarId: string, agencies: Agency[], performedBy?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('content_calendars')
        .update({ agencies })
        .eq('id', calendarId);

      if (error) throw error;

      await addCalendarEdit(calendarId, 'updated', {
        action: 'agencies_updated',
        agencies
      }, performedBy);

      await fetchCalendars();
      toast.success('Agencias actualizadas');
      return true;
    } catch (error) {
      console.error('Error updating agencies:', error);
      toast.error('Error al actualizar agencias');
      return false;
    }
  };

  return {
    calendars,
    teamMembers,
    loading,
    fetchCalendars,
    createOrUpdateContact,
    createCalendar,
    updateCalendarStatus,
    updateCalendarPdf,
    updateCalendarResponsibles,
    updateCalendarAgencies,
    updateContact,
    addNote,
    getCalendarEdits,
    getCalendarById,
    deleteCalendar
  };
}
