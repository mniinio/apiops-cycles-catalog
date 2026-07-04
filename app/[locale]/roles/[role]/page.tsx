import type { Metadata } from "next";
import CatalogPage, { normalizeLocale } from "../../../catalog-page";
import stakeholderGuides from "../../../data/stakeholder-guides.json";

export function generateStaticParams() {
  return stakeholderGuides.locales.flatMap((locale) =>
    stakeholderGuides.translations[locale].map((role) => ({ locale, role: role.id })),
  );
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; role: string };
}): Metadata {
  const locale = normalizeLocale(params.locale);
  const role = stakeholderGuides.translations[locale].find((item) => item.id === params.role);
  return {
    title: role ? `${role.title} Guide` : "Stakeholder Guide",
    description: role?.summary,
  };
}

export default function LocalizedRolePage({
  params,
}: {
  params: { locale: string };
}) {
  return <CatalogPage locale={params.locale} />;
}
