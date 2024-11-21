import type { Metadata } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import clsx from "clsx";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

import { Providers } from "../components/providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "tskr",
  description: "ログイン不要の進捗管理ツール",
  robots: {
    index: false,
    follow: false,
  },
};

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={clsx(inter.variable, notoSansJP.variable, "font-sans")}
    >
      <body className="antialiased flex min-h-screen w-full flex-col">
        <Providers>
          <NextTopLoader showSpinner={false} />
          {children}
          <Toaster />
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
