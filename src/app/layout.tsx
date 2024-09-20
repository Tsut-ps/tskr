import type { Metadata } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import clsx from "clsx";
import "./globals.css";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "tskr",
  description: "ログイン不要の進捗管理ツール",
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
        <Header />
        <div className="flex justify-center">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
