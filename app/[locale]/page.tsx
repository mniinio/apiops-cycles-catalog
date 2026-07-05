import type { Metadata } from "next";
import CatalogPage, { normalizeLocale } from "../catalog-page";
import routeIndex from "../data/route-index.json";

export function generateStaticParams() {
  return routeIndex.locales
    .filter((locale) => locale !== "en")
    .map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale = normalizeLocale(params.locale);
  const title =
    locale === "en"
      ? "APIOps Cycles Knowledge Catalog"
      : `APIOps Cycles Knowledge Catalog (${locale.toUpperCase()})`;
  return {
    title,
    alternates: {
      canonical: locale === "en" ? "/" : `/${locale}`,
      languages: {
        en: "/",
        fi: "/fi",
        fr: "/fr",
        de: "/de",
        pt: "/pt",
      },
    },
  };
}

export default function LocalizedHome({
  params,
}: {
  params: { locale: string };
}) {
  return <CatalogPage locale={params.locale} />;
}
