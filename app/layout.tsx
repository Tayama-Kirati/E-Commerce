import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Providers } from "@/app/components/pages/Providers";
import { siteUrl } from "@/app/lib/site";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const DESCRIPTION = "Shop electronics, fashion, home & more. Luxury experience, fast delivery across Nepal.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "PeaNut — Nepal's Premium Marketplace", template: "%s | PeaNut" },
  description: DESCRIPTION,
  applicationName: "PeaNut",
  openGraph: { type: "website", siteName: "PeaNut", locale: "en_NP", title: "PeaNut — Nepal's Premium Marketplace", description: DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: "PeaNut — Nepal's Premium Marketplace", description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
