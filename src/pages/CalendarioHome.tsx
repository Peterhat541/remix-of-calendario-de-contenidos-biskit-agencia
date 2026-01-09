import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Eye, FileDown, Palette, Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

const CalendarioHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-10 w-auto" />
            <span className="text-lg font-semibold text-foreground">Calendario</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/informes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a informes
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center relative">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-accent/20 rounded-2xl flex items-center justify-center">
              <Calendar className="w-10 h-10 text-accent" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Calendario de contenidos
          </h1>
          <p className="text-xl text-accent font-medium mb-6">
            Planifica, edita y exporta tu calendario editorial
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Organiza las publicaciones de tus clientes mes a mes, visualiza el contenido 
            de forma clara y genera PDFs profesionales listos para compartir.
          </p>
          
          {/* Two CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
            {/* Like a Rocket Button */}
            <Button
              onClick={() => navigate("/calendario-contenidos/nuevo?agency=likearocket")}
              size="lg"
              className="w-full sm:w-auto inline-flex items-center gap-2 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Rocket className="w-5 h-5" />
              Calendario Like a Rocket
            </Button>
            
            {/* Biskit Button - Black with yellow text, editorial style */}
            <Button
              onClick={() => navigate("/calendario-contenidos/nuevo?agency=biskit")}
              size="lg"
              className="w-full sm:w-auto inline-flex items-center gap-2 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl bg-biskit-bg hover:bg-biskit-bg/90 text-biskit-yellow border-2 border-biskit-yellow/20 hover:border-biskit-yellow/40"
            >
              <Sparkles className="w-5 h-5" />
              Calendario Biskit
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            ¿Qué puedes hacer?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Palette className="w-6 h-6" />,
                title: "Organiza contenidos",
                description: "Estructura las publicaciones por mes y canal, con copys e imágenes asociadas."
              },
              {
                icon: <Eye className="w-6 h-6" />,
                title: "Vista previa clara",
                description: "Visualiza el calendario completo antes de exportar o compartir con el cliente."
              },
              {
                icon: <FileDown className="w-6 h-6" />,
                title: "Exporta en PDF",
                description: "Genera documentos profesionales listos para presentar o archivar."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow text-center"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent mb-4 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-gradient-to-br from-accent/10 to-primary/5 rounded-2xl border border-border p-10 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Empieza a planificar
            </h3>
            <p className="text-muted-foreground mb-8">
              Crea calendarios editoriales profesionales en minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/calendarios")}
                size="lg"
                className="bg-accent hover:bg-accent/90"
              >
                Ver calendarios existentes
              </Button>
              <Button
                onClick={() => navigate("/calendario-contenidos/nuevo")}
                size="lg"
                variant="outline"
              >
                Crear nuevo calendario
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-6 w-auto" />
            <span className="text-sm text-muted-foreground">Like a Rocket © {new Date().getFullYear()}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Herramienta de planificación editorial
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CalendarioHome;