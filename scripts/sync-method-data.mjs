import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const require = createRequire(import.meta.url);
function resolveSourceRoot() {
  if (process.env.METHOD_DATA_PATH) return process.env.METHOD_DATA_PATH;
  try {
    const enginePath = require.resolve("apiops-cycles-method-data/method-engine");
    return path.resolve(enginePath, "..", "..", "..");
  } catch {
    return path.join(root, "work", "apiops-cycles-method-data");
  }
}

const sourceRoot = resolveSourceRoot();
const methodRoot = path.join(sourceRoot, "src", "data", "method");
const canvasRoot = path.join(sourceRoot, "src", "data", "canvas");
const snippetRoot = path.join(sourceRoot, "src", "snippets");
const assetRoot = path.join(sourceRoot, "src", "assets");
const partnerRoot = path.join(sourceRoot, "public", "partners");
const partnerDataFile = path.join(sourceRoot, "src", "data", "partners.json");
const appDataRoot = path.join(root, "app", "data");
const publicDataRoot = path.join(root, "public", "data");
const publicAssetRoot = path.join(root, "public", "assets");
const publicPartnerRoot = path.join(root, "public", "partners");
const locales = ["en", "fi", "fr", "de", "pt"];
const methodEngine = await import(pathToFileURL(path.join(sourceRoot, "src", "lib", "method-engine.js")));

const involvementRank = { lead: 0, core: 1, consulted: 2 };

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

function copyPublicAsset(name) {
  const sourcePath = path.join(assetRoot, name);
  if (!existsSync(sourcePath)) return;
  mkdirSync(publicAssetRoot, { recursive: true });
  copyFileSync(sourcePath, path.join(publicAssetRoot, name));
}

function copyPartnerAsset(logo) {
  if (!logo?.startsWith("/partners/")) return;
  const name = logo.replace("/partners/", "");
  const sourcePath = path.join(partnerRoot, name);
  if (!existsSync(sourcePath)) return;
  mkdirSync(publicPartnerRoot, { recursive: true });
  copyFileSync(sourcePath, path.join(publicPartnerRoot, name));
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

function siteLabels(locale) {
  const english = {
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
  return Object.fromEntries(Object.entries(english).map(([key, value]) => [key, t(locale, `site.${key}`) === `site.${key}` ? value : t(locale, `site.${key}`)]));
}

const cyclesRaw = readJson(path.join(methodRoot, "cycles.json")).cycles.items;
const stationsRaw = readJson(path.join(methodRoot, "stations.json"));
const resourcesRaw = readJson(path.join(methodRoot, "resources.json")).resources;
const criteriaSource = readJson(path.join(methodRoot, "criteria.json"));
const criteriaRaw = criteriaSource.criteria ?? criteriaSource ?? [];
const linesRaw = readJson(path.join(methodRoot, "lines.json")).lines.items ?? [];
const stakeholdersRaw = readJson(path.join(methodRoot, "stakeholders.json")).stakeholders ?? [];
const stationStakeholdersRaw = readJson(path.join(methodRoot, "station-stakeholders.json"));
const stationCriteriaRaw = readJson(path.join(methodRoot, "station-criteria.json"));
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

function readSnippet(locale, snippet) {
  if (!snippet) return { sourcePath: null, contentMarkdown: null };
  const localized = path.join(snippetRoot, locale, snippet);
  const fallback = path.join(snippetRoot, snippet);
  const sourcePath = existsSync(localized) ? localized : existsSync(fallback) ? fallback : null;
  if (!sourcePath) return { sourcePath: `src/snippets/${snippet}`, contentMarkdown: null };
  return {
    sourcePath: path.relative(sourceRoot, sourcePath).replaceAll("\\", "/"),
    contentMarkdown: readFileSync(sourcePath, "utf8"),
  };
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
const criterionById = Object.fromEntries(criteriaRaw.map((item) => [item.id, item]));
const sourceStakeholderById = Object.fromEntries(stakeholdersRaw.map((item) => [item.id, item]));

function normalizeStakeholderId(sourceKey) {
  return sourceKey ?? "";
}

function translateStakeholder(locale, sourceKey, involvement = "") {
  const id = normalizeStakeholderId(sourceKey);
  const source = sourceStakeholderById[id];
  const titleKey = source?.title ?? `stakeholder.${id}.title`;
  const descriptionKey = source?.description ?? `stakeholder.${id}.description`;
  const title = t(locale, titleKey);
  const description = t(locale, descriptionKey);
  return {
    id,
    sourceKey,
    sourceStakeholderId: source?.id ?? id,
    title: title === titleKey ? id : title,
    description: description === descriptionKey ? "" : description,
    involvement,
  };
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stationStakeholders(locale, stationId) {
  return (stationStakeholdersRaw[stationId] ?? [])
    .map((item) => translateStakeholder(locale, item.stakeholder, item.involvement))
    .filter((item) => item.id)
    .sort((a, b) => (involvementRank[a.involvement] ?? 9) - (involvementRank[b.involvement] ?? 9) || a.title.localeCompare(b.title));
}

function translateCriterion(locale, id) {
  const criterion = criterionById[id];
  return {
    id,
    title: t(locale, `criterion.${id}`),
    description: criterion?.description ? t(locale, criterion.description) : t(locale, `criterion.${id}`),
  };
}

function translateResource(locale, resource) {
  const snippet = readSnippet(locale, resource.snippet);
  return {
    id: resource.id,
    slug: resource.slug,
    title: t(locale, resource.title),
    description: t(locale, resource.description),
    category: resource.category ?? "resource",
    icon: resource.icon ?? "",
    order: Number(resource.order ?? 999),
    outcomes: translateList(locale, resource.outcomes),
    steps: translateList(locale, resource.how_it_works?.steps),
    canvasId: resource.canvas ?? null,
    sourcePath: snippet.sourcePath,
    sourceUrl: resource.url ?? null,
    contentMarkdown: snippet.contentMarkdown,
    draft: resource.draft === "true" || resource.daft === "true",
  };
}

function translateLine(locale, line) {
  return {
    id: line.id,
    slug: line.slug,
    title: t(locale, line.title),
    description: t(locale, line.description),
    icon: line.icon ?? "",
    color: line.color,
    order: Number(line.order ?? 999),
    stations: line.stations ?? [],
  };
}

function translateStation(locale, station) {
  const questions = translateList(locale, [
    ...(station.how_it_works ?? []).map((step) => step.step),
    station.apply_in_work,
    station.why_it_matters,
  ]);
  const criteria = stationCriteriaRaw[station.id] ?? station.stationCriteria ?? [];
  return {
    id: station.id,
    slug: station.slug,
    icon: station.icon ?? "",
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
    questions,
    criteria,
    criteriaDetails: criteria.map((id) => translateCriterion(locale, id)),
    stakeholders: stationStakeholders(locale, station.id),
    evidence: station.expectedEvidenceTags ?? [],
  };
}

function translateCycle(locale, cycle) {
  const audienceStakeholders = uniqueBy(
    (cycle.audiences ?? []).map((sourceKey) => translateStakeholder(locale, sourceKey, "audience")),
    (item) => item.id,
  );
  const questionnaireResources = (cycle.questionnaireResources ?? [])
    .map((item) => {
      const resource = resourceById[item.resource];
      const station = stationById[item.station];
      return {
        stationId: item.station,
        stationTitle: station ? t(locale, cycle.stationLabels?.[item.station] ?? station.title) : item.station,
        resourceId: item.resource,
        resourceTitle: resource ? t(locale, resource.title) : item.resource,
        canvasId: resource?.canvas ?? null,
        suggestedAnswerOwner: translateStakeholder(locale, item.suggestedAnswerOwner),
      };
    })
    .filter((item) => item.resourceId);
  return {
    id: cycle.id,
    slug: cycle.slug,
    title: t(locale, cycle.title),
    description: t(locale, cycle.description),
    purpose: t(locale, cycle.purpose),
    audiences: translateList(locale, cycle.audiences),
    audienceStakeholders,
    entryCriteria: cycle.entryCriteria ?? [],
    exitCriteria: cycle.exitCriteria ?? [],
    entryCriteriaDetails: (cycle.entryCriteria ?? []).map((id) => translateCriterion(locale, id)),
    exitCriteriaDetails: (cycle.exitCriteria ?? []).map((id) => translateCriterion(locale, id)),
    questionnaireResources,
    confluenceTemplateSections: (cycle.confluenceTemplateSections ?? []).map((section) => ({
      id: section.id,
      title: t(locale, section.title),
      description: section.description ? t(locale, section.description) : "",
    })),
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

function allStakeholders(locale) {
  return stakeholdersRaw
    .map((stakeholder) => translateStakeholder(locale, stakeholder.id))
    .filter((item) => item.id)
    .sort((a, b) => a.title.localeCompare(b.title));
}

function routeProfiles(locale) {
  const stakeholderIds = new Set(
    cyclesRaw.flatMap((cycle) => (cycle.audiences ?? []).map((sourceKey) => normalizeStakeholderId(sourceKey))),
  );
  return [...stakeholderIds].map((stakeholderId) => {
    const stakeholder = translateStakeholder(locale, stakeholderId);
    const cycles = cyclesRaw.filter((cycle) =>
      (cycle.audiences ?? []).some((sourceKey) => normalizeStakeholderId(sourceKey) === stakeholderId),
    );
    const stationIds = uniqueBy(
      cycles.flatMap((cycle) =>
        cycle.stations.filter((stationId) =>
          stationStakeholders(locale, stationId).some((item) => item.id === stakeholderId),
        ),
      ),
      (id) => id,
    );
    const effectiveStationIds = stationIds.length > 0 ? stationIds : cycles.flatMap((cycle) => cycle.stations.slice(0, 1));
    const resources = uniqueBy(
      cycles.flatMap((cycle) =>
        effectiveStationIds.flatMap((stationId) => [
          ...(cycle.recommendedResources?.[stationId] ?? []),
          ...(cycle.questionnaireResources ?? [])
            .filter((item) => item.station === stationId)
            .map((item) => item.resource),
        ]),
      ),
      (id) => id,
    )
      .map((id) => resourceById[id])
      .filter(Boolean);
    const canvases = uniqueBy(
      resources
        .filter((resource) => resource.canvas && canvasDataRaw[resource.canvas])
        .map((resource) => ({ id: resource.canvas, title: canvasTitle(locale, resource.canvas) })),
      (canvas) => canvas.id,
    );
    const stations = effectiveStationIds
      .filter((id) => stationById[id])
      .map((id) => ({
        id,
        title: t(locale, stationById[id].title),
        description: t(locale, stationById[id].description),
      }));
    const decisions = uniqueBy(
      effectiveStationIds.flatMap((id) => translateStation(locale, stationById[id])?.questions ?? []),
      (question) => question,
    ).slice(0, 6);
    const outputs = uniqueBy(
      effectiveStationIds.flatMap((id) => [
        ...(translateStation(locale, stationById[id])?.outcomes ?? []),
        ...(translateStation(locale, stationById[id])?.evidence ?? []),
      ]),
      (output) => output,
    ).slice(0, 8);
    return {
      id: stakeholderId,
      stakeholderId,
      title: stakeholder.title,
      summary: stakeholder.description || `${stakeholder.title} guided path`,
      stakeholder,
      cycles: cycles.map((cycle) => ({
        id: cycle.id,
        title: t(locale, cycle.title),
        description: t(locale, cycle.description),
      })),
      stations,
      canvases,
      decisions,
      outputs,
      recommendedResources: resources.slice(0, 10).map((resource) => translateResource(locale, resource)),
      promptIds: [
        `${stakeholderId}:facilitate-station`,
        `${stakeholderId}:use-resources`,
        `${stakeholderId}:next-actions`,
      ],
      exportTemplateIds: [`${stakeholderId}:markdown-summary`, `${stakeholderId}:confluence-page`],
    };
  }).sort((a, b) => a.title.localeCompare(b.title));
}

function promptPacks(locale) {
  return routeProfiles(locale).flatMap((route) => {
    const stationList = route.stations.map((station) => station.title).join(", ");
    const canvasList = route.canvases.map((canvas) => canvas.title).join(", ");
    const context = `Stakeholder: ${route.title}\nCycles: ${route.cycles.map((cycle) => cycle.title).join(", ")}\nStations: ${stationList}\nResources and canvases: ${canvasList}`;
    return [
      {
        id: `${route.id}:facilitate-station`,
        routeId: route.id,
        title: `Facilitate a station with ${route.title}`,
        mode: "facilitate-station",
        prompt: `${context}\n\nAct as an APIOps Cycles facilitator. Use the selected station questions, entry criteria, exit criteria, stakeholders, and related resources to guide the discussion. Produce decisions, evidence gaps, and next steps.`,
      },
      {
        id: `${route.id}:use-resources`,
        routeId: route.id,
        title: `Use station resources with ${route.title}`,
        mode: "use-resources",
        prompt: `${context}\n\nHelp the team use the recommended APIOps Cycles resources. For canvases, ask for evidence section by section and propose sticky notes. For checklists or guidelines, summarize what to review, what evidence is missing, and who should answer.`,
      },
      {
        id: `${route.id}:next-actions`,
        routeId: route.id,
        title: `Generate next actions for ${route.title}`,
        mode: "next-actions",
        prompt: `${context}\n\nGenerate practical next actions, owners, evidence to collect, related resources to use, and suggested next stations. Keep the output suitable for Markdown or Confluence.`,
      },
    ];
  });
}

function exportTemplates(locale) {
  return routeProfiles(locale).flatMap((route) => {
    const cycleId = route.cycles[0]?.id ?? "capability-productization-cycle";
    const cycle = translateCycle(locale, cycleById[cycleId]);
    return [
      {
        id: `${route.id}:markdown-summary`,
        routeId: route.id,
        cycleId,
        format: "markdown",
        title: `${cycle.title} Markdown`,
        sections: cycle.confluenceTemplateSections,
        body: methodEngine.renderCycleMarkdown({ cycle: cycleId, locale }),
      },
      {
        id: `${route.id}:confluence-page`,
        routeId: route.id,
        cycleId,
        format: "confluence-wiki",
        title: `${cycle.title} Confluence wiki`,
        sections: cycle.confluenceTemplateSections,
        body: methodEngine.renderCycleConfluenceWiki({ cycle: cycleId, locale }),
      },
      {
        id: `${route.id}:integration-markdown`,
        routeId: route.id,
        cycleId,
        format: "markdown",
        title: `${route.title} integration design Markdown`,
        sections: cycle.confluenceTemplateSections,
        body: methodEngine.renderIntegrationDesignMarkdown({ locale }),
      },
      {
        id: `${route.id}:integration-confluence-wiki`,
        routeId: route.id,
        cycleId,
        format: "confluence-wiki",
        title: `${route.title} integration design Confluence wiki`,
        sections: cycle.confluenceTemplateSections,
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
        labels: labelsByLocale[locale] ?? {},
        cycles: cyclesRaw.map((cycle) => translateCycle(locale, cycle)),
        lines: linesRaw
          .map((line) => translateLine(locale, line))
          .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
        stations: stationsRawList.map((station) => translateStation(locale, station)),
        stakeholders: allStakeholders(locale),
        routeProfiles: routeProfiles(locale),
        resources: resourcesRaw
          .map((resource) => translateResource(locale, resource))
          .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
        criteria: criteriaRaw.map((criterion) => ({
          ...translateCriterion(locale, criterion.id),
          category: criterion.category ?? "",
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

const siteLabelsData = {
  source,
  locales,
  defaultLocale: "en",
  translations: Object.fromEntries(locales.map((locale) => [locale, siteLabels(locale)])),
};

const partners = {
  source,
  items: existsSync(partnerDataFile) ? readJson(partnerDataFile) : [],
};

const mcpManifest = {
  source,
  version: 1,
  description: "Static APIOps Cycles manifest for a future MCP server.",
  dataFiles: [
    "/data/method-catalog.json",
    "/data/canvas-manifest.json",
    "/data/prompt-packs.json",
    "/data/export-templates.json",
    "/data/site-labels.json",
    "/data/partners.json",
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
    stakeholders: allStakeholders("en").map((stakeholder) => stakeholder.id),
    routeProfiles: routeProfiles("en").map((route) => route.id),
  },
};

function validate() {
  const cycleIds = new Set(cyclesRaw.map((cycle) => cycle.id));
  const stationIds = new Set(stationsRawList.map((station) => station.id));
  const resourceIds = new Set(resourcesRaw.map((resource) => resource.id));
  const criterionIds = new Set(criteriaRaw.map((criterion) => criterion.id));
  const stakeholderIds = new Set(stakeholdersRaw.map((stakeholder) => stakeholder.id));
  for (const cycle of cyclesRaw) {
    if (!cycleIds.has(cycle.id)) throw new Error(`Missing cycle ${cycle.id}`);
    for (const stationId of cycle.stations ?? []) if (!stationIds.has(stationId)) throw new Error(`Missing station ${stationId}`);
    for (const sourceKey of cycle.audiences ?? []) {
      const id = normalizeStakeholderId(sourceKey);
      if (!stakeholderIds.has(id)) throw new Error(`Missing stakeholder ${id} from cycle audience ${sourceKey}`);
    }
    for (const item of cycle.questionnaireResources ?? []) {
      if (!stationIds.has(item.station)) throw new Error(`Missing questionnaire station ${item.station}`);
      if (!resourceIds.has(item.resource)) throw new Error(`Missing questionnaire resource ${item.resource}`);
      const id = normalizeStakeholderId(item.suggestedAnswerOwner);
      if (!stakeholderIds.has(id)) throw new Error(`Missing stakeholder ${id} from owner ${item.suggestedAnswerOwner}`);
    }
  }
  for (const [stationId, items] of Object.entries(stationStakeholdersRaw)) {
    if (!stationIds.has(stationId)) throw new Error(`Missing station stakeholder station ${stationId}`);
    for (const item of items) {
      const id = normalizeStakeholderId(item.stakeholder);
      if (!stakeholderIds.has(id)) throw new Error(`Missing station stakeholder ${id}`);
    }
  }
  for (const [stationId, criteria] of Object.entries(stationCriteriaRaw)) {
    if (!stationIds.has(stationId)) throw new Error(`Missing station criteria station ${stationId}`);
    for (const id of criteria) if (!criterionIds.has(id)) throw new Error(`Missing criterion ${id}`);
  }
}

validate();
mkdirSync(appDataRoot, { recursive: true });
mkdirSync(publicDataRoot, { recursive: true });
copyPublicAsset("apiops-cycles-logo-dark.svg");
copyPublicAsset("apiops-cycles-logo-white.svg");
for (const partner of partners.items) copyPartnerAsset(partner.logo);
writeJson("method-catalog.json", catalog, { publish: true });
writeJson("canvas-manifest.json", canvasManifest, { publish: true });
writeJson("prompt-packs.json", prompts, { publish: true });
writeJson("export-templates.json", exportsData, { publish: true });
writeJson("site-labels.json", siteLabelsData, { publish: true });
writeJson("partners.json", partners, { publish: true });
writeJson("mcp-method-manifest.json", mcpManifest, { publish: true });

const published = readdirSync(publicDataRoot).filter((name) => name.endsWith(".json"));
console.log(`Synced APIOps Cycles artifacts from ${sourceRoot}`);
console.log(`Published ${published.length} static data files to public/data`);
