import { useNavigate } from "react-router-dom";
import { Sparkles, FileText, Edit3, CheckCircle, XCircle, ArrowRight, Rocket } from "lucide-react";
const Home = () => {
  const navigate = useNavigate();
  const handleStartApp = () => {
    navigate("/informes");
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-10 w-auto" />
            <span className="text-lg font-semibold text-foreground">Justificaciones</span>
          </div>
          
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/10 via-transparent to-brand-teal/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center relative">
          <div className="flex justify-center mb-6">
            <img src="/logo-likearocket.png" alt="Like a Rocket" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Plataforma by Like a Rocket</h1>
          <p className="text-xl text-primary font-medium mb-6">Generador personalizado </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
        </p>
          <button onClick={handleStartApp} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl text-lg">Comenzar<Rocket className="w-5 h-5" />
            Genera tu informe
          </button>
        </div>
      </section>

      {/* What does this tool do */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            ¿Qué hace esta herramienta?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[{
            icon: <Sparkles className="w-6 h-6" />,
            title: "Interpreta capturas SEO",
            description: "Analiza capturas de SEMrush, PageSpeed y otras herramientas para extraer los datos automáticamente."
          }, {
            icon: <FileText className="w-6 h-6" />,
            title: "Extrae datos relevantes",
            description: "Lee la información visible en los recuadros resaltados y la convierte en datos estructurados."
          }, {
            icon: <CheckCircle className="w-6 h-6" />,
            title: "Genera el informe oficial",
            description: "Crea el documento siguiendo exactamente la estructura exigida por Kit Digital y Red.es."
          }, {
            icon: <Edit3 className="w-6 h-6" />,
            title: "Permite revisar y editar",
            description: "Puedes ajustar el texto final antes de descargar el PDF definitivo."
          }].map((feature, index) => <div key={index} className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center text-accent mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                
              </div>)}
          </div>
        </div>
      </section>

      {/* How it works - Step by step */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          
          
          
          <div className="space-y-6">
            {[{
            step: 1,
            title: "Sube las capturas",
            description: "Añade capturas de pantalla con los datos resaltados mediante recuadros. La herramienta leerá únicamente la información visible.",
            color: "bg-primary"
          }, {
            step: 2,
            title: "Extrae los datos",
            description: "Pulsa el botón ✨ para analizar todas las capturas a la vez y obtener los datos automáticamente.",
            color: "bg-primary"
          }, {
            step: 3,
            title: "Genera el informe",
            description: "La plataforma rellena el informe siguiendo la estructura oficial de Kit Digital.",
            color: "bg-primary"
          }, {
            step: 4,
            title: "Revisa y edita",
            description: "Ajusta el texto final si necesitas añadir información específica para ese caso.",
            color: "bg-primary"
          }, {
            step: 5,
            title: "Descarga el PDF",
            description: "Descarga el informe definitivo, listo para su justificación ante Red.es.",
            color: "bg-accent"
          }].map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className={`${item.color} text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0`}>
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you don't have to do */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">
            Lo que NO tienes que hacer
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Olvídate del trabajo manual
          </p>
          
          <div className="bg-card rounded-2xl border border-border p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              {["Rellenar campos manuales", "Copiar y pegar datos", "Redactar informes desde cero", "Adaptar textos uno a uno"].map((item, index) => <div key={index} className="flex items-center gap-3 text-muted-foreground">
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <span>{item}</span>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl border border-border p-10">
            
            
            <button onClick={handleStartApp} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl text-lg">Comenzar<ArrowRight className="w-5 h-5" />
            </button>
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
    </div>;
};
export default Home;