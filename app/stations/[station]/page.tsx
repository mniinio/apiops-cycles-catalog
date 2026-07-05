import type { Metadata } from "next";
import CatalogPage from "../../catalog-page";
import routeIndex from "../../data/route-index.json";

export function generateStaticParams() {
  return routeIndex.translations.en.stations.map((station) => ({ station: station.id }));
}

export function generateMetadata({
  params,
}: {
  params: { station: string };
}): Metadata {
  const station = routeIndex.translations.en.stations.find((item) => item.id === params.station);
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
