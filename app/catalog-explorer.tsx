"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

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

function uniqueText(items: Array<string | undefined | null>) {
  return Array.from(new Set(items.map((item) => item?.trim()).filter((item): item is string => Boolean(item))));
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
  const height = 1000;
  const center = { x: 500, y: 500 };
  const coreRadius = 125;
  const coreLabelRadius = 156;
  const coreStations = cycles[0]?.stations ?? [];
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? cycles[0];
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const supportCoordinates: Record<string, { x: number; y: number; dx?: number; dy?: number; anchor?: "start" | "end" }> = {
    "ecosystem-vision": { x: 330, y: 42, dx: 12, dy: 4 },
    "competitive-analysis": { x: 355, y: 92, dx: 12, dy: 4 },
    "business-goals": { x: 380, y: 160, dx: 12, dy: 4 },
    "market-insights": { x: 405, y: 230, dx: 12, dy: 4 },
    "user-experience": { x: 430, y: 300, dx: 12, dy: 4 },
    "scalable-infrastructure": { x: 700, y: 505, dx: 12, dy: 4 },
    "legal-and-compliance": { x: 755, y: 535, dx: 12, dy: 4 },
    "security-and-privacy": { x: 810, y: 568, dx: 12, dy: 4 },
    "design-standards": { x: 865, y: 602, dx: 12, dy: 4 },
    "vendor-management": { x: 925, y: 640, dx: 12, dy: 4 },
    "contract-design": { x: 475, y: 690, dx: 12, dy: 4 },
    development: { x: 445, y: 760, dx: 12, dy: 4 },
    "ci-cd": { x: 415, y: 830, dx: 12, dy: 4 },
    "test-automation": { x: 385, y: 900, dx: 12, dy: 4 },
    "release-management": { x: 355, y: 960, dx: 12, dy: -6 },
    "service-agreements": { x: 302, y: 480, dx: 12, dy: 4 },
    "api-consumer-adoption": { x: 238, y: 445, dx: 12, dy: 4 },
    "api-promotion": { x: 172, y: 410, dx: 12, dy: 4 },
    "partner-integration": { x: 106, y: 375, dx: 12, dy: 4 },
    "api-mindset": { x: 560, y: 320, dx: 12, dy: 4 },
    "roles-and-responsibilities": { x: 620, y: 265, dx: 12, dy: 4 },
    upskilling: { x: 680, y: 210, dx: 12, dy: 4 },
    "operating-guidelines": { x: 740, y: 155, dx: 12, dy: 4 },
    "portfolio-management": { x: 800, y: 100, dx: 12, dy: 4 },
    "budget-and-resource-management": { x: 860, y: 45, dx: 12, dy: 4 },
  };
  const labelBoxes = {
    strategic: { x: 420, y: 6, width: 108, height: 34, label: "Strategic" },
    governance: { x: 640, y: 296, width: 124, height: 34, label: "Governance" },
    consumer: { x: 275, y: 386, width: 118, height: 34, label: "Consumer" },
    technical: { x: 720, y: 806, width: 110, height: 34, label: "Technical" },
  };
  const lineLegend = lines.map((line, index) => ({ ...line, x: 105, y: 760 + index * 28 }));
  const corePoints = coreStations.map((station, index) => {
    const selectedCycleStation = selectedCycle?.stations.find((item) => item.id === station.id);
    const angle = -90 + (360 / coreStations.length) * index;
    const radians = (angle * Math.PI) / 180;
    return {
      ...station,
      displayTitle: shortStationName(selectedCycleStation?.title ?? station.baseTitle),
      angle,
      labelX: center.x + coreLabelRadius * Math.cos(radians),
      labelY: center.y + coreLabelRadius * Math.sin(radians),
      x: center.x + coreRadius * Math.cos(radians),
      y: center.y + coreRadius * Math.sin(radians),
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
      <circle cx="500" cy="500" r="445" className="metro-zone metro-zone--governance" />
      <ellipse cx="390" cy="112" rx="205" ry="150" className="metro-zone metro-zone--strategic" />
      <ellipse cx="275" cy="430" rx="285" ry="112" className="metro-zone metro-zone--consumer" />
      <ellipse cx="605" cy="790" rx="345" ry="215" className="metro-zone metro-zone--technical" />
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
            const boxWidth = Math.max(92, Math.max(...lines.map((line) => line.length)) * 7 + 24);
            const boxHeight = lines.length * 14 + 16;
            const boxX = point.labelX - boxWidth / 2;
            const boxY = point.labelY - boxHeight / 2;
            return (
              <g className="metro-core-label" style={{ color: colors[selectedCycleId] ?? "#164e63" }}>
                <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx="8" />
                {lines.map((line, lineIndex) => (
                  <text key={line} x={point.labelX} y={boxY + 18 + lineIndex * 14} textAnchor="middle">
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
              <button type="submit">Add {section.defaultNoteIntent || "note"}</button>
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
  const participantChips = uniqueText([role.title, ...selectedCycle.audiences]).slice(0, 6);
  const discussionItems = uniqueText([
    ...role.decisions,
    ...stationDetail.steps.map((step) => step.text),
    stationDetail.whyItMatters,
  ]).slice(0, 5);
  const outputItems = uniqueText([...role.outputs, ...stationDetail.outcomes, ...stationDetail.evidence]).slice(0, 5);
  const nextActions = uniqueText([
    selectedStationResources[0]?.canvasId ? `Open ${selectedStationResources[0].title}` : selectedStationResources[0]?.title,
    role.canvases[0]?.title ? `Fill ${role.canvases[0].title}` : undefined,
    rolePrompts[0]?.title ? `Use AI prompt: ${rolePrompts[0].title}` : undefined,
    "Capture decisions, owners, and the next station to visit",
  ]).slice(0, 4);
  const modeKeys = Object.keys(viewLabels) as Array<keyof typeof viewLabels>;
  const aiWorkflowLabels = [
    "Facilitate station discussion",
    "Fill recommended canvas",
    "Review outputs",
    "Decide next action",
  ];

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
      <header className="app-header">
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
      </header>

      <section className="route-control" aria-label="Route controls">
        <label>
          <span>Current route</span>
          <select value={role.id} onChange={(event) => selectRole(event.target.value)}>
            {roleData.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        <label>
          <span>Recommended cycle</span>
          <select value={cycleId} onChange={(event) => setCycleId(event.target.value)}>
            {data.cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.title}</option>)}
          </select>
        </label>
        <label>
          <span>Current station</span>
          <select value={stationId} onChange={(event) => setStationId(event.target.value)}>
            {selectedCycle.stations.map((station) => (
              <option key={station.id} value={station.id}>{shortStationName(station.title)}</option>
            ))}
          </select>
        </label>
        <div className="mode-buttons" aria-label="Workspace modes">
          {modeKeys.map((key) => (
            <button key={key} type="button" className={view === key ? "is-active" : ""} onClick={() => setView(key)}>
              {viewLabels[key]}
            </button>
          ))}
        </div>
      </section>

      <section className="map-stage">
        <article className="map-card" style={{ "--route-color": colors[cycleId] ?? "#6d2ba0" } as CSSProperties}>
          <div className="panel__head map-head">
            <div>
              <p className="section-kicker">Your route on the map</p>
              <h2>{selectedCycle.title}</h2>
              <p>Click a station to change the selected workspace. The highlighted route shows the current cycle.</p>
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
        </article>

        <aside className="station-summary">
          <div className="station-summary__head">
            <span className="station-number">{selectedStation.index || stationDetail.lifecycleStage || "•"}</span>
            <div>
              <p className="you-are-here">You are here</p>
              <h2>{shortStationName(stationDetail.title)}</h2>
            </div>
          </div>
          <p>{stationDetail.description}</p>
          <section>
            <h3>Key questions</h3>
            <ul>{discussionItems.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h3>Recommended next action</h3>
            <p>{nextActions[0] ?? "Capture the decision and choose the next station."}</p>
          </section>
          <section>
            <h3>Related canvases</h3>
            <div className="related-list">
              {role.canvases.slice(0, 4).map((canvas) => (
                <button key={canvas.id} type="button" onClick={() => { setCanvasId(canvas.id); setView("canvases"); }}>
                  {canvas.title}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="station-workspace">
        <aside className="workspace-nav">
          <h2>Station workspace</h2>
          {modeKeys.map((key) => (
            <button key={key} type="button" className={view === key ? "is-active" : ""} onClick={() => setView(key)}>
              {viewLabels[key]}
            </button>
          ))}
          <div className="workspace-route-cards">
            <p className="section-kicker">Guided paths</p>
            {roleData.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === role.id ? "role-card is-active" : "role-card"}
                style={{ "--route-color": colors[item.cycles[0]?.id] ?? "#6d2ba0" } as CSSProperties}
                onClick={() => selectRole(item.id)}
              >
                <strong>{item.title}</strong>
              </button>
            ))}
          </div>
        </aside>

        <section className="workspace-main">
          {view === "map" ? (
            <article className="workspace-panel">
              <p className="section-kicker">Overview</p>
              <h2>{shortStationName(stationDetail.title)} workspace</h2>
              <div className="collaboration-brief" aria-label="Station collaboration brief">
                <section>
                  <small>People</small>
                  <span>Who do I need to involve?</span>
                  <div className="chips chips--compact">
                    {participantChips.map((participant) => <span key={participant}>{participant}</span>)}
                  </div>
                </section>
                <section>
                  <small>Conversation</small>
                  <span>What should we discuss?</span>
                  <ul>{discussionItems.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section>
                  <small>Outputs</small>
                  <span>What should we produce?</span>
                  <ul>{outputItems.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section>
                  <small>Next stop</small>
                  <span>What do we do next?</span>
                  <ul>{nextActions.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
              </div>
            </article>
          ) : null}

          {view === "guide" ? (
            <article className="workspace-panel">
              <p className="section-kicker">People to involve</p>
              <h2>Role guide for {shortStationName(stationDetail.title)}</h2>
              <div className="people-grid">
                {roleData.slice(0, 6).map((item) => (
                  <section key={item.id} className="person-card">
                    <h3>{item.title}</h3>
                    <p><strong>Why they matter:</strong> {item.summary}</p>
                    <p><strong>What to ask:</strong> {item.decisions[0] ?? discussionItems[0]}</p>
                    <p><strong>What they produce:</strong> {item.outputs[0] ?? outputItems[0]}</p>
                  </section>
                ))}
              </div>
            </article>
          ) : null}

          {view === "ai" ? (
            <article className="workspace-panel" id="workflows">
              <p className="section-kicker">Use with AI</p>
              <h2>AI workflow for {shortStationName(stationDetail.title)}</h2>
              <div className="workflow-grid">
                {rolePrompts.slice(0, 4).map((prompt, index) => (
                  <section key={prompt.id} className="prompt-card">
                    <span>{index + 1}. {aiWorkflowLabels[index] ?? prompt.mode}</span>
                    <h3>{prompt.title}</h3>
                    <p><strong>Purpose:</strong> {prompt.mode}</p>
                    <pre>{prompt.prompt}</pre>
                    <button type="button" onClick={() => copyText(prompt.prompt)}>Copy prompt</button>
                  </section>
                ))}
              </div>
            </article>
          ) : null}

          {view === "confluence" ? (
            <article className="workspace-panel">
              <p className="section-kicker">Confluence export</p>
              <h2>Publishing templates</h2>
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
            <article className="workspace-panel">
              <div className="panel__head">
                <div>
                  <p className="section-kicker">Use with canvases</p>
                  <h2>{selectedCanvas.title || "Capability Value Proposition Canvas"}</h2>
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
            <article className="workspace-panel workspace-panel--technical" id="method-data">
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

        <aside className="workspace-utility">
          <section>
            <h3>Facilitation tips</h3>
            <p>Start with outcomes, then confirm evidence, owners, and the next station before choosing templates or canvases.</p>
          </section>
          <section>
            <h3>People to involve</h3>
            <div className="chips chips--compact">
              {participantChips.map((participant) => <span key={participant}>{participant}</span>)}
            </div>
          </section>
          <section>
            <h3>Quick actions</h3>
            <div className="resource-actions">
              <button type="button" onClick={() => setView("canvases")}>Open canvas</button>
              <button type="button" onClick={() => setView("ai")}>Use AI prompts</button>
              <button type="button" onClick={() => setView("confluence")}>Prepare export</button>
            </div>
          </section>
        </aside>
      </section>

      <section className="catalog-section">
        <div className="panel__head">
          <div>
            <p className="section-kicker">Resources for this station</p>
            <h2>{shortStationName(stationDetail.title)}</h2>
          </div>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this station" aria-label="Search station resources" />
        </div>
        <div className="resource-grid">
          {filteredResources.map((resource) => (
            <article key={resource.id} className="resource-card">
              <span>{resource.category}</span>
              <h3>{resource.title}</h3>
              <strong className="resource-purpose">Helps answer: {shortStationName(stationDetail.title)}</strong>
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
