import { useState, useEffect } from 'react';
import {
  Sparkles,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  MapPin,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useContentProfile } from '@/hooks/useContentProfile';
import { CalendarContactWithAI, ContentProfile, TONE_STYLES, EMOJI_STYLES } from '@/types/contentProfile';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContactAISectionProps {
  contactId: string;
  onProfileUpdated?: () => void;
}

export function ContactAISection({ contactId, onProfileUpdated }: ContactAISectionProps) {
  const {
    profile,
    isAnalyzing,
    fetchProfile,
    fetchContactWithAI,
    updateContactAIFields,
    analyzeProfile,
  } = useContentProfile();

  const [contact, setContact] = useState<CalendarContactWithAI | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<Partial<CalendarContactWithAI>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [contactId]);

  const loadData = async () => {
    const [contactData, profileData] = await Promise.all([
      fetchContactWithAI(contactId),
      fetchProfile(contactId),
    ]);
    
    if (contactData) {
      setContact(contactData);
      setFormData({
        instagram_url: contactData.instagram_url || '',
        facebook_url: contactData.facebook_url || '',
        linkedin_url: contactData.linkedin_url || '',
        google_business_url: contactData.google_business_url || '',
        tone_style: contactData.tone_style || '',
        emoji_style: contactData.emoji_style || 'moderado',
        cta_style: contactData.cta_style || '',
        forbidden_words: contactData.forbidden_words || [],
        brand_notes: contactData.brand_notes || '',
      });
    }
  };

  const handleSave = async () => {
    if (!contact) return;
    setIsSaving(true);
    
    const success = await updateContactAIFields(contactId, formData);
    
    if (success) {
      await loadData();
      setIsEditing(false);
      onProfileUpdated?.();
    }
    setIsSaving(false);
  };

  const handleAnalyze = async () => {
    if (!contact) return;
    
    // First save any pending changes
    if (isEditing) {
      await handleSave();
    }
    
    // Merge current contact with form data
    const mergedContact = { ...contact, ...formData } as CalendarContactWithAI;
    await analyzeProfile(contactId, mergedContact);
    await loadData();
    onProfileUpdated?.();
  };

  const hasUrls = contact?.website || contact?.instagram_url || contact?.facebook_url || 
                  contact?.linkedin_url || contact?.google_business_url;

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 0.4) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Contenido / IA</CardTitle>
          </div>
          {profile && (
            <Badge 
              variant="secondary" 
              className={getConfidenceColor(profile.confidence_score)}
            >
              {Math.round(profile.confidence_score * 100)}% confianza
            </Badge>
          )}
        </div>
        <CardDescription>
          Configuración para generación automática de contenido
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* URLs Section */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            URLs de referencia
          </Label>
          
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={formData.instagram_url || ''}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/usuario"
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={formData.facebook_url || ''}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/pagina"
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={formData.linkedin_url || ''}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/company/empresa"
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={formData.google_business_url || ''}
                  onChange={(e) => setFormData({ ...formData, google_business_url: e.target.value })}
                  placeholder="https://g.page/negocio"
                  className="h-9"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {contact?.instagram_url && (
                <a href={contact.instagram_url} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 hover:bg-accent cursor-pointer">
                    <Instagram className="h-3 w-3" /> Instagram
                  </Badge>
                </a>
              )}
              {contact?.facebook_url && (
                <a href={contact.facebook_url} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 hover:bg-accent cursor-pointer">
                    <Facebook className="h-3 w-3" /> Facebook
                  </Badge>
                </a>
              )}
              {contact?.linkedin_url && (
                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 hover:bg-accent cursor-pointer">
                    <Linkedin className="h-3 w-3" /> LinkedIn
                  </Badge>
                </a>
              )}
              {contact?.google_business_url && (
                <a href={contact.google_business_url} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 hover:bg-accent cursor-pointer">
                    <MapPin className="h-3 w-3" /> Google
                  </Badge>
                </a>
              )}
              {!hasUrls && (
                <span className="text-sm text-muted-foreground italic">
                  Sin URLs configuradas
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tone & Style */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Tono</Label>
              <Select
                value={formData.tone_style || ''}
                onValueChange={(v) => setFormData({ ...formData, tone_style: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar tono" />
                </SelectTrigger>
                <SelectContent>
                  {TONE_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Emojis</Label>
              <Select
                value={formData.emoji_style || 'moderado'}
                onValueChange={(v) => setFormData({ ...formData, emoji_style: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMOJI_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="space-y-2">
            <Label className="text-xs">Notas de marca</Label>
            <Textarea
              value={formData.brand_notes || ''}
              onChange={(e) => setFormData({ ...formData, brand_notes: e.target.value })}
              placeholder="Información adicional sobre la marca, tono de voz, restricciones..."
              rows={3}
              className="text-sm"
            />
          </div>
        )}

        {/* Profile Summary (if exists) */}
        {profile && !isEditing && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Perfil IA generado
                  {profile.last_analyzed_at && (
                    <span className="text-muted-foreground">
                      ({format(new Date(profile.last_analyzed_at), "d MMM yyyy", { locale: es })})
                    </span>
                  )}
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              {profile.brand_summary && (
                <div>
                  <Label className="text-xs text-muted-foreground">Resumen de marca</Label>
                  <p className="text-sm mt-1">{profile.brand_summary}</p>
                </div>
              )}
              {profile.tone_guidelines?.primary_tone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Tono detectado</Label>
                  <p className="text-sm mt-1 capitalize">{profile.tone_guidelines.primary_tone}</p>
                </div>
              )}
              {profile.hashtags_base && profile.hashtags_base.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Hashtags base</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.hashtags_base.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* No profile yet */}
        {!profile && !isEditing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <AlertCircle className="h-4 w-4" />
            <span>Sin perfil IA. Añade URLs y analiza el perfil.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  loadData(); // Reset form
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Guardar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Editar URLs
              </Button>
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="gap-1"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : profile ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {profile ? 'Actualizar perfil' : 'Analizar perfil (IA)'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ContactAISection;
