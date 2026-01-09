import { SocialMediaFormData } from "@/types/socialMediaReport";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SocialMediaFormSectionProps {
  data: SocialMediaFormData;
  onChange: (data: SocialMediaFormData) => void;
}

const SOCIAL_NETWORKS = [
  "Google My Business",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "Twitter/X",
  "TikTok",
  "YouTube",
  "Pinterest",
  "Otra",
];

export function SocialMediaFormSection({ data, onChange }: SocialMediaFormSectionProps) {
  const handleChange = (field: keyof SocialMediaFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="beneficiaryName">Nombre del beneficiario *</Label>
          <Input
            id="beneficiaryName"
            value={data.beneficiaryName}
            onChange={(e) => handleChange("beneficiaryName", e.target.value)}
            placeholder="Empresa S.L."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nif">NIF/CIF *</Label>
          <Input
            id="nif"
            value={data.nif}
            onChange={(e) => handleChange("nif", e.target.value)}
            placeholder="B12345678"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="socialNetwork">Red social *</Label>
          <Select
            value={data.socialNetwork}
            onValueChange={(value) => handleChange("socialNetwork", value)}
          >
            <SelectTrigger id="socialNetwork">
              <SelectValue placeholder="Selecciona la red social" />
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_NETWORKS.map((network) => (
                <SelectItem key={network} value={network}>
                  {network}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="socialNetworkUrl">Enlace a la red social *</Label>
          <Input
            id="socialNetworkUrl"
            type="url"
            value={data.socialNetworkUrl}
            onChange={(e) => handleChange("socialNetworkUrl", e.target.value)}
            placeholder="https://www.instagram.com/empresa/"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Fecha inicio del servicio *</Label>
          <Input
            id="startDate"
            type="date"
            value={data.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Fecha fin del servicio *</Label>
          <Input
            id="endDate"
            type="date"
            value={data.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportDate">Fecha de elaboración</Label>
          <Input
            id="reportDate"
            type="date"
            value={data.reportDate}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Automática</p>
        </div>
      </div>
    </div>
  );
}
