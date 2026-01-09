import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const publicPrefixes = ["/share", "/auth", "/login"];

export default function RouteGuard() {
  const location = useLocation();
  const { user, session, loading } = useAuth();

  const pathname = location.pathname || "/";
  const isPublic = publicPrefixes.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isPublic && !loading && !session) {
      console.log("REDIRECT LOGIN", {
        pathname,
        hasSession: !!session,
        hasUser: !!user,
        reason: "RouteGuard",
      });
    }
  }, [isPublic, loading, session, user, pathname]);

  // Hard bypass: never redirect public routes.
  if (isPublic) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: pathname }} />;
  }

  return <Outlet />;
}
