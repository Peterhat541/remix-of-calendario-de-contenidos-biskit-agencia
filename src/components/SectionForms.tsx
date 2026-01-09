import {
  KeywordAnalysisData,
  PositioningEvolutionData,
  KeywordTableData,
  BacklinksData,
  HierarchyData,
  IndexingData,
  PageSpeedData,
} from "@/types/report";

interface KeywordFormProps {
  data: KeywordAnalysisData;
  onChange: (data: KeywordAnalysisData) => void;
}

export function KeywordAnalysisForm({ data, onChange }: KeywordFormProps) {
  const update = (field: keyof KeywordAnalysisData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Herramienta</label>
          <select
            className="form-input"
            value={data.tool}
            onChange={(e) => update("tool", e.target.value)}
          >
            <option value="semrush">SEMrush</option>
            <option value="sistrix">Sistrix</option>
            <option value="gsc">Google Search Console</option>
            <option value="otra">Otra</option>
          </select>
        </div>
        <div>
          <label className="form-label">Nº keywords activas</label>
          <input
            type="text"
            className="form-input"
            placeholder="1.250"
            value={data.activeKeywords}
            onChange={(e) => update("activeKeywords", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="form-label">Tráfico orgánico estimado (visitas/mes)</label>
        <input
          type="text"
          className="form-input"
          placeholder="3.500"
          value={data.organicTraffic}
          onChange={(e) => update("organicTraffic", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Keyword principal</label>
          <input
            type="text"
            className="form-input"
            placeholder="seo madrid"
            value={data.mainKeyword || ""}
            onChange={(e) => update("mainKeyword", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Volumen</label>
          <input
            type="text"
            className="form-input"
            placeholder="2.400"
            value={data.volume || ""}
            onChange={(e) => update("volume", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">KD</label>
          <input
            type="text"
            className="form-input"
            placeholder="45%"
            value={data.kd || ""}
            onChange={(e) => update("kd", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="form-label">Comentario (opcional)</label>
        <input
          type="text"
          className="form-input"
          placeholder="Comentario adicional..."
          value={data.comment || ""}
          onChange={(e) => update("comment", e.target.value)}
        />
      </div>
    </div>
  );
}

interface PositioningFormProps {
  data: PositioningEvolutionData;
  onChange: (data: PositioningEvolutionData) => void;
}

export function PositioningEvolutionForm({ data, onChange }: PositioningFormProps) {
  const update = (field: keyof PositioningEvolutionData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Mes inicio</label>
          <input
            type="month"
            className="form-input"
            value={data.periodStart}
            onChange={(e) => update("periodStart", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Mes fin</label>
          <input
            type="month"
            className="form-input"
            value={data.periodEnd}
            onChange={(e) => update("periodEnd", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="form-label">Tendencia</label>
        <select
          className="form-input"
          value={data.trend}
          onChange={(e) => update("trend", e.target.value)}
        >
          <option value="crece">Crece</option>
          <option value="estable">Estable</option>
          <option value="desciende">Desciende</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Pico de tráfico (mes)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Octubre 2024"
            value={data.peakMonth || ""}
            onChange={(e) => update("peakMonth", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Valor del pico</label>
          <input
            type="text"
            className="form-input"
            placeholder="4.200"
            value={data.peakValue || ""}
            onChange={(e) => update("peakValue", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

interface KeywordTableFormProps {
  data: KeywordTableData;
  onChange: (data: KeywordTableData) => void;
}

export function KeywordTableForm({ data, onChange }: KeywordTableFormProps) {
  const update = (field: keyof KeywordTableData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <label className="form-label">Top 3</label>
        <input
          type="text"
          className="form-input"
          placeholder="15"
          value={data.top3}
          onChange={(e) => update("top3", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Top 10</label>
        <input
          type="text"
          className="form-input"
          placeholder="45"
          value={data.top10}
          onChange={(e) => update("top10", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Top 11-20</label>
        <input
          type="text"
          className="form-input"
          placeholder="120"
          value={data.top11_20}
          onChange={(e) => update("top11_20", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Top 21-100</label>
        <input
          type="text"
          className="form-input"
          placeholder="350"
          value={data.top21_100}
          onChange={(e) => update("top21_100", e.target.value)}
        />
      </div>
    </div>
  );
}

interface BacklinksFormProps {
  data: BacklinksData;
  onChange: (data: BacklinksData) => void;
}

export function BacklinksForm({ data, onChange }: BacklinksFormProps) {
  const update = (field: keyof BacklinksData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Nº dominios de referencia</label>
          <input
            type="text"
            className="form-input"
            placeholder="85"
            value={data.referenceDomains}
            onChange={(e) => update("referenceDomains", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Nº backlinks</label>
          <input
            type="text"
            className="form-input"
            placeholder="320"
            value={data.totalBacklinks}
            onChange={(e) => update("totalBacklinks", e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Herramienta</label>
          <select
            className="form-input"
            value={data.tool}
            onChange={(e) => update("tool", e.target.value)}
          >
            <option value="semrush">SEMrush</option>
            <option value="ahrefs">Ahrefs</option>
            <option value="majestic">Majestic</option>
            <option value="otra">Otra</option>
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Nota (opcional)</label>
        <input
          type="text"
          className="form-input"
          placeholder="Estrategia de link building activa..."
          value={data.note || ""}
          onChange={(e) => update("note", e.target.value)}
        />
      </div>
    </div>
  );
}

interface HierarchyFormProps {
  data: HierarchyData;
  onChange: (data: HierarchyData) => void;
}

export function HierarchyForm({ data, onChange }: HierarchyFormProps) {
  const update = (field: keyof HierarchyData, value: string) => {
    const numValue = value === "" ? undefined : parseInt(value, 10) || undefined;
    onChange({ ...data, [field]: numValue });
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="form-label">Nº H1</label>
        <input
          type="number"
          className="form-input"
          placeholder="1"
          value={data.h1Count ?? ""}
          onChange={(e) => update("h1Count", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Nº H2</label>
        <input
          type="number"
          className="form-input"
          placeholder="8"
          value={data.h2Count ?? ""}
          onChange={(e) => update("h2Count", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Nº H3</label>
        <input
          type="number"
          className="form-input"
          placeholder="12"
          value={data.h3Count ?? ""}
          onChange={(e) => update("h3Count", e.target.value)}
        />
      </div>
    </div>
  );
}

interface IndexingFormProps {
  data: IndexingData;
  onChange: (data: IndexingData) => void;
}

export function IndexingForm({ data, onChange }: IndexingFormProps) {
  const toggle = (field: keyof IndexingData) => {
    onChange({ ...data, [field]: !data[field] });
  };

  const items: { field: keyof IndexingData; label: string }[] = [
    { field: "robotsOk", label: "Robots.txt correcto" },
    { field: "sitemapOk", label: "Sitemap.xml correcto" },
    { field: "canonicalsOk", label: "Canonicals correctas" },
    { field: "headingsOk", label: "H1/H2/H3 revisados" },
    { field: "metaOk", label: "Metatítulo y descripción optimizados" },
    { field: "linksOk", label: "Enlaces internos/externos revisados" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map(({ field, label }) => (
        <label
          key={field}
          className={`
            flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
            ${data[field] ? "bg-primary/10 border-primary" : "bg-muted/50 border-border hover:border-primary/50"}
          `}
        >
          <input
            type="checkbox"
            checked={data[field]}
            onChange={() => toggle(field)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm">{label}</span>
        </label>
      ))}
    </div>
  );
}

interface PageSpeedFormProps {
  data: PageSpeedData;
  onChange: (data: PageSpeedData) => void;
}

export function PageSpeedForm({ data, onChange }: PageSpeedFormProps) {
  const update = (field: keyof PageSpeedData, value: string) => {
    const numValue = value === "" ? undefined : parseInt(value, 10) || undefined;
    onChange({ ...data, [field]: numValue });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <label className="form-label">Rendimiento</label>
        <input
          type="number"
          className="form-input"
          placeholder="95"
          min="0"
          max="100"
          value={data.performance ?? ""}
          onChange={(e) => update("performance", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Accesibilidad</label>
        <input
          type="number"
          className="form-input"
          placeholder="100"
          min="0"
          max="100"
          value={data.accessibility ?? ""}
          onChange={(e) => update("accessibility", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Buenas prácticas</label>
        <input
          type="number"
          className="form-input"
          placeholder="100"
          min="0"
          max="100"
          value={data.bestPractices ?? ""}
          onChange={(e) => update("bestPractices", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">SEO</label>
        <input
          type="number"
          className="form-input"
          placeholder="100"
          min="0"
          max="100"
          value={data.seo ?? ""}
          onChange={(e) => update("seo", e.target.value)}
        />
      </div>
    </div>
  );
}