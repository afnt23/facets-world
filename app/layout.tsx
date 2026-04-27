import type { Metadata, Viewport } from "next";
import { Cormorant, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Facets Of The World",
  description: "Photography by Arthur Fontanelli.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${sourceSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
