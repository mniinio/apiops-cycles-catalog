import type { Metadata } from "next";
import CatalogPage from "../../catalog-page";
import routeIndex from "../../data/route-index.json";

const apiProductizationCycleId = "api-productization-cycle";

export function generateStaticParams() {
  const cycle = routeIndex.translations.en.cycles.find((item) => item.id === apiProductizationCycleId);
  return (cycle?.stations ?? []).map((station) => ({ station: station.id }));
}

export function generateMetadata({
  params,
}: {
  params: { station: string };
}): Metadata {
  const cycle = routeIndex.translations.en.cycles.find((item) => item.id === apiProductizationCycleId);
  const station = cycle?.stations.find((item) => item.id === params.station);
  return {
    title: station ? `${station.title} | ${cycle?.title}` : "APIOps Cycles Method",
    description: station?.description ?? cycle?.description,
  };
}

export default function MethodStationPage({
  params,
}: {
  params: { station: string };
}) {
  return <CatalogPage locale="en" initialCycleId={apiProductizationCycleId} initialStationId={params.station} />;
}
