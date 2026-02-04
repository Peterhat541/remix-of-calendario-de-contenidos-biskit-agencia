import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CalendarMonthSection from '@/components/CalendarMonthSection';
import CalendarPdfViewerModal from '@/components/CalendarPdfViewerModal';
import { 
  CalendarMonth,
  CalendarFormData, 
  CalendarMeta,
  AVAILABLE_CHANNELS, 
  DEFAULT_CHANNEL,
  generateMonthsArray
} from '@/types/contentCalendar';
import { generateCalendarPDF } from '@/utils/calendarPdfGenerator';

const CalendarioContenidos = () => {
  const navigate = useNavigate();
  const [months, setMonths] = useState<CalendarMonth[]>([]);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
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

  const handleGeneratePDF = async () => {
    if (getTotalPosts() === 0) {
      toast.error('No hay posts con fecha asignada para exportar');
      return;
    }

    setIsGeneratingPdf(true);
    toast.loading('Generando PDF...', { id: 'pdf-generation' });

    try {
      await generateCalendarPDF(calendarMeta, months, false);
      toast.success('PDF generado correctamente', { id: 'pdf-generation' });
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-biskit.png" alt="Biskit Agencia" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-foreground">Calendario de Contenidos</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/calendarios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ver calendarios
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Configuración
                </CardTitle>
                <CardDescription>
                  Define el rango de meses y canal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del cliente</Label>
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
                    <Label>Mes inicio</Label>
                    <Input
                      type="month"
                      value={formData.monthStart}
                      onChange={(e) => setFormData({ ...formData, monthStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mes fin</Label>
                    <Input
                      type="month"
                      value={formData.monthEnd}
                      onChange={(e) => setFormData({ ...formData, monthEnd: e.target.value })}
                    />
                  </div>
                </div>

                {months.length > 0 && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {months.length} {months.length === 1 ? 'mes' : 'meses'} · {getTotalPosts()} posts
                    </p>
                    
                    {/* PDF buttons only */}
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
                        className="w-full"
                        disabled={isGeneratingPdf}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {isGeneratingPdf ? 'Generando...' : 'Generar PDF'}
                      </Button>
                    </div>
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
    </div>
  );
};

export default CalendarioContenidos;
