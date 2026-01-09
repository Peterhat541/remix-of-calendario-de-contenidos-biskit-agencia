import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertTriangle } from "lucide-react";

export interface ManualMetricsData {
  profileInteractions: number | null;
  calls: number | null;
  directionsRequests: number | null;
  websiteClicks: number | null;
}

interface ManualMetricsFormProps {
  onSubmit: (data: ManualMetricsData) => void;
  onCancel?: () => void;
  initialData?: Partial<ManualMetricsData>;
}

export function ManualMetricsForm({ onSubmit, onCancel, initialData }: ManualMetricsFormProps) {
  const [formData, setFormData] = useState<ManualMetricsData>({
    profileInteractions: initialData?.profileInteractions ?? null,
    calls: initialData?.calls ?? null,
    directionsRequests: initialData?.directionsRequests ?? null,
    websiteClicks: initialData?.websiteClicks ?? null,
  });

  const handleChange = (field: keyof ManualMetricsData, value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    setFormData(prev => ({
      ...prev,
      [field]: isNaN(numValue as number) ? null : numValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const hasAnyValue = Object.values(formData).some(v => v !== null && v !== undefined);

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-medium text-amber-800">Introducir métricas manualmente</h4>
          <p className="text-sm text-amber-700">
            La extracción automática no pudo completarse. Introduce los datos de las capturas manualmente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="profileInteractions" className="text-sm">
            Interacciones del perfil
          </Label>
          <Input
            id="profileInteractions"
            type="number"
            min="0"
            placeholder="Ej: 150"
            value={formData.profileInteractions ?? ""}
            onChange={(e) => handleChange("profileInteractions", e.target.value)}
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="calls" className="text-sm">
            Llamadas
          </Label>
          <Input
            id="calls"
            type="number"
            min="0"
            placeholder="Ej: 25"
            value={formData.calls ?? ""}
            onChange={(e) => handleChange("calls", e.target.value)}
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="directionsRequests" className="text-sm">
            Solicitudes "cómo llegar"
          </Label>
          <Input
            id="directionsRequests"
            type="number"
            min="0"
            placeholder="Ej: 45"
            value={formData.directionsRequests ?? ""}
            onChange={(e) => handleChange("directionsRequests", e.target.value)}
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteClicks" className="text-sm">
            Clics al sitio web
          </Label>
          <Input
            id="websiteClicks"
            type="number"
            min="0"
            placeholder="Ej: 80"
            value={formData.websiteClicks ?? ""}
            onChange={(e) => handleChange("websiteClicks", e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          className="flex-1 bg-amber-600 hover:bg-amber-700"
          disabled={!hasAnyValue}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Usar estos datos
        </Button>
      </div>
    </form>
  );
}
