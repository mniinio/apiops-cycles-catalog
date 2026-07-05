import type { Metadata } from "next";
import CatalogPage, { normalizeLocale } from "../../../catalog-page";
import catalog from "../../../data/method-catalog.json";

export function generateStaticParams() {
  return catalog.locales.flatMap((locale) =>
    catalog.translations[locale].routeProfiles.map((role) => ({ locale, role: role.id })),
  );
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; role: string };
}): Metadata {
  const locale = normalizeLocale(params.locale);
  const role = catalog.translations[locale].routeProfiles.find((item) => item.id === params.role);
  return {
    title: role ? `${role.title} Guide` : "Stakeholder Guide",
    description: role?.summary,
  };
}

export default function LocalizedRolePage({
  params,
}: {
  params: { locale: string; role: string };
}) {
  return <CatalogPage locale={params.locale} initialRoleId={params.role} />;
}
