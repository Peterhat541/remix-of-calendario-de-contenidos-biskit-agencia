import { useNavigate } from "react-router-dom";
import { FileText, Share2, Calendar, Users, TrendingUp, ShoppingCart, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const informes = [
  {
    id: "seo-solucion-web",
    title: "Informe SEO de solución web",
    description: "Genera informes de justificación SEO para Kit Digital Fase II",
    icon: FileText,
    ready: true,
    type: "justificacion",
  },
  {
    id: "redes-sociales",
    title: "Informe de redes sociales",
    description: "Análisis y métricas de rendimiento en redes sociales",
    icon: Share2,
    ready: true,
    type: "justificacion",
  },
  {
    id: "calendario-contenidos",
    title: "Calendario de contenidos",
    description: "Herramienta de planificación editorial con vista previa y exportación PDF",
    icon: Calendar,
    ready: true,
    type: "herramienta",
  },
  {
    id: "plan-social-media",
    title: "Informe de plan social media",
    description: "Planificación estratégica de contenidos en redes",
    icon: Calendar,
    ready: false,
    type: "justificacion",
  },
  {
    id: "competencia-mensual",
    title: "Informe mensual de la competencia",
    description: "Análisis comparativo de competidores (Presencia Avanzada - Fase II)",
    icon: Users,
    ready: true,
    type: "justificacion",
  },
  {
    id: "seguimiento",
    title: "Informe de seguimiento",
    description: "Seguimiento periódico de métricas SEO On-Page (Presencia Avanzada - Fase II)",
    icon: TrendingUp,
    ready: true,
    type: "justificacion",
  },
  {
    id: "ecommerce",
    title: "Informe de e-commerce",
    description: "Informe trimestral de seguimiento del posicionamiento SEO",
    icon: ShoppingCart,
    ready: true,
    type: "justificacion",
  },
];

const InformesHome = () => {
  const navigate = useNavigate();

  const handleCardClick = (informe: typeof informes[0]) => {
    if (!informe.ready) {
      navigate(`/informes/${informe.id}`);
      return;
    }

    if (informe.type === "herramienta") {
      // Calendario va a su home propia
      navigate("/calendario");
    } else {
      // Navegar directamente a la página del informe
      navigate(`/informes/${informe.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-likearocket.png"
              alt="Like a Rocket"
              className="h-8 w-auto"
            />
            <span className="text-lg font-semibold text-foreground">
              Justificaciones
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Selecciona el tipo de informe
            </h1>
            <p className="text-muted-foreground">
              Elige qué informe necesitas generar para tu cliente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {informes.map((informe) => {
              const Icon = informe.icon;
              return (
                <Card
                  key={informe.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                    !informe.ready ? "opacity-60" : ""
                  }`}
                  onClick={() => handleCardClick(informe)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${informe.ready ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${informe.ready ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!informe.ready && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                            Próximamente
                          </span>
                        )}
                        {informe.ready && informe.type === "justificacion" && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Justificación
                          </span>
                        )}
                        {informe.ready && informe.type === "herramienta" && (
                          <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                            Herramienta
                          </span>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-3">{informe.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{informe.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InformesHome;
