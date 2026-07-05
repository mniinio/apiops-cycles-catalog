import type { Metadata } from "next";
import CatalogPage, { normalizeLocale } from "../../../catalog-page";
import routeIndex from "../../../data/route-index.json";

export function generateStaticParams() {
  return routeIndex.locales.flatMap((locale) =>
    routeIndex.translations[locale].cycles.map((cycle) => ({ locale, cycle: cycle.slug })),
  );
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; cycle: string };
}): Metadata {
  const locale = normalizeLocale(params.locale);
  const cycle = routeIndex.translations[locale].cycles.find((item) => item.slug === params.cycle || item.id === params.cycle);
  return {
    title: cycle ? `${cycle.title} | APIOps Cycles` : "APIOps Cycles",
    description: cycle?.description,
  };
}

export default function LocalizedCyclePage({
  params,
}: {
  params: { locale: string; cycle: string };
}) {
  return <CatalogPage locale={params.locale} initialCycleId={params.cycle} />;
}
