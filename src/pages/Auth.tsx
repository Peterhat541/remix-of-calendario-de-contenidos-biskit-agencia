import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Mínimo 6 caracteres");

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateInputs = () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({ title: "Error", description: emailResult.error.errors[0].message, variant: "destructive" });
      return false;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({ title: "Error", description: passwordResult.error.errors[0].message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const logActivity = async (userId: string, userEmail: string, action: string, details: Record<string, string> = {}) => {
    try {
      await supabase.from("user_activity_logs").insert([{
        user_id: userId,
        user_email: userEmail,
        action,
        details,
      }]);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const handleSignIn = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message === "Invalid login credentials" 
          ? "Credenciales incorrectas" 
          : error.message,
        variant: "destructive",
      });
    } else {
      // Log successful login
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        await logActivity(loggedUser.id, email, "login", { 
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent 
        });
      }
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Acceso Biskit</CardTitle>
          <CardDescription>Introduce tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Contraseña</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
            />
          </div>
          <Button onClick={handleSignIn} disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Acceso restringido. Contacta con el administrador si necesitas una cuenta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
