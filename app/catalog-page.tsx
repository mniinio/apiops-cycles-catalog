import catalog from "./data/method-catalog.json";
import CatalogExplorer from "./catalog-explorer";

const supportedLocales = catalog.locales;

export function normalizeLocale(locale?: string) {
  return supportedLocales.includes(locale ?? "") ? locale ?? "en" : "en";
}

export function CatalogJsonLd({ locale }: { locale: string }) {
  const data = catalog.translations[normalizeLocale(locale)];
  const items = [
    ...data.cycles.map((cycle, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: cycle.title,
      description: cycle.description,
      url: `/${locale === "en" ? "" : locale}`,
    })),
    ...data.resources.slice(0, 40).map((resource, index) => ({
      "@type": "ListItem",
      position: data.cycles.length + index + 1,
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

export default function CatalogPage({ locale = "en" }: { locale?: string }) {
  const normalized = normalizeLocale(locale);

  return (
    <>
      <CatalogJsonLd locale={normalized} />
      <CatalogExplorer catalog={catalog} initialLocale={normalized} />
    </>
  );
}
