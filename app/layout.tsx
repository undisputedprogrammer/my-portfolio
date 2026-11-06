import { buildAccent } from "@/lib/palette-server";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, JetBrains_Mono } from "next/font/google";
import { content } from "@/data/content";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jetbrains", display: "swap" });
const ibm = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-ibm", display: "swap" });

export const viewport: Viewport = { themeColor: buildAccent() };
export const metadata: Metadata = { icons: {icon:"/icon.svg"}, title: content.meta.title, description: content.meta.description };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.construction='booting';const failOpen=setTimeout(()=>{document.documentElement.dataset.construction='fallback'},6000);window.addEventListener('portfolio:build-ready',()=>clearTimeout(failOpen),{once:true});}` }}/></head><body className={`${inter.variable} ${jetbrains.variable} ${ibm.variable}`}>{children}</body></html>;
}
