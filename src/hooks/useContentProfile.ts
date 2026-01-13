import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentProfile, CalendarContactWithAI } from '@/types/contentProfile';
import { toast } from 'sonner';

export function useContentProfile() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<ContentProfile | null>(null);

  // Fetch content profile for a contact
  const fetchProfile = useCallback(async (contactId: string): Promise<ContentProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('content_profiles')
        .select('*')
        .eq('contact_id', contactId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching content profile:', error);
        return null;
      }

      if (data) {
        const vocabularyData = data.vocabulary as unknown;
        const defaultVocabulary = { recommended: [], forbidden: [] };
        
        const profileData: ContentProfile = {
          id: data.id,
          contact_id: data.contact_id,
          source_data: (data.source_data as unknown as ContentProfile['source_data']) || {},
          brand_summary: data.brand_summary,
          tone_guidelines: (data.tone_guidelines as unknown as ContentProfile['tone_guidelines']) || {},
          vocabulary: vocabularyData && typeof vocabularyData === 'object' 
            ? (vocabularyData as ContentProfile['vocabulary']) 
            : defaultVocabulary,
          hashtags_base: (data.hashtags_base as unknown as string[]) || [],
          visual_style: (data.visual_style as unknown as ContentProfile['visual_style']) || {},
          confidence_score: Number(data.confidence_score) || 0,
          last_analyzed_at: data.last_analyzed_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setProfile(profileData);
        return profileData;
      }

      return null;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  }, []);

  // Fetch contact with AI fields
  const fetchContactWithAI = useCallback(async (contactId: string): Promise<CalendarContactWithAI | null> => {
    try {
      const { data, error } = await supabase
        .from('calendar_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) {
        console.error('Error fetching contact:', error);
        return null;
      }

      return data as CalendarContactWithAI;
    } catch (err) {
      console.error('Error in fetchContactWithAI:', err);
      return null;
    }
  }, []);

  // Update contact AI fields (URLs, tone, etc.)
  const updateContactAIFields = useCallback(async (
    contactId: string,
    fields: Partial<CalendarContactWithAI>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('calendar_contacts')
        .update({
          instagram_url: fields.instagram_url,
          facebook_url: fields.facebook_url,
          linkedin_url: fields.linkedin_url,
          google_business_url: fields.google_business_url,
          tone_style: fields.tone_style,
          emoji_style: fields.emoji_style,
          cta_style: fields.cta_style,
          forbidden_words: fields.forbidden_words,
          brand_notes: fields.brand_notes,
        })
        .eq('id', contactId);

      if (error) {
        console.error('Error updating contact AI fields:', error);
        toast.error('Error al guardar los campos de IA');
        return false;
      }

      toast.success('Datos de IA actualizados');
      return true;
    } catch (err) {
      console.error('Error in updateContactAIFields:', err);
      toast.error('Error al actualizar los datos');
      return false;
    }
  }, []);

  // Analyze profile with AI (calls edge function)
  const analyzeProfile = useCallback(async (
    contactId: string,
    contactData: CalendarContactWithAI
  ): Promise<ContentProfile | null> => {
    setIsAnalyzing(true);
    toast.loading('Analizando perfil con IA...', { id: 'analyze-profile' });

    try {
      const { data, error } = await supabase.functions.invoke('analyze-content-profile', {
        body: {
          contactId,
          urls: {
            website: contactData.website,
            instagram: contactData.instagram_url,
            facebook: contactData.facebook_url,
            linkedin: contactData.linkedin_url,
            google_business: contactData.google_business_url,
          },
          existingData: {
            tone_style: contactData.tone_style,
            emoji_style: contactData.emoji_style,
            brand_notes: contactData.brand_notes,
          },
        },
      });

      if (error) {
        console.error('Error analyzing profile:', error);
        toast.error('Error al analizar el perfil', { id: 'analyze-profile' });
        return null;
      }

      toast.success('Perfil analizado correctamente', { id: 'analyze-profile' });
      
      // Refetch the profile
      const updatedProfile = await fetchProfile(contactId);
      return updatedProfile;
    } catch (err) {
      console.error('Error in analyzeProfile:', err);
      toast.error('Error al analizar el perfil', { id: 'analyze-profile' });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [fetchProfile]);

  return {
    profile,
    isAnalyzing,
    fetchProfile,
    fetchContactWithAI,
    updateContactAIFields,
    analyzeProfile,
  };
}
