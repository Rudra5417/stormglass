import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Source_Sans_3 } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Stormglass",
    template: "%s",
  },
  description:
    "Look up a public Fortnite island by code and see how it is playing.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${sourceSans.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
