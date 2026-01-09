import { KeywordEvolutionTable } from "@/types/report";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

interface KeywordEvolutionTableViewProps {
  table: KeywordEvolutionTable | null;
  canGenerate: boolean;
  missingFields: string[];
}

function getPositionColor(position: number): string {
  if (position <= 3) return "text-emerald-600 font-semibold";
  if (position <= 10) return "text-emerald-500";
  if (position <= 20) return "text-amber-600";
  return "text-muted-foreground";
}

function getVariationBadgeClass(variationText: string): string {
  if (variationText.includes("significativa")) return "bg-emerald-100 text-emerald-700";
  if (variationText.includes("notable")) return "bg-emerald-50 text-emerald-600";
  if (variationText.includes("moderada")) return "bg-amber-50 text-amber-700";
  if (variationText.includes("leve")) return "bg-amber-50 text-amber-600";
  if (variationText.includes("Estable")) return "bg-muted text-muted-foreground";
  if (variationText.includes("Retroceso")) return "bg-red-50 text-red-600";
  return "bg-muted text-muted-foreground";
}

export function KeywordEvolutionTableView({ table, canGenerate, missingFields }: KeywordEvolutionTableViewProps) {
  if (!canGenerate || !table) {
    return (
      <div className="p-6 bg-muted/50 border border-dashed border-border rounded-lg text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mb-2">Sin datos para generar tabla</p>
        <p className="text-xs text-muted-foreground">
          Completa los campos: <strong>{missingFields.join(", ")}</strong> en "Datos del Informe"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold min-w-[180px]">Palabra clave</TableHead>
              {table.months.map((month) => (
                <TableHead key={month} className="text-center font-medium min-w-[70px]">
                  {month}
                </TableHead>
              ))}
              <TableHead className="text-center font-semibold min-w-[180px]">Variación total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((row, idx) => (
              <TableRow key={idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <TableCell className="font-medium">{row.keyword}</TableCell>
                {row.valuesByMonth.map((value, monthIdx) => (
                  <TableCell key={monthIdx} className={`text-center ${getPositionColor(value)}`}>
                    {value}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${getVariationBadgeClass(row.variationText)}`}>
                    {row.variationText}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Nota/footnote eliminado para respetar plantilla fija */}
    </div>
  );
}
