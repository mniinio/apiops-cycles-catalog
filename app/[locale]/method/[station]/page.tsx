import type { Metadata } from "next";
import CatalogPage, { normalizeLocale } from "../../../catalog-page";
import catalog from "../../../data/method-catalog.json";

const apiProductizationCycleId = "api-productization-cycle";

export function generateStaticParams() {
  return catalog.locales.flatMap((locale) => {
    const cycle = catalog.translations[locale].cycles.find((item) => item.id === apiProductizationCycleId);
    return (cycle?.stations ?? []).map((station) => ({ locale, station: station.id }));
  });
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; station: string };
}): Metadata {
  const locale = normalizeLocale(params.locale);
  const cycle = catalog.translations[locale].cycles.find((item) => item.id === apiProductizationCycleId);
  const station = cycle?.stations.find((item) => item.id === params.station);
  return {
    title: station ? `${station.title} | ${cycle?.title}` : "APIOps Cycles Method",
    description: station?.description ?? cycle?.description,
  };
}

export default function LocalizedMethodStationPage({
  params,
}: {
  params: { locale: string; station: string };
}) {
  return <CatalogPage locale={params.locale} initialCycleId={apiProductizationCycleId} initialStationId={params.station} />;
}
