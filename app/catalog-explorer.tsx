"use client";

import { useMemo, useState } from "react";

type Resource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  outcomes: string[];
  steps: string[];
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
  steps: { text: string; resourceId?: string; resourceTitle?: string }[];
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

function compact(text: string, max = 150) {
  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function CycleMap({
  cycle,
  selectedStationId,
  onSelectStation,
}: {
  cycle: Cycle;
  selectedStationId: string;
  onSelectStation: (id: string) => void;
}) {
  const radius = 148;
  const center = 180;
  const points = cycle.stations.map((station, index) => {
    const angle = -90 + (360 / cycle.stations.length) * index;
    const radians = (angle * Math.PI) / 180;
    return {
      ...station,
      x: center + radius * Math.cos(radians),
      y: center + radius * Math.sin(radians),
    };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <svg className="cycle-map" viewBox="0 0 360 360" role="img" aria-label={cycle.title}>
      <circle cx={center} cy={center} r="82" className="cycle-map__core" />
      <path
        d={`${path} Z`}
        className="cycle-map__path"
        style={{ stroke: colors[cycle.id] ?? "#0f766e" }}
      />
      {points.map((point) => (
        <g key={point.id}>
          <g
            className="cycle-map__button"
            onClick={() => onSelectStation(point.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelectStation(point.id);
            }}
            role="button"
            tabIndex={0}
            aria-label={point.title}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r="18"
              className={
                point.id === selectedStationId
                  ? "cycle-map__node cycle-map__node--active"
                  : "cycle-map__node"
              }
            />
            <text
              x={point.x}
              y={point.y + 4}
              textAnchor="middle"
              className={
                point.id === selectedStationId
                  ? "cycle-map__number cycle-map__number--active"
                  : "cycle-map__number"
              }
            >
              {point.index}
            </text>
          </g>
          <text
            x={point.x}
            y={point.y + (point.y > center ? 42 : -28)}
            className="cycle-map__label"
            textAnchor="middle"
          >
            {point.title.length > 22 ? point.baseTitle : point.title}
          </text>
        </g>
      ))}
      <text x={center} y={center - 6} textAnchor="middle" className="cycle-map__brand">
        apiops
      </text>
      <text x={center} y={center + 14} textAnchor="middle" className="cycle-map__brand">
        cycles
      </text>
    </svg>
  );
}

export default function CatalogExplorer({
  catalog,
  initialLocale,
}: {
  catalog: Catalog;
  initialLocale: string;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const data = catalog.translations[locale] ?? catalog.translations.en;
  const [cycleId, setCycleId] = useState(data.cycles[1]?.id ?? data.cycles[0].id);
  const selectedCycle = data.cycles.find((cycle) => cycle.id === cycleId) ?? data.cycles[0];
  const [stationId, setStationId] = useState(selectedCycle.stations[3]?.id ?? selectedCycle.stations[0].id);
  const [query, setQuery] = useState("");
  const selectedStation =
    selectedCycle.stations.find((station) => station.id === stationId) ??
    selectedCycle.stations[0];
  const stationDetail =
    data.stations.find((station) => station.id === selectedStation.id) ?? data.stations[0];

  const filteredResources = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.resources.slice(0, 18);
    return data.resources
      .filter((resource) =>
        [resource.title, resource.description, resource.category]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 24);
  }, [data.resources, query]);

  function selectCycle(next: string) {
    const cycle = data.cycles.find((item) => item.id === next);
    setCycleId(next);
    setStationId(cycle?.stations[0]?.id ?? stationId);
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
            <label className="sr-only" htmlFor="locale">
              Language
            </label>
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
                <option key={item} value={item}>
                  {localeNames[item] ?? item.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </nav>
        <section className="hero__grid">
          <div>
            <p className="eyebrow">Knowledge catalog for reusable digital capability design</p>
            <h1>APIOps Cycles: one backbone, many routes.</h1>
            <p className="hero__lead">
              Explore productization cycles, shared lifecycle stations, canvases,
              guidelines, criteria, and resource links from the APIOps Cycles
              method data branch.
            </p>
            <div className="hero__actions" aria-label="Catalog summary">
              <span>{data.cycles.length} cycles</span>
              <span>{data.stations.length} stations</span>
              <span>{data.resources.length} resources</span>
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

      <section className="catalog-grid" aria-label="Cycles overview">
        <article className="panel panel--wide">
          <div className="panel__head">
            <div>
              <p className="section-kicker">L1 Overview</p>
              <h2>All cycles at a glance</h2>
            </div>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resources"
              aria-label="Search resources"
            />
          </div>
          <div className="cycle-cards">
            {data.cycles.map((cycle) => (
              <button
                key={cycle.id}
                className={cycle.id === selectedCycle.id ? "cycle-card is-active" : "cycle-card"}
                type="button"
                onClick={() => selectCycle(cycle.id)}
                style={{ borderColor: colors[cycle.id] ?? "#164e63" }}
              >
                <span className="cycle-card__dot" style={{ background: colors[cycle.id] ?? "#164e63" }} />
                <strong>{cycle.title}</strong>
                <span>{compact(cycle.description, 112)}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="section-kicker">L2 Cycle View</p>
          <h2>{selectedCycle.title}</h2>
          <p>{selectedCycle.purpose}</p>
          <div className="audiences">
            {selectedCycle.audiences.map((audience) => (
              <span key={audience}>{audience}</span>
            ))}
          </div>
        </article>

        <article className="panel panel--map">
          <CycleMap
            cycle={selectedCycle}
            selectedStationId={selectedStation.id}
            onSelectStation={setStationId}
          />
        </article>

        <article className="panel panel--wide station-detail">
          <div>
            <p className="section-kicker">L3 Station Details</p>
            <h2>{selectedStation.title}</h2>
            <p>{selectedStation.description || stationDetail.description}</p>
          </div>
          <div className="detail-columns">
            <section>
              <h3>Typical outcomes</h3>
              <ul>
                {stationDetail.outcomes.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Recommended resources</h3>
              <ul>
                {selectedStation.resources.slice(0, 6).map((resource) => (
                  <li key={resource.id}>{resource.title}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>How it works</h3>
              <ul>
                {stationDetail.steps.slice(0, 4).map((step) => (
                  <li key={step.text}>{step.text}</li>
                ))}
              </ul>
            </section>
          </div>
        </article>

        <article className="panel panel--wide">
          <div className="panel__head">
            <div>
              <p className="section-kicker">Knowledge Catalog</p>
              <h2>Resources indexed for discovery</h2>
            </div>
            <span className="result-count">{filteredResources.length} shown</span>
          </div>
          <div className="resource-grid">
            {filteredResources.map((resource) => (
              <article key={resource.id} className="resource-card">
                <span>{resource.category}</span>
                <h3>{resource.title}</h3>
                <p>{compact(resource.description, 165)}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
