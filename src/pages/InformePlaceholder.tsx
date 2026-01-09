import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

const titulos: Record<string, string> = {
  "redes-sociales": "Informe de redes sociales",
  "plan-social-media": "Informe de plan social media",
  "competencia-mensual": "Informe mensual de la competencia",
  "seguimiento": "Informe de seguimiento",
  "ecommerce": "Informe de e-commerce",
};

const InformePlaceholder = () => {
  const navigate = useNavigate();
  const { tipo } = useParams<{ tipo: string }>();
  const titulo = tipo ? titulos[tipo] || "Informe" : "Informe";

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
          <Button variant="ghost" size="sm" onClick={() => navigate("/informes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a informes
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <Construction className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {titulo}
          </h1>
          <p className="text-muted-foreground mb-8">
            Este informe estará disponible próximamente. Estamos trabajando en su desarrollo.
          </p>
          <Button onClick={() => navigate("/informes")}>
            Volver a la selección de informes
          </Button>
        </div>
      </main>
    </div>
  );
};

export default InformePlaceholder;
