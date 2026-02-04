import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Shield, Users, Activity, Loader2 } from "lucide-react";

type AppRole = "admin" | "manager" | "member";

interface UserWithRole {
  id: string;
  email: string;
  name: string | null;
  roles: AppRole[];
  created_at: string;
}

interface ActivityLog {
  id: string;
  user_email: string;
  action: string;
  details: unknown;
  created_at: string;
}

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const { hasRole, loading: authLoading } = useAuth();
  const { logActivity } = useActivityLog();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // New user dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("member");
  const [creating, setCreating] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!authLoading && !hasRole("admin")) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden acceder a esta página",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [authLoading, hasRole, navigate, toast]);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, created_at");

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // We need to get emails - since we can't query auth.users directly,
      // we'll use the activity logs or store email in profiles
      // For now, we'll just show what we have from profiles
      
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRoles = (rolesData || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role as AppRole);

        return {
          id: profile.id,
          email: "—", // Email not stored in profiles
          name: profile.name,
          roles: userRoles,
          created_at: profile.created_at || "",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error loading logs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los logs",
        variant: "destructive",
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      toast({
        title: "Error",
        description: "Email y contraseña son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: { name: newName },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Assign role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: authData.user.id, role: newRole });

        if (roleError) {
          console.error("Error assigning role:", roleError);
        }

        // Log the action
        await logActivity("user_created", {
          created_user_email: newEmail,
          assigned_role: newRole,
        });

        toast({
          title: "Usuario creado",
          description: `Se ha creado el usuario ${newEmail} con rol ${newRole}`,
        });

        // Reset form and reload
        setNewEmail("");
        setNewPassword("");
        setNewName("");
        setNewRole("member");
        setDialogOpen(false);
        loadUsers();
      }
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error al crear usuario",
        description: message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      // Remove existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Add new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      await logActivity("role_changed", {
        target_user_id: userId,
        new_role: newRole,
      });

      toast({
        title: "Rol actualizado",
        description: `El rol ha sido cambiado a ${newRole}`,
      });

      loadUsers();
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el rol",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Administración de Usuarios
              </h1>
              <p className="text-muted-foreground">
                Gestiona usuarios, roles y revisa la actividad del sistema
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Introduce los datos del nuevo usuario. Recibirá un email de confirmación.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Nombre</Label>
                  <Input
                    id="new-name"
                    placeholder="Nombre completo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">Rol</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={creating}>
                  {creating ? "Creando..." : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" onValueChange={(v) => v === "logs" && loadLogs()}>
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Registro de Actividad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios del Sistema</CardTitle>
                <CardDescription>
                  Lista de todos los usuarios registrados y sus roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay usuarios registrados
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Creado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name || "Sin nombre"}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant={getRoleBadgeVariant(role)}
                                  className="mr-1"
                                >
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">Sin rol</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.roles[0] || "member"}
                              onValueChange={(v) => handleRoleChange(user.id, v as AppRole)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Actividad</CardTitle>
                <CardDescription>
                  Últimas 100 acciones realizadas en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay actividad registrada
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.user_email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {JSON.stringify(log.details)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
