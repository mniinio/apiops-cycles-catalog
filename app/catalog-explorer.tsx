"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Resource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  outcomes: string[];
  steps: string[];
  canvasId?: string | null;
};

type CycleStation = {
  index: number;
  id: string;
  title: string;
  description: string;
  baseTitle: string;
  resources: Resource[];
};

type Cycle = {
  id: string;
  slug: string;
  title: string;
  description: string;
  purpose: string;
  audiences: string[];
  stations: CycleStation[];
};

type MetroLine = {
  id: string;
  slug: string;
  title: string;
  description: string;
  color: string;
  order: number;
  stations: string[];
};

type Station = {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  applyInWork: string;
  group: string;
  lifecycleStage: string;
  outcomes: string[];
  steps: { text: string; resourceId?: string; resourceTitle?: string; canvasId?: string | null }[];
  evidence: string[];
};

type Translation = {
  cycles: Cycle[];
  lines: MetroLine[];
  stations: Station[];
  resources: Resource[];
};

type Catalog = {
  source: { repository: string; branch: string; commit: string };
  locales: string[];
  defaultLocale: string;
  translations: Record<string, Translation>;
};

type RoleGuide = {
  id: string;
  title: string;
  summary: string;
  cycles: { id: string; title: string; description: string }[];
  stations: { id: string; title: string; description: string }[];
  canvases: { id: string; title: string }[];
  decisions: string[];
  outputs: string[];
  recommendedResources: Resource[];
  promptIds: string[];
  exportTemplateIds: string[];
};

type Guides = {
  translations: Record<string, RoleGuide[]>;
};

type CanvasSection = {
  id: string;
  title: string;
  description: string;
  gridPosition: { column: number; row: number; colSpan: number; rowSpan: number };
  fillOrder: number;
  highlight: boolean;
  defaultNoteColor: string;
  defaultNoteIntent: string;
};

type StickyNote = {
  content: string;
  size: number;
  color: string;
};

type CanvasExportSection = {
  sectionId: string;
  stickyNotes: StickyNote[];
};

type CanvasExport = {
  templateId: string;
  locale: string;
  metadata: {
    source: string;
    license: string;
    authors: string[];
    website: string;
    date?: string;
  };
  sections: CanvasExportSection[];
};

type CanvasDefinition = {
  id: string;
  title: string;
  purpose: string;
  howToUse: string;
  layout: { columns: number; rows: number };
  canvasCreatorUrl: string;
  importExportTemplate: CanvasExport;
  sections: CanvasSection[];
};

type CanvasManifest = {
  translations: Record<string, Record<string, CanvasDefinition>>;
};

type PromptPack = {
  id: string;
  roleId: string;
  title: string;
  mode: string;
  prompt: string;
};

type PromptData = {
  translations: Record<string, PromptPack[]>;
};

type ExportTemplate = {
  id: string;
  roleId: string;
  format: string;
  title: string;
  body: string;
};

type ExportData = {
  translations: Record<string, ExportTemplate[]>;
};

type StickyNotes = Record<string, StickyNote[]>;

const localeNames: Record<string, string> = {
  en: "English",
  fi: "Suomi",
  fr: "Francais",
  de: "Deutsch",
  pt: "Portugues",
};

const colors: Record<string, string> = {
  "capability-productization-cycle": "#31a354",
  "api-productization-cycle": "#7b1fa2",
  "integration-productization-cycle": "#0069c0",
  "automation-cycle": "#0097a7",
};

const viewLabels = {
  map: "Metro map",
  guide: "Role guide",
  ai: "Use with AI",
  confluence: "Confluence",
  canvases: "Canvases",
  data: "Method data",
} as const;

function compact(text: string, max = 150) {
  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function safeRole(roleId: string, roles: RoleGuide[]) {
  return roles.find((role) => role.id === roleId) ?? roles[0];
}

function templateUse(template: ExportTemplate) {
  const isQuestionTemplate = template.id.includes("integration");
  return {
    key: isQuestionTemplate ? "questions" : "cycle",
    label: isQuestionTemplate ? "Question template" : "Cycle documentation",
    title: isQuestionTemplate ? "Question template to fill in" : "Cycle reference to publish",
    copy: isQuestionTemplate
      ? "Use this when you want to gather answers and evidence before choosing an integration or API design path."
      : "Use this when you want to document the selected cycle, stations, route, and method guidance.",
  };
}

function shortStationName(title: string) {
  return title.split(" - ")[0].split(" – ")[0].trim();
}

function wrapMapLabel(label: string, maxLength = 18) {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function normalizeNotes(value: unknown): StickyNotes {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([sectionId, sectionNotes]) => [
      sectionId,
      Array.isArray(sectionNotes)
        ? sectionNotes
            .map((note) => {
              if (typeof note === "string") return { content: note, size: 80, color: "#FFF399" };
              if (note && typeof note === "object" && typeof (note as StickyNote).content === "string") {
                const typed = note as StickyNote;
                return {
                  content: typed.content,
                  size: Number(typed.size ?? 80),
                  color: /^#[0-9A-Fa-f]{6}$/.test(typed.color ?? "") ? typed.color : "#FFF399",
                };
              }
              return null;
            })
            .filter(Boolean)
        : [],
    ]),
  ) as StickyNotes;
}

function MetroMap({
  cycles,
  lines,
  stations,
  selectedCycleId,
  selectedStationId,
  onSelectCycle,
  onSelectStation,
}: {
  cycles: Cycle[];
  lines: MetroLine[];
  stations: Station[];
  selectedCycleId: string;
  selectedStationId: string;
  onSelectCycle: (id: string) => void;
  onSelectStation: (id: string) => void;
}) {
  const width = 1000;
  const height = 760;
  const center = { x: 470, y: 375 };
  const coreStations = cycles[0]?.stations ?? [];
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? cycles[0];
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const coreCoordinates: Record<string, { x: number; y: number }> = {
    "api-product-strategy": { x: 480, y: 288 },
    "api-consumer-experience": { x: 555, y: 330 },
    "api-platform-architecture": { x: 575, y: 430 },
    "api-design": { x: 515, y: 520 },
    "api-delivery": { x: 430, y: 520 },
    "api-audit": { x: 365, y: 430 },
    "api-publishing": { x: 345, y: 330 },
    "monitoring-and-improving": { x: 420, y: 300 },
  };
  const supportCoordinates: Record<string, { x: number; y: number; dx?: number; dy?: number; anchor?: "start" | "end" }> = {
    "ecosystem-vision": { x: 300, y: 42, dx: 12, dy: 4 },
    "competitive-analysis": { x: 320, y: 92, dx: 12, dy: 4 },
    "business-goals": { x: 340, y: 145, dx: 12, dy: 4 },
    "market-insights": { x: 360, y: 202, dx: 12, dy: 4 },
    "user-experience": { x: 382, y: 252, dx: 12, dy: 4 },
    "scalable-infrastructure": { x: 650, y: 415, dx: 12, dy: 4 },
    "legal-and-compliance": { x: 700, y: 448, dx: 12, dy: 4 },
    "security-and-privacy": { x: 750, y: 478, dx: 12, dy: 4 },
    "design-standards": { x: 805, y: 508, dx: 12, dy: 4 },
    "vendor-management": { x: 860, y: 540, dx: 12, dy: 4 },
    "contract-design": { x: 408, y: 575, dx: 12, dy: 4 },
    development: { x: 380, y: 638, dx: 12, dy: 4 },
    "ci-cd": { x: 350, y: 692, dx: 12, dy: 4 },
    "test-automation": { x: 318, y: 730, dx: 12, dy: 4 },
    "release-management": { x: 285, y: 752, dx: 12, dy: -6 },
    "service-agreements": { x: 260, y: 362, dx: 12, dy: 4 },
    "api-consumer-adoption": { x: 205, y: 338, dx: 12, dy: 4 },
    "api-promotion": { x: 150, y: 308, dx: 12, dy: 4 },
    "partner-integration": { x: 95, y: 278, dx: 12, dy: 4 },
    "api-mindset": { x: 535, y: 250, dx: 12, dy: 4 },
    "roles-and-responsibilities": { x: 580, y: 210, dx: 12, dy: 4 },
    upskilling: { x: 625, y: 170, dx: 12, dy: 4 },
    "operating-guidelines": { x: 670, y: 130, dx: 12, dy: 4 },
    "portfolio-management": { x: 715, y: 92, dx: 12, dy: 4 },
    "budget-and-resource-management": { x: 760, y: 52, dx: 12, dy: 4 },
  };
  const labelBoxes = {
    strategic: { x: 386, y: 10, width: 108, height: 34, label: "Strategic" },
    governance: { x: 548, y: 245, width: 124, height: 34, label: "Governance" },
    consumer: { x: 290, y: 322, width: 118, height: 34, label: "Consumer" },
    technical: { x: 650, y: 635, width: 110, height: 34, label: "Technical" },
  };
  const lineLegend = lines.map((line, index) => ({ ...line, x: 100, y: 600 + index * 26 }));
  const coreLabelOffsets: Record<string, { dx: number; dy: number }> = {
    "api-product-strategy": { dx: 70, dy: -2 },
    "api-consumer-experience": { dx: 105, dy: 0 },
    "api-platform-architecture": { dx: 116, dy: 18 },
    "api-design": { dx: 86, dy: 22 },
    "api-delivery": { dx: 0, dy: 60 },
    "api-audit": { dx: -95, dy: 22 },
    "api-publishing": { dx: -100, dy: 0 },
    "monitoring-and-improving": { dx: -88, dy: -28 },
  };
  const corePoints = coreStations.map((station, index) => {
    const selectedCycleStation = selectedCycle?.stations.find((item) => item.id === station.id);
    const coordinates = coreCoordinates[station.id] ?? { x: center.x, y: center.y };
    return {
      ...station,
      displayTitle: shortStationName(selectedCycleStation?.title ?? station.baseTitle),
      x: coordinates.x,
      y: coordinates.y,
    };
  });
  const corePointById = new Map(corePoints.map((point) => [point.id, point]));

  const linePoints = lines.map((line) => {
    const points = line.stations.map((stationId) => {
      const corePoint = corePointById.get(stationId);
      if (corePoint) {
        return { ...corePoint, support: false };
      }
      const fixedPoint = supportCoordinates[stationId] ?? { x: center.x, y: center.y };
      return {
        id: stationId,
        index: 0,
        title: shortStationName(stationById.get(stationId)?.title ?? stationId),
        baseTitle: shortStationName(stationById.get(stationId)?.title ?? stationId),
        description: stationById.get(stationId)?.description ?? "",
        resources: [],
        x: fixedPoint.x,
        y: fixedPoint.y,
        dx: fixedPoint.dx ?? 12,
        dy: fixedPoint.dy ?? 4,
        anchor: fixedPoint.anchor ?? "start",
        support: true,
      };
    });
    return { ...line, points };
  });

  const paths = cycles.map((cycle, cycleIndex) => {
    const offset = (cycleIndex - 1.4) * 7;
    const points = cycle.stations
      .map((station) => corePoints.find((point) => point.id === station.id))
      .filter(Boolean)
      .map((point) => ({ x: (point?.x ?? 0) + offset, y: (point?.y ?? 0) + offset }));
    return {
      id: cycle.id,
      title: cycle.title,
      color: colors[cycle.id] ?? "#164e63",
      d: points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z",
    };
  });

  return (
    <svg className="metro-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="APIOps Cycles metro map">
      <ellipse cx="510" cy="355" rx="420" ry="330" className="metro-zone metro-zone--governance" />
      <ellipse cx="360" cy="98" rx="190" ry="140" className="metro-zone metro-zone--strategic" />
      <ellipse cx="268" cy="340" rx="270" ry="100" className="metro-zone metro-zone--consumer" />
      <ellipse cx="555" cy="650" rx="325" ry="205" className="metro-zone metro-zone--technical" />
      {Object.entries(labelBoxes).map(([id, box]) => (
        <g key={id}>
          <rect x={box.x} y={box.y} width={box.width} height={box.height} rx="6" className="metro-zone-title-bg" />
          <text x={box.x + box.width / 2} y={box.y + 22} textAnchor="middle" className="metro-zone-label">
            {box.label}
          </text>
        </g>
      ))}
      <text x="32" y="38" className="metro-instructions">
        Click any station dot to navigate. Use the cycle selector to switch route.
      </text>
      {linePoints.map((line) => (
        <g key={line.id}>
          <polyline
            points={line.points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke={line.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
          {line.points.filter((point) => point.support).map((point) => (
            <g
              key={`${line.id}-${point.id}`}
              role="button"
              tabIndex={0}
              className="metro-station"
              onClick={() => onSelectStation(point.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectStation(point.id);
              }}
            >
              <title>{point.baseTitle}</title>
              <circle cx={point.x} cy={point.y} r="6" className={point.id === selectedStationId ? "metro-support-node metro-support-node--active" : "metro-support-node"} />
              <text x={point.x + point.dx} y={point.y + point.dy} textAnchor={point.anchor} className="metro-support-label">{point.baseTitle}</text>
            </g>
          ))}
        </g>
      ))}
      {paths.map((path) => (
        <path
          key={path.id}
          d={path.d}
          fill="none"
          stroke={path.color}
          strokeWidth={path.id === selectedCycleId ? 10 : 6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={path.id === selectedCycleId ? 0.95 : 0.35}
          onClick={() => onSelectCycle(path.id)}
          className="metro-route"
        />
      ))}
      {corePoints.map((point) => (
        <g
          key={point.id}
          role="button"
          tabIndex={0}
          className="metro-station"
          onClick={() => onSelectStation(point.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onSelectStation(point.id);
          }}
        >
          <title>{point.baseTitle}</title>
          <circle cx={point.x} cy={point.y} r="14" className={point.id === selectedStationId ? "metro-node metro-node--active" : "metro-node"} />
          <text x={point.x} y={point.y + 4} textAnchor="middle" className={point.id === selectedStationId ? "metro-node-number metro-node-number--active" : "metro-node-number"}>
            {point.index}
          </text>
          {(() => {
            const lines = wrapMapLabel(point.displayTitle);
            const offset = coreLabelOffsets[point.id] ?? { dx: 0, dy: point.y > center.y ? 48 : -42 };
            const boxWidth = Math.max(92, Math.max(...lines.map((line) => line.length)) * 7 + 24);
            const boxHeight = lines.length * 14 + 16;
            const boxX = point.x + offset.dx - boxWidth / 2;
            const boxY = point.y + offset.dy - boxHeight / 2;
            return (
              <g className="metro-core-label" style={{ color: colors[selectedCycleId] ?? "#164e63" }}>
                <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx="8" />
                {lines.map((line, lineIndex) => (
                  <text key={line} x={point.x + offset.dx} y={boxY + 18 + lineIndex * 14} textAnchor="middle">
                    {line}
                  </text>
                ))}
              </g>
            );
          })()}
        </g>
      ))}
      <image
        href="/assets/apiops-cycles-logo-dark.svg"
        x={center.x - 30}
        y={center.y - 30}
        width="60"
        height="60"
        className="metro-brand"
      />
      <g className="metro-line-legend">
        {lineLegend.map((line) => (
          <g key={line.id} transform={`translate(${line.x} ${line.y})`}>
            <rect x="0" y="-12" width="18" height="18" fill={line.color} />
            <text x="30" y="2">{line.title}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function CanvasWorkspace({
  canvas,
  role,
  locale,
}: {
  canvas: CanvasDefinition;
  role: RoleGuide;
  locale: string;
}) {
  const storageKey = `apiops-canvas:${role.id}:${canvas.id}`;
  const [notes, setNotes] = useState<StickyNotes>({});
  const [status, setStatus] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setNotes(normalizeNotes(JSON.parse(stored)));
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, storageKey]);

  function addNote(section: CanvasSection, text: string) {
    const next = text.trim();
    if (!next) return;
    setNotes((current) => {
      const sectionNotes = current[section.id] ?? [];
      return {
        ...current,
        [section.id]: [
          ...sectionNotes,
          {
            content: next,
            size: 80,
            color: section.defaultNoteColor,
          },
        ],
      };
    });
  }

  function removeNote(sectionId: string, index: number) {
    setNotes((current) => ({
      ...current,
      [sectionId]: (current[sectionId] ?? []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function exportJson() {
    const template = canvas.importExportTemplate;
    const payload: CanvasExport = {
      ...template,
      locale,
      metadata: {
        ...template.metadata,
        date: new Date().toISOString(),
      },
      sections: canvas.sections.map((section) => ({
        sectionId: section.id,
        stickyNotes: (notes[section.id] ?? []).map((note) => ({
          content: note.content,
          size: note.size,
          color: note.color,
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${template.templateId || canvas.id}_${locale}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Canvas JSON exported.");
  }

  function markdown() {
    return `# ${canvas.title}\n\nRole: ${role.title}\n\n${canvas.sections
      .map((section) => {
        const sectionNotes = notes[section.id] ?? [];
        return `## ${section.title}\n${sectionNotes.length ? sectionNotes.map((note) => `- ${note.content}`).join("\n") : "- "}`;
      })
      .join("\n\n")}\n`;
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown());
    setStatus("Markdown copied.");
  }

  async function importJson(file: File) {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (payload.templateId && payload.templateId !== canvas.importExportTemplate.templateId) {
      throw new Error(`This file is for ${payload.templateId}, not ${canvas.importExportTemplate.templateId}.`);
    }
    if (!Array.isArray(payload.sections)) throw new Error("Invalid canvas import/export template");
    const importedNotes = Object.fromEntries(
      payload.sections.map((section: CanvasExportSection) => [section.sectionId, section.stickyNotes ?? []]),
    );
    setNotes(normalizeNotes(importedNotes));
    setStatus("Canvas JSON imported.");
  }

  return (
    <section className="workspace">
      <div className="workspace__head">
        <div>
          <p className="section-kicker">Local canvas workspace</p>
          <h2>{canvas.title}</h2>
          <p>{canvas.purpose}</p>
        </div>
        <div className="toolbar">
          <button type="button" onClick={copyMarkdown}>Copy Markdown</button>
          <button type="button" onClick={exportJson}>Export JSON</button>
          <button type="button" onClick={() => importRef.current?.click()}>Import JSON</button>
          <input
            ref={importRef}
            hidden
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) importJson(file).catch((error) => setStatus(error.message));
            }}
          />
        </div>
      </div>
      <p className="helper-text">{canvas.howToUse}</p>
      <div
        className="canvas-grid"
        style={{
          gridTemplateColumns: `repeat(${canvas.layout.columns}, minmax(140px, 1fr))`,
          gridTemplateRows: `repeat(${canvas.layout.rows}, minmax(150px, auto))`,
        }}
      >
        {canvas.sections.map((section) => (
          <article
            key={section.id}
            className={section.highlight ? "canvas-section canvas-section--highlight" : "canvas-section"}
            style={{
              gridColumn: `${Math.floor(section.gridPosition.column) + 1} / span ${Math.ceil(section.gridPosition.colSpan)}`,
              gridRow: `${section.gridPosition.row + 1} / span ${section.gridPosition.rowSpan}`,
            }}
          >
            <span>{section.fillOrder}</span>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            <div className="sticky-notes">
              {(notes[section.id] ?? []).map((note, index) => (
                <button
                  key={`${note.content}-${index}`}
                  type="button"
                  onClick={() => removeNote(section.id, index)}
                  title="Remove note"
                  style={{ backgroundColor: note.color }}
                >
                  {note.content}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const input = event.currentTarget.elements.namedItem("note") as HTMLInputElement;
                addNote(section, input.value);
                input.value = "";
              }}
            >
              <input name="note" placeholder="Add sticky note" aria-label={`Add note to ${section.title}`} />
            </form>
          </article>
        ))}
      </div>
      {status ? <p className="status">{status}</p> : null}
    </section>
  );
}

export default function CatalogExplorer({
  catalog,
  guides,
  canvases,
  prompts,
  exportsData,
  initialLocale,
}: {
  catalog: Catalog;
  guides: Guides;
  canvases: CanvasManifest;
  prompts: PromptData;
  exportsData: ExportData;
  initialLocale: string;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const data = catalog.translations[locale] ?? catalog.translations.en;
  const roleData = guides.translations[locale] ?? guides.translations.en;
  const promptData = prompts.translations[locale] ?? prompts.translations.en;
  const templateData = exportsData.translations[locale] ?? exportsData.translations.en;
  const canvasData = canvases.translations[locale] ?? canvases.translations.en;
  const [roleId, setRoleId] = useState(roleData[0].id);
  const role = safeRole(roleId, roleData);
  const [cycleId, setCycleId] = useState(role.cycles[0]?.id ?? data.cycles[0].id);
  const selectedCycle = data.cycles.find((cycle) => cycle.id === cycleId) ?? data.cycles[0];
  const [stationId, setStationId] = useState(role.stations[0]?.id ?? selectedCycle.stations[0].id);
  const selectedCycleStation = selectedCycle.stations.find((station) => station.id === stationId);
  const stationDetail =
    data.stations.find((station) => station.id === stationId) ??
    data.stations.find((station) => station.id === selectedCycle.stations[0]?.id) ??
    data.stations[0];
  const stationStepResourceIds = new Set(stationDetail.steps.map((step) => step.resourceId).filter(Boolean));
  const selectedStationResources =
    selectedCycleStation?.resources.length
      ? selectedCycleStation.resources
      : data.resources.filter((resource) => stationStepResourceIds.has(resource.id));
  const selectedStation: CycleStation =
    selectedCycleStation ?? {
      index: 0,
      id: stationDetail.id,
      title: stationDetail.title,
      description: stationDetail.description,
      baseTitle: stationDetail.title,
      resources: selectedStationResources,
    };
  const [view, setView] = useState<keyof typeof viewLabels>("map");
  const [query, setQuery] = useState("");
  const [canvasId, setCanvasId] = useState(role.canvases[0]?.id ?? Object.keys(canvasData)[0]);

  useEffect(() => {
    const nextRole = safeRole(roleId, roleData);
    setCycleId(nextRole.cycles[0]?.id ?? data.cycles[0].id);
    setStationId(nextRole.stations[0]?.id ?? data.stations[0].id);
    setCanvasId(nextRole.canvases[0]?.id ?? Object.keys(canvasData)[0]);
  }, [locale, roleData, data.cycles, data.stations, canvasData, roleId]);

  const filteredResources = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return selectedStationResources
      .filter((resource) => !needle || [resource.title, resource.description, resource.category].join(" ").toLowerCase().includes(needle))
      .slice(0, 24);
  }, [query, selectedStationResources]);

  const rolePrompts = promptData.filter((prompt) => prompt.roleId === role.id);
  const roleTemplates = templateData.filter((template) => template.roleId === role.id);
  const templateGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        title: string;
        copy: string;
        markdown?: ExportTemplate;
        confluence?: ExportTemplate;
      }
    >();
    for (const template of roleTemplates) {
      const use = templateUse(template);
      const group = groups.get(use.key) ?? { ...use };
      if (template.format === "confluence-wiki") group.confluence = template;
      else group.markdown = template;
      groups.set(use.key, group);
    }
    return ["cycle", "questions"]
      .map((key) => groups.get(key))
      .filter((group): group is NonNullable<typeof group> => Boolean(group));
  }, [roleTemplates]);
  const selectedCanvas = canvasData[canvasId] ?? canvasData[role.canvases[0]?.id] ?? Object.values(canvasData)[0];
  const externalCanvasUrl = process.env.NEXT_PUBLIC_CANVAS_RENDERER_BASE_URL
    ? `${process.env.NEXT_PUBLIC_CANVAS_RENDERER_BASE_URL.replace(/\/$/, "")}/${selectedCanvas.id}`
    : selectedCanvas.canvasCreatorUrl;

  function selectRole(nextRoleId: string) {
    const nextRole = safeRole(nextRoleId, roleData);
    setRoleId(nextRoleId);
    setCycleId(nextRole.cycles[0]?.id ?? cycleId);
    setStationId(nextRole.stations[0]?.id ?? stationId);
    setCanvasId(nextRole.canvases[0]?.id ?? canvasId);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  function openResource(resource: Resource) {
    if (resource.canvasId) {
      setCanvasId(resource.canvasId);
      setView("canvases");
      return;
    }
    setQuery(resource.title);
  }

  return (
    <main className="site-shell">
      <header className="hero">
        <nav className="topbar" aria-label="Primary">
          <a className="brand" href={locale === "en" ? "/" : `/${locale}`}>
            <img className="brand__logo" src="/assets/apiops-cycles-logo-dark.svg" alt="" />
            <span>APIOps Cycles</span>
          </a>
          <div className="topbar__controls">
            <button type="button" onClick={() => setView("ai")}>Workflows</button>
            <button type="button" onClick={() => setView("data")}>Data</button>
            <label className="sr-only" htmlFor="locale">Language</label>
            <select
              id="locale"
              value={locale}
              onChange={(event) => {
                const next = event.target.value;
                setLocale(next);
                window.history.replaceState(null, "", next === "en" ? "/" : `/${next}`);
              }}
            >
              {catalog.locales.map((item) => (
                <option key={item} value={item}>{localeNames[item] ?? item.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </nav>
        <section className="hero__grid">
          <div>
            <p className="eyebrow">Guided method adoption for real stakeholder work</p>
            <h1>APIOps Cycles for every role, route, and toolchain.</h1>
            <p className="hero__lead">
              Start from a stakeholder role, move through the right productization cycle,
              fill method canvases with local sticky notes, and export AI, Markdown, and
              Confluence-ready guidance from the same static method data.
            </p>
            <div className="hero__actions" aria-label="Catalog summary">
              <span>{roleData.length} roles</span>
              <span>{data.cycles.length} cycles</span>
              <span>{Object.keys(canvasData).length} canvases</span>
              <span>{catalog.locales.length} languages</span>
            </div>
          </div>
          <aside className="source-panel" aria-label="Source data">
            <strong>Source dependency</strong>
            <span>apiops-cycles-method-data</span>
            <span>{catalog.source.branch}</span>
            <code>{catalog.source.commit.slice(0, 12)}</code>
          </aside>
        </section>
      </header>

      <section className="role-section" aria-label="Choose your role">
        <div className="section-head">
          <p className="section-kicker">Choose your role</p>
          <h2>Start with the job this stakeholder needs to get done</h2>
        </div>
        <div className="role-grid">
          {roleData.map((item) => (
            <button key={item.id} type="button" className={item.id === role.id ? "role-card is-active" : "role-card"} onClick={() => selectRole(item.id)}>
              <strong>{item.title}</strong>
              <span>{item.summary}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={view === "map" ? "workbench workbench--map" : "workbench"}>
        <aside className="guide-panel">
          <p className="section-kicker">Guided path</p>
          <h2>{role.title}</h2>
          <p>{role.summary}</p>
          <div className="tabs" aria-label="Workflow views">
            {(Object.keys(viewLabels) as Array<keyof typeof viewLabels>).map((key) => (
              <button key={key} type="button" className={view === key ? "is-active" : ""} onClick={() => setView(key)}>
                {viewLabels[key]}
              </button>
            ))}
          </div>
          <section>
            <h3>Key decisions</h3>
            <ul>
              {role.decisions.map((decision) => <li key={decision}>{decision}</li>)}
            </ul>
          </section>
          <section>
            <h3>Expected outputs</h3>
            <div className="chips">
              {role.outputs.map((output) => <span key={output}>{output}</span>)}
            </div>
          </section>
        </aside>

        <section className="main-panel">
          {view === "guide" ? (
            <div className="panel-stack">
              <div className="split">
                <article className="panel">
                  <p className="section-kicker">Recommended cycles</p>
                  {role.cycles.map((cycle) => (
                    <button key={cycle.id} type="button" className={cycle.id === cycleId ? "list-choice is-active" : "list-choice"} onClick={() => setCycleId(cycle.id)}>
                      <strong>{cycle.title}</strong>
                      <span>{cycle.description}</span>
                    </button>
                  ))}
                </article>
                <article className="panel">
                  <p className="section-kicker">Relevant stations</p>
                  {role.stations.map((station) => (
                    <button key={station.id} type="button" className={station.id === stationId ? "list-choice is-active" : "list-choice"} onClick={() => setStationId(station.id)}>
                      <strong>{station.title}</strong>
                      <span>{compact(station.description, 110)}</span>
                    </button>
                  ))}
                </article>
              </div>
              <article className="panel station-detail">
                <p className="section-kicker">Station detail</p>
                <h2>{selectedStation.title}</h2>
                <p>{selectedStation.description || stationDetail.description}</p>
                <div className="detail-columns">
                  <section>
                    <h3>Typical outcomes</h3>
                    <ul>{stationDetail.outcomes.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section>
                    <h3>Resources</h3>
                    {selectedStationResources.length ? (
                      <div className="resource-actions">
                        {selectedStationResources.slice(0, 6).map((resource) => (
                          <button key={resource.id} type="button" onClick={() => openResource(resource)}>
                            <strong>{resource.title}</strong>
                            <span>{resource.canvasId ? "Open canvas" : resource.category}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="helper-text">No station-specific resources are listed for this route.</p>
                    )}
                  </section>
                  <section>
                    <h3>Evidence</h3>
                    <ul>{stationDetail.evidence.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                </div>
              </article>
            </div>
          ) : null}

          {view === "map" ? (
            <article className="panel panel--map">
              <div className="panel__head map-head">
                <div>
                  <p className="section-kicker">Metro map navigation</p>
                  <h2>{selectedCycle.title}</h2>
                  <p>
                    Start from the shared eight-station route. Supporting branch dots are clickable and open details below the map.
                  </p>
                </div>
                <div className="cycle-pills" aria-label="Select cycle">
                  {data.cycles.map((cycle) => (
                    <button
                      key={cycle.id}
                      type="button"
                      className={cycle.id === cycleId ? "is-active" : ""}
                      onClick={() => setCycleId(cycle.id)}
                    >
                      <span style={{ backgroundColor: colors[cycle.id] ?? "#164e63" }} />
                      {cycle.title}
                    </button>
                  ))}
                </div>
              </div>
              <MetroMap
                cycles={data.cycles}
                lines={data.lines}
                stations={data.stations}
                selectedCycleId={cycleId}
                selectedStationId={stationId}
                onSelectCycle={setCycleId}
                onSelectStation={setStationId}
              />
              <div className="map-detail">
                <div>
                  <p className="section-kicker">Selected station</p>
                  <h2>{stationDetail.title}</h2>
                  <p>{stationDetail.description}</p>
                </div>
                <div className="resource-actions">
                  {selectedStationResources.slice(0, 4).map((resource) => (
                    <button key={resource.id} type="button" onClick={() => openResource(resource)}>
                      <strong>{resource.title}</strong>
                      <span>{resource.canvasId ? "Open canvas" : resource.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ) : null}

          {view === "ai" ? (
            <article className="panel" id="workflows">
              <p className="section-kicker">Use with AI</p>
              <h2>Prompt packs for {role.title}</h2>
              <div className="prompt-grid">
                {rolePrompts.map((prompt) => (
                  <section key={prompt.id} className="prompt-card">
                    <span>{prompt.mode}</span>
                    <h3>{prompt.title}</h3>
                    <pre>{prompt.prompt}</pre>
                    <button type="button" onClick={() => copyText(prompt.prompt)}>Copy prompt</button>
                  </section>
                ))}
              </div>
            </article>
          ) : null}

          {view === "confluence" ? (
            <article className="panel">
              <p className="section-kicker">Use with Confluence and Markdown</p>
              <h2>Export-ready templates</h2>
              <p className="helper-text">
                Choose the purpose first, then copy the format that matches the destination. Markdown is for docs repositories and static sites. Confluence-wiki is for Confluence pages that accept wiki markup.
              </p>
              <div className="template-grid">
                {templateGroups.map((group) => (
                    <section key={group.key} className="template-card template-card--grouped">
                      <div className="template-card__meta">
                        <span>{group.label}</span>
                      </div>
                      <h3>{group.title}</h3>
                      <p>{group.copy}</p>
                      <div className="template-formats">
                        {group.markdown ? (
                          <section>
                            <div className="template-format-head">
                              <strong>Markdown</strong>
                              <button type="button" onClick={() => copyText(group.markdown?.body ?? "")}>Copy Markdown</button>
                            </div>
                            <pre>{group.markdown.body}</pre>
                          </section>
                        ) : null}
                        {group.confluence ? (
                          <section>
                            <div className="template-format-head">
                              <strong>Confluence-wiki</strong>
                              <button type="button" onClick={() => copyText(group.confluence?.body ?? "")}>Copy Confluence-wiki</button>
                            </div>
                            <pre>{group.confluence.body}</pre>
                          </section>
                        ) : null}
                      </div>
                    </section>
                ))}
              </div>
            </article>
          ) : null}

          {view === "canvases" ? (
            <article className="panel">
              <div className="panel__head">
                <div>
                  <p className="section-kicker">Use with canvases</p>
                  <h2>Fill sticky notes locally</h2>
                </div>
                <select value={canvasId} onChange={(event) => setCanvasId(event.target.value)} aria-label="Select canvas">
                  {role.canvases.map((canvas) => (
                    <option key={canvas.id} value={canvas.id}>{canvas.title}</option>
                  ))}
                </select>
              </div>
              {externalCanvasUrl ? (
                <a className="external-link" href={externalCanvasUrl} target="_blank" rel="noreferrer">
                  Open in CanvasCreator
                </a>
              ) : (
                <p className="helper-text">No external canvas renderer is configured, so this page uses the built-in local workspace.</p>
              )}
              <CanvasWorkspace canvas={selectedCanvas} role={role} locale={locale} />
            </article>
          ) : null}

          {view === "data" ? (
            <article className="panel" id="method-data">
              <p className="section-kicker">Method data</p>
              <h2>Static integration surfaces</h2>
              <p>These JSON files are published with the site and can be consumed by future MCP tools, documentation generators, or external canvas renderers.</p>
              <div className="data-links">
                {[
                  "method-catalog.json",
                  "stakeholder-guides.json",
                  "canvas-manifest.json",
                  "prompt-packs.json",
                  "export-templates.json",
                  "mcp-method-manifest.json",
                ].map((file) => (
                  <a key={file} href={`/data/${file}`}>{`/data/${file}`}</a>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      </section>

      <section className="catalog-section">
        <div className="panel__head">
          <div>
            <p className="section-kicker">Expert catalog</p>
            <h2>Station resources</h2>
          </div>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this station" aria-label="Search station resources" />
        </div>
        <div className="resource-grid">
          {filteredResources.map((resource) => (
            <article key={resource.id} className="resource-card">
              <span>{resource.category}</span>
              <h3>{resource.title}</h3>
              <p>{compact(resource.description, 165)}</p>
              <button type="button" onClick={() => openResource(resource)}>
                {resource.canvasId ? "Open canvas" : "Use resource"}
              </button>
            </article>
          ))}
          {!filteredResources.length ? <p className="helper-text">No resources match this station filter.</p> : null}
        </div>
      </section>
    </main>
  );
}
