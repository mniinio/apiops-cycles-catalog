import type { MetadataRoute } from "next";
import routeIndex from "./data/route-index.json";

const baseUrl = "https://apiops-cycles-catalog.osaango-0614.chatgpt-team.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const localizedHomes = routeIndex.locales.map((locale) => ({
    url: locale === "en" ? baseUrl : `${baseUrl}/${locale}`,
    lastModified: new Date(routeIndex.generatedAt),
    alternates: {
      languages: Object.fromEntries(
        routeIndex.locales.map((item) => [
          item,
          item === "en" ? baseUrl : `${baseUrl}/${item}`,
        ]),
      ),
    },
  }));
  const roleEntries = routeIndex.locales.flatMap((locale) =>
    routeIndex.translations[locale].routeProfiles.map((role) => ({
      url:
        locale === "en"
          ? `${baseUrl}/roles/${role.id}`
          : `${baseUrl}/${locale}/roles/${role.id}`,
      lastModified: new Date(routeIndex.generatedAt),
    })),
  );
  const cycleEntries = routeIndex.locales.flatMap((locale) =>
    routeIndex.translations[locale].cycles.map((cycle) => ({
      url:
        locale === "en"
          ? `${baseUrl}/cycles/${cycle.slug}`
          : `${baseUrl}/${locale}/cycles/${cycle.slug}`,
      lastModified: new Date(routeIndex.generatedAt),
    })),
  );
  const stationEntries = routeIndex.locales.flatMap((locale) =>
    routeIndex.translations[locale].stations.map((station) => ({
      url:
        locale === "en"
          ? `${baseUrl}/stations/${station.id}`
          : `${baseUrl}/${locale}/stations/${station.id}`,
      lastModified: new Date(routeIndex.generatedAt),
    })),
  );
  const methodEntries = routeIndex.locales.flatMap((locale) => {
    const cycle = routeIndex.translations[locale].cycles.find((item) => item.id === "api-productization-cycle");
    return (cycle?.stations ?? []).map((station) => ({
      url:
        locale === "en"
          ? `${baseUrl}/method/${station.id}`
          : `${baseUrl}/${locale}/method/${station.id}`,
      lastModified: new Date(routeIndex.generatedAt),
    }));
  });
  return [...localizedHomes, ...roleEntries, ...cycleEntries, ...stationEntries, ...methodEntries];
}
