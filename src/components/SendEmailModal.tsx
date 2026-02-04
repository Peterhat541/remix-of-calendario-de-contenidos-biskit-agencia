import { useState, useEffect } from 'react';
import { Mail, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarId: string;
  companyName: string;
  channel: string;
  period: string;
  contactEmail: string;
  contactName?: string;
  responsibleEmails: string[];
  shareLink?: string | null;
  onEmailSent?: () => void;
  performedBy?: string;
  agencies?: string[];
  /** If true, only show 'send_calendar' template without selector */
  sendCalendarOnly?: boolean;
}

type TemplateId = 'blank' | 'feedback' | 'reminder' | 'confirmation' | 'send_calendar';

interface TemplateConfig {
  label: string;
  subject?: string;
  body: string;
  requiresShareLink?: boolean;
}

const getAgencyTeamName = (): string => {
  return 'Equipo Biskit Agencia';
};

const getEmailTemplates = (contactName: string, shareLink: string): Record<TemplateId, TemplateConfig> => {
  const teamName = getAgencyTeamName();
  
  return {
    blank: {
      label: 'Sin plantilla',
      body: ''
    },
    feedback: {
      label: 'Solicitud de feedback',
      subject: 'Revisión pendiente: Calendario {empresa} – {canal} – {periodo}',
      body: `Hola,

Te escribimos para solicitarte feedback sobre el calendario de contenidos que hemos preparado.

Puedes revisar el calendario y dejarnos tus comentarios directamente en el enlace que te compartimos.

Quedamos atentos a tus comentarios.

Un saludo,
${teamName}`
    },
    reminder: {
      label: 'Recordatorio de revisión',
      subject: 'Recordatorio: Revisión calendario {empresa} – {canal}',
      body: `Hola,

Te recordamos que el calendario de contenidos está pendiente de tu revisión.

Por favor, cuando puedas, revisa el contenido y déjanos saber si tienes algún cambio o aprobación.

¡Gracias!

Un saludo,
${teamName}`
    },
    confirmation: {
      label: 'Confirmación de cambios',
      subject: 'Cambios aplicados: Calendario {empresa} – {canal}',
      body: `Hola,

Te confirmamos que hemos aplicado los cambios solicitados en el calendario de contenidos.

Puedes revisar la versión actualizada aquí:
${shareLink}

Si tienes alguna duda o necesitas más ajustes, no dudes en escribirnos.

Un saludo,
${teamName}`,
      requiresShareLink: true
    },
    send_calendar: {
      label: 'Enviar el calendario',
      subject: 'Calendario de publicaciones listo para revisar – {empresa}',
      body: `Hola${contactName ? ` ${contactName}` : ''},

Te adjuntamos el calendario con las publicaciones propuestas para este periodo.

El calendario es totalmente editable: puedes revisarlo con calma y, si quieres proponer cambios, solo tienes que escribir directamente qué habría que modificar y hacer clic en "Enviar feedback" desde el propio calendario.
En cuanto recibamos tu feedback, nos encargamos de aplicar los cambios y dejarlo actualizado.

Aquí puedes acceder al calendario:
${shareLink}

Muchas gracias.
Quedamos atentos a cualquier comentario y seguimos en contacto.

Un saludo,
${teamName}`,
      requiresShareLink: true
    }
  };
};

export const SendEmailModal = ({
  open,
  onOpenChange,
  calendarId,
  companyName,
  channel,
  period,
  contactEmail,
  contactName,
  responsibleEmails,
  shareLink,
  onEmailSent,
  performedBy,
  agencies,
  sendCalendarOnly = false
}: SendEmailModalProps) => {
  const templates = getEmailTemplates(contactName || '', shareLink || '');
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(sendCalendarOnly ? 'send_calendar' : 'blank');

  // Initialize with send_calendar template if sendCalendarOnly
  useEffect(() => {
    if (open && sendCalendarOnly && shareLink) {
      const template = templates['send_calendar'];
      setSelectedTemplate('send_calendar');
      if (template.subject) {
        setSubject(applyReplacements(template.subject));
      }
      setMessage(applyReplacements(template.body));
    } else if (open && !sendCalendarOnly) {
      setSubject(`Calendario ${companyName} – ${channel} – ${period}`);
      setMessage('');
      setSelectedTemplate('blank');
    }
  }, [open, sendCalendarOnly, shareLink]);

  const applyReplacements = (text: string) => {
    return text
      .replace(/{empresa}/g, companyName)
      .replace(/{canal}/g, channel)
      .replace(/{periodo}/g, period);
  };

  // Check if current template requires share link but doesn't have one
  const currentTemplateRequiresLink = templates[selectedTemplate]?.requiresShareLink && !shareLink;

  const handleTemplateChange = (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
    
    // Regenerate templates with current values to get fresh body
    const currentTemplates = getEmailTemplates(contactName || '', shareLink || '');
    const template = currentTemplates[templateId];
    
    if (template.subject) {
      setSubject(applyReplacements(template.subject));
    }
    setMessage(applyReplacements(template.body));
  };

  const handleSend = async () => {
    if (!contactEmail) {
      toast.error('El contacto no tiene email');
      return;
    }
    
    // Only require responsibles if not in sendCalendarOnly mode
    if (!sendCalendarOnly && responsibleEmails.length === 0) {
      toast.error('Debe haber al menos un responsable asignado');
      return;
    }
    
    if (!subject.trim()) {
      toast.error('El asunto es obligatorio');
      return;
    }
    
    if (!message.trim()) {
      toast.error('El mensaje es obligatorio');
      return;
    }

    setIsSending(true);
    try {
      const currentTemplate = templates[selectedTemplate];
      
      const { data, error } = await supabase.functions.invoke('send-calendar-email', {
        body: {
          calendarId,
          contactEmail,
          responsibleEmails,
          subject: subject.trim(),
          message: message.trim(),
          companyName,
          channel,
          period,
          // Include share link if using send_calendar template
          shareLink: selectedTemplate === 'send_calendar' ? shareLink : undefined,
          templateType: selectedTemplate,
          templateLabel: currentTemplate.label,
          performedBy: performedBy,
          agencies: agencies
        }
      });

      if (error) throw error;

      toast.success(selectedTemplate === 'send_calendar' 
        ? 'Calendario enviado correctamente' 
        : 'Email enviado correctamente'
      );
      onOpenChange(false);
      onEmailSent?.();
      
      // Reset form
      setMessage('');
      setSelectedTemplate('blank');
    } catch (err: any) {
      console.error('Error sending email:', err);
      toast.error(err.message || 'Error al enviar el email');
    } finally {
      setIsSending(false);
    }
  };

  // Can send if we have email, (responsibles OR sendCalendarOnly mode), and (template doesn't require link OR has link)
  const canSend = !!contactEmail && (sendCalendarOnly || responsibleEmails.length > 0) && !currentTemplateRequiresLink;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar email
          </DialogTitle>
          <DialogDescription>
            Envía un email relacionado con el calendario de {companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Fixed Recipient */}
          <div className="space-y-2">
            <Label>Para</Label>
            <div className="p-2 bg-muted rounded-md">
              <Badge variant="secondary">{contactEmail}</Badge>
            </div>
          </div>

          {/* Reply-to / CC info */}
          {responsibleEmails.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                De parte de (Reply-To{responsibleEmails.length > 1 ? ' / CC' : ''})
              </Label>
              <div className="flex flex-wrap gap-2">
                {responsibleEmails.map((email, idx) => (
                  <Badge key={email} variant="outline" className="text-xs">
                    {idx === 0 ? '↩️ ' : '📋 '}{email}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Template Selector - only show if not sendCalendarOnly */}
          {!sendCalendarOnly && (
            <div className="space-y-2">
              <Label>Plantilla rápida</Label>
              <Select value={selectedTemplate} onValueChange={(v) => handleTemplateChange(v as TemplateId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(templates).map(([id, template]) => (
                    <SelectItem key={id} value={id}>
                      {template.label}
                      {template.requiresShareLink && !shareLink && ' ⚠️'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Warning if template requires share link */}
          {currentTemplateRequiresLink && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Primero genera el enlace de compartir en la sección "Compartir con cliente" antes de usar esta plantilla.
              </AlertDescription>
            </Alert>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Asunto</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del email..."
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || !canSend}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
