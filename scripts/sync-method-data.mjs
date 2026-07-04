import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot =
  process.env.METHOD_DATA_PATH ??
  path.join(root, "work", "apiops-cycles-method-data");
const dataRoot = path.join(sourceRoot, "src", "data", "method");
const outputPath = path.join(root, "app", "data", "method-catalog.json");
const locales = ["en", "fi", "fr", "de", "pt"];

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function readLabels(locale) {
  const dir = path.join(dataRoot, locale);
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

const cyclesRaw = readJson(path.join(dataRoot, "cycles.json")).cycles.items;
const stationsRaw = readJson(path.join(dataRoot, "stations.json"));
const resourcesRaw = readJson(path.join(dataRoot, "resources.json")).resources;
const criteriaRaw = readJson(path.join(dataRoot, "criteria.json")).criteria ?? [];
const integrationExtension = readJson(
  path.join(dataRoot, "integration-extension.json"),
);
const labelsByLocale = Object.fromEntries(
  locales.map((locale) => [locale, readLabels(locale)]),
);

function t(locale, key) {
  if (!key) return "";
  return labelsByLocale[locale]?.[key] ?? labelsByLocale.en?.[key] ?? key;
}

function translateList(locale, list = []) {
  return list.map((item) => t(locale, item)).filter(Boolean);
}

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
    draft: resource.draft === "true" || resource.daft === "true",
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

let sourceCommit = "unknown";
try {
  sourceCommit = execFileSync(
    "git",
    ["-c", `safe.directory=${sourceRoot}`, "-C", sourceRoot, "rev-parse", "HEAD"],
    { encoding: "utf8" },
  ).trim();
} catch {}

const catalog = {
  source: {
    repository: "https://github.com/APIOpsCycles/apiops-cycles-method-data",
    branch: "codex/integration-design-extension",
    commit: sourceCommit,
  },
  locales,
  defaultLocale: "en",
  generatedAt: new Date().toISOString(),
  translations: Object.fromEntries(
    locales.map((locale) => [
      locale,
      {
        cycles: cyclesRaw.map((cycle) => translateCycle(locale, cycle)),
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

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Synced method catalog from ${sourceRoot}`);
