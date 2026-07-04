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
  return [...localizedHomes, ...roleEntries];
}
