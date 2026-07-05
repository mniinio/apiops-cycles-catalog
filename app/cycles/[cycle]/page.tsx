import type { Metadata } from "next";
import CatalogPage from "../../catalog-page";
import routeIndex from "../../data/route-index.json";

export function generateStaticParams() {
  return routeIndex.translations.en.cycles.map((cycle) => ({ cycle: cycle.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { cycle: string };
}): Metadata {
  const cycle = routeIndex.translations.en.cycles.find((item) => item.slug === params.cycle || item.id === params.cycle);
  return {
    title: cycle ? `${cycle.title} | APIOps Cycles` : "APIOps Cycles",
    description: cycle?.description,
  };
}

export default function CyclePage({
  params,
}: {
  params: { cycle: string };
}) {
  return <CatalogPage locale="en" initialCycleId={params.cycle} />;
}
