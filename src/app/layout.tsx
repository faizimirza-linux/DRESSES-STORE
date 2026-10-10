import type { Metadata } from "next";
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
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <ChatWidget />
        </CartProvider>
      </body>
    </html>
  );
}
