import type { Metadata } from "next";
import { Amiri, Geist_Mono } from "next/font/google";
import "./globals.css";
import { thmanyahSans } from "@/fonts";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "مبادرة للتوسّط في الزواج وفق أحكام الشرع، تجمع بين الراغبين في الزواج بخصوصية تامة وبإشراف وسيط أمين.";

export const metadata: Metadata = {
  metadataBase: new URL("https://fazuwjuh.assoli.site"),
  title: "فَزَوِّجُوهُ",
  description,
  openGraph: {
    title: "فَزَوِّجُوهُ",
    description,
    url: "/",
    siteName: "فَزَوِّجُوهُ",
    locale: "ar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "فَزَوِّجُوهُ",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${amiri.variable} ${thmanyahSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
