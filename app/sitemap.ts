import type { MetadataRoute } from "next";
import catalog from "./data/method-catalog.json";
import stakeholderGuides from "./data/stakeholder-guides.json";

const baseUrl = "https://apiops-cycles-catalog.osaango-0614.chatgpt-team.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const localizedHomes = catalog.locales.map((locale) => ({
    url: locale === "en" ? baseUrl : `${baseUrl}/${locale}`,
    lastModified: new Date(catalog.generatedAt),
    alternates: {
      languages: Object.fromEntries(
        catalog.locales.map((item) => [
          item,
          item === "en" ? baseUrl : `${baseUrl}/${item}`,
        ]),
      ),
    },
  }));
  const roleEntries = catalog.locales.flatMap((locale) =>
    stakeholderGuides.translations[locale].map((role) => ({
      url:
        locale === "en"
          ? `${baseUrl}/roles/${role.id}`
          : `${baseUrl}/${locale}/roles/${role.id}`,
      lastModified: new Date(catalog.generatedAt),
    })),
  );
  const cycleEntries = catalog.locales.flatMap((locale) =>
    catalog.translations[locale].cycles.map((cycle) => ({
      url:
        locale === "en"
          ? `${baseUrl}/cycles/${cycle.slug}`
          : `${baseUrl}/${locale}/cycles/${cycle.slug}`,
      lastModified: new Date(catalog.generatedAt),
    })),
  );
  const stationEntries = catalog.locales.flatMap((locale) =>
    catalog.translations[locale].stations.map((station) => ({
      url:
        locale === "en"
          ? `${baseUrl}/stations/${station.id}`
          : `${baseUrl}/${locale}/stations/${station.id}`,
      lastModified: new Date(catalog.generatedAt),
    })),
  );
  return [...localizedHomes, ...roleEntries, ...cycleEntries, ...stationEntries];
}
