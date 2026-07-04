import type { Metadata } from "next";
import CatalogPage from "../../catalog-page";
import stakeholderGuides from "../../data/stakeholder-guides.json";

export function generateStaticParams() {
  return stakeholderGuides.translations.en.map((role) => ({ role: role.id }));
}

export function generateMetadata({
  params,
}: {
  params: { role: string };
}): Metadata {
  const role = stakeholderGuides.translations.en.find((item) => item.id === params.role);
  return {
    title: role ? `${role.title} Guide` : "Stakeholder Guide",
    description: role?.summary,
  };
}

export default function RolePage() {
  return <CatalogPage locale="en" />;
}
