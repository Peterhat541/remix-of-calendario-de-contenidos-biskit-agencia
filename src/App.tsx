import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import RouteGuard from "@/components/routing/RouteGuard";
import Home from "./pages/Home";
import AppGenerator from "./pages/AppGenerator";
import InformesHome from "./pages/InformesHome";
import JustificacionesHome from "./pages/JustificacionesHome";
import CalendarioHome from "./pages/CalendarioHome";
import InformePlaceholder from "./pages/InformePlaceholder";
import InformeRedesSociales from "./pages/InformeRedesSociales";
import InformeCompetencia from "./pages/InformeCompetencia";
import InformeSeguimiento from "./pages/InformeSeguimiento";
import InformeEcommerce from "./pages/InformeEcommerce";
import CalendarioContenidos from "./pages/CalendarioContenidos";
import CalendariosCrm from "./pages/CalendariosCrm";
import CalendarioDetalle from "./pages/CalendarioDetalle";
import CalendarioNuevo from "./pages/CalendarioNuevo";
import CalendarioEditar from "./pages/CalendarioEditar";
import ShareCalendar from "./pages/ShareCalendar";
import Clients from "./pages/Clients";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import InformesSeoLista from "./pages/InformesSeoLista";
import InformeSeoDetalle from "./pages/InformeSeoDetalle";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes (no auth, works in incognito) */}
              <Route path="/share/:token" element={<ShareCalendar />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />

              {/* Protected app routes */}
              <Route element={<RouteGuard />}>
                {/* Home principal */}
                <Route path="/" element={<Home />} />
                
                {/* Selección de tipo de informe */}
                <Route path="/informes" element={<InformesHome />} />
                
                {/* Home de Justificaciones (SEO y RRSS) */}
                <Route path="/justificaciones" element={<JustificacionesHome />} />
                
                {/* Generadores de justificación específicos */}
                <Route path="/informes/seo-solucion-web" element={<AppGenerator />} />
                <Route path="/informes/seo-lista" element={<InformesSeoLista />} />
                <Route path="/informes/seo/:id" element={<InformeSeoDetalle />} />
                <Route path="/informes/redes-sociales" element={<InformeRedesSociales />} />
                <Route path="/informes/competencia-mensual" element={<InformeCompetencia />} />
                
                {/* Home de Calendario (herramienta, no justificación) */}
                <Route path="/calendario" element={<CalendarioHome />} />
                
                {/* Rutas de calendario existentes */}
                <Route path="/calendario-contenidos" element={<CalendarioContenidos />} />
                <Route path="/calendario-contenidos/nuevo" element={<CalendarioNuevo />} />
                <Route path="/calendarios" element={<CalendariosCrm />} />
                <Route path="/calendarios/:id" element={<CalendarioDetalle />} />
                <Route path="/calendarios/:id/editar" element={<CalendarioEditar />} />
                
                {/* Otros */}                
                <Route path="/app" element={<AppGenerator />} />
                <Route path="/clients" element={<Clients />} />
                
                {/* Placeholders para informes próximamente */}
                <Route path="/informes/plan-social-media" element={<InformePlaceholder />} />
                <Route path="/informes/seguimiento" element={<InformeSeguimiento />} />
                <Route path="/informes/ecommerce" element={<InformeEcommerce />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;