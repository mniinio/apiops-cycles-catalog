import type { Metadata } from "next";
import CatalogPage from "../../catalog-page";
import catalog from "../../data/method-catalog.json";

export function generateStaticParams() {
  return catalog.translations.en.stations.map((station) => ({ station: station.id }));
}

export function generateMetadata({
  params,
}: {
  params: { station: string };
}): Metadata {
  const station = catalog.translations.en.stations.find((item) => item.id === params.station);
  return {
    title: station ? `${station.title} | APIOps Cycles` : "APIOps Cycles Station",
    description: station?.description,
  };
}

export default function StationPage({
  params,
}: {
  params: { station: string };
}) {
  return <CatalogPage locale="en" initialStationId={params.station} />;
}
