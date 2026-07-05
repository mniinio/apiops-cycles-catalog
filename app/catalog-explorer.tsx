"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

type Resource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  outcomes: string[];
  steps: string[];
  canvasId?: string | null;
  sourcePath?: string | null;
  sourceUrl?: string | null;
  contentMarkdown?: string | null;
};

type Criterion = {
  id: string;
  title: string;
  description: string;
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
  audienceStakeholders: Stakeholder[];
  entryCriteria: string[];
  exitCriteria: string[];
  entryCriteriaDetails: Criterion[];
  exitCriteriaDetails: Criterion[];
  questionnaireResources: {
    stationId: string;
    stationTitle: string;
    resourceId: string;
    resourceTitle: string;
    canvasId?: string | null;
    suggestedAnswerOwner: Stakeholder;
  }[];
  confluenceTemplateSections: { id: string; title: string; description: string }[];
  stations: CycleStation[];
};

type MetroLine = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon?: string;
  color: string;
  order: number;
  stations: string[];
};

type Station = {
  id: string;
  icon: string;
  title: string;
  description: string;
  whyItMatters: string;
  applyInWork: string;
  group: string;
  lifecycleStage: string;
  outcomes: string[];
  steps: { text: string; resourceId?: string; resourceTitle?: string; canvasId?: string | null }[];
  questions: string[];
  criteria: string[];
  criteriaDetails: Criterion[];
  stakeholders: Stakeholder[];
  evidence: string[];
};

type Stakeholder = {
  id: string;
  sourceKey?: string;
  sourceStakeholderId?: string;
  title: string;
  description: string;
  involvement?: string;
};

type Translation = {
  labels?: Record<string, string>;
  cycles: Cycle[];
  lines: MetroLine[];
  stations: Station[];
  stakeholders: Stakeholder[];
  routeProfiles: RouteProfile[];
  resources: Resource[];
};

type Catalog = {
  source: { repository: string; branch: string; commit: string };
  locales: string[];
  defaultLocale: string;
  translations: Record<string, Translation>;
};

type LabelData = {
  translations: Record<string, Record<string, string>>;
};

type Partner = {
  title: string;
  href: string;
  logo: string;
  description: string;
};

type PartnerData = {
  items: Partner[];
};

type RouteProfile = {
  id: string;
  stakeholderId: string;
  title: string;
  summary: string;
  stakeholder: Stakeholder;
  cycles: { id: string; title: string; description: string }[];
  stations: { id: string; title: string; description: string }[];
  canvases: { id: string; title: string }[];
  decisions: string[];
  outputs: string[];
  recommendedResources: Resource[];
  promptIds: string[];
  exportTemplateIds: string[];
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
  routeId: string;
  title: string;
  mode: string;
  prompt: string;
};

type PromptData = {
  translations: Record<string, PromptPack[]>;
};

type ExportTemplate = {
  id: string;
  routeId: string;
  cycleId?: string;
  format: string;
  title: string;
  sections?: { id: string; title: string; description: string }[];
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

const viewKeys = ["map", "guide", "canvases", "ai", "confluence", "data"] as const;
type ViewKey = (typeof viewKeys)[number];

const fallbackLabels: Record<string, string> = {
  "nav.workflows": "Workflows",
  "nav.data": "Data",
  "nav.language": "Language",
  "nav.licensing": "Licensing",
  "nav.github": "GitHub",
  "nav.community": "Community",
  "controls.currentRoute": "Current route",
  "controls.recommendedCycle": "Recommended cycle",
  "controls.currentStation": "Current station",
  "views.map": "Metro map",
  "views.guide": "Role guide",
  "views.canvases": "Resources",
  "views.ai": "Use with AI",
  "views.confluence": "Confluence",
  "views.data": "Method data",
  "map.kicker": "Your route on the map",
  "map.instructions": "Click a station to change the selected workspace. The highlighted route shows the current cycle.",
  "map.linesTitle": "Metro lines",
  "map.linesDescription": "Lines show decision tracks across the shared APIOps backbone. Cycles show the journey for a goal.",
  "station.youAreHere": "You are here",
  "station.keyQuestions": "Key questions",
  "station.nextAction": "Recommended next action",
  "station.whereNext": "Where can I go next?",
  "station.before": "Before this station",
  "station.ready": "Ready to leave when",
  "station.previous": "Previous",
  "station.next": "Next",
  "station.coreStation": "Core station",
  "station.subStation": "Sub-station",
  "station.relatedCanvases": "Related canvases",
  "station.relatedResources": "Related resources",
  "station.people": "People to involve",
  "resources.emptyCanvases": "No canvas resources are directly linked to this station.",
  "resources.emptyOther": "No additional resources are directly linked to this station.",
  "canvas.localWorkspace": "Local canvas workspace",
  "canvas.exportMarkdown": "Export Markdown",
  "canvas.exportJson": "Export JSON",
  "canvas.importJson": "Import JSON",
  "canvas.exportSvg": "Export SVG",
  "canvas.exportPng": "Export PNG",
  "canvas.exportPdf": "Export PDF",
  "canvas.exportUnavailable": "Configure NEXT_PUBLIC_CANVAS_RENDERER_BASE_URL to export styled SVG, PNG, or PDF with CanvasCreator.",
  "canvas.openCreator": "Open in CanvasCreator",
  "canvas.markdownExported": "Canvas Markdown exported.",
  "canvas.jsonExported": "Canvas JSON exported.",
  "canvas.jsonImported": "Canvas JSON imported.",
  "partners.kicker": "Community and partners",
  "partners.title": "Built with the APIOps Cycles community",
  "partners.description": "APIOps Cycles is an open method. Partners help develop, use, and teach it with teams around the world.",
  "footer.license": "Licensed under CC-BY-SA 4.0.",
  "footer.github": "GitHub repository",
  "footer.community": "Community events and joining",
};

function compact(text: string, max = 150) {
  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function safeRole(roleId: string, roles: RouteProfile[]) {
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

function uniqueById<T extends { id: string }>(items: Array<T | undefined | null>) {
  const seen = new Set<string>();
  return items.filter((item): item is T => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function publicIconPath(icon?: string) {
  if (icon === "check-box-outline" || icon === "check-circle") return `/icons/${icon}.svg`;
  return "";
}

function categoryLabel(methodLabels: Record<string, string>, siteLabels: Record<string, string>, category: string) {
  const key = `category_${category}`;
  return methodLabels[key] ?? siteLabels[key] ?? category;
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
      displayTitle: selectedCycleStation?.title ?? station.baseTitle,
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
              <text x={point.x + point.dx} y={point.y + point.dy} textAnchor={point.anchor} dominantBaseline="middle" className="metro-support-label">{point.baseTitle}</text>
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
  labels,
  canvasRendererBaseUrl,
}: {
  canvas: CanvasDefinition;
  role: RouteProfile;
  locale: string;
  labels: Record<string, string>;
  canvasRendererBaseUrl?: string;
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
    setStatus(labels["canvas.jsonExported"] ?? fallbackLabels["canvas.jsonExported"]);
  }

  function markdown() {
    return `# ${canvas.title}\n\n${canvas.purpose}\n\n${canvas.howToUse ? `${canvas.howToUse}\n\n` : ""}Role: ${role.title}\n\n${canvas.sections
      .map((section) => {
        const sectionNotes = notes[section.id] ?? [];
        return `## ${section.title}\n\n${section.description}\n\n${sectionNotes.length ? sectionNotes.map((note) => `- ${note.content}`).join("\n") : "- "}`;
      })
      .join("\n\n")}\n`;
  }

  function exportMarkdown() {
    const blob = new Blob([markdown()], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${canvas.id}_${locale}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus(labels["canvas.markdownExported"] ?? fallbackLabels["canvas.markdownExported"]);
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
    setStatus(labels["canvas.jsonImported"] ?? fallbackLabels["canvas.jsonImported"]);
  }

  return (
    <section className="workspace">
      <div className="workspace__head">
        <div>
          <p className="section-kicker">{labels["canvas.localWorkspace"] ?? fallbackLabels["canvas.localWorkspace"]}</p>
          <h2>{canvas.title}</h2>
          <p>{canvas.purpose}</p>
        </div>
        <div className="toolbar">
          <button type="button" onClick={exportMarkdown}>{labels["canvas.exportMarkdown"] ?? fallbackLabels["canvas.exportMarkdown"]}</button>
          <button type="button" onClick={exportJson}>{labels["canvas.exportJson"] ?? fallbackLabels["canvas.exportJson"]}</button>
          <button type="button" onClick={() => importRef.current?.click()}>{labels["canvas.importJson"] ?? fallbackLabels["canvas.importJson"]}</button>
          <a className="button-link" href={canvasRendererBaseUrl ? `${canvasRendererBaseUrl.replace(/\/$/, "")}/${canvas.id}` : canvas.canvasCreatorUrl} target="_blank" rel="noreferrer">
            SVG / PNG / PDF in CanvasCreator
          </a>
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

function ResourceDetail({
  resource,
  stationTitle,
}: {
  resource: Resource;
  stationTitle: string;
}) {
  return (
    <section className="resource-detail" aria-label={`${resource.title} details`}>
      <div>
        <p className="section-kicker">{resource.category}</p>
        <h3>{resource.title}</h3>
        <strong className="resource-purpose">Helps answer: {stationTitle}</strong>
      </div>
      <p>{resource.description}</p>
      {resource.outcomes.length ? (
        <section>
          <h4>Expected outcomes</h4>
          <ul>{resource.outcomes.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ) : null}
      {resource.steps.length ? (
        <section>
          <h4>How to use it</h4>
          <ol>{resource.steps.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
      ) : null}
      {resource.contentMarkdown ? (
        <section>
          <h4>Source content</h4>
          <pre>{resource.contentMarkdown}</pre>
        </section>
      ) : null}
      {resource.sourcePath || resource.sourceUrl ? (
        <p className="helper-text">
          Source: {resource.sourceUrl ? <a href={resource.sourceUrl}>{resource.sourceUrl}</a> : <code>{resource.sourcePath}</code>}
        </p>
      ) : null}
    </section>
  );
}

export default function CatalogExplorer({
  catalog,
  canvases,
  prompts,
  exportsData,
  labels,
  partners,
  initialLocale,
  initialCycleId,
  initialStationId,
}: {
  catalog: Catalog;
  canvases: CanvasManifest;
  prompts: PromptData;
  exportsData: ExportData;
  labels: LabelData;
  partners: PartnerData;
  initialLocale: string;
  initialCycleId?: string;
  initialStationId?: string;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const data = catalog.translations[locale] ?? catalog.translations.en;
  const methodLabels = data.labels ?? {};
  const roleData = data.routeProfiles;
  const promptData = prompts.translations[locale] ?? prompts.translations.en;
  const templateData = exportsData.translations[locale] ?? exportsData.translations.en;
  const canvasData = canvases.translations[locale] ?? canvases.translations.en;
  const localizedLabels = { ...fallbackLabels, ...(labels.translations[locale] ?? labels.translations.en) };
  const initialCycle = data.cycles.find((cycle) => cycle.id === initialCycleId || cycle.slug === initialCycleId) ?? data.cycles.find((cycle) => cycle.stations.some((station) => station.id === initialStationId)) ?? data.cycles[0];
  const initialStation = initialStationId && initialCycle.stations.some((station) => station.id === initialStationId)
    ? initialStationId
    : initialCycle.stations[0]?.id;
  const initialRole = roleData.find((item) =>
    item.cycles.some((cycle) => cycle.id === initialCycle.id) &&
    (!initialStation || item.stations.some((station) => station.id === initialStation)),
  ) ?? roleData[0];
  const [roleId, setRoleId] = useState(initialRole.id);
  const role = safeRole(roleId, roleData);
  const [cycleId, setCycleId] = useState(initialCycle.id);
  const selectedCycle = data.cycles.find((cycle) => cycle.id === cycleId) ?? data.cycles[0];
  const [stationId, setStationId] = useState(initialStation ?? role.stations[0]?.id ?? selectedCycle.stations[0].id);
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
  const [view, setView] = useState<ViewKey>("map");
  const [canvasId, setCanvasId] = useState(role.canvases[0]?.id ?? Object.keys(canvasData)[0]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedResourceId(null);
  }, [locale]);

  const rolePrompts = promptData.filter((prompt) => prompt.routeId === role.id);
  const roleTemplates = templateData.filter((template) => template.routeId === role.id);
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
  const selectedCycleColor = colors[cycleId] ?? "#6d2ba0";
  const stationTitle = selectedStation.title || stationDetail.title;
  const stationDescription = selectedStation.description || stationDetail.description;
  const stationBadge = String(selectedStation.index || stationDetail.lifecycleStage || "-");
  const stationBadgeIsNumber = /^\d+$/.test(stationBadge);
  const stakeholderParticipants = uniqueById([
    role.stakeholder,
    ...(stationDetail.stakeholders ?? []),
    ...(selectedCycle.audienceStakeholders ?? []),
  ]).filter(Boolean);
  const participantChips = stakeholderParticipants.map((item) => item.title).slice(0, 8);
  const stationQuestions = uniqueText([
    ...(stationDetail.questions ?? []),
    ...stationDetail.steps.map((step) => step.text),
    stationDetail.applyInWork,
    stationDetail.whyItMatters,
  ]).slice(0, 5);
  const selectedCycleStationIndex = selectedCycle.stations.findIndex((station) => station.id === stationId);
  const previousCycleStation = selectedCycleStationIndex > 0 ? selectedCycle.stations[selectedCycleStationIndex - 1] : null;
  const previousStationDetail = previousCycleStation ? data.stations.find((station) => station.id === previousCycleStation.id) : null;
  const beforeCriteria = selectedCycleStationIndex <= 0
    ? selectedCycle.entryCriteriaDetails
    : previousStationDetail?.criteriaDetails ?? [];
  const readyCriteria = stationDetail.criteriaDetails.length ? stationDetail.criteriaDetails : selectedCycle.exitCriteriaDetails;
  const lineNavigation = data.lines
    .map((line) => {
      const index = line.stations.indexOf(stationId);
      if (index < 0) return null;
      const adjacent = [
        { direction: localizedLabels["station.previous"], id: line.stations[index - 1] },
        { direction: localizedLabels["station.next"], id: line.stations[index + 1] },
      ].filter((item): item is { direction: string; id: string } => Boolean(item.id));
      if (!adjacent.length) return null;
      return {
        ...line,
        adjacent: adjacent.map((item) => {
          const cycleStation = selectedCycle.stations.find((station) => station.id === item.id);
          const detail = data.stations.find((station) => station.id === item.id);
          return {
            ...item,
            title: cycleStation?.title ?? shortStationName(detail?.title ?? item.id),
            description: cycleStation?.description ?? detail?.description ?? "",
            core: Boolean(cycleStation),
          };
        }),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const roleGuideRows = stakeholderParticipants.map((stakeholder) => {
    const profile = roleData.find((item) => item.stakeholderId === stakeholder.id || item.id === stakeholder.id);
    return {
      id: stakeholder.id,
      title: stakeholder.title,
      summary: stakeholder.description || profile?.summary || `${stakeholder.title} participates in this station.`,
      decisions: stationQuestions,
      outputs: uniqueText([...(stationDetail.outcomes ?? []), ...(stationDetail.evidence ?? []), ...(profile?.outputs ?? [])]),
      involvement: stakeholder.involvement,
    };
  });
  const canvasResources = selectedStationResources.filter((resource) => resource.canvasId);
  const otherResources = selectedStationResources.filter((resource) => !resource.canvasId);
  const selectedResource = selectedStationResources.find((resource) => resource.id === selectedResourceId) ?? null;
  const activeResource = selectedResource ?? canvasResources[0] ?? otherResources[0] ?? null;
  const activeCanvasId = activeResource?.canvasId ?? canvasId;
  const selectedCanvas = canvasData[activeCanvasId] ?? canvasData[role.canvases[0]?.id] ?? Object.values(canvasData)[0];
  const externalCanvasUrl = process.env.NEXT_PUBLIC_CANVAS_RENDERER_BASE_URL
    ? `${process.env.NEXT_PUBLIC_CANVAS_RENDERER_BASE_URL.replace(/\/$/, "")}/${selectedCanvas.id}`
    : selectedCanvas.canvasCreatorUrl;
  const discussionItems = stationQuestions;
  const outputItems = uniqueText([...role.outputs, ...stationDetail.outcomes, ...stationDetail.evidence]).slice(0, 5);
  const nextActions = uniqueText([
    lineNavigation[0]?.adjacent[0]?.title ? `${lineNavigation[0].adjacent[0].direction}: ${lineNavigation[0].adjacent[0].title}` : undefined,
    "Capture decisions, owners, and the next station to visit",
  ]).slice(0, 4);
  const modeKeys = viewKeys;
  const primaryAiPrompts = rolePrompts.filter((prompt) => ["facilitate-station", "next-actions"].includes(prompt.mode)).slice(0, 2);

  function bestRoleFor(nextCycleId: string, nextStationId: string) {
    const roleSupports = (item: RouteProfile) =>
      item.cycles.some((cycle) => cycle.id === nextCycleId) &&
      item.stations.some((station) => station.id === nextStationId);
    if (roleSupports(role)) return role.id;
    return (
      roleData.find(roleSupports)?.id ??
      roleData.find((item) => item.cycles.some((cycle) => cycle.id === nextCycleId))?.id ??
      role.id
    );
  }

  function firstCanvasFor(resources: Resource[], fallbackRole: RouteProfile) {
    return resources.find((resource) => resource.canvasId)?.canvasId ?? fallbackRole.canvases[0]?.id ?? Object.keys(canvasData)[0];
  }

  function replaceWorkspaceUrl(kind: "cycle" | "station", id: string) {
    const prefix = locale === "en" ? "" : `/${locale}`;
    const path = kind === "cycle" ? `${prefix}/cycles/${id}` : `${prefix}/stations/${id}`;
    window.history.replaceState(null, "", path);
  }

  function selectRole(nextRoleId: string) {
    const nextRole = safeRole(nextRoleId, roleData);
    const nextCycleId = nextRole.cycles[0]?.id ?? cycleId;
    const nextCycle = data.cycles.find((cycle) => cycle.id === nextCycleId) ?? selectedCycle;
    const nextStationId = nextRole.stations.find((station) => nextCycle.stations.some((cycleStation) => cycleStation.id === station.id))?.id ?? nextCycle.stations[0]?.id ?? stationId;
    const nextCycleStation = nextCycle.stations.find((station) => station.id === nextStationId);
    const nextStationDetail = data.stations.find((station) => station.id === nextStationId);
    const nextStepResourceIds = new Set((nextStationDetail?.steps ?? []).map((step) => step.resourceId).filter(Boolean));
    const nextResources = nextCycleStation?.resources.length
      ? nextCycleStation.resources
      : data.resources.filter((resource) => nextStepResourceIds.has(resource.id));
    setRoleId(nextRoleId);
    setCycleId(nextCycleId);
    setStationId(nextStationId);
    setCanvasId(firstCanvasFor(nextResources, nextRole));
    setSelectedResourceId(null);
  }

  function selectCycle(nextCycleId: string) {
    const nextCycle = data.cycles.find((cycle) => cycle.id === nextCycleId) ?? selectedCycle;
    const nextStationId = nextCycle.stations.some((station) => station.id === stationId) ? stationId : nextCycle.stations[0]?.id ?? stationId;
    const nextRoleId = bestRoleFor(nextCycleId, nextStationId);
    setCycleId(nextCycleId);
    setStationId(nextStationId);
    if (nextRoleId !== roleId) setRoleId(nextRoleId);
    setSelectedResourceId(null);
    replaceWorkspaceUrl("cycle", nextCycle.slug || nextCycle.id);
  }

  function selectStation(nextStationId: string) {
    const nextRoleId = bestRoleFor(cycleId, nextStationId);
    setStationId(nextStationId);
    if (nextRoleId !== roleId) setRoleId(nextRoleId);
    setSelectedResourceId(null);
    replaceWorkspaceUrl("station", nextStationId);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  function openCanvas(nextCanvasId: string) {
    setCanvasId(nextCanvasId);
    setSelectedResourceId(canvasResources.find((resource) => resource.canvasId === nextCanvasId)?.id ?? null);
    setView("canvases");
  }

  function promptFor(prompt: PromptPack) {
    const resources = selectedStationResources.map((resource) => resource.title).join(", ") || "No station-specific resources listed";
    const canvasList = canvasResources.map((resource) => resource.title).join(", ") || "No station-specific canvases listed";
    return `Selected APIOps Cycles context
Route: ${role.title}
Cycle: ${selectedCycle.title}
Station: ${stationTitle}
Station purpose: ${stationDescription}
Station resources: ${resources}
Station canvases: ${canvasList}

${prompt.prompt}`;
  }

  function openResource(resource: Resource) {
    if (resource.canvasId) {
      openCanvas(resource.canvasId);
      setSelectedResourceId(resource.id);
      return;
    }
    setSelectedResourceId(resource.id);
    setView("canvases");
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
            <a href="#licensing">{localizedLabels["nav.licensing"]}</a>
            <a href={catalog.source.repository} target="_blank" rel="noreferrer">{localizedLabels["nav.github"]}</a>
            <a href="#community">{localizedLabels["nav.community"]}</a>
            <button type="button" onClick={() => setView("ai")}>{localizedLabels["nav.workflows"]}</button>
            <button type="button" onClick={() => setView("data")}>{localizedLabels["nav.data"]}</button>
            <label className="sr-only" htmlFor="locale">{localizedLabels["nav.language"]}</label>
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
          <span>{localizedLabels["controls.currentRoute"]}</span>
          <select value={role.id} onChange={(event) => selectRole(event.target.value)}>
            {roleData.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        <label>
          <span>{localizedLabels["controls.recommendedCycle"]}</span>
          <select value={cycleId} onChange={(event) => selectCycle(event.target.value)}>
            {data.cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.title}</option>)}
          </select>
        </label>
        <label>
          <span>{localizedLabels["controls.currentStation"]}</span>
          <select value={stationId} onChange={(event) => selectStation(event.target.value)}>
            {selectedCycle.stations.map((station) => (
              <option key={station.id} value={station.id}>{shortStationName(station.title)}</option>
            ))}
          </select>
        </label>
        <div className="mode-buttons" aria-label="Workspace modes">
          {modeKeys.map((key) => (
            <button key={key} type="button" className={view === key ? "is-active" : ""} onClick={() => setView(key)}>
              {localizedLabels[`views.${key}`]}
            </button>
          ))}
        </div>
      </section>

      <section className={view === "map" ? "main-workspace main-workspace--map" : "main-workspace"}>
        <section className="workspace-main">
        {view === "map" ? (
        <article className="map-card" style={{ "--route-color": selectedCycleColor } as CSSProperties}>
          <div className="panel__head map-head">
            <div>
              <p className="section-kicker">{localizedLabels["map.kicker"]}</p>
              <h2>{selectedCycle.title}</h2>
              <p>{localizedLabels["map.instructions"]}</p>
            </div>
            <div className="cycle-pills" aria-label="Select cycle">
              {data.cycles.map((cycle) => (
                <button
                  key={cycle.id}
                  type="button"
                  className={cycle.id === cycleId ? "is-active" : ""}
                  onClick={() => selectCycle(cycle.id)}
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
            onSelectCycle={selectCycle}
            onSelectStation={selectStation}
          />
          <section className="line-guide" aria-label={localizedLabels["map.linesTitle"]}>
            <div>
              <h3>{localizedLabels["map.linesTitle"]}</h3>
              <p>{localizedLabels["map.linesDescription"]}</p>
            </div>
            <div className="line-guide__items">
              {data.lines.map((line) => (
                <span key={line.id} title={line.description}>
                  <i style={{ backgroundColor: line.color }} />
                  {line.title}
                </span>
              ))}
            </div>
          </section>
        </article>
        ) : null}

          {view === "guide" ? (
            <article className="workspace-panel">
              <p className="section-kicker">People to involve</p>
              <h2>Role guide for {stationTitle}</h2>
              <div className="role-table" role="table" aria-label={`Role guide for ${stationTitle}`}>
                <div className="role-table__row role-table__row--head" role="row">
                  <span role="columnheader">Role</span>
                  <span role="columnheader">Why they matter</span>
                  <span role="columnheader">What to ask</span>
                  <span role="columnheader">What they produce</span>
                </div>
                {roleGuideRows.slice(0, 8).map((item) => (
                  <div key={item.id} className={item.id === role.id ? "role-table__row is-active" : "role-table__row"} role="row" id={`role-${item.id}`}>
                    <strong role="cell">{item.title}</strong>
                    <span role="cell">{item.summary}</span>
                    <span role="cell">{stationQuestions[0] ?? item.decisions[0] ?? discussionItems[0]}</span>
                    <span role="cell">{stationDetail.outcomes[0] ?? stationDetail.evidence[0] ?? item.outputs[0] ?? outputItems[0]}</span>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {view === "canvases" ? (
            <article className="workspace-panel">
              <div className="panel__head">
                <div>
                  <p className="section-kicker">Resources</p>
                  <h2>{activeResource?.title ?? `Resources for ${stationTitle}`}</h2>
                  <p className="helper-text">Select a station resource from the details panel. Canvas resources open the local sticky-note workspace; other resources open guidance, examples, or checklists here.</p>
                </div>
                <select value={activeResource?.id ?? ""} onChange={(event) => {
                  const nextResource = selectedStationResources.find((resource) => resource.id === event.target.value);
                  if (nextResource) openResource(nextResource);
                }} aria-label="Select resource">
                  {!selectedStationResources.length ? <option value="">No station resources</option> : null}
                  {selectedStationResources.map((resource) => (
                    <option key={resource.id} value={resource.id}>{resource.title}</option>
                  ))}
                </select>
              </div>
              {activeResource?.canvasId ? (
                <>
              {externalCanvasUrl ? (
                    <a className="external-link" href={externalCanvasUrl} target="_blank" rel="noreferrer">
                      {localizedLabels["canvas.openCreator"]}
                    </a>
                  ) : (
                    <p className="helper-text">No external canvas renderer is configured, so this page uses the built-in local workspace.</p>
                  )}
                  <CanvasWorkspace canvas={selectedCanvas} role={role} locale={locale} labels={localizedLabels} canvasRendererBaseUrl={process.env.NEXT_PUBLIC_CANVAS_RENDERER_BASE_URL} />
                </>
              ) : activeResource ? (
                <ResourceDetail resource={activeResource} stationTitle={stationTitle} />
              ) : (
                <p className="helper-text">No resources are directly linked to this station in the selected cycle.</p>
              )}
            </article>
          ) : null}

          {view === "ai" ? (
            <article className="workspace-panel" id="workflows">
              <p className="section-kicker">Use with AI</p>
              <h2>AI assistance for {stationTitle}</h2>
              <p className="helper-text">Use AI to facilitate the station conversation, work through the selected Resources, and turn canvas notes or resource findings into next actions.</p>
              <div className="workflow-grid workflow-grid--focused">
                {primaryAiPrompts.map((prompt, index) => (
                  <section key={prompt.id} className="prompt-card">
                    <span>{index + 1}. {prompt.mode === "facilitate-station" ? "Facilitate station discussion" : "Decide next action"}</span>
                    <h3>{prompt.mode === "facilitate-station" ? `Facilitate ${stationTitle}` : `Next actions for ${stationTitle}`}</h3>
                    <p><strong>Purpose:</strong> {prompt.mode}</p>
                    <pre>{promptFor(prompt)}</pre>
                    <button type="button" onClick={() => copyText(promptFor(prompt))}>Copy prompt</button>
                  </section>
                ))}
              </div>
              <div className="resource-actions resource-actions--inline">
                <button type="button" onClick={() => setView("canvases")}>
                  Use station resources with AI
                  <span>Open Resources, select a canvas or guidance item, then copy its Markdown or JSON into your AI conversation.</span>
                </button>
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

          {view === "data" ? (
            <article className="workspace-panel workspace-panel--technical" id="method-data">
              <p className="section-kicker">Method data</p>
              <h2>Static integration surfaces</h2>
              <p>These JSON files are published with the site and can be consumed by future MCP tools, documentation generators, or external canvas renderers.</p>
              <div className="data-links">
                {[
                  "method-catalog.json",
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

        <aside className={view === "map" ? "station-summary" : "context-panel"} style={{ "--route-color": selectedCycleColor } as CSSProperties}>
          {view === "confluence" ? (
            <>
              <div>
                <p className="section-kicker">Cycle export</p>
                <h2>{selectedCycle.title}</h2>
              </div>
              <p>{selectedCycle.description}</p>
              <section>
                <h3>Intended audience</h3>
                <div className="chips chips--compact">
                  {uniqueText([role.title, ...selectedCycle.audiences]).map((participant) => <span key={participant}>{participant}</span>)}
                </div>
              </section>
              <section>
                <h3>Format guidance</h3>
                <p>Use Markdown for docs repositories and static sites. Use Confluence-wiki for Confluence pages that accept wiki markup.</p>
              </section>
            </>
          ) : view === "data" ? (
            <>
              <div>
                <p className="section-kicker">Method data</p>
                <h2>Static integration surfaces</h2>
              </div>
              <p>All workspace views consume generated JSON under <code>/data</code>. No database or server-side persistence is introduced.</p>
              <section>
                <h3>Source dependency</h3>
                <p><code>{catalog.source.repository}</code></p>
                <p>Branch: <code>{catalog.source.branch}</code></p>
              </section>
              <section>
                <h3>Locale-safe</h3>
                <p>Default locale is <code>{catalog.defaultLocale}</code>; published locales are {catalog.locales.join(", ")}.</p>
              </section>
            </>
          ) : (
            <>
          <div className="station-summary__head">
            <span className={stationBadgeIsNumber || publicIconPath(stationDetail.icon) ? "station-number" : "station-number station-number--text"}>
              {publicIconPath(stationDetail.icon) ? <img src={publicIconPath(stationDetail.icon)} alt="" /> : selectedStation.index || stationDetail.lifecycleStage || "•"}
            </span>
            <div>
              <p className="you-are-here">{localizedLabels["station.youAreHere"]}</p>
              <h2>{stationTitle}</h2>
            </div>
          </div>
          <p>{stationDescription}</p>
          <section>
            <h3>{localizedLabels["station.keyQuestions"]}</h3>
            <ul>{discussionItems.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h3>{localizedLabels["station.before"]}</h3>
            <ul className="criteria-list">
              {beforeCriteria.slice(0, 4).map((criterion) => (
                <li key={criterion.id}>
                  <img src="/icons/check-box-outline.svg" alt="" />
                  <span>{criterion.title}</span>
                </li>
              ))}
              {!beforeCriteria.length ? <li>{selectedCycle.entryCriteria.join(", ") || "No entry criteria listed."}</li> : null}
            </ul>
          </section>
          <section>
            <h3>{localizedLabels["station.ready"]}</h3>
            <ul className="criteria-list">
              {readyCriteria.slice(0, 4).map((criterion) => (
                <li key={criterion.id}>
                  <img src="/icons/check-circle.svg" alt="" />
                  <span>{criterion.title}</span>
                </li>
              ))}
              {!readyCriteria.length ? <li>{selectedCycle.exitCriteria.join(", ") || "No exit criteria listed."}</li> : null}
            </ul>
          </section>
          <section>
            <h3>{localizedLabels["station.relatedCanvases"]}</h3>
            <div className="side-resource-grid">
              {canvasResources.map((resource) => (
                <button key={resource.id} type="button" className={activeResource?.id === resource.id ? "side-resource-card is-active" : "side-resource-card"} onClick={() => openResource(resource)}>
                  <span>{categoryLabel(methodLabels, localizedLabels, resource.category)}</span>
                  <strong>{resource.title}</strong>
                  <small>{compact(resource.description, 96)}</small>
                </button>
              ))}
              {!canvasResources.length ? <p className="helper-text">{localizedLabels["resources.emptyCanvases"]}</p> : null}
            </div>
          </section>
              <section>
                <h3>{localizedLabels["station.relatedResources"]}</h3>
                <div className="side-resource-grid">
                  {otherResources.map((resource) => (
                    <button key={resource.id} type="button" className={activeResource?.id === resource.id ? "side-resource-card is-active" : "side-resource-card"} onClick={() => openResource(resource)}>
                      <span>{categoryLabel(methodLabels, localizedLabels, resource.category)}</span>
                      <strong>{resource.title}</strong>
                      <small>{compact(resource.description, 96)}</small>
                    </button>
                  ))}
                  {!otherResources.length ? <p className="helper-text">{localizedLabels["resources.emptyOther"]}</p> : null}
                </div>
              </section>
              <section>
                <h3>{localizedLabels["station.people"]}</h3>
                <div className="chips chips--compact chips--buttons">
                  {participantChips.map((participant) => (
                    <button key={participant} type="button" onClick={() => setView("guide")}>{participant}</button>
                  ))}
                </div>
              </section>
              <section className="line-next-section">
                <h3>{localizedLabels["station.whereNext"]}</h3>
                <div className="line-next-grid">
                  {lineNavigation.map((line) => (
                    <article key={line.id} className="line-next-card">
                      <strong><i style={{ backgroundColor: line.color }} />{line.title}</strong>
                      <div>
                        {line.adjacent.map((item) => (
                          <button key={`${line.id}-${item.direction}-${item.id}`} type="button" onClick={() => selectStation(item.id)}>
                            <span>{item.direction} · {item.core ? localizedLabels["station.coreStation"] : localizedLabels["station.subStation"]}</span>
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                  {!lineNavigation.length ? <p className="helper-text">No line transitions are listed for this station.</p> : null}
                </div>
              </section>
            </>
          )}
        </aside>
      </section>
      <section className="partners-section" id="community" aria-label={localizedLabels["partners.title"]}>
        <div className="partners-section__head">
          <p className="section-kicker">{localizedLabels["partners.kicker"]}</p>
          <h2>{localizedLabels["partners.title"]}</h2>
          <p>{localizedLabels["partners.description"]}</p>
        </div>
        <div className="partner-grid">
          {partners.items.map((partner) => (
            <a key={partner.title} className="partner-card" href={partner.href} target="_blank" rel="noreferrer">
              <img src={partner.logo} alt={`${partner.title} logo`} />
              <div>
                <h3>{partner.title}</h3>
                <p>{partner.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
      <footer className="site-footer" id="licensing">
        <span>{localizedLabels["footer.license"]}</span>
        <a href={catalog.source.repository} target="_blank" rel="noreferrer">{localizedLabels["footer.github"]}</a>
        <a href="https://www.apiops.info" target="_blank" rel="noreferrer">{localizedLabels["footer.community"]}</a>
      </footer>
    </main>
  );
}
