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
};

type CanvasDefinition = {
  id: string;
  title: string;
  purpose: string;
  howToUse: string;
  layout: { columns: number; rows: number };
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

type StickyNotes = Record<string, string[]>;

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
  guide: "Role guide",
  map: "Metro map",
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

function MetroMap({
  cycles,
  selectedCycleId,
  selectedStationId,
  onSelectCycle,
  onSelectStation,
}: {
  cycles: Cycle[];
  selectedCycleId: string;
  selectedStationId: string;
  onSelectCycle: (id: string) => void;
  onSelectStation: (id: string) => void;
}) {
  const width = 880;
  const height = 560;
  const center = { x: 430, y: 286 };
  const coreRadius = 128;
  const coreStations = cycles[0]?.stations ?? [];
  const corePoints = coreStations.map((station, index) => {
    const angle = -90 + (360 / coreStations.length) * index;
    const radians = (angle * Math.PI) / 180;
    return {
      ...station,
      x: center.x + coreRadius * Math.cos(radians),
      y: center.y + coreRadius * Math.sin(radians),
    };
  });

  const paths = cycles.map((cycle, cycleIndex) => {
    const offset = (cycleIndex - 1.4) * 9;
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

  const spokes = [
    { id: "strategic", label: "Strategic", x1: 300, y1: 182, x2: 244, y2: 48, color: "#31a354" },
    { id: "governance", label: "Governance", x1: 536, y1: 214, x2: 704, y2: 120, color: "#1a3987" },
    { id: "technical", label: "Technical", x1: 420, y1: 414, x2: 322, y2: 520, color: "#ffc647" },
    { id: "consumer", label: "Consumer", x1: 296, y1: 334, x2: 126, y2: 384, color: "#17c6e9" },
  ];

  return (
    <svg className="metro-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="APIOps Cycles metro map">
      <ellipse cx="428" cy="284" rx="340" ry="246" className="metro-zone metro-zone--governance" />
      <ellipse cx="300" cy="120" rx="170" ry="96" className="metro-zone metro-zone--strategic" />
      <ellipse cx="192" cy="362" rx="156" ry="96" className="metro-zone metro-zone--consumer" />
      <ellipse cx="462" cy="488" rx="184" ry="116" className="metro-zone metro-zone--technical" />
      {["Governance", "Strategic", "Consumer", "Technical"].map((label, index) => (
        <text key={label} x={[688, 290, 142, 498][index]} y={[132, 76, 306, 456][index]} className="metro-zone-label">
          {label}
        </text>
      ))}
      {spokes.map((spoke) => (
        <g key={spoke.id}>
          <line x1={spoke.x1} y1={spoke.y1} x2={spoke.x2} y2={spoke.y2} stroke={spoke.color} strokeWidth="6" strokeLinecap="round" />
          <circle cx={spoke.x2} cy={spoke.y2} r="6" className="metro-small-node" />
          <text x={spoke.x2 + 10} y={spoke.y2 + 4} className="metro-spoke-label">{spoke.label}</text>
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
          <circle cx={point.x} cy={point.y} r="14" className={point.id === selectedStationId ? "metro-node metro-node--active" : "metro-node"} />
          <text x={point.x} y={point.y + 4} textAnchor="middle" className={point.id === selectedStationId ? "metro-node-number metro-node-number--active" : "metro-node-number"}>
            {point.index}
          </text>
          <text x={point.x} y={point.y + (point.y > center.y ? 38 : -26)} textAnchor="middle" className="metro-label">
            {point.baseTitle}
          </text>
        </g>
      ))}
      <text x={center.x} y={center.y - 6} textAnchor="middle" className="metro-brand">apiops</text>
      <text x={center.x} y={center.y + 14} textAnchor="middle" className="metro-brand">cycles</text>
      <g transform="translate(620 416)">
        {cycles.map((cycle, index) => (
          <g key={cycle.id} transform={`translate(0 ${index * 25})`} onClick={() => onSelectCycle(cycle.id)} className="metro-legend">
            <line x1="0" y1="0" x2="32" y2="0" stroke={colors[cycle.id] ?? "#164e63"} strokeWidth="7" strokeLinecap="round" />
            <text x="44" y="4">{cycle.title}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function CanvasWorkspace({
  canvas,
  role,
}: {
  canvas: CanvasDefinition;
  role: RoleGuide;
}) {
  const storageKey = `apiops-canvas:${role.id}:${canvas.id}`;
  const [notes, setNotes] = useState<StickyNotes>({});
  const [status, setStatus] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setNotes(JSON.parse(stored));
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, storageKey]);

  function addNote(sectionId: string, text: string) {
    const next = text.trim();
    if (!next) return;
    setNotes((current) => ({
      ...current,
      [sectionId]: [...(current[sectionId] ?? []), next],
    }));
  }

  function removeNote(sectionId: string, index: number) {
    setNotes((current) => ({
      ...current,
      [sectionId]: (current[sectionId] ?? []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function exportJson() {
    const payload = {
      roleId: role.id,
      canvasId: canvas.id,
      exportedAt: new Date().toISOString(),
      notes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${role.id}-${canvas.id}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Canvas JSON exported.");
  }

  function markdown() {
    return `# ${canvas.title}\n\nRole: ${role.title}\n\n${canvas.sections
      .map((section) => {
        const sectionNotes = notes[section.id] ?? [];
        return `## ${section.title}\n${sectionNotes.length ? sectionNotes.map((note) => `- ${note}`).join("\n") : "- "}`;
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
    if (!payload.notes || typeof payload.notes !== "object") throw new Error("Invalid canvas export");
    setNotes(payload.notes);
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
                <button key={`${note}-${index}`} type="button" onClick={() => removeNote(section.id, index)} title="Remove note">
                  {note}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const input = event.currentTarget.elements.namedItem("note") as HTMLInputElement;
                addNote(section.id, input.value);
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
  const selectedStation =
    selectedCycle.stations.find((station) => station.id === stationId) ??
    selectedCycle.stations[0];
  const stationDetail =
    data.stations.find((station) => station.id === selectedStation.id) ?? data.stations[0];
  const [view, setView] = useState<keyof typeof viewLabels>("guide");
  const [query, setQuery] = useState("");
  const [canvasId, setCanvasId] = useState(role.canvases[0]?.id ?? Object.keys(canvasData)[0]);

  useEffect(() => {
    const nextRole = safeRole(roleId, roleData);
    setCycleId(nextRole.cycles[0]?.id ?? data.cycles[0].id);
    setStationId(nextRole.stations[0]?.id ?? data.stations[0].id);
    setCanvasId(nextRole.canvases[0]?.id ?? Object.keys(canvasData)[0]);
  }, [locale, roleData, data.cycles, data.stations, canvasData, roleId]);

  const filteredResources = useMemo(() => {
    const roleResourceIds = new Set(role.recommendedResources.map((resource) => resource.id));
    const stationResourceIds = new Set(selectedStation.resources.map((resource) => resource.id));
    const needle = query.trim().toLowerCase();
    return data.resources
      .filter((resource) => !needle || [resource.title, resource.description, resource.category].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => Number(roleResourceIds.has(b.id)) - Number(roleResourceIds.has(a.id)) || Number(stationResourceIds.has(b.id)) - Number(stationResourceIds.has(a.id)))
      .slice(0, 24);
  }, [data.resources, query, role.recommendedResources, selectedStation.resources]);

  const rolePrompts = promptData.filter((prompt) => prompt.roleId === role.id);
  const roleTemplates = templateData.filter((template) => template.roleId === role.id);
  const selectedCanvas = canvasData[canvasId] ?? canvasData[role.canvases[0]?.id] ?? Object.values(canvasData)[0];
  const externalCanvasBase = process.env.NEXT_PUBLIC_CANVAS_RENDERER_BASE_URL;

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

  return (
    <main className="site-shell">
      <header className="hero">
        <nav className="topbar" aria-label="Primary">
          <a className="brand" href={locale === "en" ? "/" : `/${locale}`}>
            <span className="brand__mark">AC</span>
            <span>APIOps Cycles</span>
          </a>
          <div className="topbar__controls">
            <a href="#workflows">Workflows</a>
            <a href="#method-data">Data</a>
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

      <section className="workbench">
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
                    <ul>{selectedStation.resources.slice(0, 6).map((resource) => <li key={resource.id}>{resource.title}</li>)}</ul>
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
              <MetroMap cycles={data.cycles} selectedCycleId={cycleId} selectedStationId={stationId} onSelectCycle={setCycleId} onSelectStation={setStationId} />
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
              <div className="template-grid">
                {roleTemplates.map((template) => (
                  <section key={template.id} className="template-card">
                    <span>{template.format}</span>
                    <h3>{template.title}</h3>
                    <pre>{template.body}</pre>
                    <button type="button" onClick={() => copyText(template.body)}>Copy template</button>
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
              {externalCanvasBase ? (
                <a className="external-link" href={`${externalCanvasBase.replace(/\/$/, "")}/${selectedCanvas.id}`} target="_blank" rel="noreferrer">
                  Open in external canvas renderer
                </a>
              ) : (
                <p className="helper-text">No external canvas renderer is configured, so this page uses the built-in local workspace.</p>
              )}
              <CanvasWorkspace canvas={selectedCanvas} role={role} />
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
            <h2>Search all resources</h2>
          </div>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources" aria-label="Search resources" />
        </div>
        <div className="resource-grid">
          {filteredResources.map((resource) => (
            <article key={resource.id} className="resource-card">
              <span>{resource.category}</span>
              <h3>{resource.title}</h3>
              <p>{compact(resource.description, 165)}</p>
              {resource.canvasId ? <button type="button" onClick={() => { setView("canvases"); setCanvasId(resource.canvasId ?? canvasId); }}>Open canvas</button> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
