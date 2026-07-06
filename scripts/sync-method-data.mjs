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
  const mergeLabels = (value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => mergeLabels(item));
      return;
    }
    Object.assign(labels, value);
  };
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
    if (existsSync(file)) mergeLabels(readJson(file));
  }
  return labels;
}

function siteLabels(locale) {
  const english = {
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
    "map.exportSvg": "Export SVG",
    "map.svgExported": "Metro map SVG exported.",
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
    "confluence.cycleTemplate": "Cycle documentation",
    "confluence.cycleTemplateTitle": "Cycle reference to publish",
    "confluence.cycleTemplateHelp": "Use this when you want to document the selected cycle, stations, route, and method guidance.",
    "confluence.questionTemplate": "Question template",
    "confluence.questionTemplateTitle": "Question template to fill in",
    "confluence.questionTemplateHelp": "Use this when you want to gather answers and evidence before choosing an integration or API design path.",
    "confluence.markdown": "Markdown",
    "confluence.confluenceWiki": "Confluence-wiki",
    "confluence.copyMarkdown": "Copy Markdown",
    "confluence.copyConfluenceWiki": "Copy Confluence-wiki",
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
const canvasDataRaw = readJson(path.join(canvasRoot, "canvasData.json"));
const canvasLabelsRaw = readJson(path.join(canvasRoot, "localizedData.json"));
const labelsByLocale = Object.fromEntries(locales.map((locale) => [locale, readLabels(locale)]));

function t(locale, key) {
  if (!key) return "";
  return labelsByLocale[locale]?.[key] ?? labelsByLocale.en?.[key] ?? key;
}

function hasLabel(locale, key) {
  return Boolean(labelsByLocale[locale]?.[key] ?? labelsByLocale.en?.[key]);
}

function translateList(locale, list = []) {
  return list.map((item) => t(locale, item)).filter(Boolean);
}

function stationStepItems(station) {
  return station.how_it_works ?? station["how-it-works"] ?? [];
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
const stationStakeholdersByCycle = stationStakeholdersRaw.stationStakeholdersByCycle ?? null;

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

function stationStakeholderItems(cycleId, stationId) {
  if (stationStakeholdersByCycle) return stationStakeholdersByCycle[cycleId]?.[stationId] ?? [];
  return stationStakeholdersRaw[stationId] ?? [];
}

function stationStakeholders(locale, cycleId, stationId) {
  return stationStakeholderItems(cycleId, stationId)
    .map((item) => ({
      ...translateStakeholder(locale, item.stakeholder, item.involvement),
      responsibilities: (item.responsibilities ?? []).map((responsibility) => {
        const resource = resourceById[responsibility.resource];
        return {
          resourceId: responsibility.resource,
          resourceTitle: resource ? t(locale, resource.title) : responsibility.resource,
          canvasId: resource?.canvas ?? null,
          role: responsibility.role,
        };
      }),
    }))
    .filter((item) => item.id)
    .sort((a, b) => (involvementRank[a.involvement] ?? 9) - (involvementRank[b.involvement] ?? 9) || a.title.localeCompare(b.title));
}

function aggregateStationStakeholders(locale, stationId) {
  const items = stationStakeholdersByCycle
    ? Object.keys(stationStakeholdersByCycle).flatMap((cycleId) => stationStakeholders(locale, cycleId, stationId))
    : stationStakeholders(locale, "", stationId);
  const byId = new Map();
  for (const item of items) {
    const current = byId.get(item.id);
    if (!current || (involvementRank[item.involvement] ?? 9) < (involvementRank[current.involvement] ?? 9)) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => (involvementRank[a.involvement] ?? 9) - (involvementRank[b.involvement] ?? 9) || a.title.localeCompare(b.title));
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
    ...stationStepItems(station).map((step) => step.step),
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
    steps: stationStepItems(station).map((step) => ({
      text: t(locale, step.step),
      resourceId: step.resource,
      resourceTitle: step.resource ? t(locale, resourceById[step.resource]?.title) : "",
      canvasId: step.resource ? resourceById[step.resource]?.canvas ?? null : null,
    })),
    questions,
    criteria,
    criteriaDetails: criteria.map((id) => translateCriterion(locale, id)),
    stakeholders: aggregateStationStakeholders(locale, station.id),
    evidence: station.expectedEvidenceTags ?? [],
  };
}

function cycleStationLabelKey(cycleId, stationId, field) {
  return `cycle.${cycleId}.station.${stationId}.${field}`;
}

function translateCycleStation(locale, cycle, stationId, index) {
  const station = stationById[stationId];
  const titleKey = cycle.stationLabels?.[stationId] ?? cycleStationLabelKey(cycle.id, stationId, "title");
  const descriptionKey = cycle.stationDescriptions?.[stationId] ?? cycleStationLabelKey(cycle.id, stationId, "description");
  const whyKey = cycleStationLabelKey(cycle.id, stationId, "why_it_matters");
  const applyKey = cycleStationLabelKey(cycle.id, stationId, "apply_in_work");
  const outcomeKeys = station?.outcomes?.map((key) => key.replace(`station.${stationId}.`, `cycle.${cycle.id}.station.${stationId}.`)) ?? [];
  const stepItems = stationStepItems(station ?? {}).map((step) => ({
    ...step,
    step: step.step?.replace(`station.${stationId}.`, `cycle.${cycle.id}.station.${stationId}.`),
  }));
  const steps = stepItems.map((step) => ({
    text: hasLabel(locale, step.step) ? t(locale, step.step) : t(locale, step.step?.replace(`cycle.${cycle.id}.station.${stationId}.`, `station.${stationId}.`)),
    resourceId: step.resource,
    resourceTitle: step.resource ? t(locale, resourceById[step.resource]?.title) : "",
    canvasId: step.resource ? resourceById[step.resource]?.canvas ?? null : null,
  })).filter((step) => step.text);
  const stakeholders = stationStakeholders(locale, cycle.id, stationId);
  const responsibilityResourceIds = stakeholders.flatMap((stakeholder) =>
    (stakeholder.responsibilities ?? []).map((responsibility) => responsibility.resourceId),
  );
  const resources = (cycle.recommendedResources?.[stationId] ?? [])
    .concat(responsibilityResourceIds)
    .filter((id, index, items) => items.indexOf(id) === index)
    .map((id) => resourceById[id])
    .filter(Boolean)
    .map((resource) => translateResource(locale, resource));
  const stationCriteria = stationCriteriaRaw[stationId] ?? station?.stationCriteria ?? [];
  const translatedOutcomes = outcomeKeys.map((key, outcomeIndex) => {
    const fallback = station?.outcomes?.[outcomeIndex];
    return hasLabel(locale, key) ? t(locale, key) : t(locale, fallback);
  }).filter(Boolean);
  const whyItMatters = hasLabel(locale, whyKey) ? t(locale, whyKey) : t(locale, station?.why_it_matters);
  const applyInWork = hasLabel(locale, applyKey) ? t(locale, applyKey) : t(locale, station?.apply_in_work);
  const questions = translateList(locale, [
    ...stepItems.map((step) => step.step),
    applyKey,
    whyKey,
  ]).filter((text) => !text.startsWith(`cycle.${cycle.id}.station.${stationId}.`));

  return {
    index: index + 1,
    id: stationId,
    slug: station?.slug,
    icon: station?.icon ?? "",
    title: t(locale, titleKey),
    description: t(locale, descriptionKey),
    whyItMatters,
    applyInWork,
    outcomes: translatedOutcomes.length ? translatedOutcomes : translateList(locale, station?.outcomes),
    steps,
    questions: questions.length ? questions : translateList(locale, [
      ...stationStepItems(station ?? {}).map((step) => step.step),
      station?.apply_in_work,
      station?.why_it_matters,
    ]),
    criteria: stationCriteria,
    criteriaDetails: stationCriteria.map((id) => translateCriterion(locale, id)),
    baseTitle: station ? t(locale, station.title) : stationId,
    group: station ? t(locale, station.groupTitle) : "",
    lifecycleStage: station?.lifecycleStage ?? station?.type ?? "supporting",
    stakeholders,
    resources,
    evidence: station?.expectedEvidenceTags ?? [],
  };
}

function translateCycle(locale, cycle) {
  const audienceStakeholders = uniqueBy(
    cycle.stations.flatMap((stationId) =>
      stationStakeholders(locale, cycle.id, stationId)
        .filter((item) => item.involvement === "lead" || item.involvement === "core"),
    ),
    (item) => item.id,
  );
  const questionnaireResources = cycle.stations
    .flatMap((stationId) =>
      stationStakeholders(locale, cycle.id, stationId).flatMap((stakeholder) =>
        (stakeholder.responsibilities ?? [])
          .filter((responsibility) => responsibility.role === "suggested-answer-owner")
          .map((responsibility) => ({ stationId, stakeholder, responsibility })),
      ),
    )
    .map((item) => {
      const resource = resourceById[item.responsibility.resourceId];
      const station = stationById[item.stationId];
      return {
        stationId: item.stationId,
        stationTitle: station ? t(locale, cycle.stationLabels?.[item.stationId] ?? station.title) : item.stationId,
        resourceId: item.responsibility.resourceId,
        resourceTitle: resource ? t(locale, resource.title) : item.responsibility.resourceId,
        canvasId: resource?.canvas ?? null,
        suggestedAnswerOwner: item.stakeholder,
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
    stations: cycle.stations.map((stationId, index) => translateCycleStation(locale, cycle, stationId, index)),
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
    cyclesRaw.flatMap((cycle) =>
      cycle.stations.flatMap((stationId) =>
        stationStakeholders(locale, cycle.id, stationId)
          .filter((stakeholder) => stakeholder.involvement === "lead" || stakeholder.involvement === "core")
          .map((stakeholder) => stakeholder.id),
      ),
    ),
  );
  return [...stakeholderIds].map((stakeholderId) => {
    const stakeholder = translateStakeholder(locale, stakeholderId);
    const cycles = cyclesRaw.filter((cycle) =>
      cycle.stations.some((stationId) =>
        stationStakeholders(locale, cycle.id, stationId).some((item) => item.id === stakeholderId),
      ),
    );
    const stationIds = uniqueBy(
      cycles.flatMap((cycle) =>
        cycle.stations.filter((stationId) =>
          stationStakeholders(locale, cycle.id, stationId).some((item) => item.id === stakeholderId),
        ),
      ),
      (id) => id,
    );
    const effectiveStationIds = stationIds.length > 0 ? stationIds : cycles.flatMap((cycle) => cycle.stations.slice(0, 1));
    const resources = uniqueBy(
      cycles.flatMap((cycle) =>
        effectiveStationIds.flatMap((stationId) => [
          ...(cycle.recommendedResources?.[stationId] ?? []),
          ...stationStakeholders(locale, cycle.id, stationId)
            .filter((item) => item.id === stakeholderId)
            .flatMap((item) => (item.responsibilities ?? []).map((responsibility) => responsibility.resourceId)),
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
  return cyclesRaw.flatMap((rawCycle) => {
    const cycle = translateCycle(locale, rawCycle);
    const cycleId = rawCycle.id;
    const templates = [
      {
        id: `${cycleId}:markdown-summary`,
        cycleId,
        format: "markdown",
        title: `${cycle.title} Markdown`,
        sections: cycle.confluenceTemplateSections,
        body: methodEngine.renderCycleMarkdown({ cycle: cycleId, locale }),
      },
      {
        id: `${cycleId}:confluence-page`,
        cycleId,
        format: "confluence-wiki",
        title: `${cycle.title} Confluence wiki`,
        sections: cycle.confluenceTemplateSections,
        body: methodEngine.renderCycleConfluenceWiki({ cycle: cycleId, locale }),
      },
    ];
    if (cycleId !== "integration-productization-cycle") return templates;
    return [
      ...templates,
      {
        id: `${cycleId}:integration-markdown`,
        cycleId,
        format: "markdown",
        title: `${cycle.title} integration design Markdown`,
        sections: cycle.confluenceTemplateSections,
        body: methodEngine.renderIntegrationDesignMarkdown({ locale }),
      },
      {
        id: `${cycleId}:integration-confluence-wiki`,
        cycleId,
        format: "confluence-wiki",
        title: `${cycle.title} integration design Confluence wiki`,
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

const routeIndex = {
  source,
  locales,
  defaultLocale: "en",
  generatedAt: catalog.generatedAt,
  translations: Object.fromEntries(
    locales.map((locale) => {
      const data = catalog.translations[locale];
      return [
        locale,
        {
          routeProfiles: data.routeProfiles.map((route) => ({
            id: route.id,
            stakeholderId: route.stakeholderId,
            title: route.title,
            summary: route.summary,
          })),
          cycles: data.cycles.map((cycle) => ({
            id: cycle.id,
            slug: cycle.slug,
            title: cycle.title,
            description: cycle.description,
            stations: cycle.stations.map((station) => ({
              id: station.id,
              title: station.title,
              description: station.description,
            })),
          })),
          stations: data.stations.map((station) => ({
            id: station.id,
            title: station.title,
            description: station.description,
          })),
        },
      ];
    }),
  ),
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
    "/data/route-index.json",
    "/data/canvas-manifest.json",
    "/data/prompt-packs.json",
    "/data/export-templates.json",
    "/data/site-labels.json",
    "/data/partners.json",
    ...locales.flatMap((locale) => [
      `/data/method-catalog.${locale}.json`,
      `/data/canvas-manifest.${locale}.json`,
      `/data/prompt-packs.${locale}.json`,
      `/data/export-templates.${locale}.json`,
      `/data/site-labels.${locale}.json`,
    ]),
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
  }
  const stakeholderGraph = stationStakeholdersByCycle ?? { default: stationStakeholdersRaw };
  for (const [cycleId, stations] of Object.entries(stakeholderGraph)) {
    if (cycleId !== "default" && !cycleIds.has(cycleId)) throw new Error(`Missing station stakeholder cycle ${cycleId}`);
    for (const [stationId, items] of Object.entries(stations)) {
      if (!stationIds.has(stationId)) throw new Error(`Missing station stakeholder station ${stationId}`);
      for (const item of items) {
        const id = normalizeStakeholderId(item.stakeholder);
        if (!stakeholderIds.has(id)) throw new Error(`Missing station stakeholder ${id}`);
        for (const responsibility of item.responsibilities ?? []) {
          if (!resourceIds.has(responsibility.resource)) throw new Error(`Missing stakeholder responsibility resource ${responsibility.resource}`);
        }
      }
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
writeJson("route-index.json", routeIndex, { publish: true });
writeJson("canvas-manifest.json", canvasManifest, { publish: true });
writeJson("prompt-packs.json", prompts, { publish: true });
writeJson("export-templates.json", exportsData, { publish: true });
writeJson("site-labels.json", siteLabelsData, { publish: true });
for (const locale of locales) {
  writeJson(`method-catalog.${locale}.json`, {
    ...catalog,
    translations: { [locale]: catalog.translations[locale] },
  }, { publish: true });
  writeJson(`canvas-manifest.${locale}.json`, {
    ...canvasManifest,
    translations: { [locale]: canvasManifest.translations[locale] },
  }, { publish: true });
  writeJson(`prompt-packs.${locale}.json`, {
    ...prompts,
    translations: { [locale]: prompts.translations[locale] },
  }, { publish: true });
  writeJson(`export-templates.${locale}.json`, {
    ...exportsData,
    translations: { [locale]: exportsData.translations[locale] },
  }, { publish: true });
  writeJson(`site-labels.${locale}.json`, {
    ...siteLabelsData,
    translations: { [locale]: siteLabelsData.translations[locale] },
  }, { publish: true });
}
writeJson("partners.json", partners, { publish: true });
writeJson("mcp-method-manifest.json", mcpManifest, { publish: true });

const published = readdirSync(publicDataRoot).filter((name) => name.endsWith(".json"));
console.log(`Synced APIOps Cycles artifacts from ${sourceRoot}`);
console.log(`Published ${published.length} static data files to public/data`);
