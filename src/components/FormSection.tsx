import { FormData } from "@/types/report";

interface FormSectionProps {
  data: FormData;
  onChange: (data: FormData) => void;
}

export function FormSection({ data, onChange }: FormSectionProps) {
  const handleChange = (field: keyof FormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="section-card">
      <h2 className="text-xl font-semibold mb-6">Datos del Informe</h2>
      
      <div className="grid gap-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="form-label">Nombre del beneficiario</label>
            <input
              type="text"
              className="form-input"
              placeholder="Empresa S.L."
              value={data.beneficiaryName}
              onChange={(e) => handleChange("beneficiaryName", e.target.value)}
            />
          </div>
          
          <div>
            <label className="form-label">NIF/CIF</label>
            <input
              type="text"
              className="form-input"
              placeholder="B12345678"
              value={data.nif}
              onChange={(e) => handleChange("nif", e.target.value)}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="form-label">URL del sitio web</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://ejemplo.com"
              value={data.websiteUrl}
              onChange={(e) => handleChange("websiteUrl", e.target.value)}
            />
          </div>
          
          <div>
            <label className="form-label">Servicio</label>
            <input
              type="text"
              className="form-input"
              placeholder="veterinario, fisioterapia, cerrajería..."
              value={data.servicio}
              onChange={(e) => handleChange("servicio", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Define el sector para generar la tabla evolutiva de palabras clave
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="form-label">Fecha inicio del servicio</label>
            <input
              type="date"
              className="form-input"
              value={data.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
          </div>
          
          <div>
            <label className="form-label">Fecha fin del servicio</label>
            <input
              type="date"
              className="form-input"
              value={data.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />
          </div>
          
          <div>
            <label className="form-label">Fecha de elaboración</label>
            <input
              type="date"
              className="form-input"
              value={data.reportDate}
              onChange={(e) => handleChange("reportDate", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
