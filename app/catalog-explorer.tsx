"use client";

import { type CSSProperties, type RefObject, useEffect, useRef, useState } from "react";

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
  slug?: string;
  icon: string;
  title: string;
  description: string;
  whyItMatters: string;
  applyInWork: string;
  outcomes: string[];
  steps: { text: string; resourceId?: string; resourceTitle?: string; canvasId?: string | null }[];
  questions: string[];
  criteria: string[];
  criteriaDetails: Criterion[];
  baseTitle: string;
  group: string;
  lifecycleStage: string;
  stakeholders: Stakeholder[];
  resources: Resource[];
  evidence: string[];
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
  responsibilities?: {
    resourceId: string;
    resourceTitle: string;
    canvasId?: string | null;
    role: string;
  }[];
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
  defaultLocale: string;
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
  defaultLocale: string;
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
  defaultLocale: string;
  translations: Record<string, PromptPack[]>;
};

type ExportTemplate = {
  id: string;
  routeId?: string;
  cycleId?: string;
  kind?: "cycle" | "questions";
  format: string;
  title: string;
  sections?: { id: string; title: string; description: string }[];
  body: string;
};

type ExportData = {
  defaultLocale: string;
  translations: Record<string, ExportTemplate[]>;
};

type StickyNotes = Record<string, StickyNote[]>;

type CatalogExplorerProps = {
  catalog: Catalog;
  canvases: CanvasManifest;
  labels: LabelData;
  partners: PartnerData;
  initialLocale: string;
  initialCycleId?: string;
  initialStationId?: string;
  initialRoleId?: string;
  dataVersion: string;
};

type CatalogExplorerLoaderProps = {
  initialLocale: string;
  initialCycleId?: string;
  initialStationId?: string;
  initialRoleId?: string;
  dataVersion: string;
};

type LoadedWorkspaceData = Omit<CatalogExplorerProps, "initialLocale" | "initialCycleId" | "initialStationId" | "initialRoleId" | "dataVersion">;

function arrayOrEmpty<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

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

const viewKeys = ["map", "guide", "canvases", "data"] as const;
type ViewKey = (typeof viewKeys)[number];
const announcementId = "announcement_v2_live_2026_07";

const fallbackLabels: Record<string, string> = {
  "nav.workflows": "Workflows",
  "nav.data": "Data",
  "nav.language": "Language",
  "nav.primary": "Primary",
  "nav.licensing": "Licensing",
  "nav.github": "GitHub",
  "nav.community": "Community",
  "nav.menu": "Menu",
  "announcement.message": "Version 2.0 is live with faster loading times!",
  "announcement.link": "See what's new",
  "announcement.dismiss": "Dismiss announcement",
  "controls.currentRoute": "Current route",
  "controls.stakeholderInvolvement": "Stakeholder involvement",
  "controls.recommendedCycle": "Recommended cycle",
  "controls.currentStation": "Current station",
  "controls.routeControls": "Route controls",
  "controls.workspaceModes": "Workspace modes",
  "controls.selectCycle": "Select cycle",
  "controls.selectStakeholder": "Select stakeholder",
  "involvement.lead": "Lead",
  "involvement.core": "Core",
  "involvement.consulted": "Consulted",
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
  "map.instructionsSvg": "Click any station dot to navigate. Use the cycle selector to switch route.",
  "map.ariaLabel": "APIOps Cycles metro map",
  "map.zoneStrategic": "Strategic",
  "map.zoneGovernance": "Governance",
  "map.zoneConsumer": "Consumer",
  "map.zoneTechnical": "Technical",
  "station.youAreHere": "You are here",
  "station.keyQuestions": "Key questions",
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
  "station.noEntryCriteria": "No entry criteria listed.",
  "station.noExitCriteria": "No exit criteria listed.",
  "station.noLineTransitions": "No line transitions are listed for this station.",
  "role.kicker": "People to involve",
  "role.titlePrefix": "Role guide for",
  "role.columnStakeholder": "Stakeholder",
  "role.columnWhy": "Why they matter",
  "role.columnRole": "Role",
  "role.columnResponsibilities": "Responsibilities",
  "role.noResponsibilities": "No specific resource ownership",
  "resources.emptyCanvases": "No canvas resources are directly linked to this station.",
  "resources.emptyOther": "No additional resources are directly linked to this station.",
  "resources.kicker": "Resources",
  "resources.titlePrefix": "Resources for",
  "resources.helper": "Select a station resource from the details panel. Canvas resources open the local sticky-note workspace; other resources open guidance, examples, or checklists here.",
  "resources.select": "Select resource",
  "resources.emptySelect": "No station resources",
  "resources.emptyStation": "No resources are directly linked to this station in the selected cycle.",
  "resources.noExternalRenderer": "No external canvas renderer is configured, so this page uses the built-in local workspace.",
  "resources.useWithAi": "Use station resources with AI",
  "resources.useWithAiHelp": "Open Resources, select a canvas or guidance item, then copy its Markdown or JSON into your AI conversation.",
  "resources.helpsAnswer": "Helps answer",
  "resources.expectedOutcomes": "Expected outcomes",
  "resources.howToUse": "How to use it",
  "resources.sourceContent": "Source content",
  "resources.source": "Source",
  "resources.details": "details",
  "canvas.localWorkspace": "Local canvas workspace",
  "canvas.exportMarkdown": "Export Markdown",
  "canvas.exportJson": "Export JSON",
  "canvas.importJson": "Import JSON",
  "canvas.openCreator": "Open in CanvasCreator",
  "canvas.markdownExported": "Canvas Markdown exported.",
  "canvas.jsonExported": "Canvas JSON exported.",
  "canvas.jsonImported": "Canvas JSON imported.",
  "canvas.invalidImport": "Invalid canvas import/export template",
  "canvas.removeNote": "Remove note",
  "canvas.addStickyNote": "Add sticky note",
  "category_canvas": "Canvas",
  "category_guideline": "Guideline",
  "category_checklist": "Checklist",
  "ai.kicker": "Use with AI",
  "ai.titlePrefix": "AI assistance for",
  "ai.helper": "Use AI to facilitate the station conversation, work through the selected Resources, and turn canvas notes or resource findings into next actions.",
  "ai.facilitate": "Facilitate station discussion",
  "ai.nextAction": "Decide next action",
  "ai.facilitateTitlePrefix": "Facilitate",
  "ai.nextActionTitlePrefix": "Next actions for",
  "ai.purpose": "Purpose",
  "ai.copyPrompt": "Copy prompt",
  "ai.promptContext": "Selected APIOps Cycles context",
  "ai.promptRoute": "Route",
  "ai.promptCycle": "Cycle",
  "ai.promptStation": "Station",
  "ai.promptStationPurpose": "Station purpose",
  "ai.promptResources": "Station resources",
  "ai.promptCanvases": "Station canvases",
  "confluence.kicker": "Confluence export",
  "confluence.title": "Publishing templates",
  "confluence.helper": "Choose the purpose first, then copy the format that matches the destination. Markdown is for docs repositories and static sites. Confluence-wiki is for Confluence pages that accept wiki markup.",
  "confluence.questionTemplate": "Question template",
  "confluence.questionTemplateTitle": "Question template to fill in",
  "confluence.questionTemplateHelp": "Use this when you want to gather station answers and evidence with related canvas questions and resources.",
  "confluence.markdown": "Markdown",
  "confluence.confluenceWiki": "Confluence-wiki",
  "confluence.copyMarkdown": "Copy Markdown",
  "confluence.copyConfluenceWiki": "Copy Confluence-wiki",
  "actions.copy": "Copy",
  "actions.expandAll": "Expand all",
  "actions.collapseAll": "Collapse all",
  "actions.use": "Use",
  "actions.copied": "Copied successfully",
  "actions.expand": "▸",
  "actions.collapse": "▾",
  "confluence.cycleExport": "Cycle export",
  "confluence.audience": "Intended audience",
  "confluence.formatGuidance": "Format guidance",
  "confluence.formatGuidanceText": "Use Markdown for docs repositories and static sites. Use Confluence-wiki for Confluence pages that accept wiki markup.",
  "data.kicker": "Method data",
  "data.title": "Static integration surfaces",
  "data.helper": "These JSON files are published with the site and can be consumed by future MCP tools, documentation generators, or external canvas renderers.",
  "data.panelHelper": "All workspace views consume generated JSON under /data. No database or server-side persistence is introduced.",
  "data.sourceDependency": "Source dependency",
  "data.branch": "Branch",
  "data.localeSafe": "Locale-safe",
  "data.localeSafeText": "Default locale is {defaultLocale}; published locales are {locales}.",
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

function templateUse(template: ExportTemplate, labels: Record<string, string>) {
  return {
    key: "questions",
    label: labels["confluence.questionTemplate"],
    title: labels["confluence.questionTemplateTitle"],
    copy: labels["confluence.questionTemplateHelp"],
  };
}

function buildTemplateGroups(roleTemplates: ExportTemplate[], labels: Record<string, string>) {
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
    const use = templateUse(template, labels);
    const group = groups.get(use.key) ?? { ...use };
    if (template.format === "confluence-wiki") group.confluence = template;
    else group.markdown = template;
    groups.set(use.key, group);
  }
  return ["questions"]
    .map((key) => groups.get(key))
    .filter((group): group is NonNullable<typeof group> => Boolean(group));
}

function shortStationName(title: string) {
  return title.split(" - ")[0].split(" – ")[0].trim();
}

function wrapMapLabel(label: string, maxLength = 24) {
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

function metroMapSvgStyles(activeColor: string) {
  return `
    .metro-zone { opacity: 0.28; stroke: none; }
    .metro-zone--governance { fill: #a8d7ef; }
    .metro-zone--strategic { fill: #ffd75e; }
    .metro-zone--consumer { fill: #8ee6a4; }
    .metro-zone--technical { fill: #f6b16f; }
    .metro-zone-label,
    .metro-support-label,
    .metro-label,
    .metro-legend text,
    .metro-line-legend text { fill: #071640; font-family: Arial, sans-serif; font-size: 13px; font-weight: 800; }
    .metro-label { font-size: 10px; }
    .metro-support-label { font-size: 11px; font-weight: 650; }
    .metro-zone-title-bg { fill: rgba(255, 255, 255, 0.88); }
    .metro-route { fill: none; }
    .metro-support-node,
    .metro-node { fill: #ffffff; stroke: #ffffff; stroke-width: 3; }
    .metro-support-node { opacity: 0.9; stroke-width: 2; }
    .metro-station--highlighted .metro-node,
    .metro-station--highlighted .metro-support-node { stroke: ${activeColor}; }
    .metro-station--involvement-lead .metro-node,
    .metro-station--involvement-lead .metro-support-node { fill: #dcc6ee; stroke-width: 5; }
    .metro-station--involvement-core .metro-node,
    .metro-station--involvement-core .metro-support-node { fill: #ffffff; stroke-width: 4; }
    .metro-station--involvement-consulted .metro-node,
    .metro-station--involvement-consulted .metro-support-node { fill: #f3eef9; stroke-dasharray: 4 3; stroke-width: 3; }
    .metro-involvement-ring { fill: none; pointer-events: none; stroke: ${activeColor}; }
    .metro-involvement-ring--lead { stroke-width: 5; }
    .metro-involvement-ring--core { stroke-width: 3; }
    .metro-involvement-ring--consulted { stroke-dasharray: 5 4; stroke-width: 3; }
    .metro-selection-ring { fill: none; pointer-events: none; stroke: ${activeColor}; stroke-width: 4; }
    .metro-support-node--active,
    .metro-node--active { fill: ${activeColor}; stroke: ${activeColor}; }
    .metro-node-number { fill: #071640; font-family: Arial, sans-serif; font-size: 10px; font-weight: 900; pointer-events: none; }
    .metro-node-number--active { fill: #ffffff; }
    .metro-brand { opacity: 0.45; }
    .metro-core-label rect { fill: rgba(255, 255, 255, 0.95); stroke: currentColor; stroke-width: 2; }
    .metro-core-label text { fill: currentColor; font-family: Arial, sans-serif; font-size: 12px; font-weight: 850; pointer-events: none; }
    .metro-line-legend text { font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; }
  `;
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
  stakeholderInvolvementByStation,
  onSelectCycle,
  onSelectStation,
  uiLabels,
  svgRef,
}: {
  cycles: Cycle[];
  lines: MetroLine[];
  stations: Station[];
  selectedCycleId: string;
  selectedStationId: string;
  stakeholderInvolvementByStation: Record<string, string>;
  onSelectCycle: (id: string) => void;
  onSelectStation: (id: string) => void;
  uiLabels: Record<string, string>;
  svgRef?: RefObject<SVGSVGElement | null>;
}) {
  const width = 1000;
  const height = 1000;
  const center = { x: 500, y: 500 };
  const coreRadius = 125;
  const coreLabelRadius = 190;
  const coreStations = cycles[0]?.stations ?? [];
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? cycles[0];
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const supportCoordinates: Record<string, { x: number; y: number; dx?: number; dy?: number; anchor?: "start" | "end" }> = {
    "ecosystem-vision": { x: 330, y: 100, dx: 12, dy: 4 },
    "competitive-analysis": { x: 355, y: 130, dx: 12, dy: 4 },
    "business-goals": { x: 380, y: 160, dx: 12, dy: 4 },
    "market-insights": { x: 405, y: 190, dx: 12, dy: 4 },
    "user-experience": { x: 430, y: 240, dx: 12, dy: 4 },
    "scalable-infrastructure": { x: 700, y: 600, dx: 12, dy: 4 },
    "legal-and-compliance": { x: 740, y: 570, dx: 12, dy: 4 },
    "security-and-privacy": { x: 760, y: 550, dx: 12, dy: 4 },
    "design-standards": { x: 780, y: 530, dx: 12, dy: 4 },
    "vendor-management": { x: 800, y: 510, dx: 12, dy: 4 },
    "contract-design": { x: 460, y: 720, dx: 12, dy: 4 },
    development: { x: 440, y: 760, dx: 12, dy: 4 },
    "ci-cd": { x: 420, y: 800, dx: 12, dy: 4 },
    "test-automation": { x: 400, y: 840, dx: 12, dy: 4 },
    "release-management": { x: 380, y: 880, dx: 12, dy: -6 },
    "service-agreements": { x: 240, y: 460, dx: 12, dy: 4 },
    "api-consumer-adoption": { x: 200, y: 440, dx: 12, dy: 4 },
    "api-promotion": { x: 160, y: 420, dx: 12, dy: 4 },
    "partner-integration": { x: 120, y: 400, dx: 12, dy: 4 },
    "api-mindset": { x: 580, y: 310, dx: 12, dy: 4 },
    "roles-and-responsibilities": { x: 600, y: 290, dx: 12, dy: 4 },
    upskilling: { x: 620, y: 270, dx: 12, dy: 4 },
    "operating-guidelines": { x: 640, y: 250, dx: 12, dy: 4 },
    "portfolio-management": { x: 660, y: 230, dx: 12, dy: 4 },
    "budget-and-resource-management": { x: 680, y: 210, dx: 12, dy: 4 },
  };
  const labelBoxes = {
    strategic: { x: 480, y: 80, width: 108, height: 34, label: uiLabels["map.zoneStrategic"] },
    governance: { x: 740, y: 296, width: 124, height: 34, label: uiLabels["map.zoneGovernance"] },
    consumer: { x: 60, y: 425, width: 118, height: 34, label: uiLabels["map.zoneConsumer"] },
    technical: { x: 720, y: 700, width: 110, height: 34, label: uiLabels["map.zoneTechnical"] },
  };
  const coreLabelPositions: Record<number, { x: number; y: number }> = {
    1: { x: 500, y: 340 },
    2: { x: 680, y: 380 },
    3: { x: 740, y: 470 },
    4: { x: 640, y: 630 },
    5: { x: 505, y: 680 },
    6: { x: 340, y: 630 },
    7: { x: 270, y: 505 },
    8: { x: 320, y: 370 },
  };
  const lineLegend = lines.map((line, index) => ({ ...line, x: 180, y: 665 + index * 28 }));
  const stationClassName = (id: string) => {
    const involvement = stakeholderInvolvementByStation[id];
    return [
      "metro-station",
      involvement ? "metro-station--highlighted" : "",
      involvement ? `metro-station--involvement-${involvement}` : "",
    ].filter(Boolean).join(" ");
  };
  const involvementFor = (id: string) => stakeholderInvolvementByStation[id];
  const corePoints = coreStations.map((station, index) => {
    const selectedCycleStation = selectedCycle?.stations.find((item) => item.id === station.id);
    const angle = -90 + (360 / coreStations.length) * index;
    const radians = (angle * Math.PI) / 180;
    const indexForLabel = selectedCycleStation?.index ?? station.index;
    const fixedLabel = coreLabelPositions[indexForLabel];
    return {
      ...station,
      displayTitle: selectedCycleStation?.title ?? station.baseTitle,
      angle,
      labelX: fixedLabel?.x ?? center.x + coreLabelRadius * Math.cos(radians),
      labelY: fixedLabel?.y ?? center.y + coreLabelRadius * Math.sin(radians),
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
    <svg ref={svgRef} className="metro-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={uiLabels["map.ariaLabel"]}>
      <defs>
        <clipPath id="metro-map-circle-clip">
          <circle cx="500" cy="500" r="445" />
        </clipPath>
      </defs>
      <g clipPath="url(#metro-map-circle-clip)">
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
              className={stationClassName(point.id)}
              onClick={() => onSelectStation(point.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectStation(point.id);
              }}
            >
              <title>{point.baseTitle}</title>
              {point.id === selectedStationId ? (
                <circle cx={point.x} cy={point.y} r="13" className="metro-selection-ring" />
              ) : null}
              {involvementFor(point.id) ? (
                <circle cx={point.x} cy={point.y} r="10" className={`metro-involvement-ring metro-involvement-ring--${involvementFor(point.id)}`} />
              ) : null}
              <circle cx={point.x} cy={point.y} r="6" className="metro-support-node" />
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
          className={stationClassName(point.id)}
          onClick={() => onSelectStation(point.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onSelectStation(point.id);
          }}
        >
          <title>{point.baseTitle}</title>
          {point.id === selectedStationId ? (
            <circle cx={point.x} cy={point.y} r="25" className="metro-selection-ring" />
          ) : null}
          {involvementFor(point.id) ? (
            <circle cx={point.x} cy={point.y} r="20" className={`metro-involvement-ring metro-involvement-ring--${involvementFor(point.id)}`} />
          ) : null}
          <circle cx={point.x} cy={point.y} r="14" className="metro-node" />
          <text x={point.x} y={point.y + 4} textAnchor="middle" className="metro-node-number">
            {point.index}
          </text>
          {(() => {
            const lines = wrapMapLabel(point.displayTitle);
            const boxWidth = Math.max(128, Math.max(...lines.map((line) => line.length)) * 7 + 24);
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
    if (!Array.isArray(payload.sections)) throw new Error(labels["canvas.invalidImport"] ?? fallbackLabels["canvas.invalidImport"]);
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
                  title={labels["canvas.removeNote"] ?? fallbackLabels["canvas.removeNote"]}
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
              <input name="note" placeholder={labels["canvas.addStickyNote"] ?? fallbackLabels["canvas.addStickyNote"]} aria-label={`${labels["canvas.addStickyNote"] ?? fallbackLabels["canvas.addStickyNote"]}: ${section.title}`} />
              <button type="submit">{labels["canvas.addStickyNote"] ?? fallbackLabels["canvas.addStickyNote"]}</button>
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
  labels,
}: {
  resource: Resource;
  stationTitle: string;
  labels: Record<string, string>;
}) {
  return (
    <section className="resource-detail" aria-label={`${resource.title} ${labels["resources.details"]}`}>
      <div>
        <p className="section-kicker">{categoryLabel({}, labels, resource.category)}</p>
        <h3>{resource.title}</h3>
        <strong className="resource-purpose">{labels["resources.helpsAnswer"] ?? "Helps answer"}: {stationTitle}</strong>
      </div>
      <p>{resource.description}</p>
      {resource.outcomes.length ? (
        <section>
          <h4>{labels["resources.expectedOutcomes"] ?? "Expected outcomes"}</h4>
          <ul>{resource.outcomes.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ) : null}
      {resource.steps.length ? (
        <section>
          <h4>{labels["resources.howToUse"] ?? "How to use it"}</h4>
          <ol>{resource.steps.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
      ) : null}
      {resource.contentMarkdown ? (
        <section>
          <h4>{labels["resources.sourceContent"] ?? "Source content"}</h4>
          <pre>{resource.contentMarkdown}</pre>
        </section>
      ) : null}
      {resource.sourcePath || resource.sourceUrl ? (
        <p className="helper-text">
          {labels["resources.source"] ?? "Source"}: {resource.sourceUrl ? <a href={resource.sourceUrl}>{resource.sourceUrl}</a> : <code>{resource.sourcePath}</code>}
        </p>
      ) : null}
    </section>
  );
}

function CatalogExplorer({
  catalog,
  canvases,
  labels,
  partners,
  initialLocale,
  initialCycleId,
  initialStationId,
  initialRoleId,
  dataVersion,
}: CatalogExplorerProps) {
  const [locale, setLocale] = useState(initialLocale);
  const data = catalog.translations[locale] ?? catalog.translations[catalog.defaultLocale] ?? catalog.translations.en;
  const methodLabels = data.labels ?? {};
  const roleData = arrayOrEmpty(data.routeProfiles);
  const cycles = arrayOrEmpty(data.cycles);
  const stations = arrayOrEmpty(data.stations);
  const resources = arrayOrEmpty(data.resources);
  const lines = arrayOrEmpty(data.lines);
  const canvasData = canvases.translations[locale] ?? canvases.translations[canvases.defaultLocale] ?? canvases.translations.en ?? {};
  const localizedLabels = { ...fallbackLabels, ...(labels.translations[locale] ?? labels.translations[labels.defaultLocale] ?? labels.translations.en) };
  const requestedRole = roleData.find((item) => item.id === initialRoleId || item.stakeholderId === initialRoleId);
  const initialCycle =
    cycles.find((cycle) => cycle.id === initialCycleId || cycle.slug === initialCycleId) ??
    (initialStationId ? cycles.find((cycle) => cycle.stations.some((station) => station.id === initialStationId)) : undefined) ??
    (requestedRole?.cycles[0]?.id ? cycles.find((cycle) => cycle.id === requestedRole.cycles[0].id) : undefined) ??
    cycles[0];
  if (!initialCycle) {
    return (
      <main className="site-shell">
        <section className="workspace-panel">
          <p className="section-kicker">APIOps Cycles</p>
          <h1>Unable to load method catalog</h1>
          <p>The method catalog did not contain cycle data for this locale.</p>
        </section>
      </main>
    );
  }
  const requestedRoleStation = requestedRole?.stations.find((station) =>
    initialCycle.stations.some((cycleStation) => cycleStation.id === station.id),
  )?.id;
  const initialStation = initialStationId && initialCycle.stations.some((station) => station.id === initialStationId)
    ? initialStationId
    : requestedRoleStation ?? initialCycle.stations[0]?.id;
  const initialRole = requestedRole ?? roleData.find((item) =>
    item.cycles.some((cycle) => cycle.id === initialCycle.id) &&
    (!initialStation || item.stations.some((station) => station.id === initialStation)),
  ) ?? roleData[0];
  const [roleId, setRoleId] = useState(requestedRole?.id ?? "");
  const role = roleId ? safeRole(roleId, roleData) : initialRole;
  const [cycleId, setCycleId] = useState(initialCycle.id);
  const selectedCycle = cycles.find((cycle) => cycle.id === cycleId) ?? cycles[0] ?? initialCycle;
  const [stationId, setStationId] = useState(initialStation ?? role.stations[0]?.id ?? selectedCycle.stations[0].id);
  const selectedCycleStation = selectedCycle.stations.find((station) => station.id === stationId);
  const stationDetail =
    stations.find((station) => station.id === stationId) ??
    stations.find((station) => station.id === selectedCycle.stations[0]?.id) ??
    stations[0];
  if (!stationDetail) {
    return (
      <main className="site-shell">
        <section className="workspace-panel">
          <p className="section-kicker">APIOps Cycles</p>
          <h1>Unable to load station data</h1>
          <p>The method catalog did not contain station data for this locale.</p>
        </section>
      </main>
    );
  }
  const stationStepResourceIds = new Set((selectedCycleStation?.steps ?? stationDetail.steps).map((step) => step.resourceId).filter(Boolean));
  const selectedStationResources =
    selectedCycleStation?.resources.length
      ? selectedCycleStation.resources
      : resources.filter((resource) => stationStepResourceIds.has(resource.id));
  const selectedStation: CycleStation =
    selectedCycleStation ?? {
      index: 0,
      id: stationDetail.id,
      slug: stationDetail.id,
      icon: stationDetail.icon,
      title: stationDetail.title,
      description: stationDetail.description,
      whyItMatters: stationDetail.whyItMatters,
      applyInWork: stationDetail.applyInWork,
      outcomes: stationDetail.outcomes,
      steps: stationDetail.steps,
      questions: stationDetail.questions,
      criteria: stationDetail.criteria,
      criteriaDetails: stationDetail.criteriaDetails,
      baseTitle: stationDetail.title,
      group: stationDetail.group,
      lifecycleStage: stationDetail.lifecycleStage,
      stakeholders: stationDetail.stakeholders ?? [],
      resources: selectedStationResources,
      evidence: stationDetail.evidence,
    };
  const [view, setView] = useState<ViewKey>("map");
  const [canvasId, setCanvasId] = useState(role.canvases[0]?.id ?? Object.keys(canvasData)[0]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [promptPacks, setPromptPacks] = useState<PromptData | null>(null);
  const [exportTemplates, setExportTemplates] = useState<ExportData | null>(null);
  const [actionMenu, setActionMenu] = useState<"ai" | "exports" | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    questions: false,
    before: false,
    ready: false,
  });
  const [copyStatus, setCopyStatus] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const metroMapRef = useRef<SVGSVGElement>(null);
  const workspaceTopRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setSelectedResourceId(null);
  }, [locale]);

  useEffect(() => {
    let timer: number | undefined;
    try {
      if (window.localStorage.getItem(announcementId) !== "dismissed") {
        timer = window.setTimeout(() => setShowAnnouncement(true), 3000);
      }
    } catch {
      timer = window.setTimeout(() => setShowAnnouncement(true), 3000);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const selectedCycleColor = colors[cycleId] ?? "#6d2ba0";
  const stationTitle = selectedStation.title || stationDetail.title;
  const stationDescription = selectedStation.description || stationDetail.description;
  const stationBadge = String(selectedStation.index || stationDetail.lifecycleStage || "-");
  const stationBadgeIsNumber = /^\d+$/.test(stationBadge);
  const stakeholderParticipants = uniqueById(selectedStation.stakeholders ?? []).filter(Boolean);
  const participantChips = stakeholderParticipants.map((item) => item.title).slice(0, 8);
  const stationQuestions = uniqueText([
    ...(selectedStation.questions ?? []),
    ...(selectedStation.steps ?? []).map((step) => step.text),
    selectedStation.applyInWork,
    selectedStation.whyItMatters,
  ]).slice(0, 5);
  const selectedCycleStationIndex = selectedCycle.stations.findIndex((station) => station.id === stationId);
  const previousCycleStation = selectedCycleStationIndex > 0 ? selectedCycle.stations[selectedCycleStationIndex - 1] : null;
  const previousStationDetail = previousCycleStation ? stations.find((station) => station.id === previousCycleStation.id) : null;
  const beforeCriteria = selectedCycleStationIndex <= 0
    ? selectedCycle.entryCriteriaDetails
    : previousCycleStation?.criteriaDetails ?? previousStationDetail?.criteriaDetails ?? [];
  const readyCriteria = selectedStation.criteriaDetails.length ? selectedStation.criteriaDetails : selectedCycle.exitCriteriaDetails;
  const lineNavigation = lines
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
          const detail = stations.find((station) => station.id === item.id);
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
    const ownedResources = (stakeholder.responsibilities ?? [])
      .filter((responsibility) => responsibility.role === "suggested-answer-owner")
      .map((responsibility) => responsibility.resourceTitle);
    return {
      id: stakeholder.id,
      title: stakeholder.title,
      summary: stakeholder.description || profile?.summary || "",
      involvement: stakeholder.involvement,
      responsibilities: uniqueText(ownedResources),
      responsibilityLabel: uniqueText(ownedResources).join(", "),
      roleLabel: stakeholder.involvement ? methodLabels[`stakeholder.involvement.${stakeholder.involvement}`] ?? stakeholder.involvement : "",
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
  const selectedStakeholderId = roleId ? role.stakeholderId ?? role.id : "";
  const stakeholderInvolvementByStation = selectedStakeholderId
    ? Object.fromEntries(
        selectedCycle.stations
          .map((station) => {
            const involvement = station.stakeholders?.find((stakeholder) => stakeholder.id === selectedStakeholderId)?.involvement;
            return involvement ? [station.id, involvement] : null;
          })
          .filter((item): item is [string, string] => Boolean(item)),
      )
    : {};

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
    const path = kind === "cycle" ? `${prefix}/cycles/${id}` : `${prefix}/method/${id}`;
    window.history.replaceState(null, "", path);
  }

  function selectRole(nextRoleId: string) {
    if (!nextRoleId) {
      setRoleId("");
      setSelectedResourceId(null);
      return;
    }
    const nextRole = safeRole(nextRoleId, roleData);
    setRoleId(nextRoleId);
    setCanvasId(firstCanvasFor(selectedStationResources, nextRole));
    setSelectedResourceId(null);
  }

  function selectCycle(nextCycleId: string) {
    const nextCycle = cycles.find((cycle) => cycle.id === nextCycleId) ?? selectedCycle;
    const nextStationId = nextCycle.stations.some((station) => station.id === stationId) ? stationId : nextCycle.stations[0]?.id ?? stationId;
    setCycleId(nextCycleId);
    setStationId(nextStationId);
    setSelectedResourceId(null);
    replaceWorkspaceUrl("cycle", nextCycle.slug || nextCycle.id);
  }

  function selectStation(nextStationId: string) {
    setStationId(nextStationId);
    setSelectedResourceId(null);
    replaceWorkspaceUrl("station", nextStationId);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopyStatus(localizedLabels["actions.copied"]);
    window.setTimeout(() => setCopyStatus(""), 2200);
  }

  function dismissAnnouncement() {
    try {
      window.localStorage.setItem(announcementId, "dismissed");
    } catch {
      // Local storage can be unavailable in strict privacy modes; dismiss for this session anyway.
    }
    setShowAnnouncement(false);
  }

  async function exportMetroMapSvg() {
    const svg = metroMapRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    clone.setAttribute("width", "1000");
    clone.setAttribute("height", "1000");
    for (const image of Array.from(clone.querySelectorAll("image"))) {
      const href = image.getAttribute("href");
      if (href === "/assets/apiops-cycles-logo-dark.svg") {
        const response = await fetch(href);
        const logoText = await response.text();
        const logo = new DOMParser().parseFromString(logoText, "image/svg+xml").documentElement;
        const inlineLogo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        inlineLogo.setAttribute("x", image.getAttribute("x") ?? "0");
        inlineLogo.setAttribute("y", image.getAttribute("y") ?? "0");
        inlineLogo.setAttribute("width", image.getAttribute("width") ?? "60");
        inlineLogo.setAttribute("height", image.getAttribute("height") ?? "60");
        inlineLogo.setAttribute("viewBox", logo.getAttribute("viewBox") ?? "0 0 567 567");
        inlineLogo.setAttribute("preserveAspectRatio", logo.getAttribute("preserveAspectRatio") ?? "xMidYMid meet");
        inlineLogo.setAttribute("class", image.getAttribute("class") ?? "");
        Array.from(logo.children).filter((child) => child.localName !== "namedview").forEach((child) => {
          inlineLogo.appendChild(document.importNode(child, true));
        });
        image.replaceWith(inlineLogo);
      } else if (href?.startsWith("/")) {
        image.setAttribute("href", `${window.location.origin}${href}`);
      }
    }
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = metroMapSvgStyles(selectedCycleColor);
    clone.insertBefore(style, clone.firstChild);
    const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}\n`;
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `apiops-cycles-${selectedCycle.slug || selectedCycle.id}-${stationId}.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
    setCopyStatus(localizedLabels["map.svgExported"]);
    window.setTimeout(() => setCopyStatus(""), 2200);
  }

  async function loadPromptPacks() {
    if (promptPacks) return promptPacks;
    const version = encodeURIComponent(dataVersion);
    const loaded = await loadJson<PromptData>(`/data/prompt-packs.${locale}.json?v=${version}`);
    setPromptPacks(loaded);
    return loaded;
  }

  async function loadExportTemplates() {
    if (exportTemplates) return exportTemplates;
    const version = encodeURIComponent(dataVersion);
    const loaded = await loadJson<ExportData>(`/data/export-templates.${locale}.json?v=${version}`);
    setExportTemplates(loaded);
    return loaded;
  }

  async function copyAiPrompt(mode: "facilitate-station" | "next-actions") {
    const loaded = await loadPromptPacks();
    const promptsForLocale = loaded.translations[locale] ?? loaded.translations[loaded.defaultLocale] ?? loaded.translations.en ?? [];
    const prompt = promptsForLocale.find((item) => item.routeId === role.id && item.mode === mode)
      ?? promptsForLocale.find((item) => item.routeId === role.id)
      ?? promptsForLocale.find((item) => item.mode === mode);
    if (prompt) {
      await copyText(promptFor(prompt));
      setActionMenu(null);
    }
  }

  async function copyExportTemplate(format: "markdown" | "confluence") {
    const loaded = await loadExportTemplates();
    const templatesForLocale = loaded.translations[locale] ?? loaded.translations[loaded.defaultLocale] ?? loaded.translations.en ?? [];
    const groups = buildTemplateGroups(
      templatesForLocale.filter((template) => template.routeId === role.id || template.cycleId === cycleId),
      localizedLabels,
    );
    const group = groups.find((item) => item.key === "questions");
    const template = format === "confluence" ? group?.confluence : group?.markdown;
    if (template) {
      await copyText(template.body);
      setActionMenu(null);
    }
  }

  function toggleDecisionSection(section: string) {
    setExpandedSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function showView(nextView: ViewKey) {
    setView(nextView);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1180px)").matches) {
      window.setTimeout(() => {
        workspaceTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }

  function openCanvas(nextCanvasId: string) {
    setCanvasId(nextCanvasId);
    setSelectedResourceId(canvasResources.find((resource) => resource.canvasId === nextCanvasId)?.id ?? null);
    showView("canvases");
  }

  function promptFor(prompt: PromptPack) {
    const resources = selectedStationResources.map((resource) => resource.title).join(", ") || "";
    const canvasList = canvasResources.map((resource) => resource.title).join(", ") || "";
    return `${localizedLabels["ai.promptContext"]}
${localizedLabels["ai.promptRoute"]}: ${role.title}
${localizedLabels["ai.promptCycle"]}: ${selectedCycle.title}
${localizedLabels["ai.promptStation"]}: ${stationTitle}
${localizedLabels["ai.promptStationPurpose"]}: ${stationDescription}
${localizedLabels["ai.promptResources"]}: ${resources}
${localizedLabels["ai.promptCanvases"]}: ${canvasList}

${prompt.prompt}`;
  }

  function openResource(resource: Resource) {
    if (resource.canvasId) {
      openCanvas(resource.canvasId);
      setSelectedResourceId(resource.id);
      return;
    }
    setSelectedResourceId(resource.id);
    showView("canvases");
  }

  return (
    <main className="site-shell">
      <header className="app-header">
        <nav className="topbar" aria-label={localizedLabels["nav.primary"]}>
          <a className="brand" href={locale === "en" ? "/" : `/${locale}`}>
            <img className="brand__logo" src="/assets/apiops-cycles-logo-dark.svg" alt="" />
            <span>APIOps Cycles</span>
          </a>
          <button
            className="topbar__menu"
            type="button"
            aria-expanded={navOpen}
            aria-controls="primary-navigation"
            onClick={() => setNavOpen((open) => !open)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span className="sr-only">{localizedLabels["nav.menu"]}</span>
          </button>
          <div id="primary-navigation" className={navOpen ? "topbar__controls is-open" : "topbar__controls"}>
            <a href="#licensing" onClick={() => setNavOpen(false)}>{localizedLabels["nav.licensing"]}</a>
            <a href={catalog.source.repository} target="_blank" rel="noreferrer" onClick={() => setNavOpen(false)}>{localizedLabels["nav.github"]}</a>
            <a href="#community" onClick={() => setNavOpen(false)}>{localizedLabels["nav.community"]}</a>
            <button type="button" onClick={() => { showView("data"); setNavOpen(false); }}>{localizedLabels["nav.data"]}</button>
            <label className="sr-only" htmlFor="locale">{localizedLabels["nav.language"]}</label>
            <select
              id="locale"
              value={locale}
              onChange={(event) => {
                const next = event.target.value;
                setNavOpen(false);
                window.location.href = next === "en" ? `/method/${stationId}` : `/${next}/method/${stationId}`;
              }}
            >
              {catalog.locales.map((item) => (
                <option key={item} value={item}>{localeNames[item] ?? item.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </nav>
      </header>

      <section className={view === "data" ? "main-workspace main-workspace--data" : view === "map" ? "main-workspace main-workspace--map" : "main-workspace main-workspace--focus"}>
        {view !== "data" ? (
          <aside className="journey-panel" style={{ "--route-color": selectedCycleColor } as CSSProperties}>
            <p className="section-kicker">{localizedLabels["map.kicker"]}</p>
            <h2>{selectedCycle.title}</h2>
            <div className="station-summary__head">
              <span className={stationBadgeIsNumber || publicIconPath(stationDetail.icon) ? "station-number" : "station-number station-number--text"}>
                {publicIconPath(stationDetail.icon) ? <img src={publicIconPath(stationDetail.icon)} alt="" /> : selectedStation.index || stationDetail.lifecycleStage || "•"}
              </span>
              <div>
                <p className="you-are-here">{localizedLabels["station.youAreHere"]}</p>
                <h3>{stationTitle}</h3>
              </div>
            </div>
            <p>{stationDescription}</p>
            <section className="journey-criteria">
              <div className="compact-section-head">
                <h3>{localizedLabels["station.before"]}</h3>
                <button type="button" onClick={() => toggleDecisionSection("before")}>
                  {expandedSections.before ? localizedLabels["actions.collapse"] : localizedLabels["actions.expand"]}
                </button>
              </div>
              {expandedSections.before ? <ul className="criteria-list">
                {beforeCriteria.slice(0, 4).map((criterion) => (
                  <li key={criterion.id}>
                    <img src="/icons/check-box-outline.svg" alt="" />
                    <span>{criterion.title}</span>
                  </li>
                ))}
                {!beforeCriteria.length ? <li>{selectedCycle.entryCriteria.join(", ") || localizedLabels["station.noEntryCriteria"]}</li> : null}
              </ul> : null}
            </section>
            <section className="journey-criteria">
              <div className="compact-section-head">
                <h3>{localizedLabels["station.ready"]}</h3>
                <button type="button" onClick={() => toggleDecisionSection("ready")}>
                  {expandedSections.ready ? localizedLabels["actions.collapse"] : localizedLabels["actions.expand"]}
                </button>
              </div>
              {expandedSections.ready ? <ul className="criteria-list">
                {readyCriteria.slice(0, 4).map((criterion) => (
                  <li key={criterion.id}>
                    <img src="/icons/check-circle.svg" alt="" />
                    <span>{criterion.title}</span>
                  </li>
                ))}
                {!readyCriteria.length ? <li>{selectedCycle.exitCriteria.join(", ") || localizedLabels["station.noExitCriteria"]}</li> : null}
              </ul> : null}
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
                {!lineNavigation.length ? <p className="helper-text">{localizedLabels["station.noLineTransitions"]}</p> : null}
              </div>
            </section>
          </aside>
        ) : null}
        <section className="workspace-main" ref={workspaceTopRef}>
        {view === "map" ? (
        <article className="map-card" style={{ "--route-color": selectedCycleColor } as CSSProperties}>
          <div className="panel__head map-head">
            <div className="cycle-pills" aria-label={localizedLabels["controls.selectCycle"]}>
              {cycles.map((cycle) => (
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
            <label className="stakeholder-selector">
              <span>{localizedLabels["controls.stakeholderInvolvement"]}</span>
              <select value={roleId} onChange={(event) => selectRole(event.target.value)}>
                <option value="">{localizedLabels["controls.selectStakeholder"]}</option>
                {roleData.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              <span className="stakeholder-legend" aria-label={localizedLabels["controls.stakeholderInvolvement"]}>
                <i className="stakeholder-legend__marker stakeholder-legend__marker--lead" />{localizedLabels["involvement.lead"]}
                <i className="stakeholder-legend__marker stakeholder-legend__marker--core" />{localizedLabels["involvement.core"]}
                <i className="stakeholder-legend__marker stakeholder-legend__marker--consulted" />{localizedLabels["involvement.consulted"]}
              </span>
            </label>
            <div className="map-head-actions">
              <button type="button" onClick={exportMetroMapSvg}>
                {localizedLabels["map.exportSvg"]}
              </button>
            </div>
          </div>
          <MetroMap
            cycles={cycles}
            lines={lines}
            stations={stations}
            selectedCycleId={cycleId}
            selectedStationId={stationId}
            stakeholderInvolvementByStation={stakeholderInvolvementByStation}
            onSelectCycle={selectCycle}
            onSelectStation={selectStation}
            uiLabels={localizedLabels}
            svgRef={metroMapRef}
          />
          <section className="line-guide" aria-label={localizedLabels["map.linesTitle"]}>
            <div>
              <h3>{localizedLabels["map.linesTitle"]}</h3>
              <p>{localizedLabels["map.linesDescription"]}</p>
            </div>
            <div className="line-guide__items">
              {lines.map((line) => (
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
              <p className="section-kicker">{localizedLabels["role.kicker"]}</p>
              <h2>{localizedLabels["role.titlePrefix"]} {stationTitle}</h2>
              <div className="role-table" role="table" aria-label={`Role guide for ${stationTitle}`}>
                <div className="role-table__row role-table__row--head" role="row">
                  <span role="columnheader">{localizedLabels["role.columnStakeholder"]}</span>
                  <span role="columnheader">{localizedLabels["role.columnWhy"]}</span>
                  <span role="columnheader">{localizedLabels["role.columnRole"]}</span>
                  <span role="columnheader">{localizedLabels["role.columnResponsibilities"]}</span>
                </div>
                {roleGuideRows.slice(0, 8).map((item) => (
                  <div key={item.id} className={item.id === role.id ? "role-table__row is-active" : "role-table__row"} role="row" id={`role-${item.id}`}>
                    <strong role="cell">{item.title}</strong>
                    <span role="cell">{item.summary}</span>
                    <span role="cell">{item.roleLabel}</span>
                    <span role="cell">{item.responsibilityLabel || localizedLabels["role.noResponsibilities"]}</span>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {view === "canvases" ? (
            <article className="workspace-panel">
              <div className="panel__head">
                <div>
                  <p className="section-kicker">{localizedLabels["resources.kicker"]}</p>
                  {!activeResource?.canvasId ? <h2>{activeResource?.title ?? `${localizedLabels["resources.titlePrefix"]} ${stationTitle}`}</h2> : null}
                </div>
                <div className="workspace-actions">
                  <select value={activeResource?.id ?? ""} onChange={(event) => {
                    const nextResource = selectedStationResources.find((resource) => resource.id === event.target.value);
                    if (nextResource) openResource(nextResource);
                  }} aria-label={localizedLabels["resources.select"]}>
                    {!selectedStationResources.length ? <option value="">{localizedLabels["resources.emptySelect"]}</option> : null}
                    {selectedStationResources.map((resource) => (
                      <option key={resource.id} value={resource.id}>{resource.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              {activeResource?.canvasId ? (
                <>
                  {!externalCanvasUrl ? (
                    <p className="helper-text">{localizedLabels["resources.noExternalRenderer"]}</p>
                  ) : null}
                  <CanvasWorkspace canvas={selectedCanvas} role={role} locale={locale} labels={localizedLabels} canvasRendererBaseUrl={process.env.NEXT_PUBLIC_CANVAS_RENDERER_BASE_URL} />
                </>
              ) : activeResource ? (
                <ResourceDetail resource={activeResource} stationTitle={stationTitle} labels={localizedLabels} />
              ) : (
                <p className="helper-text">{localizedLabels["resources.emptyStation"]}</p>
              )}
            </article>
          ) : null}

          {view === "data" ? (
            <article className="workspace-panel workspace-panel--technical" id="method-data">
              <p className="section-kicker">{localizedLabels["data.kicker"]}</p>
              <h2>{localizedLabels["data.title"]}</h2>
              <p>{localizedLabels["data.helper"]}</p>
              <div className="data-links">
                {[
                  `method-catalog.${locale}.json`,
                  `canvas-manifest.${locale}.json`,
                  `prompt-packs.${locale}.json`,
                  `export-templates.${locale}.json`,
                  "route-index.json",
                  "mcp-method-manifest.json",
                ].map((file) => (
                  <a key={file} href={`/data/${file}`}>{`/data/${file}`}</a>
                ))}
              </div>
            </article>
          ) : null}
        </section>

        <aside className={view === "data" ? "context-panel" : "station-summary"} style={{ "--route-color": selectedCycleColor } as CSSProperties}>
          {view === "data" ? (
            <>
              <div>
                <p className="section-kicker">{localizedLabels["data.kicker"]}</p>
                <h2>{localizedLabels["data.title"]}</h2>
              </div>
              <p>{localizedLabels["data.panelHelper"]}</p>
              <section>
                <h3>{localizedLabels["data.sourceDependency"]}</h3>
                <p><code>{catalog.source.repository}</code></p>
                <p>{localizedLabels["data.branch"]}: <code>{catalog.source.branch}</code></p>
              </section>
              <section>
                <h3>{localizedLabels["data.localeSafe"]}</h3>
                <p>{localizedLabels["data.localeSafeText"].replace("{defaultLocale}", catalog.defaultLocale).replace("{locales}", catalog.locales.join(", "))}</p>
              </section>
            </>
          ) : (
            <>
          <div className="decision-actions">
            <span>{localizedLabels["actions.use"]}</span>
            <button type="button" onClick={() => showView("map")} disabled={view === "map"}>Map</button>
            <div className="action-menu">
              <button type="button" onClick={() => setActionMenu(actionMenu === "ai" ? null : "ai")}>AI</button>
              {actionMenu === "ai" ? (
                <div className="action-menu__items">
                  <button type="button" onClick={() => copyAiPrompt("facilitate-station")}>{localizedLabels["ai.copyPrompt"]}: {localizedLabels["ai.facilitate"]}</button>
                  <button type="button" onClick={() => copyAiPrompt("next-actions")}>{localizedLabels["ai.copyPrompt"]}: {localizedLabels["ai.nextAction"]}</button>
                </div>
              ) : null}
            </div>
            <div className="action-menu">
              <button type="button" onClick={() => setActionMenu(actionMenu === "exports" ? null : "exports")}>Wiki</button>
              {actionMenu === "exports" ? (
                <div className="action-menu__items">
                  <button type="button" onClick={() => copyExportTemplate("markdown")}>{localizedLabels["confluence.copyMarkdown"]}: {localizedLabels["confluence.questionTemplate"]}</button>
                  <button type="button" onClick={() => copyExportTemplate("confluence")}>{localizedLabels["confluence.copyConfluenceWiki"]}: {localizedLabels["confluence.questionTemplate"]}</button>
                </div>
              ) : null}
            </div>
          </div>
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
            <div className="compact-section-head">
              <h3>{localizedLabels["station.keyQuestions"]}</h3>
              <button type="button" onClick={() => toggleDecisionSection("questions")}>
                {expandedSections.questions ? localizedLabels["actions.collapse"] : localizedLabels["actions.expand"]}
              </button>
            </div>
            {expandedSections.questions ? <ul>{discussionItems.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul> : null}
          </section>
          <section>
            <div className="compact-section-head">
              <h3>{localizedLabels["station.relatedCanvases"]}</h3>
            </div>
            <div className="pill-list">
              {canvasResources.map((resource) => (
                <button key={resource.id} type="button" onClick={() => openResource(resource)}>{resource.title}</button>
              ))}
              {!canvasResources.length ? <span>{localizedLabels["resources.emptyCanvases"]}</span> : null}
            </div>
          </section>
              <section>
                <div className="compact-section-head">
                  <h3>{localizedLabels["station.relatedResources"]}</h3>
                </div>
                <div className="pill-list">
                  {otherResources.map((resource) => (
                    <button key={resource.id} type="button" onClick={() => openResource(resource)}>{resource.title}</button>
                  ))}
                  {!otherResources.length ? <span>{localizedLabels["resources.emptyOther"]}</span> : null}
                </div>
              </section>
              <section>
                <div className="compact-section-head">
                  <h3>{localizedLabels["station.people"]}</h3>
                </div>
                <div className="pill-list">
                  {roleGuideRows.slice(0, 8).map((item) => (
                    <button key={item.id} type="button" onClick={() => showView("guide")}>{item.title}</button>
                  ))}
                </div>
                <div className="chips chips--compact chips--buttons">
                  {participantChips.map((participant) => (
                    <button key={participant} type="button" onClick={() => showView("guide")}>{participant}</button>
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
                  {!lineNavigation.length ? <p className="helper-text">{localizedLabels["station.noLineTransitions"]}</p> : null}
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
      {showAnnouncement ? (
        <aside className="announcement-toast" role="status" aria-live="polite">
          <p>
            <span>{localizedLabels["announcement.message"]}</span>
            <a href="#community">{localizedLabels["announcement.link"]} &rarr;</a>
          </p>
          <button type="button" onClick={dismissAnnouncement} aria-label={localizedLabels["announcement.dismiss"]}>
            &times;
          </button>
        </aside>
      ) : null}
      {copyStatus ? <div className="copy-toast" role="status">{copyStatus}</div> : null}
    </main>
  );
}

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json() as Promise<T>;
}

export default function CatalogExplorerLoader({
  initialLocale,
  initialCycleId,
  initialStationId,
  initialRoleId,
  dataVersion,
}: CatalogExplorerLoaderProps) {
  const [data, setData] = useState<LoadedWorkspaceData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const version = encodeURIComponent(dataVersion);
    Promise.all([
      loadJson<Catalog>(`/data/method-catalog.${initialLocale}.json?v=${version}`),
      loadJson<CanvasManifest>(`/data/canvas-manifest.${initialLocale}.json?v=${version}`),
      loadJson<LabelData>(`/data/site-labels.${initialLocale}.json?v=${version}`),
      loadJson<PartnerData>(`/data/partners.json?v=${version}`),
    ])
      .then(([catalog, canvases, labels, partners]) => {
        if (!cancelled) setData({ catalog, canvases, labels, partners });
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : String(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [dataVersion]);

  if (error) {
    return (
      <main className="site-shell">
        <section className="workspace-panel">
          <p className="section-kicker">APIOps Cycles</p>
          <h1>Unable to load workspace data</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="site-shell">
        <section className="workspace-panel">
          <p className="section-kicker">APIOps Cycles</p>
          <h1>Loading APIOps Cycles workspace</h1>
          <p>Preparing the method catalog and workspace data.</p>
        </section>
      </main>
    );
  }

  return (
    <CatalogExplorer
      {...data}
      initialLocale={initialLocale}
      initialCycleId={initialCycleId}
      initialStationId={initialStationId}
      initialRoleId={initialRoleId}
      dataVersion={dataVersion}
    />
  );
}
