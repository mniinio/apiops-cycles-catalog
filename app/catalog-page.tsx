import catalog from "./data/method-catalog.json";
import canvasManifest from "./data/canvas-manifest.json";
import exportTemplates from "./data/export-templates.json";
import promptPacks from "./data/prompt-packs.json";
import siteLabels from "./data/site-labels.json";
import partners from "./data/partners.json";
import CatalogExplorer from "./catalog-explorer";

const supportedLocales = catalog.locales;

export function normalizeLocale(locale?: string) {
  return supportedLocales.includes(locale ?? "") ? locale ?? "en" : "en";
}

export function CatalogJsonLd({ locale }: { locale: string }) {
  const data = catalog.translations[normalizeLocale(locale)];
  const roles = data.routeProfiles;
  const prefix = locale === "en" ? "" : `/${locale}`;
  const items = [
    ...roles.map((role, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: role.title,
      description: role.summary,
      url: `${prefix}/roles/${role.id}`,
    })),
    ...data.cycles.map((cycle, index) => ({
      "@type": "ListItem",
      position: roles.length + index + 1,
      name: cycle.title,
      description: cycle.description,
      url: `${prefix}/cycles/${cycle.slug}`,
    })),
    ...data.stations.map((station, index) => ({
      "@type": "ListItem",
      position: roles.length + data.cycles.length + index + 1,
      name: station.title,
      description: station.description,
      url: `${prefix}/stations/${station.id}`,
    })),
    ...data.resources.slice(0, 40).map((resource, index) => ({
      "@type": "ListItem",
      position: roles.length + data.cycles.length + data.stations.length + index + 1,
      name: resource.title,
      description: resource.description,
    })),
  ];

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "APIOps Cycles Knowledge Catalog",
          inLanguage: locale,
          itemListElement: items,
        }),
      }}
    />
  );
}

export default function CatalogPage({
  locale = "en",
  initialCycleId,
  initialStationId,
  initialRoleId,
}: {
  locale?: string;
  initialCycleId?: string;
  initialStationId?: string;
  initialRoleId?: string;
}) {
  const normalized = normalizeLocale(locale);

  return (
    <>
      <CatalogJsonLd locale={normalized} />
      <CatalogExplorer
        catalog={catalog}
        canvases={canvasManifest}
        prompts={promptPacks}
        exportsData={exportTemplates}
        labels={siteLabels}
        partners={partners}
        initialLocale={normalized}
        initialCycleId={initialCycleId}
        initialStationId={initialStationId}
        initialRoleId={initialRoleId}
      />
    </>
  );
}
