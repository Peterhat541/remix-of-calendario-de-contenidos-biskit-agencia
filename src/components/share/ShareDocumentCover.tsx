import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ShareDocumentCoverProps {
  clientName: string;
  responsibles: string[];
  channel: string;
  monthStart: string;
  monthEnd: string;
}

const ShareDocumentCover = ({
  clientName,
  responsibles,
  channel,
  monthStart,
  monthEnd
}: ShareDocumentCoverProps) => {
  const formatPeriod = () => {
    const start = new Date(monthStart);
    const end = new Date(monthEnd);
    
    const startMonth = format(start, 'MMMM yyyy', { locale: es });
    const endMonth = format(end, 'MMMM yyyy', { locale: es });
    
    if (startMonth === endMonth) {
      return startMonth.charAt(0).toUpperCase() + startMonth.slice(1);
    }
    
    return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} - ${endMonth.charAt(0).toUpperCase() + endMonth.slice(1)}`;
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-border/50 overflow-hidden mb-12">
      {/* Header accent */}
      <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
      
      <div className="px-8 py-12 md:px-16 md:py-16">
        {/* Document title */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Documento de planificación
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
            Calendario de Contenidos
          </h1>
          <div className="w-24 h-0.5 bg-primary mx-auto mt-6" />
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-2xl mx-auto mb-12">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Cliente</p>
            <p className="text-lg font-medium text-foreground">{clientName}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Responsable</p>
            <p className="text-lg font-medium text-foreground">
              {responsibles.length > 0 ? responsibles.join(', ') : '—'}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Canal / Plataforma</p>
            <p className="text-lg font-medium text-foreground">{channel}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Periodo</p>
            <p className="text-lg font-medium text-foreground">{formatPeriod()}</p>
          </div>
        </div>

        {/* Introductory text */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="h-px bg-border mb-8" />
          <p className="text-muted-foreground leading-relaxed">
            Este documento presenta la planificación de contenidos para el periodo indicado. 
            Cada publicación incluye la fecha prevista, imagen de referencia, título y copy propuesto. 
            Puede revisar el contenido y añadir sus comentarios, propuestas de cambio o notas 
            en cada publicación.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ShareDocumentCover;
