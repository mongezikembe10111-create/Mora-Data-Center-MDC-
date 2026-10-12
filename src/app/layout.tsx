import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});
const geist = localFont({
  src: "../../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-geist",
  display: "swap",
});
const mono = localFont({
  src: "../../node_modules/@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "The Public Square — A space to question power.",
    template: "%s | The Public Square",
  },
  applicationName: "The Public Square",
  description:
    "A more informed public square. Explore South African election data, public bills and hearings, municipal participation, research and verified sources. Understand democracy. Take part in it.",
  openGraph: {
    title: "The Public Square — A space to question power.",
    description:
      "People, data, ideas and accountability. South African democratic intelligence and citizen action, grounded in verifiable evidence.",
    siteName: "The Public Square",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "The Public Square",
    description:
      "A space to question power. Politics, law, society, accountability.",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-ZA"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${geist.variable} ${mono.variable}`}
    >
      <body>
        <Navigation />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
