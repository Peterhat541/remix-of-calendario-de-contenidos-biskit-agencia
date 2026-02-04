import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import RouteGuard from "@/components/routing/RouteGuard";
import CalendarioHome from "./pages/CalendarioHome";
import CalendarioContenidos from "./pages/CalendarioContenidos";
import CalendariosCrm from "./pages/CalendariosCrm";
import CalendarioDetalle from "./pages/CalendarioDetalle";
import CalendarioNuevo from "./pages/CalendarioNuevo";
import CalendarioEditar from "./pages/CalendarioEditar";
import ShareCalendar from "./pages/ShareCalendar";
import Clients from "./pages/Clients";
import Auth from "./pages/Auth";
import AdminUsuarios from "./pages/AdminUsuarios";
import NotFound from "./pages/NotFound";

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
              {/* Public routes */}
              <Route path="/share/:token" element={<ShareCalendar />} />
              <Route path="/c/:slug" element={<ShareCalendar />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />

              {/* Protected app routes */}
              <Route element={<RouteGuard />}>
                {/* Home - Calendario */}
                <Route path="/" element={<CalendarioHome />} />
                
                {/* Rutas de calendario */}
                <Route path="/calendario" element={<CalendarioHome />} />
                <Route path="/calendario-contenidos" element={<CalendarioContenidos />} />
                <Route path="/calendario-contenidos/nuevo" element={<CalendarioNuevo />} />
                <Route path="/calendarios" element={<CalendariosCrm />} />
                <Route path="/calendarios/:id" element={<CalendarioDetalle />} />
                <Route path="/calendarios/:id/editar" element={<CalendarioEditar />} />
                
                {/* Gestión de clientes */}
                <Route path="/clients" element={<Clients />} />
                
                {/* Panel de administración */}
                <Route path="/admin/usuarios" element={<AdminUsuarios />} />
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
