import type { MetadataRoute } from "next";
import catalog from "./data/method-catalog.json";

const baseUrl = "https://apiops-cycles-catalog.local";

export default function sitemap(): MetadataRoute.Sitemap {
  return catalog.locales.map((locale) => ({
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
}
