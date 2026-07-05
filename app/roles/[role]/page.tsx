import type { Metadata } from "next";
import CatalogPage from "../../catalog-page";
import routeIndex from "../../data/route-index.json";

export function generateStaticParams() {
  return routeIndex.translations.en.routeProfiles.map((role) => ({ role: role.id }));
}

export function generateMetadata({
  params,
}: {
  params: { role: string };
}): Metadata {
  const role = routeIndex.translations.en.routeProfiles.find((item) => item.id === params.role);
  return {
    title: role ? `${role.title} Guide` : "Stakeholder Guide",
    description: role?.summary,
  };
}

export default function RolePage({
  params,
}: {
  params: { role: string };
}) {
  return <CatalogPage locale="en" initialRoleId={params.role} />;
}
