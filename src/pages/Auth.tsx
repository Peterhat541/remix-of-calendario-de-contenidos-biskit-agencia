import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Mínimo 6 caracteres");

// ⚠️ TEMPORAL: Cambiar a false después de crear la cuenta de Sandra
const ALLOW_REGISTRATION = true;

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
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
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        await logActivity(loggedUser.id, email, "login", { 
          timestamp: new Date().toISOString(),
        });
      }
      navigate("/");
    }
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) {
      const message = error.message.includes("already registered")
        ? "Este email ya está registrado"
        : error.message;
      toast({ title: "Error al registrarse", description: message, variant: "destructive" });
    } else {
      toast({
        title: "Cuenta creada",
        description: "Ya puedes iniciar sesión con tus credenciales.",
      });
    }
  };

  // Solo login (sin registro)
  if (!ALLOW_REGISTRATION) {
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

  // Con registro habilitado (temporal)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Acceso Biskit</CardTitle>
          <CardDescription>Inicia sesión o crea una cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 mt-4">
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
            </TabsContent>
            <TabsContent value="register" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nombre</Label>
                <Input
                  id="reg-name"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Contraseña</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
              </div>
              <Button onClick={handleSignUp} disabled={loading} className="w-full">
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
