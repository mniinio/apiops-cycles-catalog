import type { Metadata } from "next";
import CatalogPage from "./catalog-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      fi: "/fi",
      fr: "/fr",
      de: "/de",
      pt: "/pt",
    },
  },
};

export default function Home() {
  return <CatalogPage locale="en" />;
}
