import routeIndex from "./data/route-index.json";
import CatalogExplorer from "./catalog-explorer";

const supportedLocales = routeIndex.locales;

export function normalizeLocale(locale?: string) {
  return supportedLocales.includes(locale ?? "") ? locale ?? "en" : "en";
}

export function CatalogJsonLd({ locale }: { locale: string }) {
  const data = routeIndex.translations[normalizeLocale(locale)];
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
        initialLocale={normalized}
        initialCycleId={initialCycleId}
        initialStationId={initialStationId}
        initialRoleId={initialRoleId}
        dataVersion={`${routeIndex.source.commit}-${routeIndex.generatedAt}`}
      />
    </>
  );
}
