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
    default: "MORA Data Centre — Democracy, By the Numbers.",
    template: "%s | MORA Data Centre",
  },
  description:
    "Independent South African electoral intelligence. Explore voter registration, participation, election history, and the evidence behind the numbers.",
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
