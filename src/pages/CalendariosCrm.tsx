import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, FileText, Search, Trash2, Building2, ArrowLeft, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useAuth } from "@/hooks/useAuth";
import { useCalendarCrm } from "@/hooks/useCalendarCrm";
import type { CalendarStatus, ContentCalendar, Agency, CALENDAR_STATUSES } from "@/types/calendarCrm";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const ALL_STATUSES: CalendarStatus[] = [
  "Pendiente de enviar",
  "Pendiente de aprobación",
  "Editado",
  "Aprobado",
  "Calendario publicado"
];

const statusChipClass = (status: CalendarStatus) => {
  switch (status) {
    case "Pendiente de enviar":
      return "bg-[hsl(45_93%_94%)] text-[hsl(45_92%_35%)] dark:bg-[hsl(45_45%_18%)] dark:text-[hsl(45_85%_75%)]";
    case "Pendiente de aprobación":
      return "bg-[hsl(214_100%_96%)] text-[hsl(221_83%_53%)] dark:bg-[hsl(221_45%_20%)] dark:text-[hsl(214_95%_80%)]";
    case "Editado":
      return "bg-[hsl(0_84%_95%)] text-[hsl(0_72%_51%)] dark:bg-[hsl(0_45%_20%)] dark:text-[hsl(0_70%_80%)]";
    case "Aprobado":
      return "bg-[hsl(141_60%_95%)] text-[hsl(142_71%_35%)] dark:bg-[hsl(142_35%_18%)] dark:text-[hsl(141_70%_80%)]";
    case "Calendario publicado":
      return "bg-[hsl(220_9%_93%)] text-[hsl(220_9%_40%)] dark:bg-[hsl(220_10%_25%)] dark:text-[hsl(220_9%_80%)]";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatShortDate = (iso: string) => format(parseISO(iso), "d MMM yyyy", { locale: es });

const formatPeriod = (start: string, end: string) => {
  const startMonth = format(parseISO(start), "MMM yyyy", { locale: es });
  const endMonth = format(parseISO(end), "MMM yyyy", { locale: es });
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  return startMonth === endMonth ? cap(startMonth) : `${cap(startMonth)} – ${cap(endMonth)}`;
};

type AgencyFilter = 'all' | Agency;
type ViewMode = 'grid' | 'list';

export default function CalendariosCrm() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { calendars, loading, deleteCalendar } = useCalendarCrm();

  const [query, setQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState<AgencyFilter>(
    (searchParams.get('agency') as AgencyFilter) || 'all'
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'grid'
  );
  const [statusFilter, setStatusFilter] = useState<CalendarStatus | 'all'>(
    (searchParams.get('status') as CalendarStatus | 'all') || 'all'
  );

  useEffect(() => {
    document.title = "Calendarios de Mi Workspace";
  }, []);

  const handleAgencyChange = (value: string) => {
    const agency = value as AgencyFilter;
    setAgencyFilter(agency);
    if (agency === 'all') {
      searchParams.delete('agency');
    } else {
      searchParams.set('agency', agency);
    }
    setSearchParams(searchParams);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    searchParams.set('view', mode);
    setSearchParams(searchParams);
  };

  const handleStatusFilterChange = (value: string) => {
    const status = value as CalendarStatus | 'all';
    setStatusFilter(status);
    if (status === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const filtered = useMemo(() => {
    let result = calendars;

    // Filter by agency
    if (agencyFilter !== 'all') {
      result = result.filter(c => c.agencies?.includes(agencyFilter));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Filter by search query
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((c) => {
        const company = c.calendar_contact?.company_name?.toLowerCase() ?? "";
        const channel = (c.channel ?? "").toLowerCase();
        const responsibles = c.responsibles?.map(r => r.email.toLowerCase()).join(" ") ?? "";
        return company.includes(q) || channel.includes(q) || responsibles.includes(q);
      });
    }

    return result;
  }, [calendars, query, agencyFilter, statusFilter]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <div className={viewMode === 'list' ? "max-w-6xl mx-auto" : "max-w-5xl mx-auto"}>
          {/* Header */}
          <header className="flex items-start justify-between gap-6 mb-10">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Calendarios de Mi Workspace
              </h1>
              <p className="mt-2 text-muted-foreground">
                Gestiona calendarios de contenidos con tu equipo
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={() => navigate("/calendario-contenidos/nuevo")}
                className="h-10 rounded-lg px-4 shadow-sm hover:shadow-md"
              >
                + Nuevo calendario
              </Button>
            </div>
          </header>

          {/* Filters row */}
          <section className="mb-6 flex flex-wrap items-center gap-4">
            {/* Agency Tabs */}
            <Tabs value={agencyFilter} onValueChange={handleAgencyChange}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Todos
                </TabsTrigger>
                <TabsTrigger 
                  value="likearocket" 
                  className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  Like a Rocket
                </TabsTrigger>
                <TabsTrigger 
                  value="biskit"
                  className="flex items-center gap-2 data-[state=active]:bg-biskit-bg data-[state=active]:text-biskit-yellow"
                >
                  Biskit
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/50 ml-auto">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* Search + Status filter */}
          <section aria-label="Buscar calendarios" className="mb-6 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por cliente, canal o responsable..."
                className="h-12 pl-12 rounded-xl bg-card shadow-sm w-full"
              />
            </div>
            {viewMode === 'list' && (
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[220px] h-12 rounded-xl bg-card shadow-sm">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {ALL_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </section>

          {/* Content */}
          <section aria-label="Listado de calendarios">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
                  <Calendar className="h-7 w-7 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Sin calendarios
                </h2>
                <p className="text-muted-foreground mb-6">
                  {agencyFilter !== 'all' 
                    ? `No hay calendarios de ${agencyFilter === 'likearocket' ? 'Like a Rocket' : 'Biskit'}`
                    : statusFilter !== 'all'
                    ? `No hay calendarios con estado "${statusFilter}"`
                    : 'Crea tu primer calendario para empezar'
                  }
                </p>
                <Button
                  onClick={() => navigate(`/calendario-contenidos/nuevo${agencyFilter !== 'all' ? `?agency=${agencyFilter}` : ''}`)}
                  className="h-10 rounded-lg px-4 shadow-sm hover:shadow-md"
                >
                  Nuevo calendario
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((calendar) => (
                  <CalendarCard
                    key={calendar.id}
                    calendar={calendar}
                    onOpen={() => navigate(`/calendarios/${calendar.id}`)}
                    onDelete={() => deleteCalendar(calendar.id)}
                  />
                ))}
              </div>
            ) : (
              <CalendarListView 
                calendars={filtered} 
                onOpen={(id) => navigate(`/calendarios/${id}`)}
                onDelete={deleteCalendar}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

type SortColumn = 'client' | 'channel' | 'period' | 'status' | 'updated';
type SortDirection = 'asc' | 'desc';

function CalendarListView({
  calendars,
  onOpen,
  onDelete,
}: {
  calendars: ContentCalendar[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedCalendars = useMemo(() => {
    const sorted = [...calendars].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'client':
          const clientA = a.calendar_contact?.company_name?.toLowerCase() ?? '';
          const clientB = b.calendar_contact?.company_name?.toLowerCase() ?? '';
          comparison = clientA.localeCompare(clientB);
          break;
        case 'channel':
          comparison = (a.channel ?? '').localeCompare(b.channel ?? '');
          break;
        case 'period':
          comparison = (a.month_start ?? '').localeCompare(b.month_start ?? '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'updated':
          const dateA = a.updated_at || a.created_at || '';
          const dateB = b.updated_at || b.created_at || '';
          comparison = dateA.localeCompare(dateB);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [calendars, sortColumn, sortDirection]);

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[200px] cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('client')}
            >
              <div className="flex items-center">
                Cliente
                <SortIcon column="client" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('channel')}
            >
              <div className="flex items-center">
                Canal
                <SortIcon column="channel" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('period')}
            >
              <div className="flex items-center">
                Periodo
                <SortIcon column="period" />
              </div>
            </TableHead>
            <TableHead>Responsables</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Estado
                <SortIcon column="status" />
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('updated')}
            >
              <div className="flex items-center justify-end">
                Actualizado
                <SortIcon column="updated" />
              </div>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCalendars.map((calendar) => {
            const companyName = calendar.calendar_contact?.company_name ?? "Sin nombre";
            const period = calendar.month_start && calendar.month_end 
              ? formatPeriod(calendar.month_start, calendar.month_end) 
              : "—";
            const dateIso = calendar.updated_at || calendar.created_at;
            const dateLabel = dateIso ? formatShortDate(dateIso) : "";
            const agencies = calendar.agencies || ['likearocket'];

            return (
              <TableRow 
                key={calendar.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onOpen(calendar.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {agencies.map(agency => (
                        <Badge 
                          key={agency} 
                          variant="outline" 
                          className={`text-[9px] px-1 py-0 ${
                            agency === 'biskit' 
                              ? 'bg-biskit-bg/80 text-biskit-yellow border-biskit-yellow/30' 
                              : 'bg-accent/10 text-accent border-accent/30'
                          }`}
                        >
                          {agency === 'likearocket' ? 'LAR' : 'BSK'}
                        </Badge>
                      ))}
                    </div>
                    <span className="truncate max-w-[150px]">{companyName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{calendar.channel || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{period}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {calendar.responsibles?.slice(0, 2).map((r) => (
                      <Badge key={r.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {r.email.split('@')[0]}
                      </Badge>
                    ))}
                    {(calendar.responsibles?.length ?? 0) > 2 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        +{(calendar.responsibles?.length ?? 0) - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${statusChipClass(
                      calendar.status,
                    )}`}
                  >
                    {calendar.status}
                    {calendar.pdf_url && (
                      <FileText className="h-3 w-3 opacity-60" />
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {dateLabel}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar calendario?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminarán permanentemente el calendario 
                          "{companyName}" y todos sus datos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(calendar.id)}
                          disabled={deletingId === calendar.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingId === calendar.id ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function CalendarCard({
  calendar,
  onOpen,
  onDelete,
}: {
  calendar: ContentCalendar;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const companyName = calendar.calendar_contact?.company_name ?? "Sin nombre";

  const hasDescription = Boolean(calendar.channel && calendar.month_start && calendar.month_end);
  const description = hasDescription
    ? `${calendar.channel} · ${formatPeriod(calendar.month_start, calendar.month_end)}`
    : "Sin descripción";

  const dateIso = calendar.updated_at || calendar.created_at;
  const dateLabel = dateIso ? formatShortDate(dateIso) : "";

  const responsibles = calendar.responsibles ?? [];
  const visibleResp = responsibles.slice(0, 2);
  const agencies = calendar.agencies || ['likearocket'];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <Card
      onClick={onOpen}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      className="cursor-pointer rounded-2xl border border-border shadow-sm transition-all hover:shadow-lg hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring relative group"
    >
      <CardContent className="p-6 flex flex-col h-full">
        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
              aria-label="Eliminar calendario"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar calendario?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminarán permanentemente el calendario 
                "{companyName}" y todos sus datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Agency badges */}
        <div className="flex gap-1 mb-2">
          {agencies.map(agency => (
            <Badge 
              key={agency} 
              variant="outline" 
              className={`text-[10px] px-1.5 py-0 ${
                agency === 'biskit' 
                  ? 'bg-biskit-bg/80 text-biskit-yellow border-biskit-yellow/30' 
                  : 'bg-accent/10 text-accent border-accent/30'
              }`}
            >
              {agency === 'likearocket' ? 'LAR' : 'BSK'}
            </Badge>
          ))}
        </div>

        {/* Title + description */}
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-foreground leading-snug line-clamp-2 pr-8">
            {companyName}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          {visibleResp.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {visibleResp.map((r) => (
                <Badge key={r.id} variant="secondary" className="text-xs rounded-full">
                  {r.email}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full ${statusChipClass(
                calendar.status,
              )}`}
            >
              {calendar.status}
              {calendar.pdf_url && (
                <FileText className="h-3.5 w-3.5 opacity-60" aria-label="PDF disponible" />
              )}
            </span>
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap">{dateLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}