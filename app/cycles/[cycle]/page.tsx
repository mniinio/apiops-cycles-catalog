import type { Metadata } from "next";
import CatalogPage from "../../catalog-page";
import catalog from "../../data/method-catalog.json";

export function generateStaticParams() {
  return catalog.translations.en.cycles.map((cycle) => ({ cycle: cycle.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { cycle: string };
}): Metadata {
  const cycle = catalog.translations.en.cycles.find((item) => item.slug === params.cycle || item.id === params.cycle);
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
