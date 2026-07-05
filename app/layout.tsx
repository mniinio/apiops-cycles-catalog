import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "APIOps Cycles Knowledge Catalog",
    template: "%s | APIOps Cycles",
  },
  description:
    "A static, localizable APIOps Cycles method site with method-catalog routes, AI prompt packs, canvas workspaces, Confluence exports, and method data surfaces.",
  keywords: [
    "APIOps Cycles",
    "API productization",
    "integration productization",
    "knowledge catalog",
    "AI prompts",
    "Confluence templates",
    "canvas workspace",
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
      "Explore role-guided APIOps Cycles paths, method canvases, AI prompt packs, exports, and static method data.",
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
