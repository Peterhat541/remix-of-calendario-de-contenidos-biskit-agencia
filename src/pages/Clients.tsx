import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Copy, ArrowLeft, Check, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  name: string;
  workspace_id: string;
  created_at: string;
}

export default function Clients() {
  const { user, profile, roles, loading: authLoading, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const canEdit = hasRole(["admin", "manager"]);


  const fetchClients = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const handleAddClient = async () => {
    if (!newClientName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("clients")
      .insert({ 
        name: newClientName.trim(), 
        workspace_id: profile?.workspace_id || "default" 
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message.includes("row-level security")
          ? "No tienes permisos para añadir clientes"
          : "No se pudo crear el cliente",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cliente creado",
        description: `"${newClientName}" añadido correctamente`,
      });
      setNewClientName("");
      setDialogOpen(false);
      fetchClients();
    }
    setSaving(false);
  };

  const copyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast({
      title: "ID copiado",
      description: "ID del cliente copiado al portapapeles",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {profile?.name || user.email}
            </div>
            <Badge variant="secondary" className="capitalize">
              {roles[0] || "member"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Workspace: <span className="font-medium">{profile?.workspace_id}</span>
            {!canEdit && (
              <span className="ml-2 text-xs">(solo lectura)</span>
            )}
          </p>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Nombre del cliente</Label>
                    <Input
                      id="clientName"
                      placeholder="Ej: Acme Corp"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddClient()}
                    />
                  </div>
                  <Button
                    onClick={handleAddClient}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? "Guardando..." : "Guardar cliente"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Cargando clientes...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay clientes en este workspace
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="w-24 text-right">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      {format(new Date(client.created_at), "d MMM yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyId(client.id)}
                        className="gap-1"
                      >
                        {copiedId === client.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        Copiar ID
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
