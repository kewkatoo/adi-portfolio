import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aditya Achary — AI Engineer · Data Analyst · Music Producer",
  description: "AI engineer, data analyst and music producer building intelligent systems at the edge, in the cloud, and everywhere in between.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
