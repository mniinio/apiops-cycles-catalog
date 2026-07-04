import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const sourceRoot =
  process.env.METHOD_DATA_PATH ??
  path.join(root, "work", "apiops-cycles-method-data");
const methodRoot = path.join(sourceRoot, "src", "data", "method");
const canvasRoot = path.join(sourceRoot, "src", "data", "canvas");
const appDataRoot = path.join(root, "app", "data");
const publicDataRoot = path.join(root, "public", "data");
const locales = ["en", "fi", "fr", "de", "pt"];
const methodEngine = await import(pathToFileURL(path.join(sourceRoot, "src", "lib", "method-engine.js")));

const roleDefinitions = [
  {
    id: "executives",
    title: "Executives and top management",
    summary: "Decide why reusable capabilities matter and where investment should go.",
    cycles: ["capability-productization-cycle"],
    stations: ["api-product-strategy", "api-platform-architecture", "monitoring-and-improving"],
    canvases: ["capabilityValuePropositionCanvas", "capabilityBusinessModelCanvas", "businessImpactCanvas"],
    decisions: [
      "Which reusable capabilities deserve investment?",
      "What business outcomes, risks, and benefits justify the work?",
      "Which governance evidence is needed before scaling?",
    ],
    outputs: ["Capability investment brief", "Business impact summary", "Executive decision record"],
  },
  {
    id: "enterprise-architects",
    title: "Enterprise and solution architects",
    summary: "Choose architecture routes and keep solution choices traceable to evidence.",
    cycles: ["capability-productization-cycle", "integration-productization-cycle"],
    stations: ["api-platform-architecture", "api-design", "api-audit"],
    canvases: ["businessImpactCanvas", "locationsCanvas", "capacityCanvas", "domainCanvas", "interactionCanvas"],
    decisions: [
      "Which delivery style fits the capability: API, event, file, stream, data product, or hybrid?",
      "Which constraints drive platform and integration choices?",
      "What evidence supports the architecture decision?",
    ],
    outputs: ["Architecture decision record", "Integration pattern decision", "Risk and constraint map"],
  },
  {
    id: "capability-owners",
    title: "Capability owners",
    summary: "Shape reusable business capabilities before choosing implementation technology.",
    cycles: ["capability-productization-cycle"],
    stations: ["api-product-strategy", "api-consumer-experience", "api-publishing"],
    canvases: ["customerJourneyCanvas", "capabilityValuePropositionCanvas", "capabilityBusinessModelCanvas"],
    decisions: [
      "Who consumes this capability and what outcome do they need?",
      "What should be reusable across teams or partners?",
      "How will consumers discover, request, and get support?",
    ],
    outputs: ["Capability value proposition", "Consumer requirements", "Publishing brief"],
  },
  {
    id: "api-product-owners",
    title: "API product owners",
    summary: "Productize APIs with clear consumers, value, onboarding, and lifecycle evidence.",
    cycles: ["api-productization-cycle"],
    stations: ["api-product-strategy", "api-consumer-experience", "api-publishing", "monitoring-and-improving"],
    canvases: ["customerJourneyCanvas", "apiValuePropositionCanvas", "apiBusinessModelCanvas", "consumerExperienceRequirementsCanvas"],
    decisions: [
      "Who are the API consumers and what value do they need?",
      "What onboarding, service, and support promises are realistic?",
      "How will adoption and value be measured?",
    ],
    outputs: ["API product brief", "Consumer onboarding plan", "API value and adoption metrics"],
  },
  {
    id: "api-designers",
    title: "API designers",
    summary: "Turn validated needs into consistent contracts, interactions, and schemas.",
    cycles: ["api-productization-cycle"],
    stations: ["api-design", "api-audit"],
    canvases: ["domainCanvas", "interactionCanvas", "restCanvas", "eventCanvas", "graphqlCanvas"],
    decisions: [
      "Which interaction style fits each consumer task?",
      "Which domain objects, operations, events, and schemas are needed?",
      "Is the contract consistent, secure, and reviewable?",
    ],
    outputs: ["Contract-first design pack", "Interaction model", "Design review notes"],
  },
  {
    id: "api-platform-teams",
    title: "API platform teams",
    summary: "Provide platform, delivery, governance, security, and publishing enablement.",
    cycles: ["api-productization-cycle", "integration-productization-cycle"],
    stations: ["api-platform-architecture", "api-delivery", "api-audit", "api-publishing"],
    canvases: ["businessImpactCanvas", "locationsCanvas", "capacityCanvas"],
    decisions: [
      "Which platform capabilities must be available?",
      "Which delivery and audit controls are mandatory?",
      "How should teams publish and operate reusable products?",
    ],
    outputs: ["Platform readiness checklist", "Delivery guardrails", "Publishing and operations guidance"],
  },
  {
    id: "integration-architects",
    title: "Integration architects",
    summary: "Design reusable integration capabilities across APIs, events, files, streams, and data.",
    cycles: ["integration-productization-cycle"],
    stations: ["api-product-strategy", "api-platform-architecture", "api-design", "api-delivery"],
    canvases: ["consumerExperienceRequirementsCanvas", "locationsCanvas", "capacityCanvas", "eventCanvas", "interactionCanvas"],
    decisions: [
      "Which integration pattern fits the consumer and producer constraints?",
      "How are payloads, timing, ownership, and recovery handled?",
      "How will the capability be operated and reused?",
    ],
    outputs: ["Integration pattern decision", "Capability contract outline", "Operational readiness notes"],
  },
  {
    id: "automation-owners",
    title: "Automation and process owners",
    summary: "Identify, design, release, and improve governed automation workflows.",
    cycles: ["automation-cycle"],
    stations: ["api-product-strategy", "api-consumer-experience", "api-design", "api-audit"],
    canvases: ["customerJourneyCanvas", "consumerExperienceRequirementsCanvas", "interactionCanvas", "businessImpactCanvas"],
    decisions: [
      "Which process outcomes should be automated?",
      "Where are exceptions, handoffs, and human approvals needed?",
      "Which controls prove the automation is ready?",
    ],
    outputs: ["Automation opportunity brief", "Workflow design notes", "Human validation checklist"],
  },
  {
    id: "ai-facilitators",
    title: "AI assistants and method facilitators",
    summary: "Use structured prompts and exports to guide workshops and method work.",
    cycles: ["capability-productization-cycle", "api-productization-cycle", "integration-productization-cycle", "automation-cycle"],
    stations: ["api-product-strategy", "api-consumer-experience", "api-design", "api-audit"],
    canvases: ["customerJourneyCanvas", "domainCanvas", "interactionCanvas", "consumerExperienceRequirementsCanvas"],
    decisions: [
      "Which prompt should guide the next conversation?",
      "Which canvas captures current evidence best?",
      "What should be exported for Confluence, Markdown, or MCP use?",
    ],
    outputs: ["Workshop prompt pack", "Canvas facilitation notes", "Markdown or Confluence summary"],
  },
];

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(relativePath, value, { publish = false } = {}) {
  const appPath = path.join(appDataRoot, relativePath);
  mkdirSync(path.dirname(appPath), { recursive: true });
  writeFileSync(appPath, `${JSON.stringify(value, null, 2)}\n`);
  if (publish) {
    const publicPath = path.join(publicDataRoot, relativePath);
    mkdirSync(path.dirname(publicPath), { recursive: true });
    writeFileSync(publicPath, `${JSON.stringify(value, null, 2)}\n`);
  }
}

function readLabels(locale) {
  const dir = path.join(methodRoot, locale);
  const labels = {};
  if (!existsSync(dir)) return labels;
  for (const name of [
    "labels.json",
    "labels.cycles.json",
    "labels.stations.json",
    "labels.resources.json",
    "labels.criteria.json",
    "labels.stakeholders.json",
    "labels.lines.json",
  ]) {
    const file = path.join(dir, name);
    if (existsSync(file)) Object.assign(labels, readJson(file));
  }
  return labels;
}

const cyclesRaw = readJson(path.join(methodRoot, "cycles.json")).cycles.items;
const stationsRaw = readJson(path.join(methodRoot, "stations.json"));
const resourcesRaw = readJson(path.join(methodRoot, "resources.json")).resources;
const criteriaRaw = readJson(path.join(methodRoot, "criteria.json")).criteria ?? [];
const linesRaw = readJson(path.join(methodRoot, "lines.json")).lines.items ?? [];
const integrationExtension = readJson(path.join(methodRoot, "integration-extension.json"));
const canvasDataRaw = readJson(path.join(canvasRoot, "canvasData.json"));
const canvasLabelsRaw = readJson(path.join(canvasRoot, "localizedData.json"));
const labelsByLocale = Object.fromEntries(locales.map((locale) => [locale, readLabels(locale)]));

function t(locale, key) {
  if (!key) return "";
  return labelsByLocale[locale]?.[key] ?? labelsByLocale.en?.[key] ?? key;
}

function translateList(locale, list = []) {
  return list.map((item) => t(locale, item)).filter(Boolean);
}

function allStations() {
  return Object.values(stationsRaw)
    .flatMap((group) =>
      (group.items ?? []).map((station) => ({
        ...station,
        groupTitle: group.title,
        groupSlug: group.slug,
      })),
    )
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
}

const stationsRawList = allStations();
const resourceById = Object.fromEntries(resourcesRaw.map((item) => [item.id, item]));
const stationById = Object.fromEntries(stationsRawList.map((item) => [item.id, item]));
const cycleById = Object.fromEntries(cyclesRaw.map((item) => [item.id, item]));

function translateResource(locale, resource) {
  return {
    id: resource.id,
    slug: resource.slug,
    title: t(locale, resource.title),
    description: t(locale, resource.description),
    category: resource.category ?? "resource",
    order: Number(resource.order ?? 999),
    outcomes: translateList(locale, resource.outcomes),
    steps: translateList(locale, resource.how_it_works?.steps),
    canvasId: resource.canvas ?? null,
    draft: resource.draft === "true" || resource.daft === "true",
  };
}

function translateLine(locale, line) {
  return {
    id: line.id,
    slug: line.slug,
    title: t(locale, line.title),
    description: t(locale, line.description),
    color: line.color,
    order: Number(line.order ?? 999),
    stations: line.stations ?? [],
  };
}

function translateStation(locale, station) {
  return {
    id: station.id,
    slug: station.slug,
    title: t(locale, station.title),
    description: t(locale, station.description),
    whyItMatters: t(locale, station.why_it_matters),
    applyInWork: t(locale, station.apply_in_work),
    group: t(locale, station.groupTitle),
    lifecycleStage: station.lifecycleStage ?? station.type ?? "supporting",
    outcomes: translateList(locale, station.outcomes),
    steps: (station.how_it_works ?? []).map((step) => ({
      text: t(locale, step.step),
      resourceId: step.resource,
      resourceTitle: step.resource ? t(locale, resourceById[step.resource]?.title) : "",
      canvasId: step.resource ? resourceById[step.resource]?.canvas ?? null : null,
    })),
    criteria: station.stationCriteria ?? [],
    evidence: station.expectedEvidenceTags ?? [],
  };
}

function translateCycle(locale, cycle) {
  return {
    id: cycle.id,
    slug: cycle.slug,
    title: t(locale, cycle.title),
    description: t(locale, cycle.description),
    purpose: t(locale, cycle.purpose),
    audiences: translateList(locale, cycle.audiences),
    entryCriteria: cycle.entryCriteria ?? [],
    exitCriteria: cycle.exitCriteria ?? [],
    stations: cycle.stations.map((stationId, index) => {
      const station = stationById[stationId];
      const resources = (cycle.recommendedResources?.[stationId] ?? [])
        .map((id) => resourceById[id])
        .filter(Boolean)
        .map((resource) => translateResource(locale, resource));
      return {
        index: index + 1,
        id: stationId,
        title: t(locale, cycle.stationLabels?.[stationId] ?? station?.title),
        description: t(locale, cycle.stationDescriptions?.[stationId] ?? station?.description),
        baseTitle: station ? t(locale, station.title) : stationId,
        resources,
      };
    }),
  };
}

function canvasTitle(locale, canvasId) {
  return canvasLabelsRaw[locale]?.[canvasId]?.title ?? canvasLabelsRaw.en?.[canvasId]?.title ?? canvasId;
}

function translateCanvas(locale, canvasId, canvas) {
  const labels = canvasLabelsRaw[locale]?.[canvasId] ?? canvasLabelsRaw.en?.[canvasId] ?? {};
  const metadata = methodEngine.buildCanvasMetadata(canvasId, locale);
  const metadataSections = new Map(metadata.sections.map((section) => [section.id, section]));
  return {
    id: canvasId,
    title: labels.title ?? canvasId,
    purpose: labels.purpose ?? "",
    howToUse: labels.howToUse ?? "",
    layout: canvas.layout,
    metadata: canvas.metadata,
    canvasCreatorUrl: methodEngine.getCanvasCreatorUrl(canvasId, locale),
    importExportTemplate: methodEngine.buildCanvasTemplate(canvasId, locale),
    sections: canvas.sections
      .map((section) => {
        const sectionLabels = labels.sections?.[section.id] ?? {};
        const metadataSection = metadataSections.get(section.id);
        return {
          id: section.id,
          title: sectionLabels.section ?? section.id,
          description: sectionLabels.description ?? "",
          gridPosition: section.gridPosition,
          fillOrder: section.fillOrder,
          highlight: Boolean(section.highlight),
          journeySteps: Boolean(section.journeySteps),
          defaultNoteColor: metadataSection?.defaultNoteColor ?? "#FFF399",
          defaultNoteIntent: metadataSection?.defaultNoteIntent ?? "default",
        };
      })
      .sort((a, b) => Number(a.fillOrder ?? 999) - Number(b.fillOrder ?? 999)),
  };
}

function roleGuide(locale, role) {
  const cycles = role.cycles.map((id) => cycleById[id]).filter(Boolean);
  const stationIds = role.stations.filter((id) => stationById[id]);
  const recommendedResources = [
    ...new Set(
      cycles.flatMap((cycle) =>
        stationIds.flatMap((stationId) => cycle.recommendedResources?.[stationId] ?? []),
      ),
    ),
  ]
    .map((id) => resourceById[id])
    .filter(Boolean)
    .slice(0, 10)
    .map((resource) => translateResource(locale, resource));

  return {
    ...role,
    cycles: role.cycles.map((id) => ({
      id,
      title: t(locale, cycleById[id]?.title),
      description: t(locale, cycleById[id]?.description),
    })),
    stations: stationIds.map((id) => ({
      id,
      title: t(locale, stationById[id]?.title),
      description: t(locale, stationById[id]?.description),
    })),
    canvases: role.canvases
      .filter((id) => canvasDataRaw[id])
      .map((id) => ({ id, title: canvasTitle(locale, id) })),
    recommendedResources,
    promptIds: [
      `${role.id}:facilitate-station`,
      `${role.id}:fill-canvas`,
      `${role.id}:review-output`,
      `${role.id}:next-actions`,
    ],
    exportTemplateIds: [`${role.id}:markdown-summary`, `${role.id}:confluence-page`],
  };
}

function promptPacks(locale) {
  return roleDefinitions.flatMap((role) => {
    const guide = roleGuide(locale, role);
    const stationList = guide.stations.map((station) => station.title).join(", ");
    const canvasList = guide.canvases.map((canvas) => canvas.title).join(", ");
    const context = `Role: ${guide.title}\nCycles: ${guide.cycles.map((cycle) => cycle.title).join(", ")}\nStations: ${stationList}\nCanvases: ${canvasList}`;
    return [
      {
        id: `${role.id}:facilitate-station`,
        roleId: role.id,
        title: `Facilitate a station for ${guide.title}`,
        mode: "facilitate-station",
        prompt: `${context}\n\nAct as an APIOps Cycles facilitator. Help the team choose the next station, ask focused questions, identify missing evidence, and produce a concise decision log.`,
      },
      {
        id: `${role.id}:fill-canvas`,
        roleId: role.id,
        title: `Fill a recommended canvas for ${guide.title}`,
        mode: "fill-canvas",
        prompt: `${context}\n\nHelp fill the selected canvas. For each section, ask for evidence, suggest sticky notes, flag assumptions, and keep unanswered items as open questions.`,
      },
      {
        id: `${role.id}:review-output`,
        roleId: role.id,
        title: `Review method output for ${guide.title}`,
        mode: "review-output",
        prompt: `${context}\n\nReview the supplied method output for consistency, traceability, missing stakeholders, risks, and readiness for the next APIOps Cycles station.`,
      },
      {
        id: `${role.id}:next-actions`,
        roleId: role.id,
        title: `Generate next actions for ${guide.title}`,
        mode: "next-actions",
        prompt: `${context}\n\nGenerate practical next actions, owners, evidence to collect, and recommended canvases or templates. Keep the output suitable for Markdown or Confluence.`,
      },
    ];
  });
}

function exportTemplates(locale) {
  return roleDefinitions.flatMap((role) => {
    const guide = roleGuide(locale, role);
    const cycleId = guide.cycles[0]?.id ?? "capability-productization-cycle";
    return [
      {
        id: `${role.id}:markdown-summary`,
        roleId: role.id,
        format: "markdown",
        title: `${guide.title} cycle Markdown`,
        body: methodEngine.renderCycleMarkdown({ cycle: cycleId, locale }),
      },
      {
        id: `${role.id}:confluence-page`,
        roleId: role.id,
        format: "confluence-wiki",
        title: `${guide.title} cycle Confluence wiki`,
        body: methodEngine.renderCycleConfluenceWiki({ cycle: cycleId, locale }),
      },
      {
        id: `${role.id}:integration-markdown`,
        roleId: role.id,
        format: "markdown",
        title: `${guide.title} integration design Markdown`,
        body: methodEngine.renderIntegrationDesignMarkdown({ locale }),
      },
      {
        id: `${role.id}:integration-confluence-wiki`,
        roleId: role.id,
        format: "confluence-wiki",
        title: `${guide.title} integration design Confluence wiki`,
        body: methodEngine.renderIntegrationDesignConfluenceWiki({ locale }),
      },
    ];
  });
}

let sourceCommit = "unknown";
try {
  sourceCommit = execFileSync(
    "git",
    ["-c", `safe.directory=${sourceRoot}`, "-C", sourceRoot, "rev-parse", "HEAD"],
    { encoding: "utf8" },
  ).trim();
} catch {}

const source = {
  repository: "https://github.com/APIOpsCycles/apiops-cycles-method-data",
  branch: "codex/integration-design-extension",
  commit: sourceCommit,
};

const catalog = {
  source,
  locales,
  defaultLocale: "en",
  generatedAt: new Date().toISOString(),
  translations: Object.fromEntries(
    locales.map((locale) => [
      locale,
      {
        cycles: cyclesRaw.map((cycle) => translateCycle(locale, cycle)),
        lines: linesRaw
          .map((line) => translateLine(locale, line))
          .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
        stations: stationsRawList.map((station) => translateStation(locale, station)),
        resources: resourcesRaw
          .map((resource) => translateResource(locale, resource))
          .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
        criteria: criteriaRaw.map((criterion) => ({
          id: criterion.id,
          title: t(locale, criterion.title),
          description: t(locale, criterion.description),
          category: criterion.category,
        })),
      },
    ]),
  ),
  extension: integrationExtension,
};

const canvasManifest = {
  source,
  locales,
  defaultLocale: "en",
  translations: Object.fromEntries(
    locales.map((locale) => [
      locale,
      Object.fromEntries(
        Object.entries(canvasDataRaw).map(([canvasId, canvas]) => [
          canvasId,
          translateCanvas(locale, canvasId, canvas),
        ]),
      ),
    ]),
  ),
};

const stakeholderGuides = {
  source,
  locales,
  defaultLocale: "en",
  translations: Object.fromEntries(
    locales.map((locale) => [locale, roleDefinitions.map((role) => roleGuide(locale, role))]),
  ),
};

const prompts = {
  source,
  locales,
  defaultLocale: "en",
  translations: Object.fromEntries(locales.map((locale) => [locale, promptPacks(locale)])),
};

const exportsData = {
  source,
  locales,
  defaultLocale: "en",
  translations: Object.fromEntries(locales.map((locale) => [locale, exportTemplates(locale)])),
};

const mcpManifest = {
  source,
  version: 1,
  description: "Static APIOps Cycles manifest for a future MCP server.",
  dataFiles: [
    "/data/method-catalog.json",
    "/data/stakeholder-guides.json",
    "/data/canvas-manifest.json",
    "/data/prompt-packs.json",
    "/data/export-templates.json",
  ],
  tools: [
    "list_cycles",
    "get_cycle",
    "get_station",
    "get_canvas",
    "suggest_next_step",
    "generate_prompt",
    "render_export",
  ],
  identifiers: {
    cycles: cyclesRaw.map((cycle) => cycle.id),
    stations: stationsRawList.map((station) => station.id),
    canvases: Object.keys(canvasDataRaw),
    roles: roleDefinitions.map((role) => role.id),
  },
};

function validate() {
  const cycleIds = new Set(cyclesRaw.map((cycle) => cycle.id));
  const stationIds = new Set(stationsRawList.map((station) => station.id));
  const canvasIds = new Set(Object.keys(canvasDataRaw));
  for (const role of roleDefinitions) {
    for (const id of role.cycles) if (!cycleIds.has(id)) throw new Error(`Missing cycle ${id}`);
    for (const id of role.stations) if (!stationIds.has(id)) throw new Error(`Missing station ${id}`);
    for (const id of role.canvases) if (!canvasIds.has(id)) throw new Error(`Missing canvas ${id}`);
  }
}

validate();
mkdirSync(appDataRoot, { recursive: true });
mkdirSync(publicDataRoot, { recursive: true });
writeJson("method-catalog.json", catalog, { publish: true });
writeJson("stakeholder-guides.json", stakeholderGuides, { publish: true });
writeJson("canvas-manifest.json", canvasManifest, { publish: true });
writeJson("prompt-packs.json", prompts, { publish: true });
writeJson("export-templates.json", exportsData, { publish: true });
writeJson("mcp-method-manifest.json", mcpManifest, { publish: true });

const published = readdirSync(publicDataRoot).filter((name) => name.endsWith(".json"));
console.log(`Synced APIOps Cycles artifacts from ${sourceRoot}`);
console.log(`Published ${published.length} static data files to public/data`);
