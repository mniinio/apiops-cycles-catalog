import type { Metadata } from "next";
import CatalogPage, { normalizeLocale } from "../../../catalog-page";
import catalog from "../../../data/method-catalog.json";

export function generateStaticParams() {
  return catalog.locales.flatMap((locale) =>
    catalog.translations[locale].stations.map((station) => ({ locale, station: station.id })),
  );
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; station: string };
}): Metadata {
  const locale = normalizeLocale(params.locale);
  const station = catalog.translations[locale].stations.find((item) => item.id === params.station);
  return {
    title: station ? `${station.title} | APIOps Cycles` : "APIOps Cycles Station",
    description: station?.description,
  };
}

export default function LocalizedStationPage({
  params,
}: {
  params: { locale: string; station: string };
}) {
  return <CatalogPage locale={params.locale} initialStationId={params.station} />;
}
