import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/lib/business";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/components/chat-widget";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: {
    default: `${BUSINESS.name} — Custom Stitched Dresses | Narowal, Pakistan`,
    template: `%s | ${BUSINESS.name}`,
  },
  description: BUSINESS.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${manrope.variable}`}>
      <body className="grain min-h-dvh">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5014055251480611"
          crossOrigin="anonymous"
        />
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <section aria-label="Advertisement" className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-format="autorelaxed"
              data-ad-client="ca-pub-5014055251480611"
              data-ad-slot="9791602752"
            />
            <Script id="adsense-unit" strategy="afterInteractive">
              {`(adsbygoogle = window.adsbygoogle || []).push({});`}
            </Script>
          </section>
          <SiteFooter />
          <ChatWidget />
        </CartProvider>
      </body>
    </html>
  );
}
