import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Rocket, FileCheck, Shield, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const JustificacionesHome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo") || "seo-solucion-web";

  const handleCrearJustificacion = () => {
    if (tipo === "redes-sociales") {
      navigate("/informes/redes-sociales");
    } else {
      navigate("/informes/seo-solucion-web");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-10 w-auto" />
            <span className="text-lg font-semibold text-foreground">Justificaciones</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/informes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a informes
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/10 via-transparent to-brand-teal/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center relative">
          <div className="flex justify-center mb-6">
            <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Justificaciones Like a Rocket
          </h1>
          <p className="text-xl text-primary font-medium mb-6">
            Generador automático de informes Kit Digital – Fase II
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Genera informes de justificación a partir de capturas de pantalla, 
            cumpliendo el modelo oficial exigido por Red.es para las evidencias de tu proyecto Kit Digital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleCrearJustificacion}
              size="lg"
              className="inline-flex items-center gap-2 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <Rocket className="w-5 h-5" />
              Crear nueva justificación
            </Button>
            <Button
              onClick={() => navigate("/informes/seo-lista")}
              variant="outline"
              size="lg"
              className="inline-flex items-center gap-2 px-8 py-6 text-lg font-semibold"
            >
              <FileCheck className="w-5 h-5" />
              Ver informes
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            ¿Por qué usar esta herramienta?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <FileCheck className="w-6 h-6" />,
                title: "Modelo oficial Red.es",
                description: "Genera informes siguiendo exactamente la estructura exigida por Kit Digital."
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Evidencias válidas",
                description: "Incluye capturas de pantalla como pruebas verificables del trabajo realizado."
              },
              {
                icon: <ClipboardCheck className="w-6 h-6" />,
                title: "Cumplimiento garantizado",
                description: "Asegura que tu justificación cumple todos los requisitos de la Fase II."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow text-center"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {tipo === "redes-sociales" 
                ? "Informe de Redes Sociales" 
                : "Informe SEO de Solución Web"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {tipo === "redes-sociales"
                ? "Genera el informe de justificación para las acciones realizadas en redes sociales dentro del programa Kit Digital."
                : "Genera el informe de justificación SEO para tu solución web dentro del programa Kit Digital Fase II."}
            </p>
            <Button
              onClick={handleCrearJustificacion}
              variant="outline"
              size="lg"
            >
              Comenzar ahora
            </Button>
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
            Herramienta interna para justificaciones Kit Digital
          </p>
        </div>
      </footer>
    </div>
  );
};

export default JustificacionesHome;
