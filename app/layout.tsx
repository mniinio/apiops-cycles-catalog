import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "APIOps Cycles Knowledge Catalog",
    template: "%s | APIOps Cycles",
  },
  description:
    "A static, localizable knowledge catalog for APIOps Cycles method content, productization cycles, shared stations, canvases, criteria, and resources.",
  keywords: [
    "APIOps Cycles",
    "API productization",
    "integration productization",
    "knowledge catalog",
    "API design",
    "capability productization",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "APIOps Cycles Knowledge Catalog",
    description:
      "Explore productization cycles, lifecycle stations, canvases, guidelines, and resources from the APIOps Cycles method data.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
